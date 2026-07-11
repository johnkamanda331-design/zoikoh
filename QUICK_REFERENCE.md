# ZOIKO Bible Explorer - Configuration Quick Reference

## 📋 Summary

This workspace is a **full-stack Bible trivia platform** built with:
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (via Neon or Replit)
- **Authentication**: Clerk
- **AI/LLM**: Google Gemini (primary) + OpenAI (fallback)

---

## 🔧 What You Need to Configure

| Service | Key | Where to Get | Priority |
|---------|-----|-------------|----------|
| **Clerk** | `CLERK_SECRET_KEY` | https://dashboard.clerk.com | ✅ Required |
| **Clerk** | `CLERK_PUBLISHABLE_KEY` | https://dashboard.clerk.com | ✅ Required |
| **Database** | `DATABASE_URL` or `NEON_DATABASE_URL` | https://console.neon.tech | ✅ Required |
| **Gemini AI** | `GEMINI_API_KEY` | https://aistudio.google.com/apikey | ⚠️ Optional* |
| **OpenAI** | `OPENAI_API_KEY` | https://platform.openai.com | ⬜ Unused |
| **Vite Frontend** | `VITE_CLERK_PUBLISHABLE_KEY` | Same as above | ✅ Required |

*Falls back to mock questions if not set

---

## 📁 Configuration Files

| File | Purpose | How to Use |
|------|---------|-----------|
| `config/app-config.ts` | **Centralized config** - All API keys and settings | Import in backend, reference for frontend |
| `ENV_TEMPLATE.md` | **Template for environment variables** | Copy to `.env` and fill in your keys |
| `DEPENDENCIES_AND_ARCHITECTURE.md` | **Complete technical reference** | Documentation of stack and architecture |
| `CONFIG_INTEGRATION_GUIDE.md` | **Step-by-step integration instructions** | Follow to link config to all modules |

---

## ⚡ Quick Start

### 1. Set Up Environment Variables

```bash
# Copy template
cp ENV_TEMPLATE.md .env

# Edit and fill in your API keys
nano .env  # or use your editor
```

**Minimum required to start:**
```bash
DATABASE_URL=postgresql://localhost:5432/zoiko_dev
CLERK_SECRET_KEY=sk_test_YOUR_KEY
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
GEMINI_API_KEY=AIzaSy_YOUR_KEY
PORT=8080
```

### 2. Create Frontend Environment

```bash
# Create frontend .env.local
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY" > artifacts/bible-explorer/.env.local
echo "VITE_CLERK_PROXY_URL=/api/auth" >> artifacts/bible-explorer/.env.local
echo "BASE_PATH=/" >> artifacts/bible-explorer/.env.local
```

### 3. Install & Run

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start development servers
pnpm --filter @workspace/api-server run dev     # Backend (port 8080)
pnpm --filter @workspace/bible-explorer run dev # Frontend (port 24116)
```

---

## 🔌 Where Configuration is Used

### Backend (Express API)

**File**: `artifacts/api-server/src/config.ts`

```typescript
// Reads from environment variables:
config.port              // PORT
config.nodeEnv           // NODE_ENV
config.databaseUrl       // DATABASE_URL / NEON_DATABASE_URL
config.clerk.secretKey   // CLERK_SECRET_KEY
config.clerk.publishableKey // CLERK_PUBLISHABLE_KEY
config.ai.geminiApiKey   // GEMINI_API_KEY
config.ai.openaiApiKey   // OPENAI_API_KEY
```

### Frontend (React App)

**File**: `artifacts/bible-explorer/src/App.tsx`

```typescript
// Reads from Vite environment variables:
import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
import.meta.env.VITE_CLERK_PROXY_URL
import.meta.env.BASE_PATH
```

### Database

**File**: `lib/db/drizzle.config.ts`

```typescript
// Reads from environment variables:
process.env.NEON_DATABASE_URL  // Priority
process.env.DATABASE_URL       // Fallback
```

### API Question Generation

**File**: `artifacts/api-server/src/routes/questions.ts`

```typescript
// POST /api/questions/generate uses:
config.ai.geminiApiKey    // Primary AI provider
config.ai.openaiApiKey    // Fallback (not used currently)
// Falls back to mock questions if neither key is set
```

---

## 📚 Documentation Files Included

1. **DEPENDENCIES_AND_ARCHITECTURE.md**
   - Complete tech stack breakdown
   - Architecture overview
   - Directory structure
   - All dependencies listed
   - Feature-by-feature requirements

2. **CONFIG_INTEGRATION_GUIDE.md**
   - Step-by-step integration
   - How to link config to code
   - Troubleshooting guide
   - File reference map

3. **ENV_TEMPLATE.md**
   - Environment variable template
   - Instructions for getting each key
   - Development setup checklist
   - Production deployment guide

4. **config/app-config.ts**
   - Centralized configuration object
   - TypeScript types for all settings
   - Validation helpers
   - Environment variable references

---

## 🔐 Security Best Practices

✅ **DO:**
- Keep API keys in `.env` files (add to `.gitignore`)
- Use environment variables in production
- Rotate keys if exposed
- Use different keys for dev/production
- Keep `CLERK_SECRET_KEY` backend-only

❌ **DON'T:**
- Hardcode API keys in source code
- Commit `.env` files to Git
- Share API keys in chat/email
- Use weak database passwords
- Expose `CLERK_SECRET_KEY` to frontend

---

## 🐛 Common Issues & Solutions

### "Missing VITE_CLERK_PUBLISHABLE_KEY"
```bash
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_..." > artifacts/bible-explorer/.env.local
```

### "DATABASE_URL must be set"
```bash
# Set in .env:
DATABASE_URL=postgresql://localhost:5432/zoiko_dev
# OR use Neon:
NEON_DATABASE_URL=postgresql://user:pass@host.neon.tech/db
```

### "Gemini API not working (mock questions)"
```bash
# Add to .env:
GEMINI_API_KEY=AIzaSy...
# Restart backend:
pnpm --filter @workspace/api-server run dev
```

### "Clerk authentication failing"
1. Check both keys are set: `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`
2. Verify they're from the same Clerk application
3. Check Clerk dashboard for API key status
4. Restart frontend: `pnpm --filter @workspace/bible-explorer run dev`

---

## 📖 Full Documentation

For complete information, see:

- **Architecture & Dependencies**: [DEPENDENCIES_AND_ARCHITECTURE.md](DEPENDENCIES_AND_ARCHITECTURE.md)
- **Integration Steps**: [CONFIG_INTEGRATION_GUIDE.md](CONFIG_INTEGRATION_GUIDE.md)
- **Environment Setup**: [ENV_TEMPLATE.md](ENV_TEMPLATE.md)
- **Centralized Config**: [config/app-config.ts](config/app-config.ts)

---

## 📞 API Reference (Key Endpoints)

```
POST   /api/questions/generate       # Generate AI-powered trivia
GET    /api/daily/content            # Get daily verse
GET    /api/daily/challenge          # Get daily challenge questions
POST   /api/sessions/create          # Create multiplayer session
POST   /api/sessions/join            # Join session via PIN
GET    /api/sessions/:id             # Get session details
POST   /api/sessions/:id/answer      # Submit answer
GET    /api/players/:name            # Get player stats
POST   /api/achievements             # Record achievement
```

---

## 🚀 Deployment

### Vercel
- Build: `pnpm run typecheck:libs && pnpm --filter @workspace/bible-explorer run build`
- Output: `artifacts/bible-explorer/dist/public`
- Environment variables via Vercel dashboard

### Replit
- Managed PostgreSQL: Auto-provisioned
- Workflows: Defined in `.replit`
- Environment: Via `.replit` `[userenv.shared]` or UI

---

## ✅ Setup Checklist

- [ ] Copy `ENV_TEMPLATE.md` to `.env`
- [ ] Fill in all API keys
- [ ] Create `artifacts/bible-explorer/.env.local`
- [ ] Run `pnpm install`
- [ ] Run `pnpm --filter @workspace/db run push`
- [ ] Start backend: `pnpm --filter @workspace/api-server run dev`
- [ ] Start frontend: `pnpm --filter @workspace/bible-explorer run dev`
- [ ] Test sign-in at http://localhost:24116
- [ ] Test API at http://localhost:8080/api
- [ ] Generate test question: `curl -X POST http://localhost:8080/api/questions/generate`

---

**Next**: Read [CONFIG_INTEGRATION_GUIDE.md](CONFIG_INTEGRATION_GUIDE.md) to integrate the centralized config into your code.
