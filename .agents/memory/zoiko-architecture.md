---
name: ZOIKO Architecture
description: Full-stack Bible engagement platform — OpenAPI-first, Express backend, React+Vite frontend with PostgreSQL.
---

## Artifact
- Frontend: artifacts/bible-explorer (react-vite, previewPath "/")
- Backend: artifacts/api-server (Express, previewPath "/api")

## Routes (frontend)
/ | /solo | /start | /join | /session/:id | /session/:id/leaderboard | /session/:id/summary | /achievements | /settings

## DB Tables (lib/db/src/schema/)
- categoriesTable — id, name, description
- questionsTable — id, text, options (text[]), correctAnswer, difficulty, categoryId, explanation, book, createdAt
- sessionsTable — id, pin (unique), hostCode, status, difficulty, playStyle, participants (text[]), questionIds (text[]), currentQuestionIndex, totalQuestions, createdAt, completedAt
- sessionAnswersTable — id, sessionId, playerName, questionId, answer, isCorrect, score, createdAt
- achievementsTable — id, playerName, type, title, description, earnedAt

## Scoring
Easy=100pts, Medium=150pts, Hard=200pts per correct answer

## Session PIN pattern
hostCode generated server-side (random 6-char uppercase); PIN is 6-digit number; players join via POST /api/sessions/join with {pin, playerName}

## Daily content
GET /api/daily/content — rotates from hardcoded DAILY_VERSES array by day-of-year index
GET /api/daily/challenge — 5 questions seeded by today's timestamp, shuffled deterministically

## AI question generation
POST /api/questions/generate — uses OPENAI_API_KEY (gpt-4o-mini); falls back to mock questions if no key set

**Why:** No external auth; PIN-based session joining keeps it simple for group play.
