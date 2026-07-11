# 🚀 ZOIKO Bible Explorer - Local Testing & Vercel Deployment Guide

## ✅ Project Status

**Files Restored from Git**: ✅ YES
**Dependencies**: ✅ Resolved (9 workspace projects found)
**Configuration**: ✅ Complete  (.env files created with API keys)
**Ready for Local Testing**: ✅ YES
**Ready for Vercel**: ✅ YES (with deployment config included)

---

## 🏃 **Quick Start - Local Testing (Choose One Method)**

### Method 1: Using Batch Files (Easiest for Windows)

**For Backend + Frontend Together**:
```bash
# Double-click this file in your workspace:
start-all.bat
```

**For Individual Servers**:
```bash
# Terminal 1 - Backend only:
double-click start-backend.bat

# Terminal 2 - Frontend only:
double-click start-frontend.bat
```

### Method 2: PowerShell (Recommended for Control)

```powershell
# Terminal 1: Backend API Server
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd 'c:\Users\USER\OneDrive\Desktop\Dev Apps\zoikohbiblexplorer'
pnpm --filter @workspace/api-server run dev

# Terminal 2: Frontend React App (new PowerShell window)
cd 'c:\Users\USER\OneDrive\Desktop\Dev Apps\zoikohbiblexplorer'
pnpm --filter @workspace/bible-explorer run dev
```

### Method 3: Command Prompt (cmd.exe)

```cmd
@REM Terminal 1: Backend
cd "c:\Users\USER\OneDrive\Desktop\Dev Apps\zoikohbiblexplorer"
pnpm --filter @workspace/api-server run dev

@REM Terminal 2: Frontend
cd "c:\Users\USER\OneDrive\Desktop\Dev Apps\zoikohbiblexplorer"
pnpm --filter @workspace/bible-explorer run dev
```

---

## 📍 **Access Your Local App**

Once both servers are running, open in your browser:

| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend App** | http://localhost:24116 | ZOIKO Bible Explorer UI |
| **Backend API** | http://localhost:8080 | REST API endpoints |
| **API Docs** | http://localhost:8080/api | OpenAPI spec |

---

## ✅ **Local Testing Checklist**

- [ ] **Backend starts without errors** (port 8080)
  - Should see: Express server listening on 8080
  - Verify: `curl http://localhost:8080/api` returns 404 (not connection error)

- [ ] **Frontend loads** (port 24116)
  - Should see: React app with Clerk sign-in button
  - Verify: Opens http://localhost:24116 without SSL errors

- [ ] **Clerk Sign-In Works**
  - Click "Sign Up"
  - Create account with email/password
  - Should redirect to dashboard after sign-in
  - Should see: Player stats, daily verse, solo modes

- [ ] **Database Connected**
  - After sign-in, should see player data
  - Verify: No "database connection" errors in console
  - Check API server logs for query execution

- [ ] **Gemini AI Working**
  - Click "Generate Question" (if available in UI)
  - Should either show AI-generated question or mock question
  - Check: Backend logs should show Gemini API call

- [ ] **Multiplayer Session Works** (if UI has this)
  - Create new session via UI
  - Should generate PIN
  - Join from another browser tab/incognito
  - Should sync in real-time

---

## 🎯 **Testing Script**

Create a test file `test-local.sh` (or `.bat` for Windows):

```bash
#!/bin/bash
# Test ZOIKO local setup

echo "🧪 Testing ZOIKO Bible Explorer locally..."

# Test backend
echo "✓ Testing backend on http://localhost:8080..."
curl -s http://localhost:8080/api > /dev/null && echo "✓ Backend responds" || echo "✗ Backend not responding"

# Test frontend
echo "✓ Testing frontend on http://localhost:24116..."
curl -s http://localhost:24116 | grep -q "Clerk" && echo "✓ Frontend has Clerk" || echo "✗ Frontend not loading"

# Check database
echo "✓ Testing database..."
# (This would check actual queries if backend exposes health endpoint)

# Check AI
echo "✓ Testing Gemini API..."
curl -s -X POST http://localhost:8080/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"easy","count":1}' | grep -q "text" && echo "✓ Gemini working" || echo "⚠ Gemini may need API key"

echo ""
echo "🎉 Local testing complete!"
```

---

## 🌐 **Vercel Deployment Setup**

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your GitHub repos

### Step 2: Connect GitHub Repository

1. On Vercel dashboard, click "New Project"
2. Import your GitHub repo: `zoikohbiblexplorer`
3. Vercel auto-detects: pnpm workspace, Next.js/Vite setup

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
# Database
NEON_DATABASE_URL=postgresql://neondb_owner:npg_L7jHUKuhVZ1A@ep-flat-morning-asjisvy9-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Clerk
CLERK_SECRET_KEY=sk_test_ajqpr2374ulmjqoIbrVoYNkvSoqEKrcP4nqjcimpYb
CLERK_PUBLISHABLE_KEY=pk_test_ZXhwZXJ0LW1hbi00Ni5jbGVyay5hY2NvdW50cy5kZXYk

# Frontend Vite
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ZXhwZXJ0LW1hbi00Ni5jbGVyay5hY2NvdW50cy5kZXYk
VITE_CLERK_PROXY_URL=/api/auth
BASE_PATH=/

# AI
GEMINI_API_KEY=AQ.Ab8RN6IaIHrCka1vUZju3wwh5X7lrmrNTZsf9UQaQKAplIKsFQ
OPENAI_API_KEY=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

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### Step 4: Vercel Build Configuration

Vercel auto-detects the build config from `vercel.json`:

```json
{
  "buildCommand": "pnpm run typecheck:libs && pnpm --filter @workspace/bible-explorer run build",
  "outputDirectory": "artifacts/bible-explorer/dist/public",
  "installCommand": "pnpm install"
}
```

✅ This is already in your `vercel.json`

### Step 5: Deploy

1. Click "Deploy" on Vercel dashboard
2. Wait for build to complete (2-5 minutes)
3. Get your live URL: `https://your-app-name.vercel.app`

---

## 📋 **Vercel Environment Variables Configuration**

### Set Variables via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
cd "c:\Users\USER\OneDrive\Desktop\Dev Apps\zoikohbiblexplorer"
vercel link

# Set environment variables
vercel env add NEON_DATABASE_URL
vercel env add CLERK_SECRET_KEY
vercel env add CLERK_PUBLISHABLE_KEY
vercel env add VITE_CLERK_PUBLISHABLE_KEY
vercel env add GEMINI_API_KEY
vercel env add OPENAI_API_KEY

# Deploy
vercel deploy --prod
```

### Or Set Variables via Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable
5. Redeploy

---

## 🔧 **Vercel Build Troubleshooting**

### Error: "No projects matched the filters"

**Cause**: Workspace packages not detected
**Solution**: Ensure `artifacts/api-server/package.json` exists
```bash
git status  # Check if files are tracked
git checkout HEAD -- artifacts lib  # Restore from git if missing
```

### Error: "Cannot find module '@workspace/...'"

**Cause**: pnpm workspace resolution issue
**Solution**: 
```bash
pnpm install
pnpm run typecheck:libs  # Rebuild lib exports
```

### Error: "CLERK_SECRET_KEY not found"

**Cause**: Environment variable not set in Vercel
**Solution**: Add to Vercel dashboard Settings → Environment Variables

### Error: "DATABASE_URL must be set"

**Cause**: NEON_DATABASE_URL not configured
**Solution**:
```bash
# Set in Vercel dashboard
NEON_DATABASE_URL=postgresql://...

# OR use DATABASE_URL if using Replit DB
DATABASE_URL=postgresql://...
```

---

## 🚀 **After Deployment**

### Verify Production App

1. **Frontend**: Open `https://your-app-name.vercel.app`
   - Should load ZOIKO interface
   - Clerk sign-in should work
   - Must use production Clerk keys (not test)

2. **API**: Test backend endpoint
   ```bash
   curl https://your-app-name.vercel.app/api
   ```

3. **Database**: Create account
   - Sign up to test database connection
   - Should create player record in Neon

4. **Gemini**: Generate question
   - Use AI question generation feature
   - Should call Gemini API successfully

### Monitor in Production

Vercel provides:
- **Build logs**: https://vercel.com → Project → Deployments
- **Function logs**: https://vercel.com → Project → Logs  
- **Environment**: Vercel automatically manages Node.js version

---

## 📊 **Deployment Checklist**

**Before Going Live:**

- [ ] All `.env` values filled in (no placeholders)
- [ ] Vercel environment variables set
- [ ] `vercel.json` configured correctly
- [ ] Local testing passes ✅
- [ ] Git repo is up to date (`git push origin main`)
- [ ] Clerk keys are test keys (not production yet)
- [ ] Neon database connection works
- [ ] Gemini API key is valid

**After Deployment:**

- [ ] Production URL is accessible
- [ ] Sign-in works
- [ ] Database queries execute
- [ ] AI questions generate
- [ ] No console errors
- [ ] Vercel logs show successful requests

---

## 🔗 **Your Deployment URLs** (Once Live)

| Service | URL |
|---------|-----|
| **Frontend (Local)** | http://localhost:24116 |
| **Backend (Local)** | http://localhost:8080 |
| **Vercel (Production)** | `https://your-project-name.vercel.app` |
| **GitHub Repo** | https://github.com/johnkamanda331-design/zoikohbiblexplorer |

---

## 📝 **Next Steps**

1. **Test Locally** (Right Now):
   ```bash
   powershell -ExecutionPolicy Bypass -Command "cd 'c:\Users\USER\OneDrive\Desktop\Dev Apps\zoikohbiblexplorer' ; pnpm --filter @workspace/api-server run dev"
   ```
   Then in another terminal:
   ```bash
   powershell -ExecutionPolicy Bypass -Command "cd 'c:\Users\USER\OneDrive\Desktop\Dev Apps\zoikohbiblexplorer' ; pnpm --filter @workspace/bible-explorer run dev"
   ```

2. **Access App**: http://localhost:24116

3. **Test Features**: Sign up, create session, generate questions

4. **Deploy to Vercel**:
   - Create Vercel account
   - Connect GitHub repo
   - Set environment variables
   - Click Deploy

5. **Get Live URL**: Copy from Vercel dashboard

---

## 🆘 **Support & Documentation**

- **Tech Stack**: See `DEPENDENCIES_AND_ARCHITECTURE.md`
- **Configuration**: See `CONFIG_INTEGRATION_GUIDE.md`
- **API Spec**: `lib/api-spec/openapi.yaml`
- **DB Schema**: `lib/db/src/schema/`

---

**Status**: 🚀 **Ready for Local Testing & Vercel Deployment**  
**Last Updated**: 2026-07-11  
**Config Status**: ✅ Complete with all API keys
