---
name: ZOIKO Gemini wiring and player persistence
description: How AI question generation and server-side player stats were wired, and the trust model behind them.
---

## Gemini AI question generation
- User declined the Replit AI Integrations account upgrade prompt, so question generation uses the user's own `GEMINI_API_KEY` secret via direct REST calls to `generativelanguage.googleapis.com` (model `gemini-2.5-flash`, `responseMimeType: application/json`), not the AI Integrations proxy.
- Provider priority in `/questions/generate`: `OPENAI_API_KEY` first (if ever added), then `GEMINI_API_KEY`, then mock fallback.
- **Why:** `mixed` is a session-level pooling concept only — the `Question`/`QuestionInput` OpenAPI schemas only allow `easy|medium|hard` per question. When difficulty is `mixed`, generated/mock questions get per-question difficulty spread round-robin across easy/medium/hard rather than being tagged literally `"mixed"`.

## Players table trust model
- `players` table (keyed by free-text `name`, no accounts/auth in this app) stores aggregate stats synced from localStorage via `PUT /players/:name`; server merges by taking `max(existing, incoming)` per counter so multi-device syncs never regress progress.
- **Why:** the whole app already keys everything (achievements, session participants) by nickname with no auth — this matches that existing convention rather than introducing real accounts.
- **How to apply:** if real auth is ever added, revisit `PUT /players/:name` — currently any client can write stats for any name (mitigated only by non-negative-integer + max-1,000,000 sanity caps, not real authorization).
