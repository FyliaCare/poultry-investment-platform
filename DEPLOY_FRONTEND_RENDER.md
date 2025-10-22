# Deploy Frontend to Render (Static Site)

## Quick Setup

### 1. Go to Render Dashboard
https://dashboard.render.com

### 2. Create New Static Site
1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository: `poultry-investment-platform`
3. Click **"Connect"**

---

## Configuration Settings

### Build Settings

| Field | Value |
|-------|-------|
| **Name** | `poultry-investment-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

### Environment Variables

Click **"Advanced"** → Add environment variable:

```bash
VITE_API_URL=https://poultry-investment-platform.onrender.com
```

### Auto-Deploy
✅ Enable **"Auto-Deploy"** (deploys on every git push)

---

## Click "Create Static Site"

Render will:
1. Install dependencies
2. Build your React app
3. Deploy to CDN
4. Give you a URL like: `https://poultry-investment-frontend.onrender.com`

Build takes ~3-5 minutes.

---

## After Deployment

### 1. Update CORS in Backend

Go to your **backend service** on Render:
1. Click on `poultry-investment-platform` (backend)
2. Go to **"Environment"** tab
3. Find `CORS_ORIGINS` and update it:

```bash
CORS_ORIGINS=https://poultry-investment-frontend.onrender.com
```

4. Click **"Save Changes"** (backend will auto-redeploy)

### 2. Test Your App

Visit: `https://poultry-investment-frontend.onrender.com`

Test:
- ✅ Registration
- ✅ Login
- ✅ View investments
- ✅ Create investment

---

## Custom Domain (Optional)

### Add Your Domain
1. In your static site settings
2. Go to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `invest.yourdomain.com`
5. Update DNS with provided CNAME record

### Update CORS
Add custom domain to backend CORS:
```bash
CORS_ORIGINS=https://invest.yourdomain.com,https://poultry-investment-frontend.onrender.com
```

---

## Troubleshooting

### Build Fails
Check **"Logs"** tab. Common issues:
- Node version: Add `.node-version` file with `20`
- Missing dependencies: Check `package.json`

### 404 on Page Refresh
Already handled by Render's built-in SPA support!

### CORS Errors
Make sure:
1. `VITE_API_URL` is set in frontend environment
2. Frontend URL is in backend `CORS_ORIGINS`
3. Both services are deployed and running

---

## Cost

**FREE** includes:
- 100GB bandwidth/month
- Auto-deploy from GitHub
- HTTPS/SSL included
- Custom domains
- Global CDN

**Paid**: $7/month for 400GB bandwidth

---

## Your Live URLs

- **Frontend**: `https://poultry-investment-frontend.onrender.com`
- **Backend**: `https://poultry-investment-platform.onrender.com`
- **API Docs**: `https://poultry-investment-platform.onrender.com/docs`

🎉 **Full-stack app deployed on Render!**
