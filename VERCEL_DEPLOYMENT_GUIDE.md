# Vercel Deployment Guide - Complete Setup

## Overview
This guide explains how to properly deploy ZOIKOH Bible Explorer to Vercel with full database support.

## Prerequisites
- Vercel account (free tier works)
- NEON PostgreSQL database (free tier available at https://neon.tech) OR your own PostgreSQL database
- GitHub repository with your code

## Step 1: Set Up Database

### Option A: NEON PostgreSQL (Recommended for Vercel)
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create a new project
4. Copy your connection string (looks like: `postgresql://user:password@hostname/dbname`)
5. Keep this string safe - you'll need it in Step 3

### Option B: Other PostgreSQL Providers
- Heroku Postgres, AWS RDS, Render, Railway, etc.
- Get your connection string from your database provider

## Step 2: Connect GitHub to Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Connect your GitHub account
4. Select the repository containing ZOIKOH
5. Continue to configuration step (don't deploy yet!)

## Step 3: Add Environment Variables in Vercel

Before deploying, you MUST set the database URL.

### In the Vercel import screen:
1. Scroll to "Environment Variables"
2. Add the following variables:

#### Database Configuration
- **Key:** `NEON_DATABASE_URL`  
  **Value:** (your PostgreSQL connection string from Step 1)

#### Clerk Authentication (if you're using the existing app)
- **Key:** `CLERK_SECRET_KEY`  
  **Value:** (your Clerk secret key)
- **Key:** `CLERK_PUBLISHABLE_KEY`  
  **Value:** (your Clerk publishable key)

#### Optional: Custom Domain & Analytics
- **Key:** `ALLOWED_ORIGINS`  
  **Value:** `https://yourdomain.vercel.app,https://yourcustomdomain.com` (if using custom domain)

### Variables NOT needed in Vercel:
- `PORT` - Vercel sets this automatically
- `BASE_PATH` - Already set in vercel.json as "/"
- `NODE_ENV` - Vercel sets this to "production"

## Step 4: Deploy

1. In Vercel dashboard, click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Check deployment status

## Step 5: Verify Database Connection

Test the health check endpoint to ensure database is connected:

```bash
curl https://yourdomain.vercel.app/api/healthz/db
```

**Expected response:**
```json
{"status":"ok","database":"connected"}
```

**If you see this instead:**
```json
{"status":"error","message":"Database is not configured..."}
```

Then the environment variable wasn't set correctly. Go back to Step 3 and verify `NEON_DATABASE_URL` is set.

## Troubleshooting

### Issue: 500 Errors on /api/players/Player, /api/daily/challenge, etc.

**Cause:** Database URL not set in Vercel environment variables

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `NEON_DATABASE_URL` with your PostgreSQL connection string
3. Click "Save"
4. Redeploy from Vercel dashboard → Deployments → Click the latest deployment → Redeploy

### Issue: Database Connection Timeout

**Cause:** Connection string incorrect or database not accessible

**Solution:**
1. Test connection string locally:
   ```bash
   psql "your_connection_string_here"
   ```
2. If that works, copy the exact string to Vercel
3. If not, get the correct connection string from your database provider

### Issue: Clerk Sign-In Not Working

**Cause:** Missing or incorrect Clerk keys

**Solution:**
1. Go to Clerk Dashboard (https://dashboard.clerk.com)
2. Find your application
3. Copy API Keys section:
   - `CLERK_SECRET_KEY` (starts with `sk_`)
   - `CLERK_PUBLISHABLE_KEY` (starts with `pk_`)
4. Add to Vercel environment variables
5. Redeploy

### Issue: CORS Errors in Browser Console

**Cause:** Frontend origin not in `ALLOWED_ORIGINS`

**Solution:**
1. In Vercel, set `ALLOWED_ORIGINS` to your Vercel domain:
   - Format: `https://yourdomain.vercel.app`
   - Multiple domains: `https://domain1.com,https://domain2.com`
2. Redeploy

### Issue: FUNCTION_INVOCATION_FAILED (500 Error)

**Cause:** Serverless function crashed during initialization

**Solution:**
1. Check diagnostic endpoint:
   ```bash
   curl https://yourdomain.vercel.app/api/healthz/config
   ```
   Should return configuration status

2. If database is the issue, verify:
   ```bash
   curl https://yourdomain.vercel.app/api/healthz/db
   ```
   
3. Check Vercel logs:
   - Click the error message link
   - Look for specific error in Function Logs
   - Common issues:
     - Database connection timeout (check connection string)
     - Memory exceeded (unlikely with 512MB)
     - Missing environment variables

4. If you see "Database pool not initialized":
   - Environment variable is definitely not set
   - Go back to Step 3 in this guide
   - Ensure `NEON_DATABASE_URL` is exactly in Vercel settings
   - Redeploy

## Monitoring & Debugging

### View Logs
- Vercel Dashboard → Your Project → Deployments → Click deployment → Function Logs

### Health Checks
- Basic health: `https://yourdomain.vercel.app/api/healthz`
- Database: `https://yourdomain.vercel.app/api/healthz/db`

### Database Commands
Test database directly:
```bash
# Test connection
psql "your_connection_string"

# Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema='public';

# Check questions count
SELECT COUNT(*) FROM questions;
```

## Local Development (for reference)

To test locally before deploying:
```bash
# Set environment variables
export NEON_DATABASE_URL="your_connection_string"
export CLERK_SECRET_KEY="your_secret_key"
export CLERK_PUBLISHABLE_KEY="your_publishable_key"

# Run development servers
pnpm dev
```

## Custom Domain Setup (Optional)

1. In Vercel Dashboard, go to Domains
2. Add your custom domain
3. Update DNS records according to Vercel instructions
4. Update `ALLOWED_ORIGINS` if needed

## Production Checklist

- [ ] Database URL set in Vercel environment variables
- [ ] Clerk keys configured (if using auth)
- [ ] Test `/api/healthz/db` returns success
- [ ] Test game modes load questions
- [ ] Test AI generation works
- [ ] Test sign-in flow works
- [ ] Custom domain set up (if applicable)
- [ ] SSL certificate auto-configured (Vercel default)

## Support

If you encounter issues:
1. Check Vercel logs: Deployments → View logs
2. Check browser console: F12 → Console tab
3. Test health endpoints to isolate frontend vs backend issues
4. Verify all environment variables are set exactly as shown above
