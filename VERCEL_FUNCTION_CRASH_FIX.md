# Fixing FUNCTION_INVOCATION_FAILED Error on Vercel

If you're seeing a **500 error** with code `FUNCTION_INVOCATION_FAILED` when accessing your Vercel deployment, follow these steps.

## Step 1: Check Diagnostic Endpoints

These endpoints will help identify the exact problem:

```bash
# Basic health check (should always work)
curl https://yourdomain.vercel.app/api/healthz

# Configuration status (shows what's configured)
curl https://yourdomain.vercel.app/api/healthz/config

# Database connectivity (shows if database is reachable)
curl https://yourdomain.vercel.app/api/healthz/db
```

Expected responses:
- `/api/healthz` → `{"status":"ok"}`
- `/api/healthz/config` → Shows configuration including `"poolInitialized": true` or `false`
- `/api/healthz/db` → `{"status":"ok","database":"connected"}`

## Step 2: Interpret Results

### If `/api/healthz/config` returns `"poolInitialized": false`

**Problem:** Database connection is not initialized (environment variable missing)

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `NEON_DATABASE_URL` is present and has a value
3. If missing or empty:
   - Add `NEON_DATABASE_URL` with your PostgreSQL connection string
   - Save
   - Go to Deployments and click "Redeploy"

### If `/api/healthz/db` returns an error

**Problem:** Database connection string is incorrect or database is unreachable

**Fix:**
1. Verify your connection string is correct:
   ```bash
   # Test locally first
   psql "your_connection_string"
   ```
2. If local test works but Vercel fails:
   - Check if your database provider blocks cloud IPs (check your DB provider's firewall settings)
   - NEON: Should automatically allow Vercel IPs
   - Other providers: May need to allowlist Vercel IPs or set to "allow all"

3. After fixing, redeploy on Vercel

### If getting `"database":"failed"` with a specific error message

**Common error messages and fixes:**

| Error Message | Cause | Fix |
|---|---|---|
| "ECONNREFUSED" | Database server not running or wrong host | Check connection string, verify database is running |
| "ENOTFOUND" | DNS can't resolve hostname | Check hostname in connection string |
| "permission denied" | Database credentials wrong | Verify username/password in connection string |
| "connection timeout" | Database taking too long to respond | May be temporary, try again; if persistent, check database provider status |

## Step 3: Check Vercel Logs

If diagnostic endpoints don't help:

1. In the error page, click "check the logs"
2. Look for errors in the "Function Logs" section
3. Common issues you'll see:
   - `NEON_DATABASE_URL is not set`
   - `Connection refused`
   - `Cannot find module` (dependency issue)
   - `Timeout` (function took too long)

## Step 4: Force Fresh Deployment

Sometimes Vercel caches old deployment info:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Find the failed deployment
3. Click the three dots menu
4. Select "Redeploy"
5. Wait for rebuild to complete

## Step 5: Check Recent Changes

If it was working before, think about what changed:

- Did you add new environment variables?
- Did you modify the API code?
- Did you change package.json dependencies?

If unsure, you can:
1. Revert recent changes in your code
2. Push to GitHub
3. Vercel will auto-redeploy

## Common Complete Scenarios

### Scenario A: Just Deployed, Getting 500 Error

**Most likely cause:** `NEON_DATABASE_URL` not set

**Solution:**
1. Set `NEON_DATABASE_URL` in Vercel environment variables
2. Redeploy

### Scenario B: Was Working, Suddenly Broke

**Most likely cause:** Database credentials expired or changed

**Solution:**
1. Get fresh connection string from your database provider
2. Update `NEON_DATABASE_URL` in Vercel
3. Redeploy

### Scenario C: Errors in Vercel Logs

**Solution:**
1. Read the error message carefully
2. Match to "Common error messages" table above
3. Fix the underlying issue
4. Redeploy

## Emergency: Using Mock/Fallback Mode

If your database is truly unavailable, the app has fallback data built in:

**Daily Challenge endpoint** will serve mock questions from a hardcoded list

**Questions endpoint** returns mock data as fallback

This means `/api/daily/challenge` should work even without a database, but `/api/questions` won't have the full database if the DB fails.

## Still Having Issues?

Create a debug log:

```bash
# From your Vercel dashboard, capture:
1. The exact error code (e.g., FUNCTION_INVOCATION_FAILED)
2. The request ID (shown in error page)
3. Full text of any errors in Function Logs
4. Output of: curl https://yourdomain.vercel.app/api/healthz/config
5. Output of: curl https://yourdomain.vercel.app/api/healthz/db

# Share this information when asking for help
```

## Related Documentation

- [Vercel Error: FUNCTION_INVOCATION_FAILED](https://vercel.com/docs/errors/FUNCTION_INVOCATION_FAILED)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [NEON Database Documentation](https://neon.tech/docs/introduction)
