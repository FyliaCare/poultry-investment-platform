# Deploy Frontend to Vercel

## Prerequisites
- GitHub account with your code pushed
- Vercel account (free) - sign up at https://vercel.com

---

## Step-by-Step Deployment

### 1. Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

### 2. Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Find `poultry-investment-platform` repository
3. Click **"Import"**

### 3. Configure Build Settings

**Framework Preset**: Vite
**Root Directory**: `frontend`
**Build Command**: `npm run build`
**Output Directory**: `dist`

### 4. Set Environment Variables

Click **"Environment Variables"** and add:

```bash
VITE_API_URL=https://poultry-investment-platform.onrender.com
```

### 5. Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://poultry-investment-platform.vercel.app`

---

## After Deployment

### Update CORS in Backend

1. Go to Render Dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Update `CORS_ORIGINS`:

```bash
CORS_ORIGINS=https://poultry-investment-platform.vercel.app,https://poultry-investment-platform-git-main-fyliacare.vercel.app
```

5. Save and wait for auto-redeploy

### Test Your App

1. Visit your Vercel URL
2. Try registering a new user
3. Try logging in
4. Test creating an investment

---

## Custom Domain (Optional)

### Add Your Own Domain

1. In Vercel project settings
2. Go to **Domains** tab
3. Click **"Add"**
4. Enter your domain (e.g., `invest.yourdomain.com`)
5. Follow DNS configuration instructions

### Update CORS Again

Add your custom domain to `CORS_ORIGINS`:

```bash
CORS_ORIGINS=https://invest.yourdomain.com,https://poultry-investment-platform.vercel.app
```

---

## Automatic Deployments

Every time you push to GitHub `main` branch, Vercel will:
- ✅ Automatically build and deploy
- ✅ Run tests (if configured)
- ✅ Update your live site
- ✅ Keep preview URLs for each commit

---

## Troubleshooting

### Build Fails

Check Vercel build logs. Common issues:
- TypeScript errors → Fix and commit
- Missing dependencies → Check package.json
- Build command wrong → Should be `npm run build`

### API Calls Fail (CORS Errors)

Make sure:
1. `VITE_API_URL` is set correctly in Vercel
2. `CORS_ORIGINS` includes your Vercel URL in Render
3. Both services are running

### 404 on Page Refresh

Add `vercel.json` to root (already created for you - see below)

---

## Performance Tips

### Enable Analytics (Free)
1. Go to project settings
2. Enable **Vercel Analytics**
3. Track performance and user behavior

### Preview Deployments
Every pull request gets its own preview URL for testing!

---

## Cost

**FREE** for:
- Unlimited deployments
- 100GB bandwidth/month
- HTTPS/SSL included
- Custom domains (3 max on free tier)

**Upgrade if needed**: $20/month for more bandwidth and features

---

## Your Deployed URLs

After deployment, you'll have:
- **Production**: `https://poultry-investment-platform.vercel.app`
- **API Docs**: `https://poultry-investment-platform.onrender.com/docs`
- **Health Check**: `https://poultry-investment-platform.onrender.com/health`

🎉 **That's it! Your full-stack app is live!**
