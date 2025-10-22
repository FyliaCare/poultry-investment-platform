# Deploying to Render.com

This guide covers deploying your Poultry Investment Platform to Render.com - the easiest and most cost-effective option.

## Why Render?

✅ **Free tier available** (PostgreSQL included)
✅ **Automatic SSL certificates** (no manual setup)
✅ **Deploy from GitHub** (automatic deployments)
✅ **Built-in Docker support**
✅ **Simple environment variable management**
✅ **Zero DevOps required**

## Prerequisites

- GitHub account
- Render.com account (free - sign up at https://render.com)
- Your code pushed to GitHub

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for production deployment"

# Create repository on GitHub, then:
git remote add origin https://github.com/FyliaCare/poultry-investment-platform.git
git push -u origin main
```

### 2. Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `poultry-db`
   - **Database**: `poultry_db`
   - **User**: `poultry_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click **"Create Database"**
5. **Save the Internal Database URL** (you'll need this)

### 3. Deploy Backend API

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `poultry-api`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `backend/Dockerfile.prod`
   - **Region**: Same as database
   - **Plan**: Free (or Starter $7/month for production)

4. **Add Environment Variables**:
   ```
   DATABASE_URL=<Internal Database URL from step 2>
   JWT_SECRET=<generate with: openssl rand -hex 32>
   ADMIN_EMAIL=admin@yourdomain.com
   CORS_ORIGINS=https://poultry-web.onrender.com
   ENVIRONMENT=production
   ```

5. Click **"Create Web Service"**

### 4. Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `poultry-web`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Region**: Same as backend

4. **Add Environment Variable**:
   ```
   VITE_API_URL=https://poultry-api.onrender.com
   ```

5. Click **"Create Static Site"**

### 5. Update CORS Settings

Once frontend is deployed, update the backend environment variables:

1. Go to your backend service (`poultry-api`)
2. Click **"Environment"**
3. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://poultry-web.onrender.com,https://<your-custom-domain>
   ```
4. Save (this will trigger a redeploy)

### 6. Verify Deployment

1. **Check API**: Visit `https://poultry-api.onrender.com/health`
2. **Check Frontend**: Visit `https://poultry-web.onrender.com`
3. **Check Docs**: Visit `https://poultry-api.onrender.com/docs`

### 7. Create Admin User

1. Register a user through the web interface
2. Access the database:
   - In Render dashboard, go to your PostgreSQL database
   - Click **"Connect"** → **"External Connection"**
   - Use provided credentials with a PostgreSQL client

3. Set user as admin:
   ```sql
   UPDATE users SET is_admin = true WHERE id = 1;
   ```

## Cost Breakdown

### Free Tier (Development/Testing)
- **PostgreSQL**: Free (90 days, then $7/month)
- **Backend API**: Free (spins down after inactivity)
- **Frontend**: Free
- **Total**: $0/month (first 90 days), then $7/month

### Production Tier (Recommended)
- **PostgreSQL**: $7/month (always on, 1GB RAM)
- **Backend API**: $7/month (always on, 512MB RAM)
- **Frontend**: Free or $7/month for custom domain + SSL
- **Total**: $14-21/month

## Custom Domain Setup

1. In your web service, go to **"Settings"**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Update your DNS records as instructed
5. SSL certificate will be automatically provisioned

## Automatic Deployments

Render automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main
# Render will automatically deploy! 🚀
```

## Environment Variables Reference

### Backend (poultry-api)
```bash
DATABASE_URL=<from Render PostgreSQL>
JWT_SECRET=<run: openssl rand -hex 32>
ADMIN_EMAIL=admin@yourdomain.com
CORS_ORIGINS=https://poultry-web.onrender.com,https://yourdomain.com
ENVIRONMENT=production
```

### Frontend (poultry-web)
```bash
VITE_API_URL=https://poultry-api.onrender.com
```

## Troubleshooting

### Backend Won't Start
- Check logs in Render dashboard
- Verify `DATABASE_URL` is correct
- Ensure Dockerfile.prod exists in backend folder

### Database Connection Failed
- Use **Internal Database URL** (not External)
- Format: `postgresql://user:password@hostname/database`
- Verify database is in same region as backend

### Frontend Can't Reach API
- Check CORS_ORIGINS includes frontend URL
- Verify VITE_API_URL is correct
- Check backend is running

### Migrations Not Running
- Check backend logs for migration errors
- Migrations run automatically on startup
- Verify `DATABASE_URL` is accessible

## Monitoring & Logs

1. **View Logs**: Dashboard → Your Service → Logs tab
2. **Metrics**: Dashboard → Your Service → Metrics tab
3. **Health**: Automatic health checks on `/health` endpoint

## Backup Database

### Manual Backup
```bash
# Get External Database URL from Render
pg_dump <EXTERNAL_DATABASE_URL> > backup.sql
```

### Scheduled Backups
- Render PostgreSQL includes daily backups
- Retained for 7 days (free tier) or longer (paid tiers)

## Scaling

### Vertical Scaling (More Resources)
1. Go to service settings
2. Change instance type
3. Save (causes brief downtime)

### Horizontal Scaling (More Instances)
1. Only available on paid plans
2. Settings → Scaling → Set number of instances

## Security Checklist

- [x] HTTPS automatically enabled
- [x] Environment variables stored securely
- [x] Database not publicly accessible (internal URL)
- [x] CORS properly configured
- [x] Admin seed endpoint disabled in production
- [ ] Set up custom domain
- [ ] Enable 2FA on Render account
- [ ] Set up monitoring alerts

## Next Steps

1. ✅ Deploy to Render using this guide
2. Test all functionality
3. Set up custom domain
4. Configure email service (SendGrid, etc.)
5. Integrate payment gateway (Paystack/MoMo)
6. Set up monitoring (Sentry, LogRocket, etc.)

## Alternative: Render Blueprint (Coming Soon)

For even easier deployment, you can use a render.yaml blueprint. Let me know if you want me to create one!

---

**Questions?** Check Render docs at https://render.com/docs or contact support.
