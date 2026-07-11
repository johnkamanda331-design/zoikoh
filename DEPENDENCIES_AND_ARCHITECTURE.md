# ZOIKO Bible Explorer - Complete Code Review & Dependencies

## Project Overview

**Application Type**: Full-stack Bible engagement platform for churches, youth groups, and camps  
**Architecture**: Monorepo using pnpm workspaces with OpenAPI-first design  
**Node Version**: Node.js 24  
**Package Manager**: pnpm  
**License**: MIT  

---

## Architecture Overview

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.1.0 |
| **Frontend Build** | Vite | 7.3.2 |
| **Styling** | Tailwind CSS | 4.1.14 |
| **UI Components** | lucide-react | 0.545.0 |
| **Animation** | Framer Motion | 12.42.2 |
| **Routing** | Wouter | 3.3.5 |
| **Language** | TypeScript | 5.9.3 |
| **Backend** | Express.js | 5.x |
| **Database** | PostgreSQL 16 | - |
| **ORM** | Drizzle ORM | 0.45.2 |
| **Auth** | Clerk | via npm |
| **API Schema** | OpenAPI 3.0 | - |
| **API Codegen** | Orval | - |
| **State Management** | React Query | 5.90.21 |
| **Validation** | Zod | 3.25.76 |
| **CSS Utils** | tailwind-merge, clsx | 3.6.0, 2.1.1 |
| **Utilities** | class-variance-authority | 0.7.1 |

### Directory Structure

```
zoikohbiblexplorer/
├── artifacts/
│   ├── bible-explorer/              # React frontend (Vite)
│   │   └── src/
│   │       ├── components/          # Reusable UI components
│   │       ├── pages/               # Page components
│   │       ├── App.tsx              # Main app with Clerk provider
│   │       └── main.tsx             # Entry point
│   │
│   ├── api-server/                  # Express backend API
│   │   └── src/
│   │       ├── routes/              # API route handlers
│   │       ├── middlewares/         # Auth, Clerk proxy, etc.
│   │       ├── config.ts            # Centralized config (reads env)
│   │       ├── app.ts               # Express setup
│   │       └── index.ts             # Server entry
│   │
│   └── mockup-sandbox/              # Component preview (internal)
│
├── lib/
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema/              # Drizzle table definitions
│   │   │   ├── seed.ts              # Database seed script
│   │   │   └── index.ts             # Database initialization
│   │   ├── drizzle.config.ts        # Drizzle Kit config
│   │   └── package.json
│   │
│   ├── api-spec/
│   │   ├── openapi.yaml             # OpenAPI specification (source of truth)
│   │   └── package.json
│   │
│   ├── api-client-react/            # Generated React Query hooks
│   │   └── src/generated/
│   │
│   ├── api-zod/                     # Generated Zod schemas
│   │   └── src/generated/
│   │
│   └── integrations/                # External integrations
│
├── scripts/                         # Shared utility scripts
├── pnpm-workspace.yaml              # Workspace configuration
├── package.json                     # Root workspace package
├── tsconfig.base.json               # Base TypeScript config
├── tsconfig.json                    # Root TypeScript config
├── vercel.json                      # Vercel deployment config
└── .replit                          # Replit configuration

```

---

## Core Features & Their Requirements

### 1. Authentication (Clerk)
- **Purpose**: User registration, sign-in, session management
- **Where Used**: 
  - Frontend: `artifacts/bible-explorer/src/App.tsx` - ClerkProvider
  - Backend: `artifacts/api-server/src/app.ts` - clerkMiddleware
  - API protection: `artifacts/api-server/src/middlewares/requireAuth.ts`
- **Environment Variables**:
  - `CLERK_SECRET_KEY` - Backend secret for server-side auth
  - `CLERK_PUBLISHABLE_KEY` - Backend publishable key
  - `VITE_CLERK_PUBLISHABLE_KEY` - Frontend publishable key
  - `VITE_CLERK_PROXY_URL` - Optional proxy for custom domains

### 2. Database (PostgreSQL + Drizzle ORM)
- **Purpose**: Store sessions, players, questions, scores, achievements
- **Tables**:
  - `players` - User stats, streaks, win/loss records
  - `questions` - Bible trivia questions with difficulty levels
  - `categories` - Question categories (OT, NT, etc.)
  - `sessions` - Multiplayer game sessions (PIN-based)
  - `sessionAnswers` - Player answers within sessions
  - `achievements` - Player achievement tracking
- **Environment Variables**:
  - `DATABASE_URL` - Replit's managed PostgreSQL
  - `NEON_DATABASE_URL` - Alternative Neon PostgreSQL (takes priority)
- **Schema Location**: `lib/db/src/schema/`
- **Seed Data**: `lib/db/src/seed.ts`

### 3. AI Question Generation (Gemini/OpenAI)
- **Purpose**: Generate dynamic Bible trivia questions
- **Primary Provider**: Google Gemini 2.5-flash
- **Fallback**: OpenAI (if configured), then mock questions
- **API Endpoint**: POST `/api/questions/generate`
- **Implementation**: `artifacts/api-server/src/routes/questions.ts` (lines 118-160)
- **Environment Variables**:
  - `GEMINI_API_KEY` - Google Gemini API key (primary)
  - `OPENAI_API_KEY` - OpenAI API key (fallback, not currently used)

### 4. Frontend Framework (React + Vite)
- **Purpose**: Interactive UI for all game modes
- **Entry Point**: `artifacts/bible-explorer/src/main.tsx`
- **Key Pages**: Home, Solo modes (8 types), Multiplayer, Achievements, Settings
- **Dark Mode**: Applied via `.dark` class on HTML element (persisted in localStorage)
- **Build System**: Vite with HMR
- **Environment Variables**: Vite vars with `VITE_` prefix
  - `VITE_CLERK_PUBLISHABLE_KEY`
  - `VITE_CLERK_PROXY_URL`
  - `BASE_PATH` (routing base)

### 5. API Server (Express)
- **Purpose**: RESTful API for all game logic, authentication, data persistence
- **Port**: 8080 (development)
- **Routes**: Session management, questions, player stats, achievements
- **OpenAPI Spec**: `lib/api-spec/openapi.yaml` (single source of truth)
- **Middleware Stack**:
  - Clerk middleware (authentication)
  - CORS middleware
  - Express JSON parser
  - Pino HTTP logging
- **Environment Variables**:
  - `PORT` - HTTP server port
  - `NODE_ENV` - Environment (development/production)
  - `LOG_LEVEL` - Logging level (info/debug/error)
  - Database URLs
  - Clerk keys
  - AI API keys

---

## Complete Dependency List

### Production Dependencies

#### Frontend (React + Build)
```json
{
  "@clerk/react": "^4.x",           // Clerk authentication UI
  "@tanstack/react-query": "^5.90.21", // Data fetching & caching
  "react": "^19.1.0",               // React library
  "react-dom": "^19.1.0",           // React DOM rendering
  "vite": "^7.3.2"                  // Frontend build tool
}
```

#### Styling & UI
```json
{
  "@tailwindcss/vite": "^4.1.14",   // Tailwind CSS Vite plugin
  "tailwindcss": "^4.1.14",         // Utility-first CSS
  "tailwind-merge": "^3.6.0",       // Merge Tailwind classes
  "clsx": "^2.1.1",                 // Conditional className utility
  "class-variance-authority": "^0.7.1", // Component variant system
  "lucide-react": "^0.545.0",       // Icon library
  "framer-motion": "^12.42.2"       // Animation library
}
```

#### Routing
```json
{
  "wouter": "^3.3.5"                // Lightweight router
}
```

#### Backend (Express)
```json
{
  "@clerk/express": "^latest",      // Clerk Express middleware
  "express": "^5.x",                // Web framework
  "cors": "^latest",                // CORS middleware
  "pino": "^latest",                // Logger
  "pino-http": "^latest",           // HTTP logger middleware
  "http-proxy-middleware": "^latest" // HTTP proxy (Clerk proxy)
}
```

#### Database
```json
{
  "drizzle-orm": "^0.45.2",         // ORM
  "pg": "^latest",                  // PostgreSQL driver
  "drizzle-zod": "^latest"          // Zod schema generation from Drizzle
}
```

#### Validation & Schema
```json
{
  "zod": "^3.25.76",                // Runtime schema validation
  "@replit/connectors-sdk": "^0.4.1" // Replit-specific connectors
}
```

### Development Dependencies

#### Language & Build
```json
{
  "typescript": "~5.9.3",           // TypeScript compiler
  "@types/react": "^19.2.0",        // React type definitions
  "@types/react-dom": "^19.2.0",    // React DOM type definitions
  "@types/node": "^25.3.3",         // Node.js type definitions
  "@vitejs/plugin-react": "^5.0.4", // Vite React plugin
  "tsx": "^4.21.0",                 // TypeScript executor
  "esbuild": "^latest"              // Build tool
}
```

#### Code Quality & Tools
```json
{
  "prettier": "^3.9.4",             // Code formatter
  "@replit/vite-plugin-cartographer": "^0.5.21", // Replit Vite plugin
  "@replit/vite-plugin-dev-banner": "^0.1.1",   // Dev banner plugin
  "@replit/vite-plugin-runtime-error-modal": "^0.0.6" // Error modal
}
```

#### Testing (if implemented)
```json
{
  "msw": "^latest",                 // Mock Service Worker
  "vitest": "^latest",              // Vitest testing framework
  "@testing-library/react": "^latest" // React testing utilities
}
```

### Build-Time Only
```json
{
  "drizzle-kit": "^latest",         // Database schema migration tool
  "orval": "^latest"                // OpenAPI code generator
}
```

---

## Environment Variables Configuration

### Backend Environment Variables

**File**: `artifacts/api-server/src/config.ts`

```typescript
// Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEON_DATABASE_URL=postgresql://user:password@neon.tech/dbname  // Takes priority

// Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_public_key

// AI/LLM Configuration
GEMINI_API_KEY=AIzaSyXxxx...
OPENAI_API_KEY=sk-proj-xxx...  // Optional fallback

// Server Configuration
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
```

### Frontend Environment Variables

**File**: `.env` (root) or via `import.meta.env`

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_public_key
VITE_CLERK_PROXY_URL=/api/auth
BASE_PATH=/
```

### Deployment Configuration

**Vercel**: `vercel.json` specifies:
- Build command: `pnpm run typecheck:libs && pnpm --filter @workspace/bible-explorer run build`
- Output directory: `artifacts/bible-explorer/dist/public`
- Server function: `api/index.ts`
- Security headers configured
- Rewrite rules for SPA routing

---

## Key Configuration Files

### 1. Backend Config (`artifacts/api-server/src/config.ts`)
- Central location for ALL environment variable reads
- Never read from `process.env` elsewhere
- Pattern: `config.clerk.secretKey`, `config.ai.geminiApiKey`, etc.
- Validates required variables on startup

### 2. Frontend App (`artifacts/bible-explorer/src/App.tsx`)
- Reads `VITE_CLERK_PUBLISHABLE_KEY` from Vite env
- Sets up ClerkProvider with proxy URL
- Configures dark mode appearance
- Sets up React Query client
- Defines all routes

### 3. API Spec (`lib/api-spec/openapi.yaml`)
- Single source of truth for all API contracts
- Defines request/response schemas
- Codegen produces:
  - React hooks: `lib/api-client-react/src/generated/`
  - Zod schemas: `lib/api-zod/src/generated/`

### 4. Database Config (`lib/db/drizzle.config.ts`)
- Points to PostgreSQL via `DATABASE_URL` or `NEON_DATABASE_URL`
- Schema located in: `lib/db/src/schema/`
- Migrations managed by drizzle-kit

### 5. Vite Config (`artifacts/bible-explorer/vite.config.ts`)
- Bundles frontend with Tailwind 4
- HMR configuration for dev
- Base path configuration

---

## Installation & Setup Commands

```bash
# Install dependencies
pnpm install

# Rebuild database type exports
pnpm run typecheck:libs

# Full project typecheck
pnpm run typecheck

# Build entire project
pnpm run build

# Development (parallel)
pnpm --filter @workspace/bible-explorer run dev    # Frontend on port 24116
pnpm --filter @workspace/api-server run dev        # Backend on port 8080

# Database operations
pnpm --filter @workspace/db run push                # Push schema changes
pnpm --filter @workspace/db run generate           # Generate migrations

# API code generation
pnpm --filter @workspace/api-spec run codegen      # Regenerate API hooks & Zod
```

---

## Critical Implementation Details

### Session Management
- PIN-based joining (6-digit PIN)
- Host code verification (6-char uppercase)
- Session state machine: pending → live → completed
- Real-time leaderboard updates

### Scoring System
- Easy: 100 points
- Medium: 150 points
- Hard: 200 points
- Streaks tracked per player

### Daily Content
- Daily verse rotates based on day-of-year
- Daily challenge: 5 seeded questions per day
- Deterministic shuffling by timestamp

### Bible API Integration
- Provider: bolls.life (not getbible.net - deprecated)
- Always run `cleanVerse()` to strip Strong's numbers and HTML
- Supports multiple translations

### Dark Mode
- Default: Dark mode on load
- Persisted in localStorage key: `theme`
- CSS class `.dark` applied to HTML element before React renders

---

## Security Considerations

1. **Clerk Secret Key**: Never expose to frontend
2. **Database URL**: Should be encrypted in production
3. **API Keys**: Use environment variables, never hardcode
4. **CORS**: Configured to allow credentials
5. **Auth Middleware**: All multiplayer writes require valid Clerk session
6. **Session PIN**: Server-side generated, cannot be spoofed

---

## Deployment Notes

### Replit
- PostgreSQL 16 managed by Replit
- Clerk auth pane handles configuration
- Workflow file defines dev/build tasks
- Auto-provisions environment variables

### Vercel
- Static export to `artifacts/bible-explorer/dist/public`
- API functions via `api/index.ts`
- Edge: Rejects chunked responses (selfHandleResponse in proxy)
- Environment variables configured in Vercel dashboard

---

## Next Steps

1. ✅ Review complete code structure
2. ⬜ Create centralized configuration file
3. ⬜ Integrate API keys into config
4. ⬜ Link config to all usage locations
5. ⬜ Document build and deployment process
