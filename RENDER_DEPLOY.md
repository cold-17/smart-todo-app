# Deploy to Render.com - Step by Step Guide

This guide will help you deploy your Smart Todo App to Render.com in ~10 minutes.

## Prerequisites

- GitHub account with this repository pushed
- Render.com account (sign up at https://render.com - no credit card needed for free tier)

---

## Quick Deploy (Recommended)

### Option A: One-Click Deploy with Blueprint (Easiest)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click **"New +"** → **"Blueprint"**

3. **Connect Repository**
   - Click **"Connect GitHub"** and authorize Render
   - Select your `smart-todo-app` repository
   - Render will detect the `render.yaml` file automatically

4. **Configure Services**
   - Review the services that will be created:
     - ✅ Backend API (Node.js)
     - ✅ Frontend (Static Site)
     - ✅ MongoDB Database
   - Click **"Apply"**

5. **Wait for Deployment** (5-10 minutes)
   - Backend: Building and starting...
   - Frontend: Building static files...
   - Database: Provisioning MongoDB...

6. **Get Your URLs**
   Once deployed, you'll see:
   - Backend: `https://smart-todo-backend-XXXX.onrender.com`
   - Frontend: `https://smart-todo-frontend-XXXX.onrender.com`

7. **Update Frontend Environment Variable**
   - Go to: Frontend service → **Environment**
   - Find `VITE_API_URL` (it will show as "sync: false")
   - Click **Edit** and set value to: `https://smart-todo-backend-XXXX.onrender.com/api`
   - (Replace XXXX with your actual backend URL)
   - Click **Save**
   - Frontend will automatically rebuild

8. **Update Backend CORS**
   - Go to: Backend service → **Environment**
   - Find `CLIENT_URL`
   - Update it to: `https://smart-todo-frontend-XXXX.onrender.com`
   - Click **Save**
   - Backend will restart automatically

9. **Test Your App** 🎉
   - Visit your frontend URL
   - Register a new account
   - Create a todo
   - Test all features

---

## Option B: Manual Setup (More Control)

If you prefer to set up services manually:

### Step 1: Create MongoDB Database

1. From Render Dashboard, click **"New +"** → **"MongoDB"**
2. Settings:
   - **Name**: `smart-todo-mongodb`
   - **Database Name**: `smart-todo-app`
   - **User**: `smart_todo_user`
   - **Region**: `Oregon (US West)` (or your preferred region)
   - **Plan**: Free (256MB) or Starter ($7/mo - 512MB)
3. Click **"Create Database"**
4. **Save the connection string** - you'll need this in Step 2
   - Format: `mongodb://user:password@hostname:27017/database`

### Step 2: Deploy Backend API

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Settings:
   - **Name**: `smart-todo-backend`
   - **Region**: `Oregon` (same as database)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter ($7/mo)

4. **Environment Variables** - Add these:
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<click "Generate" for a secure random value>
   MONGODB_URI=<paste your MongoDB connection string from Step 1>
   CLIENT_URL=https://smart-todo-frontend-XXXX.onrender.com
   ```

   Optional (if using AI features):
   ```
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

5. **Health Check Path**: `/health`
6. Click **"Create Web Service"**
7. Wait for deployment (3-5 minutes)
8. **Copy your backend URL**: `https://smart-todo-backend-XXXX.onrender.com`

### Step 3: Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository (same repo)
3. Settings:
   - **Name**: `smart-todo-frontend`
   - **Region**: `Oregon` (same as backend)
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://smart-todo-backend-XXXX.onrender.com/api
   ```
   (Replace XXXX with your actual backend URL from Step 2)

5. Click **"Create Static Site"**
6. Wait for build (2-3 minutes)

### Step 4: Update Backend CORS

1. Go back to your **Backend service**
2. Go to **Environment** tab
3. Update `CLIENT_URL` to your frontend URL:
   ```
   CLIENT_URL=https://smart-todo-frontend-XXXX.onrender.com
   ```
4. Click **Save Changes**
5. Backend will restart automatically

### Step 5: Test Your App

Visit your frontend URL and test:
- ✅ User registration
- ✅ Login/logout
- ✅ Create/edit/delete todos
- ✅ Real-time features (if multiple users)
- ✅ AI features (if OpenAI API key configured)

---

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Purchase a domain (e.g., from Namecheap, Google Domains)
2. In Render Dashboard:
   - Go to your **Frontend service**
   - Click **Settings** → **Custom Domains**
   - Click **"Add Custom Domain"**
   - Enter: `yourdomain.com` and `www.yourdomain.com`
3. Update your domain's DNS records:
   ```
   Type: CNAME
   Name: www
   Value: smart-todo-frontend-XXXX.onrender.com

   Type: A
   Name: @
   Value: <Render provides IP>
   ```
4. SSL certificate will be auto-generated (Let's Encrypt)

### Environment Management

**Free Tier Limitations:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds
- 750 hours/month of runtime (plenty for one app)

**Upgrade to Starter ($7/service/mo) for:**
- ✅ Always-on (no spin-down)
- ✅ Faster performance
- ✅ More resources

### Enable Notifications

1. In each service, go to **Settings** → **Notifications**
2. Add your email for deploy notifications
3. Optional: Connect to Slack/Discord

---

## Troubleshooting

### Frontend shows connection error

**Issue**: Cannot connect to backend

**Fix**:
1. Check `VITE_API_URL` in frontend environment variables
2. Make sure it ends with `/api`
3. Verify backend is running (check backend logs)
4. Check backend `CLIENT_URL` includes frontend URL

### Backend shows CORS error

**Issue**: CORS policy blocking requests

**Fix**:
1. Go to backend **Environment** tab
2. Update `CLIENT_URL` to match frontend URL exactly
3. If using custom domain, add both `yourdomain.com` and `www.yourdomain.com`
   ```
   CLIENT_URL=https://yourdomain.com,https://www.yourdomain.com
   ```

### MongoDB connection failed

**Issue**: Backend can't connect to database

**Fix**:
1. Verify `MONGODB_URI` is correct in backend environment
2. Check MongoDB database is running (not suspended)
3. Ensure connection string includes correct credentials
4. Format: `mongodb://user:password@hostname:27017/database`

### Service won't start

**Issue**: Build or start command failing

**Fix**:
1. Check **Logs** tab for error messages
2. Common issues:
   - Missing environment variables
   - Wrong Node.js version (Render uses Node 20 by default)
   - Incorrect build/start commands
   - Missing dependencies in package.json

### Build takes too long / times out

**Issue**: Frontend build exceeds time limit

**Fix**:
1. Reduce bundle size (check `frontend/package.json` for unused dependencies)
2. Upgrade to Starter plan for more build time
3. Check for build errors in logs

### Socket.io not working

**Issue**: Real-time features not working

**Fix**:
1. Verify WebSocket connections are allowed (Render supports this)
2. Check browser console for socket connection errors
3. Ensure `VITE_API_URL` is set correctly (socket derives URL from this)
4. Backend must be accessible at the URL without `/api` for sockets

---

## Monitoring & Maintenance

### View Logs

1. Go to service in Render Dashboard
2. Click **Logs** tab
3. Live tail or search historical logs

### View Metrics

1. Go to service → **Metrics** tab
2. See:
   - Request volume
   - Response times
   - Memory usage
   - CPU usage

### Set up Alerts

1. Service → **Settings** → **Notifications**
2. Get alerted for:
   - Deploy failures
   - Service crashes
   - High error rates

### Database Backups

**Free tier**: No automatic backups (manual export recommended)

**Paid tier**: Daily automatic backups

**Manual backup**:
1. Use MongoDB Compass or `mongodump` to export data
2. Or use the backup script: `npm run backup` (from backend)

---

## Updating Your App

### Deploy Updates

**Automatic** (recommended):
1. Push code to GitHub: `git push origin main`
2. Render automatically detects changes and redeploys
3. No manual steps needed!

**Manual**:
1. Go to service → **Manual Deploy**
2. Click **"Deploy latest commit"**

### Environment Variables

1. Service → **Environment** tab
2. Click **Add Environment Variable** or edit existing
3. Click **Save Changes**
4. Service will restart automatically

---

## Cost Breakdown

### Free Tier (Perfect for Testing)
- Backend: Free (spins down after 15min inactivity)
- Frontend: Free (always on, it's static)
- MongoDB: Free (256MB storage)
- **Total: $0/month**

### Starter Tier (Recommended for Production)
- Backend: $7/month (always on, 512MB RAM)
- Frontend: Free (always on, it's static)
- MongoDB: $7/month (512MB storage, daily backups)
- **Total: $14/month**

### Standard Tier (High Traffic)
- Backend: $25/month (2GB RAM)
- Frontend: Free
- MongoDB: $25/month (2GB storage)
- **Total: $50/month**

---

## Next Steps

Once deployed:

1. ✅ **Test thoroughly** - Try all features
2. ✅ **Set up monitoring** - Add Sentry or LogRocket
3. ✅ **Configure backups** - Set up automated database backups
4. ✅ **Add custom domain** - Make it professional
5. ✅ **Share with users** - Get feedback!
6. ✅ **Monitor performance** - Check Render metrics
7. ✅ **Plan for scale** - Upgrade when you grow

---

## Support

**Render Documentation**: https://render.com/docs
**Render Community**: https://community.render.com
**App Issues**: Check your GitHub repository issues

---

## Quick Reference - URLs & Commands

```bash
# Your URLs (after deployment)
Frontend: https://smart-todo-frontend-XXXX.onrender.com
Backend:  https://smart-todo-backend-XXXX.onrender.com
MongoDB:  mongodb://user:pass@mongo-hostname:27017/database

# Useful Render CLI commands (optional)
npm install -g render-cli
render login
render services list
render services logs smart-todo-backend
render deploy --service smart-todo-backend

# Update and redeploy
git add .
git commit -m "Update feature"
git push origin main  # Auto-deploys!
```

---

**You're ready to deploy!** 🚀

Choose Option A (Blueprint) for the fastest deployment, or Option B (Manual) for more control.
