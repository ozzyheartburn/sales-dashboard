# Sales Intelligence Dashboard

A B2B sales intelligence dashboard built with React + Vite + TypeScript.

## Tech Stack
- React 18 + TypeScript
- Vite
- React Router DOM
- Framer Motion (motion/react)
- Recharts
- Lucide React

## Local Development
```bash
npm install
npm run dev
```

## Deploy to Vercel (Fully Automated)
This repo now auto-deploys to Vercel on every push to `main` via GitHub Actions.

### One-time setup
1. In Vercel, create/import the project once.
2. In GitHub repo settings, add these Actions secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
3. Confirm the workflow exists at `.github/workflows/vercel-deploy.yml`.

### Day-to-day deploy
```bash
./deploy.sh
```
This script builds, commits, and pushes to `main`; GitHub Actions handles production deploy automatically.

## Folder Structure
```
src/
  components/   → AppLayout (sidebar + shell)
  pages/        → DashboardHome, ResearchHub
  index.css     → Design tokens + global styles
  App.tsx       → Router setup
  main.tsx      → Entry point
```
