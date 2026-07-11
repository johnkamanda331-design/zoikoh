# Configuration Integration Guide

This document explains how to integrate the centralized `config/app-config.ts` into your ZOIKO Bible Explorer application.

## Quick Start

### 1. Backend Configuration Integration

#### Option A: Use as Replacement for artifacts/api-server/src/config.ts

If you want to consolidate all configuration into a single file, update your API server to use the centralized config:

**File**: `artifacts/api-server/src/config.ts`

Replace the existing config with:

```typescript
import { appConfig } from '../../../config/app-config';

export const config = Object.freeze({
  port: appConfig.server.PORT,
  nodeEnv: appConfig.server.NODE_ENV,
  logLevel: appConfig.server.LOG_LEVEL,
  
  databaseUrl: appConfig.database.ACTIVE_DATABASE_URL,
  
  clerk: Object.freeze({
    secretKey: appConfig.clerk.SECRET_KEY,
    publishableKey: appConfig.clerk.PUBLISHABLE_KEY,
  }),
  
  ai: Object.freeze({
    geminiApiKey: appConfig.ai.GEMINI_API_KEY,
    openaiApiKey: appConfig.ai.OPENAI_API_KEY,
  }),
});

// Validate on startup
appConfig.validateAll();
```

#### Option B: Keep Separate, Import Values

If you prefer to keep the existing structure but import values from the centralized config:

```typescript
import { appConfig } from '../../../config/app-config';

const databaseUrl = appConfig.database.ACTIVE_DATABASE_URL || process.env.DATABASE_URL || "";
const geminiKey = appConfig.ai.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
// ... etc
```

### 2. Frontend Configuration Integration

#### Update artifacts/bible-explorer/src/App.tsx

The frontend already uses Vite environment variables. Update to reference the centralized config:

**Current code** (around line 32):
```typescript
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
```

This will continue to work with environment variables. To hardcode values, update your `.env` files:

**File**: `artifacts/bible-explorer/.env` (create if it doesn't exist)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
VITE_CLERK_PROXY_URL=/api/auth
BASE_PATH=/
```

Or create `artifacts/bible-explorer/.env.local` for hardcoded development values:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ABC123XYZ...
VITE_CLERK_PROXY_URL=/api/auth
BASE_PATH=/
```

### 3. Database Configuration Integration

#### Update lib/db/drizzle.config.ts

**Current code**:
```typescript
const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
```

**Integration option** (import from centralized config):
```typescript
// At the top of the file
import path from "path";
import { appConfig } from "../../config/app-config";

// Replace the dbUrl line with:
const dbUrl = appConfig.database.ACTIVE_DATABASE_URL;

if (!dbUrl) {
  throw new Error("No database URL configured. Check NEON_DATABASE_URL or DATABASE_URL");
}
```

### 4. Gemini API Integration

The Gemini API is already integrated in `artifacts/api-server/src/routes/questions.ts`. The config will automatically be used if you follow Step 1.

**Current implementation** (line 160-180):
```typescript
async function generateWithGemini(apiKey: string, prompt: string): Promise<{ questions: unknown[] } | null> {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      // ... rest of implementation
    }
  );
  // ...
}
```

**No changes needed** — it receives the API key from `config.ai.geminiApiKey`.

### 5. Clerk Authentication Integration

#### Backend Middleware (No changes needed)

**File**: `artifacts/api-server/src/middlewares/requireAuth.ts`

Already uses `getAuth(req)` from Clerk. Config is initialized via `clerkMiddleware` in `app.ts`.

#### Frontend ClerkProvider (No changes needed)

**File**: `artifacts/bible-explorer/src/App.tsx`

Already uses `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_PROXY_URL`.

---

## Configuration Priority (Where Each Value Comes From)

### 1. Backend Configuration Priority

**For Database URL:**
1. `NEON_DATABASE_URL` environment variable
2. `DATABASE_URL` environment variable
3. `appConfig.database.NEON_DATABASE_URL` hardcoded value
4. `appConfig.database.DATABASE_URL` hardcoded value

**For Clerk Keys:**
1. `CLERK_SECRET_KEY` environment variable
2. `appConfig.clerk.SECRET_KEY` hardcoded value
3. (If empty, Clerk middleware will warn)

**For AI Keys:**
1. `GEMINI_API_KEY` environment variable
2. `appConfig.ai.GEMINI_API_KEY` hardcoded value
3. Falls back to mock questions if both are empty

### 2. Frontend Configuration Priority

**For Clerk Keys:**
1. `VITE_CLERK_PUBLISHABLE_KEY` environment variable
2. `.env.local` file hardcoded value
3. Vite config defaults

---

## Setting Hardcoded Values

### Method 1: Update config/app-config.ts Directly

Edit `config/app-config.ts` and replace placeholder values:

```typescript
export const CLERK_CONFIG = {
  SECRET_KEY: "sk_test_YOUR_ACTUAL_SECRET_KEY_HERE",
  PUBLISHABLE_KEY: "pk_test_YOUR_ACTUAL_PUBLIC_KEY_HERE",
  VITE_PUBLISHABLE_KEY: "pk_test_YOUR_ACTUAL_PUBLIC_KEY_HERE",
  PROXY_URL: "/api/auth",
  // ...
} as const;

export const AI_CONFIG = {
  GEMINI_API_KEY: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  OPENAI_API_KEY: "sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  // ...
} as const;

export const DATABASE_CONFIG = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/zoiko_dev",
  NEON_DATABASE_URL: "postgresql://user:password@xxxxx.neon.tech/zoiko",
  // ...
} as const;
```

### Method 2: Keep Environment Variables, Use .env Files

**Backend (.env in root or via system environment):**
```
DATABASE_URL=postgresql://localhost/zoiko_dev
NEON_DATABASE_URL=postgresql://user:pass@neon.tech/dbname
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
GEMINI_API_KEY=AIzaSy...
PORT=8080
NODE_ENV=development
```

**Frontend (artifacts/bible-explorer/.env.local):**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_PROXY_URL=/api/auth
BASE_PATH=/
```

---

## Integration Checklist

- [ ] **Backend API Server**
  - [ ] Update `artifacts/api-server/src/config.ts` to import from `config/app-config.ts`
  - [ ] Or ensure `config.ts` reads from environment variables that match `appConfig` names
  - [ ] Test that API starts: `pnpm --filter @workspace/api-server run dev`

- [ ] **Frontend React App**
  - [ ] Create/update `artifacts/bible-explorer/.env.local` with `VITE_CLERK_PUBLISHABLE_KEY`
  - [ ] Verify app loads: `pnpm --filter @workspace/bible-explorer run dev`

- [ ] **Database**
  - [ ] Set `NEON_DATABASE_URL` or `DATABASE_URL`
  - [ ] Test connection: `pnpm --filter @workspace/db run push`
  - [ ] Seed if needed: `pnpm --filter @workspace/db run seed`

- [ ] **AI/LLM**
  - [ ] Set `GEMINI_API_KEY` in environment
  - [ ] Test question generation via API: `POST /api/questions/generate`

- [ ] **Clerk Authentication**
  - [ ] Verify `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` are set
  - [ ] Test sign-in flow in frontend

- [ ] **Configuration Validation**
  - [ ] Run `pnpm run build` to ensure typecheck passes
  - [ ] Check logs for configuration warnings

---

## Troubleshooting

### "Missing VITE_CLERK_PUBLISHABLE_KEY in .env file"

**Solution:**
```bash
# Create frontend .env
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY" > artifacts/bible-explorer/.env.local
```

### "DATABASE_URL (or NEON_DATABASE_URL) must be set"

**Solution:**
Set in environment or update `config/app-config.ts`:
```typescript
DATABASE_URL: "postgresql://user:pass@localhost:5432/zoiko_dev"
```

### "Gemini API not working / mock questions showing"

**Solution:**
1. Verify API key is set: `echo $GEMINI_API_KEY`
2. Check in `config/app-config.ts`: `GEMINI_API_KEY: "AIzaSy..."`
3. Restart API server: `pnpm --filter @workspace/api-server run dev`

### Clerk authentication failing

**Solution:**
1. Verify `CLERK_SECRET_KEY` is set on backend
2. Verify `VITE_CLERK_PUBLISHABLE_KEY` is set on frontend
3. Check Clerk dashboard for correct keys: https://dashboard.clerk.com

---

## Next Steps

1. **Get your API keys:**
   - Clerk: https://dashboard.clerk.com/apps/YOUR_APP_ID/api-keys
   - Gemini: https://aistudio.google.com/apikey
   - Neon: https://console.neon.tech/app/projects

2. **Fill in config/app-config.ts** with your actual keys

3. **Run configuration validation:**
   ```bash
   pnpm run build
   ```

4. **Start development:**
   ```bash
   pnpm --filter @workspace/api-server run dev
   pnpm --filter @workspace/bible-explorer run dev
   ```

---

## File Reference Map

| Config Category | Files That Use It |
|---|---|
| **Database** | `lib/db/drizzle.config.ts`, `artifacts/api-server/src/config.ts`, `lib/db/src/seed.ts` |
| **Clerk Auth** | `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/middlewares/requireAuth.ts`, `artifacts/bible-explorer/src/App.tsx` |
| **Gemini AI** | `artifacts/api-server/src/routes/questions.ts` |
| **Vite Frontend** | `artifacts/bible-explorer/src/App.tsx`, `artifacts/bible-explorer/vite.config.ts` |
| **Server** | `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts` |
