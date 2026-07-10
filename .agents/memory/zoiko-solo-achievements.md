---
name: ZOIKO solo hub & achievements
description: Solo mode implementation details, achievement system design, and key pitfalls to avoid.
---

## Solo Hub (`artifacts/bible-explorer/src/pages/solo-hub.tsx`)

**8 fully playable modes:**
- `daily` / `qa` — QuizGame component, fetches from API (`useGetDailyChallenge` / `useListQuestions`)
- `flash` — FlashCardGame, API questions, flip animation, "Got it!" / "Review"
- `scramble` — WordScrambleGame, static BIBLE_WORDS pool, 45s timer
- `true-false` — TrueFalseGame, static TRUE_FALSE_QUESTIONS pool, 40 items
- `speed-round` — SpeedRoundGame, API questions, 60s countdown
- `verse-fill` — VerseFillGame, static FILL_IN_VERSES pool, fill-the-blank
- `number-match` — BibleNumbersGame, static NUMBER_QUESTIONS pool

**2 modes "coming soon":** `crossword`, `quote-match`

### Key pitfall: `pickUnseen` must NOT be called during render
Call it once in a `useEffect` when data arrives, store result in `useState`. Calling during render causes:
- Mutations to localStorage seen-list on every re-render
- Desync between currentQIndex and displayed question

**Why:** pickUnseen has side-effects (writes localStorage), making it impure for render phase.

**How to apply:** Always put `pickUnseen(...)` inside a `useEffect` guarded by `selectedQuestions.length === 0 && dataReady`.

### QuizGame "Play Again" must reset selectedQuestions
```tsx
setSelectedQuestions([]);
```
Without this, the old question set is reused instead of picking fresh ones.

## Achievement System (`src/hooks/use-achievements.ts`)

**20 achievements in 4 categories:** Overall (5), Solo Play (7), Team/Hosting (5), Speed & Accuracy (3).

**Storage pattern:**
- `zoiko_earned_achievements` — JSON array of earned achievement IDs
- `zoiko_progress` — PlayerProgress object (correctAnswers, totalAnswers, flashCardsKnown, etc.)
- `zoiko_streak_data` — { lastDate, current, longest }
- `zoiko_seen_{mode}` — seen question IDs for dedup

**Award flow:** After each game, call `recordXxx()` → `checkAndAward()` → toast if new achievements.

**Mode always records participation (even zero score):** `recordScramble(score)` without a `score > 0` guard, so the mode is always marked in `modesPlayed`.

## DB Questions
80 questions seeded across 8 categories (10 per category). Categories:
1. Old Testament History, 2. New Testament Events, 3. Bible Characters, 4. Books of the Bible,
5. Bible Geography, 6. Parables & Teachings, 7. Miracles & Wonders, 8. Prophecy & Fulfillment

## Achievement route
`POST /api/achievements` is idempotent — won't duplicate by (playerName, type) pair.
`GET /api/achievements` returns all or filtered by `?playerName=...`.
