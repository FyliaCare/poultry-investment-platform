# Deploying with Neon Database + Render Backend

This guide covers deploying your Poultry Investment Platform using **Neon** for PostgreSQL and **Render** for the backend API.

## Why This Stack?

✅ **Neon PostgreSQL**: Serverless, faster, better free tier (3GB storage)
✅ **Render Backend**: Easy Docker deployment, automatic SSL
✅ **Cost**: $0-7/month (both have generous free tiers)

## Prerequisites

- GitHub account with your code pushed
- Neon account (free - https://neon.tech)
- Render account (free - https://render.com)

---

## Step-by-Step Deployment

### 1. Setup Neon PostgreSQL Database

1. Go to https://console.neon.tech
2. Click **"Create a project"**
3. Configure:
   - **Project name**: `poultry-investment-platform`
   - **PostgreSQL version**: 16 (latest)
   - **Region**: Choose closest to your users (e.g., US East, US West, EU)
4. Click **"Create project"**

5. **Copy your connection string**:
   - Look for the connection string that looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   - **Save this!** You'll need it for Render

6. **Optional - Create dedicated database**:
   ```sql
   CREATE DATABASE poultry_db;
   ```

---

### 2. Deploy Backend API on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `FyliaCare/poultry-investment-platform`

4. **Configure Service**:
   - **Name**: `poultry-investment-platform` (or `poultry-api`)
   - **Region**: Choose same region as Neon (or close to it)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Environment**: `Docker`
   - **Dockerfile Path**: `backend/Dockerfile.prod`
   - **Docker Build Context Directory**: `.` (or leave empty)

5. **Instance Type**:
   - **Free** (spins down after inactivity) - for testing
   - **Starter ($7/month)** - for production (recommended)

6. **Add Environment Variables** (click "Advanced" or add after creation):

   ```bash
   DATABASE_URL
   Value: postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   
   JWT_SECRET
   Value: 4zd7Qxfu8yDrJoehOIAmES95qgZF3kBiHwUPvVn6TXG2cLjMRtbCpl0W1aYsKN
   
   ADMIN_EMAIL
   Value: admin@fylia.care
   
   CORS_ORIGINS
   Value: https://poultry-investment-platform.onrender.com,http://localhost:5173
   
   ENVIRONMENT
   Value: production
   ```

7. Click **"Create Web Service"**

8. **Wait for deployment** (~5-10 minutes for first build)

---

### 3. Verify Backend Deployment

Once deployed, test these endpoints:

```bash
# Health check
https://poultry-investment-platform.onrender.com/health

# API docs
https://poultry-investment-platform.onrender.com/docs

# OpenAPI schema
https://poultry-investment-platform.onrender.com/openapi.json
```

**Check the logs** in Render dashboard:
- Look for "Database is up - running migrations"
- Look for "Starting application"
- No errors about database connection

---

### 4. Deploy Frontend (Option A: Render Static Site)

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `poultry-web`
   - **Branch**: `main`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. **Add Environment Variable**:
   ```bash
   VITE_API_URL
   Value: https://poultry-investment-platform.onrender.com
   ```

5. Click **"Create Static Site"**

---

### 4. Deploy Frontend (Option B: Vercel) - RECOMMENDED

Vercel is faster for static sites:

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Add Environment Variable**:
   ```bash
   VITE_API_URL = https://poultry-investment-platform.onrender.com
   ```

6. Click **"Deploy"**

---

### 5. Update CORS Settings

After frontend is deployed:

1. Go to your backend service on Render
2. Click **"Environment"**
3. Update `CORS_ORIGINS` to include your frontend URL:
   ```bash
   CORS_ORIGINS=https://poultry-web.onrender.com,https://your-app.vercel.app
   ```
4. Save (triggers automatic redeploy)

---

### 6. Create Admin User

#### Method 1: Through the Web Interface
1. Visit your frontend URL
2. Register a new user account
3. Note the email you registered with

#### Method 2: Access Neon Database Directly
1. Go to Neon Console → Your Project
2. Click **"SQL Editor"** or **"Tables"**
3. Run this query:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
   ```

#### Method 3: Use a PostgreSQL Client
```bash
# Using psql or any PostgreSQL client
psql "postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Then run:
UPDATE users SET is_admin = true WHERE id = 1;
```

---

## 🎯 **Complete Configuration Summary**

### Neon Database
```
Connection String: postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
Region: [Your chosen region]
Plan: Free (3GB storage, 0.5 vCPU)
```

### Render Backend
```
URL: https://poultry-investment-platform.onrender.com
Dockerfile: backend/Dockerfile.prod
Region: [Match Neon region]
Plan: Free or Starter ($7/month)
```

### Environment Variables (Backend)
```bash
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
JWT_SECRET=4zd7Qxfu8yDrJoehOIAmES95qgZF3kBiHwUPvVn6TXG2cLjMRtbCpl0W1aYsKN
ADMIN_EMAIL=admin@fylia.care
CORS_ORIGINS=https://your-frontend-url.com
ENVIRONMENT=production
```

### Frontend (Choose One)
**Option A - Render:**
```
URL: https://poultry-web.onrender.com
Build: cd frontend && npm install && npm run build
Publish: frontend/dist
VITE_API_URL: https://poultry-investment-platform.onrender.com
```

**Option B - Vercel (Recommended):**
```
URL: https://your-app.vercel.app
Root: frontend
Build: npm run build
Output: dist
VITE_API_URL: https://poultry-investment-platform.onrender.com
```

---

## 💰 **Cost Breakdown**

### Free Tier (Development/Testing)
- **Neon PostgreSQL**: Free (3GB storage, always on)
- **Render Backend**: Free (spins down after 15 min inactivity)
- **Frontend (Vercel)**: Free (100GB bandwidth)
- **Total**: $0/month ✨

### Production Tier
- **Neon PostgreSQL**: Free or $19/month (Pro - 10GB, autoscaling)
- **Render Backend**: $7/month (Starter - always on, 512MB RAM)
- **Frontend (Vercel)**: Free or $20/month (Pro - more bandwidth)
- **Total**: $7-46/month

---

## 🔧 **Troubleshooting**

### Backend Won't Connect to Database
```bash
# Check these:
1. DATABASE_URL is correctly set in Render environment variables
2. DATABASE_URL includes "?sslmode=require" at the end
3. Verify the connection string format:
   postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require
4. Check Render logs for specific error messages
5. Verify Neon database is active (check Neon console)

# Common fixes:
- Copy the FULL connection string from Neon (including ?sslmode=require)
- Don't use "localhost" or "db:5432" - use the Neon hostname
- Make sure there are no extra spaces in DATABASE_URL
```

### Migrations Not Running
```bash
# Check Render logs for:
- "Waiting for database..." (should connect within seconds)
- "Database is up - running migrations"
- "Starting application"

# If stuck, redeploy:
Manual Deploy → Deploy latest commit
```

### Frontend Can't Reach API
```bash
# Verify:
1. VITE_API_URL is correct (no trailing slash)
2. CORS_ORIGINS includes your frontend URL
3. Backend is running (visit /health endpoint)
```

### Free Tier Sleep Issues
```bash
# Render free tier spins down after 15 min
# First request takes ~30 seconds to wake up
# Solutions:
1. Upgrade to Starter plan ($7/month - always on)
2. Use a cron job to ping /health every 10 minutes
3. Accept the cold start for development
```

---

## 📊 **Monitor Your Deployment**

### Neon Console
- Database size and usage
- Connection pooling stats
- Query performance

### Render Dashboard
- Service logs (real-time)
- Metrics (CPU, memory, requests)
- Deployment history

### Health Check
```bash
# Set up monitoring (free services):
- UptimeRobot: https://uptimerobot.com
- Better Uptime: https://betteruptime.com
- Ping every 5 minutes: https://your-backend.onrender.com/health
```

---

## 🚀 **Automatic Deployments**

Both Neon and Render support automatic deployments:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Render automatically rebuilds and redeploys! 🎉
# Database migrations run automatically on startup
```

---

## 🔒 **Security Best Practices**

- [x] Database uses SSL/TLS (Neon enforces this)
- [x] HTTPS for all services
- [x] Environment variables for secrets
- [x] CORS properly configured
- [x] Admin seed endpoint disabled in production
- [ ] Enable Neon IP allowlist (optional, for extra security)
- [ ] Set up database backups (Neon has automatic daily backups)
- [ ] Enable 2FA on Neon and Render accounts

---

## 🎯 **Next Steps**

1. ✅ Database deployed on Neon
2. ✅ Backend deployed on Render
3. ✅ Frontend deployed (Render or Vercel)
4. Test all functionality
5. Set up custom domain
6. Configure monitoring/alerts
7. Integrate payment gateway (Paystack/MoMo)
8. Set up error tracking (Sentry)

---

## 💡 **Pro Tips**

1. **Use Neon Branching**: Create database branches for testing
2. **Connection Pooling**: Neon handles this automatically
3. **Render Preview Environments**: Auto-deploy PRs for testing
4. **Environment Sync**: Use Render's environment groups
5. **Database Backups**: Neon keeps 7 days of backups on free tier

---

**Questions?** 
- Neon Docs: https://neon.tech/docs
- Render Docs: https://render.com/docs
