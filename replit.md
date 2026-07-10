# ZOIKO Bible Explorer

Bible engagement platform for churches, youth groups, and camps — multiplayer trivia sessions with PIN-based joining, solo play modes, a built-in Bible reader, and AI-powered question generation.

## Run & Operate

- `pnpm --filter @workspace/bible-explorer run dev` — run the frontend (port managed by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild lib declarations (run after any schema change)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — auto-provided by Replit's managed PostgreSQL (runtime-managed, no manual setup needed). `NEON_DATABASE_URL` is also supported as a portable alternative if you prefer your own Neon instance.
- Required env (AI questions): `GEMINI_API_KEY` — enables AI question generation (gemini-2.5-flash) via direct REST call; `OPENAI_API_KEY` still works too if ever set (checked first); falls back to mock questions if neither is set

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS 4, Framer Motion, Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bible-explorer/src/` — React frontend (pages, components, layout)
- `artifacts/api-server/src/routes/` — Express API route handlers
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation (do not edit)

## Architecture decisions

- **OpenAPI-first**: All API contracts defined in openapi.yaml, codegen produces typed hooks and Zod validators
- **Dark mode default**: .dark class on html element, applied before React renders to prevent flash, persisted in localStorage key 'theme'
- **Bible API**: bolls.life (getbible.net is broken). Always run cleanVerse() on response text to strip Strong's numbers and HTML tags
- **Session PIN**: 6-digit PIN generated server-side; hostCode (6-char uppercase) kept separate for host verification
- **Scoring**: Easy=100pts, Medium=150pts, Hard=200pts per correct answer
- **DB lib rebuild**: After adding schema tables, run `pnpm run typecheck:libs` before api-server typecheck or new exports won't resolve

## Product

- **Home dashboard**: Daily verse card, stats overview, recent sessions, quick challenge
- **Solo modes**: Daily Challenge (5 seeded questions/day), Bible Q&A, Flash Cards, Word Scramble
- **Multiplayer**: 4-step host wizard → PIN sharing → live gameplay → leaderboard → summary
- **Bible panel**: Global overlay with chapter reading, verse highlighting, bookmarks, 5 translations
- **Settings**: Question DB management + AI question generator (requires OPENAI_API_KEY)
- **Achievements**: Grid of earned/locked achievement badges

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Setup status (Replit)

- ✅ Dependencies installed (`pnpm install`)
- ✅ Replit PostgreSQL provisioned — schema pushed via `pnpm --filter @workspace/db run push`
- ✅ Clerk auth provisioned — keys auto-set (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`)
- ✅ Managed artifact workflows running: `artifacts/api-server: API Server`, `artifacts/bible-explorer: web`, `artifacts/mockup-sandbox: Component Preview Server`
- ✅ Full typecheck passes across all packages
- ⚠️  API server requires `PORT` env var — run it via workflow (auto-provided), or `PORT=8080 pnpm --filter @workspace/api-server run dev` in shell
- ✅ `DATABASE_URL` — Replit's managed PostgreSQL (runtime-provided); schema already pushed. `NEON_DATABASE_URL` also supported as a portable alternative.
- ⚠️  `GEMINI_API_KEY` not set — AI question generation will fall back to mock questions until you add the key

## Gotchas

- After any change to lib/db/src/schema/, run `pnpm run typecheck:libs` before api-server typecheck/build
- After any change to lib/api-spec/openapi.yaml, run `pnpm --filter @workspace/api-spec run codegen`
- Sessions store questionIds as text[] of stringified integers — always `ids.map(Number)` when fetching
- Bible books array is 1-indexed (Genesis=1) when calling bolls.life API
