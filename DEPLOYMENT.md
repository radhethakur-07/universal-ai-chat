# Deployment Guide — Universal AI Chat Interface

> **Team: Dev Dynasty | SIH 2026 | PS12**
> 
> This guide deploys the project entirely using browser dashboards. No local CLI installation required.

---

## Prerequisites

Create accounts (all free tiers):
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Google AI Studio](https://aistudio.google.com)
- [GitHub](https://github.com)
- [Render](https://render.com)
- [Vercel](https://vercel.com)

---

## Step 1: MongoDB Atlas Setup

### 1.1 Create a Free Cluster
1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click **"Build a Database"**
3. Select **"M0 Free"** tier
4. Choose **AWS**, region closest to you (e.g., Mumbai: `ap-south-1`)
5. Name your cluster (e.g., `universal-ai-cluster`)
6. Click **"Create Deployment"**

### 1.2 Create a Database User
1. Go to **Security → Database Access**
2. Click **"Add New Database User"**
3. Authentication: **Password**
4. Username: `devdynasty`
5. Password: Generate a strong password and **save it securely**
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 1.3 Configure Network Access
1. Go to **Security → Network Access**
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   > ⚠️ For production, restrict to your Render backend IP. For the hackathon, allow all is acceptable.
4. Click **"Confirm"**

### 1.4 Get Your Connection String
1. Go to **Clusters → Connect**
2. Select **"Drivers"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy the connection string. It looks like:
   ```
   mongodb+srv://devdynasty:<password>@universal-ai-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add the database name: `universal_ai_chat`
   ```
   mongodb+srv://devdynasty:YOUR_PASSWORD@universal-ai-cluster.xxxxx.mongodb.net/project0?retryWrites=true&w=majority
   ```
7. **Save this as `MONGODB_URI`**

---

## Step 2: Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **"Get API Key"** in the top navigation
4. Click **"Create API Key"**
5. Select **"Create API Key in new project"** or use an existing project
6. Copy the API key
7. **Save this as `GEMINI_API_KEY`**

> Model to use: `gemini-2.0-flash` (already set as default in the code)

---

## Step 3: Push to GitHub

### 3.1 Create a Repository
1. Go to [github.com](https://github.com)
2. Click **"New repository"**
3. Name: `universal-ai-chat`
4. Visibility: **Private** (to protect your code before the hackathon)
5. Do NOT initialize with README
6. Click **"Create repository"**

### 3.2 Upload Your Code

**Option A: GitHub Web UI (Drag & Drop)**
1. On the repository page, click **"uploading an existing file"**
2. Drag the project folder contents into the upload area
3. Commit the files

**Option B: GitHub Desktop**
1. Download [GitHub Desktop](https://desktop.github.com) (one-time install)
2. Clone your new repository
3. Copy your project files into the cloned folder
4. Commit and push

### 3.3 Create a .gitignore

Ensure these are ignored (already in `.gitignore`):
```
node_modules/
dist/
.env
*.env.local
```

---

## Step 4: Deploy Backend to Render

### 4.1 Create a Web Service
1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your `universal-ai-chat` repository
5. Configure:
   - **Name**: `universal-ai-chat-server`
   - **Region**: Singapore (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
   - **Instance Type**: Free

### 4.2 Add Environment Variables
In Render → Environment tab, add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | your MongoDB Atlas connection string |
| `GEMINI_API_KEY` | your Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `JWT_SECRET` | Generate a 64+ char random string |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://your-app.vercel.app` (add after Vercel deploy) |
| `CORS_ORIGIN` | `https://your-app.vercel.app` (add after Vercel deploy) |

> 💡 Generate JWT_SECRET: Go to [randomkeygen.com](https://randomkeygen.com) and use a "504-bit WPA Key"

### 4.3 Deploy
1. Click **"Create Web Service"**
2. Render will build and deploy automatically
3. Wait 3–5 minutes for the first build
4. Your backend URL will be: `https://universal-ai-chat-server.onrender.com`

### 4.4 Test Backend Health
Open in your browser:
```
https://universal-ai-chat-server.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-21T...",
  "database": "connected"
}
```

### 4.5 Seed Demo Data
In Render → your service → **Shell** tab:
```bash
node -e "require('./dist/utils/seed.js')"
```

Or add a one-time job:
1. Render → **"New +"** → **"Job"**
2. Same repository, root directory `server`
3. Command: `node dist/utils/seed.js`
4. Run once

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Import Repository
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your `universal-ai-chat` GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 5.2 Add Environment Variables
In Vercel → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://universal-ai-chat-server.onrender.com` |

### 5.3 Deploy
1. Click **"Deploy"**
2. Wait 1–2 minutes
3. Your frontend URL will be: `https://universal-ai-chat.vercel.app`

---

## Step 6: Connect Frontend ↔ Backend

### 6.1 Update Backend CORS
Go to Render → your service → Environment:
- Update `CLIENT_URL` to your Vercel URL
- Update `CORS_ORIGIN` to your Vercel URL

Click **"Save Changes"** — Render will redeploy automatically.

### 6.2 Redeploy Frontend (if needed)
Vercel → your project → **"Redeploy"**

---

## Step 7: Production Testing Checklist

### 7.1 Health Check
```
GET https://your-backend.onrender.com/api/health
```
✅ `{"status": "ok", "database": "connected"}`

### 7.2 Authentication
1. Open your Vercel URL
2. Click **"Use Demo Credentials"**
3. Login with `demo@devdynasty.in` / `Demo@1234`
4. ✅ Should redirect to chat workspace

### 7.3 Test Chat — Query
Type: `"Show me all orders"`
✅ Should show a table of orders

### 7.4 Test Chat — Filter
Type: `"Show Mumbai orders above ₹5000"`
✅ Should show filtered table

### 7.5 Test Chat — Analytics
Type: `"Generate a bar chart of revenue by region"`
✅ Should show a Recharts bar chart

### 7.6 Test Chat — Function
Type: `"What is the total unpaid invoice amount?"`
✅ Should calculate and answer

### 7.7 Test Chat — Mutation
Type: `"Update order ORD-101 to shipped"`
✅ Should show confirmation card

Click **"Confirm"**
✅ Should execute and show success

### 7.8 Test Conversation History
1. Start a new chat
2. Ask a question
3. Click sidebar → the chat appears in "Recent"
4. Click it → messages reload

---

## Step 8: Verify Production Logs

In Render → your service → **"Logs"** tab:
- ✅ No `GEMINI_API_KEY` in logs
- ✅ No `MONGODB_URI` in logs
- ✅ No JWT tokens in logs
- ✅ Requests logged with requestId and duration

---

## Troubleshooting

### Backend won't start
- Check Render logs for error messages
- Verify all environment variables are set
- Ensure `MONGODB_URI` is correct and network access is open

### CORS errors in browser
- Ensure `CORS_ORIGIN` matches your exact Vercel URL (no trailing slash)
- Redeploy backend after changing env vars

### Gemini errors
- Verify `GEMINI_API_KEY` is correct
- Check you haven't exceeded free tier limits
- Try `GEMINI_MODEL=gemini-1.5-flash` if `gemini-2.0-flash` is unavailable

### MongoDB connection fails
- Verify network access allows `0.0.0.0/0`
- Check database user credentials
- Ensure the database name is in the URI

### Free tier cold starts
- Render free tier services sleep after 15 minutes of inactivity
- First request after sleep may take 30–60 seconds
- This is expected — upgrade to Render Starter for production

---

## Production Checklist

```
✅ Frontend builds successfully
✅ Backend starts successfully  
✅ MongoDB connection works
✅ Gemini API connection works
✅ Authentication works
✅ Protected routes work
✅ Chat works
✅ Tool calling works
✅ Zod validation works
✅ Authorization works
✅ Query operation works
✅ Mutation confirmation works
✅ Function execution works
✅ Analytics works
✅ Conversation history works
✅ Error handling works
✅ Audit logs work
✅ Secrets are not exposed
✅ No localhost URLs in production config
✅ CORS works
✅ Vercel deployment works
✅ Render deployment works
✅ MongoDB Atlas works
✅ Demo scenarios work end-to-end
```
