# Environment Variables Template

Copy this file to `.env` in your workspace root and fill in your actual API keys.

## Backend Environment Variables

```bash
# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Replit Managed PostgreSQL or local PostgreSQL
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
DATABASE_URL=postgresql://localhost:5432/zoiko_dev

# Neon PostgreSQL (takes priority over DATABASE_URL if set)
# Get from: https://console.neon.tech/app/projects
# Format: postgresql://[user]:[password]@[host].neon.tech/[database]
NEON_DATABASE_URL=postgresql://neondb_owner:npg_L7jHUKuhVZ1A@ep-flat-morning-asjisvy9-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# ============================================================================
# CLERK AUTHENTICATION
# ============================================================================

# Clerk Secret Key (Server-side only, NEVER expose to frontend)
# Get from: https://dashboard.clerk.com → API Keys → Secret Key
# Format: sk_test_XXXXXXX... or sk_live_XXXXXXX...
CLERK_SECRET_KEY=sk_test_ajqpr2374ulmjqoIbrVoYNkvSoqEKrcP4nqjcimpYb

# Clerk Publishable Key (Safe to expose to frontend)
# Get from: https://dashboard.clerk.com → API Keys → Publishable Key
# Format: pk_test_XXXXXXX... or pk_live_XXXXXXX...
CLERK_PUBLISHABLE_KEY=pk_test_ZXhwZXJ0LW1hbi00Ni5jbGVyay5hY2NvdW50cy5kZXYk

# ============================================================================
# AI/LLM CONFIGURATION (Question Generation)
# ============================================================================

# Google Gemini API Key (Primary AI provider)
# Model: gemini-2.5-flash
# Get from: https://aistudio.google.com/apikey
# Usage: POST /api/questions/generate for AI-powered Bible trivia
GEMINI_API_KEY=AQ.Ab8RN6IaIHrCka1vUZju3wwh5X7lrmrNTZsf9UQaQKAplIKsFQ

# OpenAI API Key (Fallback provider, optional)
# Model: gpt-4o-mini
# Get from: https://platform.openai.com/api-keys
# Note: Not currently used, Gemini is primary
OPENAI_API_KEY=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

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================

# HTTP Server Port
# Backend: 8080 (development), managed by Replit (production)
# Frontend: 24116 (Vite dev server)
PORT=8080

# Node.js Environment
# Values: development, production, test
NODE_ENV=development

# Logging Level
# Values: trace, debug, info, warn, error, fatal
LOG_LEVEL=info

```

## Frontend Environment Variables

Create a file at `artifacts/bible-explorer/.env.local`:

```bash
# ============================================================================
# CLERK AUTHENTICATION (Frontend)
# ============================================================================

# Clerk Publishable Key for Vite
# Must be prefixed with VITE_ to be bundled into the frontend
# Get from: https://dashboard.clerk.com → API Keys → Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ZXhwZXJ0LW1hbi00Ni5jbGVyay5hY2NvdW50cy5kZXYk

# Clerk Proxy URL (optional)
# Used for custom domain support in production
# Empty string in development
VITE_CLERK_PROXY_URL=/api/auth

# ============================================================================
# APP CONFIGURATION
# ============================================================================

# Base path for the app
# Use "/" for root deployment, "/app" if deployed at a subpath
BASE_PATH=/

```

## Replit Configuration

If deploying on Replit, configure these in the `.replit` file's `[userenv.shared]` section or via the Replit UI:

```toml
[userenv.shared]
DATABASE_URL="auto-set by Replit PostgreSQL"
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
GEMINI_API_KEY="AIzaSy..."
NODE_ENV="development"
PORT="8080"
LOG_LEVEL="info"
```

## How to Get Each API Key

### 1. Clerk Authentication Keys

1. Go to https://dashboard.clerk.com
2. Select your application
3. Click "API Keys" in the left sidebar
4. Copy:
   - **Publishable Key** → `CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### 2. Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API key"
3. Select or create a Google Cloud project
4. Copy the API key → `GEMINI_API_KEY`
5. Make sure the Generative Language API is enabled in your project

### 3. Neon Database Connection String

1. Go to https://console.neon.tech/app/projects
2. Create a new project (if you don't have one)
3. Copy the connection string under "Connection string"
4. Paste into `NEON_DATABASE_URL`
5. Format: `postgresql://[user]:[password]@[host].neon.tech/[database]`

### 4. Replit PostgreSQL (Automatic)

If using Replit's managed PostgreSQL:
1. The `DATABASE_URL` is automatically set by Replit
2. You don't need to configure it manually
3. It's available in the runtime environment

### 5. OpenAI API Key (Optional)

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key → `OPENAI_API_KEY`
4. Note: Currently not used (Gemini is primary)

## Environment Variables by Module

### artifacts/api-server/src/config.ts
Reads these variables:
- `PORT`
- `NODE_ENV`
- `LOG_LEVEL`
- `DATABASE_URL` / `NEON_DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`

### artifacts/bible-explorer/src/App.tsx
Reads these variables:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PROXY_URL`
- `BASE_PATH`

### lib/db/drizzle.config.ts
Reads these variables:
- `NEON_DATABASE_URL` (priority)
- `DATABASE_URL` (fallback)

### artifacts/api-server/src/routes/questions.ts
Reads these variables:
- `GEMINI_API_KEY` (primary)
- `OPENAI_API_KEY` (fallback)

## Development Setup Checklist

1. **Create root .env file:**
   ```bash
   cp ENV_TEMPLATE.md .env
   # Edit .env with your actual keys
   ```

2. **Create frontend .env.local:**
   ```bash
   cp ENV_TEMPLATE.md artifacts/bible-explorer/.env.local
   # Edit with VITE_ prefixed variables
   ```

3. **Fill in all placeholders:**
   - `GEMINI_API_KEY` → Get from https://aistudio.google.com/apikey
   - `CLERK_SECRET_KEY` → Get from https://dashboard.clerk.com
   - `CLERK_PUBLISHABLE_KEY` → Get from https://dashboard.clerk.com
   - `NEON_DATABASE_URL` → Get from https://console.neon.tech
   - `PORT` → Defaults to 8080, change if needed

4. **Install dependencies:**
   ```bash
   pnpm install
   ```

5. **Push database schema:**
   ```bash
   pnpm --filter @workspace/db run push
   ```

6. **Start development:**
   ```bash
   # Terminal 1: Backend API
   pnpm --filter @workspace/api-server run dev
   
   # Terminal 2: Frontend
   pnpm --filter @workspace/bible-explorer run dev
   ```

## Important Security Notes

⚠️ **Never commit .env files to Git!**
- Add to `.gitignore`:
  ```
  .env
  .env.local
  .env.production
  ```

⚠️ **Keep API keys secret:**
- Don't share `.env` files
- Use environment variables in production
- Rotate keys if accidentally exposed
- Monitor API usage for unauthorized access

⚠️ **Database security:**
- Use strong database passwords
- Don't use localhost credentials in production
- Restrict database access to your IP/VPC

⚠️ **Clerk secret key:**
- Only use in backend (Node.js code)
- Never expose to frontend or client-side code
- Never commit to Git

## Production Deployment

For Vercel/production deployments:

1. Set environment variables in your deployment platform:
   - Vercel: Project Settings → Environment Variables
   - Replit: .replit `[userenv.shared]` section
   - Docker: Pass via `-e` flags or docker-compose

2. Use production API keys:
   - Change from `test` keys to `live` keys where applicable
   - Update Clerk to use production keys
   - Use production Neon/PostgreSQL connection

3. Example production .env:
   ```bash
   DATABASE_URL=postgresql://user:password@prod.database.host/zoiko
   CLERK_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   CLERK_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   NODE_ENV=production
   LOG_LEVEL=info
   PORT=8080
   ```

## Troubleshooting

**Error: "Invalid or missing PORT environment variable"**
- Make sure `PORT=8080` is set in `.env`
- Or run: `PORT=8080 pnpm --filter @workspace/api-server run dev`

**Error: "DATABASE_URL (or NEON_DATABASE_URL) must be set"**
- Add `NEON_DATABASE_URL` or `DATABASE_URL` to `.env`
- Test connection: `psql $NEON_DATABASE_URL`

**Error: "Missing VITE_CLERK_PUBLISHABLE_KEY"**
- Create `artifacts/bible-explorer/.env.local`
- Add `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...`

**Warning: "GEMINI_API_KEY not set"**
- Add `GEMINI_API_KEY=AIzaSy...` to `.env`
- Generate questions will use mock data until set

**Error: "Clerk authentication not working"**
- Verify `CLERK_SECRET_KEY` is set on backend
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set on frontend
- Check that both are from the same Clerk application
