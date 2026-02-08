# 🚀 DigitalOcean App Platform Deployment Guide

**Platform:** DigitalOcean App Platform  
**Date:** February 8, 2026  
**Estimated Setup Time:** 30-45 minutes  
**Monthly Cost:** ~$24-36 USD (Basic plan)

---

## 📋 Prerequisites

### 1. DigitalOcean Account
- [ ] Create account at [digitalocean.com](https://www.digitalocean.com/)
- [ ] Add payment method
- [ ] Enable App Platform in your account

### 2. External Services Setup

#### Qdrant Cloud (Vector Database for AI Tutor)
1. Go to [cloud.qdrant.io](https://cloud.qdrant.io/)
2. Create free account
3. Create new cluster: **focusguard-vectors**
4. Note down:
   - **QDRANT_URL**: `https://your-cluster.qdrant.io`
   - **QDRANT_API_KEY**: From cluster settings

#### HuggingFace API (for RAG AI Tutor - FREE)
1. Go to [huggingface.co](https://huggingface.co/)
2. Create free account
3. Go to Settings → Access Tokens
4. Create new token with "Read" access
5. Note down **HUGGINGFACE_API_KEY** (starts with `hf_`)

**Note**: Free tier includes 1000 requests/hour - more than enough!

### 3. Generate JWT Secret
```bash
# Run this command to generate a secure secret
openssl rand -hex 32
```
**Copy the output** - you'll need it as `JWT_SECRET_KEY`

---

## 🎯 Step-by-Step Deployment

### Step 1: Push Code to GitHub (Already Done ✅)
Your repository is already on GitHub at:
```
https://github.com/talelboussetta/FocusGuard-ML
```

### Step 2: Create App on DigitalOcean

1. **Log in to DigitalOcean** → Click **"Create"** → **"Apps"**

2. **Connect GitHub Repository**
   - Choose **GitHub**
   - Authorize DigitalOcean to access your repos
   - Select: `talelboussetta/FocusGuard-ML`
   - Branch: `main`
   - ✅ Enable **Auto Deploy** (deploys on git push)

3. **Option A: Import App Spec (Recommended)**
   - Click **"Edit App Spec"** (top right, YAML icon)
   - Delete ALL auto-detected configuration
   - Copy the entire contents of `.do/app.yaml` from your repo
   - Paste into the editor
   - Click **"Save"**
   
   **Option B: Let DigitalOcean Auto-Detect (Alternative)**
   - Click **"Next"** to let DO detect components automatically
   - After detection, click **"Edit App Spec"**
   - Update the backend/frontend settings with values from `.do/app.yaml`
   - Specifically add the environment variables section
   
   **Troubleshooting:**
   - If "No components detected" → Use Option B instead
   - Make sure repository is public or DigitalOcean has access permissions

### Step 3: Configure Managed Database

The app spec already includes a PostgreSQL database. DigitalOcean will:
- ✅ Automatically create a managed PostgreSQL 15 instance
- ✅ Auto-inject `DATABASE_URL` into your backend
- ✅ Handle backups and updates

**No manual database setup needed!**

### Step 4: Set Environment Variables (Secrets)

1. In the App Platform dashboard, go to **Settings** → **Environment Variables** → **Backend**

2. Add these **SECRET** variables (click "Edit" → "Encrypt"):

   | Variable | Value | Where to Get It |
   |----------|-------|-----------------|
   | `JWT_SECRET_KEY` | `<your-generated-secret>` | Output from `openssl rand -hex 32` |
   | `QDRANT_URL` | `https://your-cluster.qdrant.io` | Qdrant Cloud dashboard |
   | `QDRANT_API_KEY` | `qdr_xxxxx` | Qdrant cluster settings |
   | `HUGGINGFACE_API_KEY` | `hf_xxxxx` | HuggingFace access token |

3. **Enable Local Embeddings** (free alternative to OpenAI):
   
   Add this to **Backend** environment variables:
   
   | Variable | Value |
   |----------|-------|
   | `USE_LOCAL_EMBEDDINGS` | `True` |
   
   This uses sentence-transformers (runs on server CPU) instead of OpenAI embeddings.

4. Click **"Save"**

### Step 5: Configure Frontend Environment

The frontend environment variables are **build-time only** and are already configured in `app.yaml`:
- `VITE_API_URL` → Automatically set to backend URL
- `VITE_ENABLE_CAMERA` → Set to "true"

**No manual configuration needed!**

### Step 6: Deploy the App

1. Click **"Review"** → **"Create Resources"**

2. **DigitalOcean will now:**
   - ✅ Provision PostgreSQL database
   - ✅ Build backend (install Python dependencies)
   - ✅ Build frontend (npm install + build)
   - ✅ Deploy both services
   - ✅ Run database migrations automatically

3. **Deployment takes ~10-15 minutes**

   You'll see:
   ```
   ⏳ Building backend...
   ⏳ Building frontend...
   ⏳ Creating database...
   ✅ Deployment successful!
   ```

### Step 7: Initialize Database

The database migrations will **automatically run** on first deployment because:
- Migrations are in `serv/database/init/*.sql`
- PostgreSQL runs them on first connection
- All 12 migration files will be executed in order

**No manual database setup needed!**

### Step 8: Verify Deployment

1. **Get Your App URL**
   - In App Platform dashboard, you'll see:
     - Frontend: `https://focusguard-xxxxx.ondigitalocean.app`
     - Backend: `https://focusguard-backend-xxxxx.ondigitalocean.app`

2. **Test Backend Health**
   ```bash
   curl https://focusguard-backend-xxxxx.ondigitalocean.app/health
   # Expected: {"status": "healthy", "database": "connected"}
   ```

3. **Test API Documentation**
   - Visit: `https://focusguard-backend-xxxxx.ondigitalocean.app/docs`
   - You should see Swagger UI

4. **Test Frontend**
   - Visit: `https://focusguard-xxxxx.ondigitalocean.app`
   - You should see the landing page
   - Click **"Sign Up"** to create an account

---

## 🎨 Step 9: Set Up Custom Domain (Optional)

1. In App Platform → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `focusguard.app`
4. Add DNS records to your domain registrar:
   ```
   Type: CNAME
   Name: @
   Value: focusguard-xxxxx.ondigitalocean.app
   ```
5. DigitalOcean will auto-provision SSL certificate (Let's Encrypt)

---

## 🔧 Step 10: Configure CORS for Custom Domain

If you set up a custom domain, update backend CORS:

1. Go to **App Platform** → **Backend** → **Environment Variables**
2. Edit `ALLOWED_ORIGINS`:
   ```
   https://focusguard.app,https://www.focusguard.app
   ```
3. Click **"Save"** → App will redeploy automatically

---

## 💰 Pricing Breakdown

| Resource | Tier | Cost/Month |
|----------|------|------------|
| Backend (FastAPI) | Basic XXS | $5 |
| Frontend (Static Site) | Basic XXS | $5 |
| PostgreSQL Database | Basic | $15 |
| **Total** | | **~$25/month** |

**Additional Costs:**
- Qdrant Cloud: Free tier (1GB storage)
- HuggingFace API: Free tier (1000 requests/hour)

**Total estimated: $25/month** (just infrastructure, no API costs!)

---

## 📊 Monitoring & Logs

### View Logs
1. App Platform → Your App → **Runtime Logs**
2. Select service (backend/frontend)
3. View real-time logs

### View Metrics
1. App Platform → Your App → **Insights**
2. See:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Set Up Alerts
1. App Platform → **Settings** → **Alerts**
2. Configure email notifications for:
   - Deployment failures
   - High CPU/memory
   - Service down

---

## 🔄 Continuous Deployment (Already Configured ✅)

App Platform is configured for **auto-deploy**:

```bash
# Make code changes locally
git add .
git commit -m "feat: add new feature"
git push origin main

# DigitalOcean automatically:
# 1. Detects git push
# 2. Rebuilds services
# 3. Deploys new version
# 4. Zero-downtime deployment
```

**Deployment takes ~5-10 minutes per update**

---

## 🐛 Troubleshooting

### Issue: Backend Health Check Failing

**Solution:**
```bash
# Check backend logs in App Platform dashboard
# Common issues:
# 1. DATABASE_URL not set → Check environment variables
# 2. Qdrant not accessible → Verify QDRANT_URL and API key
# 3. Migration errors → Check database logs
```

### Issue: Frontend Can't Connect to Backend

**Solution:**
1. Check `VITE_API_URL` is set correctly
2. Rebuild frontend (trigger deployment)
3. Verify CORS settings in backend

### Issue: Database Migration Failed

**Solution:**
```bash
# Option 1: Trigger redeploy (migrations will retry)
# In App Platform → Click "Deploy"

# Option 2: Manual migration via console
# App Platform → Backend → Console → Run:
cd serv
python scripts/run_migration.py
```

### Issue: AI Tutor Not Working

**Solution:**
1. Verify `HUGGINGFACE_API_KEY` is set
2. Verify `QDRANT_URL` and `QDRANT_API_KEY` are set
3. Verify `USE_LOCAL_EMBEDDINGS=True` is set
4. Check HuggingFace token has "Read" permissions
5. Check backend logs for errors

---

## 🚀 Post-Deployment Tasks

### 1. Ingest RAG Knowledge Base (First Time Only)

```bash
# In App Platform → Backend → Console
cd serv
python rag/ingest_knowledge_base.py
# This will index all 40+ markdown docs into Qdrant
# Takes ~5-10 minutes
```

### 2. Create Admin Account

Visit your app and sign up with your email.

### 3. Test All Features

- [ ] User registration/login
- [ ] Start focus session
- [ ] Camera detection (if using webcam)
- [ ] AI Tutor chat
- [ ] Garden visualization
- [ ] Team features
- [ ] Leaderboard

---

## 📈 Scaling (Future)

When you need more power:

### Scale Vertically
```bash
# App Platform → Backend → Resources
# Change instance size:
# Basic XXS → Professional XS ($12/month)
# Professional XS → Professional S ($24/month)
```

### Scale Horizontally
```bash
# App Platform → Backend → Resources
# Increase instance count: 1 → 2, 3, 4...
# Auto load balancing included
```

### Upgrade Database
```bash
# App Platform → Databases → focusguard-db
# Change plan: Basic → Professional ($50/month)
# Features: 2GB RAM → 4GB RAM, daily backups
```

---

## 🎯 Quick Reference

**Your App URLs (after deployment):**
- Frontend: `https://focusguard-xxxxx.ondigitalocean.app`
- Backend: `https://focusguard-backend-xxxxx.ondigitalocean.app`
- API Docs: `https://focusguard-backend-xxxxx.ondigitalocean.app/docs`
- Database: Managed by DigitalOcean (internal URL)

**Required Environment Variables:**
- `JWT_SECRET_KEY` - Generate with `openssl rand -hex 32`
- `QDRANT_URL` - From Qdrant Cloud
- `QDRANT_API_KEY` - From Qdrant Cloud
- `HUGGINGFACE_API_KEY` - From HuggingFace (free tier)
- `USE_LOCAL_EMBEDDINGS=True` - Use free CPU-based embeddings

**Support Resources:**
- DigitalOcean Docs: https://docs.digitalocean.com/products/app-platform/
- Community Forum: https://www.digitalocean.com/community/tags/app-platform

---

## ✅ Checklist

- [ ] DigitalOcean account created
- [ ] Qdrant Cloud cluster created
- [ ] HuggingFace API token obtained (free tier)
- [ ] JWT secret generated
- [ ] App created from GitHub repo
- [ ] App spec imported from `.do/app.yaml`
- [ ] Environment variables configured
- [ ] App deployed successfully
- [ ] Health check passing
- [ ] RAG knowledge base ingested
- [ ] User account created and tested
- [ ] All features working

**You're live! 🎉**

---

**Deployment Complete! Your FocusGuard app is now running on DigitalOcean App Platform with:**
- ✅ Auto-scaling infrastructure
- ✅ Managed PostgreSQL database
- ✅ SSL certificates
- ✅ Automatic deployments from git
- ✅ Zero-downtime updates
- ✅ Built-in monitoring and logs
