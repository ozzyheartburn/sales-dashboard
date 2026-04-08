#!/bin/bash
set -e

echo ""
echo "🚀 Sales Dashboard — Vercel Deploy Script"
echo "==========================================="

# Check for git
if ! command -v git &> /dev/null; then
  echo "❌ git not found. Install it from https://git-scm.com"
  exit 1
fi

# Check for gh CLI (optional but helpful)
HAS_GH=$(command -v gh &> /dev/null && echo "yes" || echo "no")

echo ""
echo "Step 1/4 — Building project..."
npm run build
echo "✅ Build successful (dist/ folder ready)"

echo ""
echo "Step 2/4 — Initializing git..."
if [ ! -d ".git" ]; then
  git init
  git branch -M main
  echo "✅ Git initialized"
else
  echo "✅ Git already initialized"
fi

git add .
git commit -m "deploy: Sales Intelligence Dashboard" 2>/dev/null || echo "✅ Nothing new to commit"

echo ""
echo "Step 3/4 — GitHub repository"
if [ "$HAS_GH" = "yes" ]; then
  echo "GitHub CLI detected. Creating repo automatically..."
  gh repo create sales-dashboard --public --source=. --remote=origin --push 2>/dev/null || \
  (echo "Repo may already exist — pushing to origin..." && git push -u origin main)
  echo "✅ Pushed to GitHub"
else
  echo ""
  echo "👉 Manual step required:"
  echo "   1. Go to https://github.com/new"
  echo "   2. Create a repo named: sales-dashboard"
  echo "   3. Run these commands:"
  echo ""
  echo "      git remote add origin https://github.com/YOUR_USERNAME/sales-dashboard.git"
  echo "      git push -u origin main"
  echo ""
  read -p "Press Enter once you've pushed to GitHub..."
fi

echo ""
echo "Step 4/4 — Open Vercel"
echo "Opening https://vercel.com/new ..."
echo ""
echo "In Vercel:"
echo "  • Click 'Add New Project'"
echo "  • Import 'sales-dashboard' from GitHub"
echo "  • Framework: Vite (auto-detected)"
echo "  • Build command: npm run build"
echo "  • Output directory: dist"
echo "  • Click Deploy ✅"
echo ""

# Try to open browser
if command -v open &> /dev/null; then
  open "https://vercel.com/new"
elif command -v xdg-open &> /dev/null; then
  xdg-open "https://vercel.com/new"
else
  echo "👉 Open manually: https://vercel.com/new"
fi

echo ""
echo "🎉 Done! Your app will be live at https://sales-dashboard.vercel.app"
