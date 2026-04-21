#!/bin/bash
set -e

echo ""
echo "🚀 Sales Dashboard — Automated Deploy Trigger"
echo "============================================="

if ! command -v git &> /dev/null; then
  echo "❌ git not found. Install it from https://git-scm.com"
  exit 1
fi

echo ""
echo "Step 1/3 — Building project..."
npm run build
echo "✅ Build successful"

echo ""
echo "Step 2/3 — Commit latest changes..."
if [ ! -d ".git" ]; then
  echo "❌ This folder is not a git repository. Initialize git first."
  exit 1
fi

git add .
git commit -m "deploy: Sales Intelligence Dashboard" 2>/dev/null || echo "✅ Nothing new to commit"

echo ""
echo "Step 3/3 — Push to main (auto-deploy)..."
git push -u origin main

echo ""
echo "✅ Push complete. GitHub Actions now deploys to Vercel automatically."
echo "   Check workflow runs in: GitHub → Actions → 'Vercel Production Deploy'"
