#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REGION="eu-north-1"
CLUSTER_NAME="pg-machine"
SERVICE_NAME="pg-machine-backend"
PORT=4000

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Full Stack Deploy: Backend + Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 1: Deploy backend to ECS ──────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Step 1/4 — Deploy backend to ECS        ║"
echo "╚══════════════════════════════════════════╝"
cd "$SCRIPT_DIR/server"
bash deploy-ecs.sh
cd "$SCRIPT_DIR"

# ─── Step 2: Wait for new IP ───────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Step 2/4 — Getting new public IP        ║"
echo "╚══════════════════════════════════════════╝"

PUBLIC_IP=""
MAX_ATTEMPTS=20
ATTEMPT=0

while [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -gt "$MAX_ATTEMPTS" ]; then
    echo "❌ Timed out waiting for public IP after ${MAX_ATTEMPTS} attempts"
    exit 1
  fi

  echo "  Polling for IP (attempt $ATTEMPT/$MAX_ATTEMPTS)..."
  sleep 10

  TASK_ARN=$(aws ecs list-tasks \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --region "$REGION" \
    --desired-status RUNNING \
    --query 'taskArns[0]' --output text 2>/dev/null || true)

  if [ -n "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
    ENI_ID=$(aws ecs describe-tasks \
      --cluster "$CLUSTER_NAME" \
      --tasks "$TASK_ARN" \
      --region "$REGION" \
      --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
      --output text 2>/dev/null || true)

    if [ -n "$ENI_ID" ] && [ "$ENI_ID" != "None" ]; then
      PUBLIC_IP=$(aws ec2 describe-network-interfaces \
        --network-interface-ids "$ENI_ID" \
        --region "$REGION" \
        --query 'NetworkInterfaces[0].Association.PublicIp' \
        --output text 2>/dev/null || true)
    fi
  fi
done

echo "  ✓ New IP: $PUBLIC_IP"

# ─── Step 3: Update .env and vercel.json ────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Step 3/4 — Updating config files        ║"
echo "╚══════════════════════════════════════════╝"

# Update .env
echo "VITE_API_URL=http://$PUBLIC_IP:$PORT" > "$SCRIPT_DIR/.env"
echo "  ✓ .env updated → http://$PUBLIC_IP:$PORT"

# Update vercel.json
cat > "$SCRIPT_DIR/vercel.json" <<EOF
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://$PUBLIC_IP:$PORT/api/:path*"
    },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF
echo "  ✓ vercel.json updated"

# ─── Step 4: Wait for health check, then push to GitHub ────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Step 4/4 — Health check & deploy frontend║"
echo "╚══════════════════════════════════════════╝"

HEALTH_OK=false
for i in $(seq 1 15); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$PUBLIC_IP:$PORT/api/health" 2>/dev/null || true)
  if [ "$STATUS" = "200" ]; then
    HEALTH_OK=true
    echo "  ✓ Backend health check passed"
    break
  fi
  echo "  Waiting for backend to be ready ($i/15)..."
  sleep 10
done

if [ "$HEALTH_OK" = false ]; then
  echo "⚠️  Backend health check didn't pass yet, but pushing frontend anyway"
  echo "    (the task may still be starting)"
fi

# Build, commit, push
cd "$SCRIPT_DIR"
npm run build
echo "  ✓ Frontend built"

git add .
git commit -m "deploy: update backend IP to $PUBLIC_IP" 2>/dev/null || echo "  (nothing new to commit)"
git push -u origin main
echo "  ✓ Pushed to GitHub → Vercel will auto-deploy"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Full deploy complete!"
echo ""
echo "  Backend:  http://$PUBLIC_IP:$PORT"
echo "  Frontend: https://sales-dashboard-liard.vercel.app"
echo "  Health:   curl http://$PUBLIC_IP:$PORT/api/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
