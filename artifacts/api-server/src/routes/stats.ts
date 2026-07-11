import { Router } from "express";
import { db } from "../lib/db.js";

const router = Router();

router.get("/stats/overview", async (req: any, res: any) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const totalQuestionsResult = await (db as any).$client.query(
      `SELECT COUNT(*)::int AS count FROM questions`
    );
    const totalSessionsResult = await (db as any).$client.query(
      `SELECT COUNT(*)::int AS count FROM sessions`
    );
    const totalPlayersResult = await (db as any).$client.query(
      `SELECT COUNT(*)::int AS count FROM sessions WHERE status = 'completed'`
    );
    const questionsThisWeekResult = await (db as any).$client.query(
      `SELECT COUNT(*)::int AS count FROM questions WHERE created_at >= $1`,
      [oneWeekAgo]
    );
    const completedSessionsResult = await (db as any).$client.query(
      `SELECT id, participants, difficulty, completed_at, created_at FROM sessions WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 5`
    );
    const recentAnswersResult = await (db as any).$client.query(
      `SELECT is_correct AS "isCorrect" FROM session_answers ORDER BY created_at DESC LIMIT 50`
    );
    const allSessionsResult = await (db as any).$client.query(
      `SELECT participants FROM sessions`
    );

    const recentAnswers = recentAnswersResult.rows;
    const correctAnswers = recentAnswers.filter((a: any) => a.isCorrect).length;
    const avgScore = recentAnswers.length > 0 ? Math.round((correctAnswers / recentAnswers.length) * 100) : 0;

    const uniquePlayers = new Set(allSessionsResult.rows.flatMap((s: any) => s.participants ?? [])).size;

    const recentActivity = completedSessionsResult.rows.map((s: any) => ({
      type: "session",
      description: `Session with ${s.participants?.length ?? 0} players completed — ${s.difficulty} difficulty`,
      createdAt: (s.completed_at ?? s.created_at).toISOString(),
    }));

    (res as any).json({
      totalQuestions: totalQuestionsResult.rows?.[0]?.count ?? 0,
      totalSessions: totalSessionsResult.rows?.[0]?.count ?? 0,
      totalPlayers: uniquePlayers,
      questionsThisWeek: questionsThisWeekResult.rows?.[0]?.count ?? 0,
      averageScore: avgScore,
      topDifficulty: "medium",
      recentActivity,
    });
  } catch (err) {
    (req as any).log.error({ err }, "Failed to get stats");
    (res as any).status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
