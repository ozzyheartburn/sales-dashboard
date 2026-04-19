#!/bin/bash
set -e

# ─── Configuration ──────────────────────────────────────────────────────────
REGION="eu-north-1"                    # Stockholm — closest to Nordics
CLUSTER_NAME="pg-machine"
SERVICE_NAME="pg-machine-backend"
TASK_FAMILY="pg-machine-backend"
REPO_NAME="pg-machine-backend"
CONTAINER_NAME="pg-machine-backend"
PORT=4000
CPU=256                                 # 0.25 vCPU
MEMORY=512                              # 0.5 GB

# ─── Check prerequisites ───────────────────────────────────────────────────
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found. Install: brew install awscli"
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Install Docker Desktop first."
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ AWS not configured. Run: aws configure"
  exit 1
fi

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PG Machine Backend → AWS Fargate"
echo "  Region: $REGION"
echo "  Account: $ACCOUNT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 1: Create ECR repo (if doesn't exist) ────────────────────────────
echo ""
echo "→ Step 1: ECR repository"
aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" 2>/dev/null || \
  aws ecr create-repository --repository-name "$REPO_NAME" --region "$REGION" --query 'repository.repositoryUri' --output text
echo "  ✓ ECR repo ready: $ECR_URI"

# ─── Step 2: Build & push Docker image ─────────────────────────────────────
echo ""
echo "→ Step 2: Build & push Docker image"
cd "$(dirname "$0")"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
docker build --no-cache --platform linux/amd64 -t "$REPO_NAME" .
docker tag "$REPO_NAME:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"
echo "  ✓ Image pushed to ECR"

# ─── Step 3: Create ECS cluster (if doesn't exist) ─────────────────────────
echo ""
echo "→ Step 3: ECS cluster"
aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$REGION" --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE || \
  aws ecs create-cluster --cluster-name "$CLUSTER_NAME" --region "$REGION" --query 'cluster.clusterArn' --output text
echo "  ✓ Cluster ready: $CLUSTER_NAME"

# ─── Step 4: Create IAM execution role (if doesn't exist) ──────────────────
echo ""
echo "→ Step 4: IAM execution role"
ROLE_NAME="ecsTaskExecutionRole"
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || true)
if [ -z "$ROLE_ARN" ] || [ "$ROLE_ARN" = "None" ]; then
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' --query 'Role.Arn' --output text
  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
fi
echo "  ✓ Execution role: $ROLE_ARN"

# ─── Step 5: Check for MONGODB_URI ─────────────────────────────────────────
if [ -f .env ]; then
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    # Remove surrounding quotes if present
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    export "$key=$value"
  done < .env
fi
if [ -z "$MONGODB_URI" ]; then
  echo ""
  echo "❌ MONGODB_URI not set. Export it or add to server/.env"
  echo "   export MONGODB_URI='mongodb+srv://...'"
  exit 1
fi
if [ -z "$OPENAI_API_KEY" ]; then
  echo ""
  echo "❌ OPENAI_API_KEY not set. Export it or add to server/.env"
  exit 1
fi

# ─── Step 6: Register task definition ──────────────────────────────────────
echo ""
echo "→ Step 6: Register task definition"
TASK_DEF=$(cat <<EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "$CPU",
  "memory": "$MEMORY",
  "executionRoleArn": "$ROLE_ARN",
  "containerDefinitions": [{
    "name": "$CONTAINER_NAME",
    "image": "$ECR_URI:latest",
    "portMappings": [{"containerPort": $PORT, "protocol": "tcp"}],
    "environment": [
      {"name": "MONGODB_URI", "value": "$MONGODB_URI"},
      {"name": "OPENAI_API_KEY", "value": "$OPENAI_API_KEY"},
      {"name": "PORT", "value": "$PORT"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/$TASK_FAMILY",
        "awslogs-region": "$REGION",
        "awslogs-stream-prefix": "ecs",
        "awslogs-create-group": "true"
      }
    }
  }]
}
EOF
)
echo "$TASK_DEF" > /tmp/pg-machine-task-def.json
aws ecs register-task-definition --cli-input-json file:///tmp/pg-machine-task-def.json --region "$REGION" --query 'taskDefinition.taskDefinitionArn' --output text
echo "  ✓ Task definition registered"

# ─── Step 7: Get default VPC & subnets ─────────────────────────────────────
echo ""
echo "→ Step 7: Network configuration"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region "$REGION" --query 'Vpcs[0].VpcId' --output text)
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region "$REGION" --query 'Subnets[*].SubnetId' --output text | tr '\t' ',')

# Create or get security group
SG_NAME="pg-machine-backend-sg"
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" --region "$REGION" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)
if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
  SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" --description "PG Machine backend" --vpc-id "$VPC_ID" --region "$REGION" --query 'GroupId' --output text)
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port $PORT --cidr 0.0.0.0/0 --region "$REGION"
fi
echo "  ✓ VPC: $VPC_ID | SG: $SG_ID"

# ─── Step 8: Create or update service ──────────────────────────────────────
echo ""
echo "→ Step 8: Deploy service"
EXISTING=$(aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --region "$REGION" --query 'services[0].status' --output text 2>/dev/null || true)

if [ "$EXISTING" = "ACTIVE" ]; then
  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "$SERVICE_NAME" \
    --task-definition "$TASK_FAMILY" \
    --force-new-deployment \
    --region "$REGION" \
    --query 'service.serviceArn' --output text
  echo "  ✓ Service updated (new deployment)"
else
  FIRST_SUBNET=$(echo "$SUBNETS" | cut -d',' -f1)
  aws ecs create-service \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --task-definition "$TASK_FAMILY" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$FIRST_SUBNET],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
    --region "$REGION" \
    --query 'service.serviceArn' --output text
  echo "  ✓ Service created"
fi

# ─── Step 9: Wait for public IP ────────────────────────────────────────────
echo ""
echo "→ Waiting for task to start (this may take 1-2 minutes)..."
sleep 15
TASK_ARN=$(aws ecs list-tasks --cluster "$CLUSTER_NAME" --service-name "$SERVICE_NAME" --region "$REGION" --query 'taskArns[0]' --output text)

if [ -n "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
  ENI_ID=$(aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --region "$REGION" \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
  
  if [ -n "$ENI_ID" ] && [ "$ENI_ID" != "None" ]; then
    PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids "$ENI_ID" --region "$REGION" \
      --query 'NetworkInterfaces[0].Association.PublicIp' --output text)
  fi
fi

# If task isn't ready yet, wait a bit more and retry
if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  echo "  Task still starting, waiting 30 more seconds..."
  sleep 30
  TASK_ARN=$(aws ecs list-tasks --cluster "$CLUSTER_NAME" --service-name "$SERVICE_NAME" --region "$REGION" --query 'taskArns[0]' --output text)
  if [ -n "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
    ENI_ID=$(aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --region "$REGION" \
      --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
    if [ -n "$ENI_ID" ] && [ "$ENI_ID" != "None" ]; then
      PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids "$ENI_ID" --region "$REGION" \
        --query 'NetworkInterfaces[0].Association.PublicIp' --output text)
    fi
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
  echo "  ✅ Backend deployed: http://$PUBLIC_IP:$PORT"

  # ─── ALB provides stable DNS — no need to update vercel.json ──────────────
  ALB_DNS="pg-machine-alb-1643756400.eu-north-1.elb.amazonaws.com"
  echo "  ℹ️  ALB DNS: $ALB_DNS (vercel.json already uses this — no update needed)"
else
  echo "  ⚠️  Could not detect public IP. Task may still be starting."
  echo "  Run manually:"
  echo "  aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --region $REGION"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
