# Poultry Investment Platform (Full Stack)
Beautiful, production-style starter for an investment platform connecting investors to poultry farms (Egg Note & Chicken Note).

## Stack
- **Frontend:** React + Vite + TypeScript + TailwindCSS + React Router + Axios + Recharts
- **Backend:** FastAPI + SQLAlchemy (SQLite) + JWT Auth
- **Packaging:** Dockerfiles for frontend/backend, `docker-compose.yml`
- **Env:** `.env.example` files included

## Quick Start (Local)
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

## Docker (optional)
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
