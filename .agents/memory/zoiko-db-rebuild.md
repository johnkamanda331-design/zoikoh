---
name: ZOIKO DB rebuild pattern
description: After adding new Drizzle tables, typecheck:libs must run before api-server typecheck or new exports won't resolve.
---

## Rule
Any time you add or change files in lib/db/src/schema/, run:
  pnpm run typecheck:libs

before running:
  pnpm --filter @workspace/api-server run typecheck

**Why:** lib/db is a composite TypeScript project. Its emitted declarations are what api-server imports. Without a rebuild, api-server sees the stale .d.ts files and reports "Module has no exported member X" for every new table.

## How to apply
- Add new schema file → export it from lib/db/src/schema/index.ts → run typecheck:libs → then api-server typecheck/build will pass.
- Codegen (pnpm --filter @workspace/api-spec run codegen) already calls typecheck:libs at the end, so after codegen you're safe.
