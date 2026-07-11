import { Router } from "express";
import { db } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth.js";

const router = Router();

function mapPlayer(p: any) {
  return {
    name: p.name,
    correctAnswers: p.correct_answers,
    totalAnswers: p.total_answers,
    sessionsPlayed: p.sessions_played,
    sessionsWon: p.sessions_won,
    sessionsHosted: p.sessions_hosted,
    streakCurrent: p.streak_current,
    streakLongest: p.streak_longest,
    updatedAt: new Date(p.updated_at).toISOString(),
    createdAt: new Date(p.created_at).toISOString(),
  };
}

router.get("/players/:name", async (req: any, res: any) => {
  try {
    const name = req.params.name as string;
    const existingResult = await (db as any).$client.query(
      `SELECT name, clerk_user_id AS "clerkUserId", correct_answers, total_answers, sessions_played, sessions_won, sessions_hosted, streak_current, streak_longest, updated_at, created_at FROM players WHERE name = $1`,
      [name]
    );

    if (existingResult.rows.length > 0) {
      (res as any).json(mapPlayer(existingResult.rows[0]));
      return;
    }

    const createdResult = await (db as any).$client.query(
      `INSERT INTO players (name) VALUES ($1) RETURNING name, clerk_user_id AS "clerkUserId", correct_answers, total_answers, sessions_played, sessions_won, sessions_hosted, streak_current, streak_longest, updated_at, created_at`,
      [name]
    );
    (res as any).json(mapPlayer(createdResult.rows[0]));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to get player");
    (res as any).status(500).json({ error: "Failed to get player" });
  }
});

const MAX_REASONABLE_VALUE = 1_000_000;

function isValidCounter(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_REASONABLE_VALUE;
}

router.put("/players/:name", requireAuth, async (req: any, res: any) => {
  try {
    const auth = (req as unknown as AuthedRequest).auth!;
    const name = req.params.name as string;
    if (!name || name.length > 64) {
      (res as any).status(400).json({ error: "Invalid player name" });
      return;
    }

    const {
      correctAnswers = 0,
      totalAnswers = 0,
      sessionsPlayed = 0,
      sessionsWon = 0,
      sessionsHosted = 0,
      streakCurrent = 0,
      streakLongest = 0,
    } = req.body ?? {};

    const fields = { correctAnswers, totalAnswers, sessionsPlayed, sessionsWon, sessionsHosted, streakCurrent, streakLongest };
    for (const [key, value] of Object.entries(fields)) {
      if (!isValidCounter(value)) {
        (res as any).status(400).json({ error: `Invalid value for ${key}: must be a non-negative integer` });
        return;
      }
    }
    if (totalAnswers < correctAnswers) {
      (res as any).status(400).json({ error: "totalAnswers cannot be less than correctAnswers" });
      return;
    }

    const existingResult = await (db as any).$client.query(
      `SELECT name, clerk_user_id AS "clerkUserId", correct_answers, total_answers, sessions_played, sessions_won, sessions_hosted, streak_current, streak_longest, updated_at, created_at FROM players WHERE name = $1`,
      [name]
    );
    const existing = existingResult.rows[0];

    if (existing?.clerkUserId && existing.clerkUserId !== auth.userId) {
      (res as any).status(403).json({ error: "This player name is already claimed by another account" });
      return;
    }

    const merged = {
      clerk_user_id: auth.userId,
      correct_answers: Math.max(existing?.correct_answers ?? 0, correctAnswers),
      total_answers: Math.max(existing?.total_answers ?? 0, totalAnswers),
      sessions_played: Math.max(existing?.sessions_played ?? 0, sessionsPlayed),
      sessions_won: Math.max(existing?.sessions_won ?? 0, sessionsWon),
      sessions_hosted: Math.max(existing?.sessions_hosted ?? 0, sessionsHosted),
      streak_current: streakCurrent,
      streak_longest: Math.max(existing?.streak_longest ?? 0, streakLongest),
      updated_at: new Date(),
    };

    const updatedResult = existing
      ? await (db as any).$client.query(
          `UPDATE players SET clerk_user_id = $1, correct_answers = $2, total_answers = $3, sessions_played = $4, sessions_won = $5, sessions_hosted = $6, streak_current = $7, streak_longest = $8, updated_at = $9 WHERE name = $10 RETURNING name, clerk_user_id AS "clerkUserId", correct_answers, total_answers, sessions_played, sessions_won, sessions_hosted, streak_current, streak_longest, updated_at, created_at`,
          [
            merged.clerk_user_id,
            merged.correct_answers,
            merged.total_answers,
            merged.sessions_played,
            merged.sessions_won,
            merged.sessions_hosted,
            merged.streak_current,
            merged.streak_longest,
            merged.updated_at,
            name,
          ]
        )
      : await (db as any).$client.query(
          `INSERT INTO players (name, clerk_user_id, correct_answers, total_answers, sessions_played, sessions_won, sessions_hosted, streak_current, streak_longest, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING name, clerk_user_id AS "clerkUserId", correct_answers, total_answers, sessions_played, sessions_won, sessions_hosted, streak_current, streak_longest, updated_at, created_at`,
          [
            name,
            merged.clerk_user_id,
            merged.correct_answers,
            merged.total_answers,
            merged.sessions_played,
            merged.sessions_won,
            merged.sessions_hosted,
            merged.streak_current,
            merged.streak_longest,
            merged.updated_at,
          ]
        );

    (res as any).json(mapPlayer(updatedResult.rows[0]));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to sync player");
    (res as any).status(500).json({ error: "Failed to sync player" });
  }
});

export default router;
