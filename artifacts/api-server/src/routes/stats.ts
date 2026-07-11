import { Router } from "express";
import { db } from "../lib/db.js";
import { questionsTable, sessionsTable, sessionAnswersTable } from "@workspace/db";
import { eq, count, avg, gte, desc } from "drizzle-orm";

const router = Router();

router.get("/stats/overview", async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [[totalQuestions], [totalSessions], [totalPlayers], [questionsThisWeek], completedSessions, recentAnswers] =
      await Promise.all([
        db.select({ count: count() }).from(questionsTable),
        db.select({ count: count() }).from(sessionsTable),
        db.select({ count: count() }).from(sessionsTable).where(eq(sessionsTable.status, "completed")),
        db.select({ count: count() }).from(questionsTable).where(gte(questionsTable.createdAt, oneWeekAgo)),
        db.select().from(sessionsTable).where(eq(sessionsTable.status, "completed")).orderBy(desc(sessionsTable.completedAt)).limit(5),
        db.select().from(sessionAnswersTable).orderBy(desc(sessionAnswersTable.createdAt)).limit(50),
      ]);

    // Calculate average score
    const correctAnswers = recentAnswers.filter((a) => a.isCorrect).length;
    const avgScore = recentAnswers.length > 0 ? Math.round((correctAnswers / recentAnswers.length) * 100) : 0;

    // Count unique players from all sessions
    const allSessions = await db.select().from(sessionsTable);
    const uniquePlayers = new Set(allSessions.flatMap((s) => s.participants)).size;

    // Recent activity
    const recentActivity = completedSessions.map((s) => ({
      type: "session",
      description: `Session with ${s.participants.length} players completed — ${s.difficulty} difficulty`,
      createdAt: (s.completedAt ?? s.createdAt).toISOString(),
    }));

    res.json({
      totalQuestions: totalQuestions?.count ?? 0,
      totalSessions: totalSessions?.count ?? 0,
      totalPlayers: uniquePlayers,
      questionsThisWeek: questionsThisWeek?.count ?? 0,
      averageScore: avgScore,
      topDifficulty: "medium",
      recentActivity,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
