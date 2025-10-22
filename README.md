# Poultry Investment Platform (Full Stack)

Beautiful, production-ready investment platform connecting investors to poultry farms (Egg Note & Chicken Note).

🚀 **PRODUCTION READY** - See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide

## Stack
- **Frontend:** React + Vite + TypeScript + TailwindCSS + React Router + Axios + Recharts
- **Backend:** FastAPI + SQLAlchemy + JWT Auth + Alembic Migrations
- **Database:** PostgreSQL (Production) / SQLite (Development)
- **Web Server:** Nginx with SSL/TLS support
- **Packaging:** Production-ready Docker containers with health checks
- **Security:** Environment-based secrets, CORS, HTTPS, security headers

## Quick Start (Local Development)

### 1) Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # set a strong JWT_SECRET; DATABASE_URL defaults to sqlite
uvicorn app.main:app --reload
```

### 2) Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs

## Production Deployment

### Option 1: Neon + Render ⭐ (Recommended - Best Performance)

```bash
# Neon PostgreSQL (serverless) + Render Backend
# See DEPLOY_NEON_RENDER.md for complete guide
```

🚀 **Quick Start**: [DEPLOY_NEON_RENDER.md](DEPLOY_NEON_RENDER.md) - Deploy in 10 minutes
💰 **Cost**: Free tier available (or $7-27/month for production)
⚡ **Best for**: Production apps, better performance, 3GB free storage

### Option 2: All-in-One Render

```bash
# Everything on Render (Database + Backend + Frontend)
# See DEPLOY_TO_RENDER.md for complete guide
```

🚀 **Quick Start**: [DEPLOY_TO_RENDER.md](DEPLOY_TO_RENDER.md)
💰 **Cost**: Free tier or $14-21/month
📦 **Best for**: Simplicity, everything in one place

### Option 3: Self-Hosted (VPS/Cloud)

For deployment with Docker on your own server:

```bash
# See complete guide in DEPLOYMENT.md
docker-compose -f docker-compose.prod.yml up -d --build
```

📋 **Pre-deployment**: Review [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
📖 **Full guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions
🎯 **Quick reference**: See [PRODUCTION_READY.md](PRODUCTION_READY.md) for overview

## Docker (Development)
```bash
docker-compose up --build
```

## Default Admin
After registration, make yourself admin by updating the DB or by calling the seed endpoint:
```bash
# (Dev only) Seed demo content and set first user as admin:
curl -X POST http://localhost:8000/admin/seed
```
> Remove/disable `/admin/seed` in production.

## Features
- Marketing pages: Home, How It Works (step-by-step), FAQ
- Investor flows: Register/Login, Invest in Eggs or Chicken, Portfolio dashboard
- Admin: Create farms/batches, view KPIs, simulate and execute payouts
- Pretty Tailwind UI, responsive, with charts via Recharts

## Notes
- Payments are stubbed with a simulator service; integrate MoMo/Paystack/etc. in `app/services/payments.py` later.
- All numbers are illustrative—tune pricing & payouts in `app/services/payouts.py` and in frontend copy.
