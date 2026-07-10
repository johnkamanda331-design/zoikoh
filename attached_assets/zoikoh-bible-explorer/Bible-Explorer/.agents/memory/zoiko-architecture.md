---
name: ZOIKO Architecture
description: OpenAPI-first Bible platform; scoring formula, session PIN/hostCode pattern, daily content rotation, Solo mode, Bible panel.
---

## Core concept
Bible engagement platform for churches, youth groups, camps. Supports hosted multiplayer trivia sessions (PIN-based joining) and solo games.

## Layout — Left Sidebar (current)
The app uses a two-panel layout (not a top navbar):
- **Desktop (≥768px)**: `position: sticky; top: 0; height: 100dvh` left sidebar (240px) + scrollable main content column. Sidebar has Logo, nav links, Read Bible, Play, Theme toggle.
- **Mobile (<768px)**: Slim top bar (hamburger + logo + Bible/Play icons) + `AnimatePresence` slide-from-left drawer (z-210) + bottom tab bar (z-50).
- **Play dropdown**: rendered `position:fixed` anchored via `getBoundingClientRect()` captured into `activeAnchorEl` ref. Rect is recomputed on `window.resize` while open. When Play is triggered from the mobile sidebar, the rect is captured BEFORE `setSidebarOpen(false)` to prevent the button from unmounting first.
- Background blobs use `position: fixed` (not absolute) so they don't affect the flex layout.

## Routes
- `/` — Dashboard/home (hero, VerseCard, stats, recent sessions)
- `/start` — 4-step host wizard (categoryId always=1, useListCategories fallback)
- `/join` — join by PIN
- `/session/:id` — gameplay
- `/session/:id/leaderboard` — leaderboard
- `/session/:id/summary` — session summary
- `/achievements` — achievements
- `/settings` — Question DB + AI Generator tabs
- `/solo` — Solo Play (Daily Challenge, Bible Q&A, Flash Cards, Word Scramble)

## Play dropdown — architecture
Both home.tsx (hero) and layout.tsx (navbar) have Play dropdowns.
- **home.tsx**: uses `FixedDropdown` component that reads button rect via `getBoundingClientRect()` and renders at `position:fixed` — escapes ancestor `overflow:hidden`. Hero section no longer has `overflow:hidden` (blobs clipped inside their own inner wrapper instead).
- **layout.tsx**: uses `ref` callback on dropdown div to position using `getBoundingClientRect()` of the Play button at mount time.
Both dropdowns have sections: Multiplayer (Host/Join) and Solo.
Escape key handled via `useEffect` in both components.

## Bible Panel — API & reliability
**API**: `https://getbible.net/v2/{translation}/{bookNr}/{chapterNr}.json`
- Book number: 1-based index from the `BIBLE_BOOKS` array (Genesis=1 … Revelation=66)
- Response shape: `{ chapter: { "1": { verse, text }, "2": ..., } }` (key is string verse number)
- Multiple translations supported: kjv, web, asv, basicenglish, darby
- Translation preference persisted to `zoiko_bible_translation` localStorage key

**Why getbible.net**: the previous `bible-api.com` URL was using `encodeURIComponent` which double-encoded `+` to `%2B`, breaking requests for multi-word book names like "1 Samuel".

**Race protection**: `fetchAbortRef` (AbortController) cancels the previous in-flight request on every new fetch. AbortError is silently ignored.

## Bible Panel — features
`BiblePanel.tsx` — global fixed overlay (z-index 160), accessible from the navbar "Bible" button.
- State in `layout.tsx`: `bibleOpen / setBibleOpen`
- Features: chapter-by-chapter reading from bible-api.com (`/{book}+{chapter}:1-200`), verse highlighting (4 colors, stored in `zoiko_bible_highlights` localStorage), bookmarks (`zoiko_bible_bookmarks` localStorage), font size (sm/md/lg), copy verse, book search/jump tab.
- Escape key closes; focus moves to close button on open.
- Timer cleanup: `copyTimerRef` cleared on unmount.

## Solo Play (`/solo`)
Four modes, each with back navigation to menu:
1. **Daily Challenge** — 5 seeded questions per date, cached in `zoiko_daily_{date}` localStorage; does NOT re-fetch if already completed that day.
2. **Bible Q&A** — 10-question solo quiz, difficulty selector (easy/medium/hard), fetches from `/api/questions?difficulty=X&limit=30`; `loadQuestions` returns `boolean` and `handleStart` only sets `started=true` on success.
3. **Flash Cards** — 12 hardcoded key Bible verses, flip-to-reveal UX, known/studying split; `flipTimerRef` cleaned up on unmount.
4. **Word Scramble** — 20 Bible words with clues, 45s countdown (+10s on correct), `advanceTimerRef` cleaned up on unmount.

## Mobile tab bar
Home | Solo | Trophies | Settings (4 items).

## Scoring formula
See seeding script. Easy=100pts, Medium=150pts, Hard=200pts.

## Session PIN pattern
hostCode generated server-side; players join with PIN from `/join`.

## Daily content rotation
`/api/daily/content` — returns verse, verseReference, challenge, memoryVerse. Rotates by date.

## Tech notes
- No zod in api-server — manual TS type guards
- openai npm package used directly with OPENAI_API_KEY secret
- dark mode default, class-based on `document.documentElement`, persisted to localStorage
- html2canvas@^1.4.1 for verse screenshot in VerseCard
- categoryId always=1 (Q&A), useListCategories fallback in start.tsx
