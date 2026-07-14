import { Router } from "express";
import { db } from "../lib/db.js";
import { optionalAuth, requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post(
  "/api/analytics",
  optionalAuth,
  async (req: any, res: any) => {
    const events = Array.isArray(req.body?.events) ? req.body.events : [];
    const sessionId = req.body?.clientMeta?.sessionId || null;
    const userId = (req as any).auth?.userId ?? null;

    if (!events.length) {
      res.status(400).json({ error: "No events provided" });
      return;
    }

    // Limit to reasonable batch size
    if (events.length > 500) {
      res.status(413).json({ error: "Too many events" });
      return;
    }

    // Allowed event names and minimal validation
    const ALLOWED_EVENTS = new Set(["question_answered", "session_start", "session_end", "achievement_unlocked"]);

    // Best-effort: if DB isn't configured, return accepted so client can clear queue
    try {
      const client = await db.$client.connect();
      try {
        await client.query("BEGIN");
        let processed = 0;
        let skipped = 0;

        for (const ev of events) {
          const name = String(ev.name || "");
          const payload = ev.payload || {};
          const ts = ev.ts ? new Date(ev.ts) : new Date();

          // Basic whitelist validation
          if (!ALLOWED_EVENTS.has(name)) {
            skipped += 1;
            console.warn(`Skipping unknown analytics event: ${name}`);
            continue;
          }

          // Minimal schema checks for important events
          if (name === "question_answered") {
            const { questionId, correct } = payload as any;
            if (typeof questionId !== "number" || typeof correct !== "boolean") {
              skipped += 1;
              console.warn("Skipping invalid question_answered event payload", payload);
              continue;
            }
          }

          processed += 1;

          await client.query(
            `INSERT INTO analytics_events (user_id, name, payload, session_id, created_at) VALUES ($1,$2,$3,$4,$5)`,
            [userId, name, payload, sessionId, ts],
          );

          // If authenticated and the event is question_answered, update aggregated progress
          if (userId && name === "question_answered") {
            try {
              const { questionId, selected, correct, categoryId, difficulty } = payload as any;

              // Load existing progress
              const { rows } = await client.query(`SELECT * FROM user_progress WHERE user_id = $1 FOR UPDATE`, [userId]);
              let progress = rows[0];
              if (!progress) {
                // initialize
                const perCategory: any = {};
                const perDifficulty: any = {};
                const catKey = categoryId ? String(categoryId) : "unknown";
                const diffKey = difficulty || "unknown";
                perCategory[catKey] = { correct: correct ? 1 : 0, total: 1 };
                perDifficulty[diffKey] = { correct: correct ? 1 : 0, total: 1 };

                await client.query(
                  `INSERT INTO user_progress (user_id, total_answered, correct, current_streak, longest_streak, per_category, per_difficulty, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now()) ON CONFLICT (user_id) DO NOTHING`,
                  [userId, 1, correct ? 1 : 0, correct ? 1 : 0, correct ? 1 : 0, perCategory, perDifficulty],
                );
              } else {
                // compute new progress
                const totalAnswered = (progress.total_answered || 0) + 1;
                const correctCount = (progress.correct || 0) + (correct ? 1 : 0);
                const currentStreak = correct ? (progress.current_streak || 0) + 1 : 0;
                const longestStreak = Math.max(progress.longest_streak || 0, currentStreak);

                const perCategory = progress.per_category || {};
                const catKey = categoryId ? String(categoryId) : "unknown";
                perCategory[catKey] = perCategory[catKey] || { correct: 0, total: 0 };
                perCategory[catKey].total = (perCategory[catKey].total || 0) + 1;
                if (correct) perCategory[catKey].correct = (perCategory[catKey].correct || 0) + 1;

                const perDifficulty = progress.per_difficulty || {};
                const diffKey = difficulty || "unknown";
                perDifficulty[diffKey] = perDifficulty[diffKey] || { correct: 0, total: 0 };
                perDifficulty[diffKey].total = (perDifficulty[diffKey].total || 0) + 1;
                if (correct) perDifficulty[diffKey].correct = (perDifficulty[diffKey].correct || 0) + 1;

                await client.query(
                  `INSERT INTO user_progress (user_id, total_answered, correct, current_streak, longest_streak, per_category, per_difficulty, updated_at)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,now())
                   ON CONFLICT (user_id) DO UPDATE SET
                     total_answered = EXCLUDED.total_answered,
                     correct = EXCLUDED.correct,
                     current_streak = EXCLUDED.current_streak,
                     longest_streak = EXCLUDED.longest_streak,
                     per_category = EXCLUDED.per_category,
                     per_difficulty = EXCLUDED.per_difficulty,
                     updated_at = now()
                  `,
                  [userId, totalAnswered, correctCount, currentStreak, longestStreak, perCategory, perDifficulty],
                );
              }
            } catch (e) {
              // ignore per-event progress failures
              console.error('Failed to aggregate progress for event', e instanceof Error ? e.message : String(e));
            }
          }
        }
        await client.query("COMMIT");
        if (processed === 0) {
          res.status(400).json({ error: "No valid events in batch", skipped });
          return;
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.warn("Analytics ingest failed (DB unavailable?)", error instanceof Error ? error.message : String(error));
      // Return 202 so clients can clear local queue even if server-side persistence failed
      res.status(202).json({ status: "accepted" });
      return;
    }

    res.status(200).json({ status: "ok" });
  },
);

// Return the authenticated user's aggregated progress
router.get(
  "/api/me/progress",
  requireAuth,
  async (req: any, res: any) => {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ error: "Sign in required" });

    try {
      const { rows } = await db.$client.query(`SELECT * FROM user_progress WHERE user_id = $1`, [userId]);
      const progress = rows?.[0] ?? null;
      if (!progress) {
        return res.json({
          total_answered: 0,
          correct: 0,
          current_streak: 0,
          longest_streak: 0,
          per_category: {},
          per_difficulty: {},
        });
      }
      return res.json(progress);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Failed to load user progress', msg);
      return res.status(500).json({ error: 'Failed to load progress' });
    }
  },
);

export default router;
