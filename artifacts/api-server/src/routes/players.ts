import { Router } from "express";
import { db } from "../lib/db.js";
import { playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth.js";

const router = Router();

function mapPlayer(p: typeof playersTable.$inferSelect) {
  return {
    name: p.name,
    correctAnswers: p.correctAnswers,
    totalAnswers: p.totalAnswers,
    sessionsPlayed: p.sessionsPlayed,
    sessionsWon: p.sessionsWon,
    sessionsHosted: p.sessionsHosted,
    streakCurrent: p.streakCurrent,
    streakLongest: p.streakLongest,
    updatedAt: p.updatedAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/players/:name", async (req, res) => {
  try {
    const name = (req.params.name as string);
    const [existing] = await db.select().from(playersTable).where(eq(playersTable.name, name));

    if (existing) {
      res.json(mapPlayer(existing));
      return;
    }

    const [created] = await db.insert(playersTable).values({ name }).returning();
    res.json(mapPlayer(created));
  } catch (err) {
    req.log.error({ err }, "Failed to get player");
    res.status(500).json({ error: "Failed to get player" });
  }
});

// Sanity caps on any single sync as defense-in-depth alongside identity
// verification below.
const MAX_REASONABLE_VALUE = 1_000_000;

function isValidCounter(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_REASONABLE_VALUE;
}

// Signing in is required to write player stats: the record is "claimed" by
// the caller's verified Clerk user id on first write, and any further write
// to that name from a different account is rejected. This is what stops one
// player from spoofing another's name to inflate/reset their stats.
router.put("/players/:name", requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const name = (req.params.name as string);
    if (!name || name.length > 64) {
      res.status(400).json({ error: "Invalid player name" });
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
        res.status(400).json({ error: `Invalid value for ${key}: must be a non-negative integer` });
        return;
      }
    }
    if (totalAnswers < correctAnswers) {
      res.status(400).json({ error: "totalAnswers cannot be less than correctAnswers" });
      return;
    }

    const [existing] = await db.select().from(playersTable).where(eq(playersTable.name, name));

    if (existing?.clerkUserId && existing.clerkUserId !== auth.userId) {
      res.status(403).json({ error: "This player name is already claimed by another account" });
      return;
    }

    // Merge by taking the max of existing vs incoming so syncs from multiple
    // devices/tabs never regress a player's recorded progress.
    const merged = {
      clerkUserId: auth.userId, // claims an unclaimed legacy row, or re-affirms ownership
      correctAnswers: Math.max(existing?.correctAnswers ?? 0, correctAnswers),
      totalAnswers: Math.max(existing?.totalAnswers ?? 0, totalAnswers),
      sessionsPlayed: Math.max(existing?.sessionsPlayed ?? 0, sessionsPlayed),
      sessionsWon: Math.max(existing?.sessionsWon ?? 0, sessionsWon),
      sessionsHosted: Math.max(existing?.sessionsHosted ?? 0, sessionsHosted),
      streakCurrent,
      streakLongest: Math.max(existing?.streakLongest ?? 0, streakLongest),
      updatedAt: new Date(),
    };

    const [updated] = existing
      ? await db.update(playersTable).set(merged).where(eq(playersTable.name, name)).returning()
      : await db.insert(playersTable).values({ name, ...merged }).returning();

    res.json(mapPlayer(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to sync player");
    res.status(500).json({ error: "Failed to sync player" });
  }
});

export default router;
