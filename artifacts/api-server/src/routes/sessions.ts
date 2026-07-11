import { Router } from "express";
import { db, pool } from "../lib/db.js";
import crypto from "crypto";
import { requireAuth, optionalAuth, type AuthedRequest } from "../middlewares/requireAuth.js";
import { sessionLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateId(): string {
  return crypto.randomUUID();
}

function generateHostCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Picks a display name that doesn't collide with names already in the session. */
function dedupeName(desired: string, existing: string[]): string {
  const base = (desired || "Player").trim().slice(0, 20) || "Player";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

function mapSession(s: any, questions?: any[], myDisplayName?: string | null) {
  return {
    id: s.id,
    pin: s.pin,
    hostCode: s.hostCode,
    status: s.status,
    type: s.type,
    difficulty: s.difficulty,
    playStyle: s.playStyle ?? null,
    participants: s.participants,
    myDisplayName: myDisplayName ?? null,
    questions: questions?.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      categoryId: q.categoryId,
      explanation: q.explanation ?? null,
      book: q.book ?? null,
      createdAt: new Date(q.createdAt).toISOString(),
    })) ?? [],
    currentQuestionIndex: s.currentQuestionIndex,
    totalQuestions: s.totalQuestions,
    createdAt: new Date(s.createdAt).toISOString(),
    completedAt: s.completedAt ? new Date(s.completedAt).toISOString() : null,
  };
}

async function pickQuestions(difficulty: string, totalQuestions: number) {
  const query = difficulty === "mixed"
    ? `SELECT id, text, options, correct_answer AS "correctAnswer", difficulty, category_id AS "categoryId", explanation, book, created_at AS "createdAt" FROM questions LIMIT 300`
    : `SELECT id, text, options, correct_answer AS "correctAnswer", difficulty, category_id AS "categoryId", explanation, book, created_at AS "createdAt" FROM questions WHERE difficulty = $1 LIMIT 100`;
  const result = await (db as any).$client.query(query, difficulty === "mixed" ? [] : [difficulty]);
  const shuffled = [...result.rows].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(totalQuestions, shuffled.length));
}

async function getSessionQuestions(questionIds: string[], client?: any) {
  const ids = questionIds.map(Number).filter(Boolean);
  if (ids.length === 0) return [];

  const executor = client ?? (db as any).$client;
  const result = await executor.query(
    `SELECT id, text, options, correct_answer AS "correctAnswer", difficulty, category_id AS "categoryId", explanation, book, created_at AS "createdAt" FROM questions WHERE id = ANY($1)`,
    [ids],
  );

  const questionMap = new Map(result.rows.map((q: any) => [q.id, q]));
  return ids.map((id) => questionMap.get(id)).filter(Boolean);
}

router.post("/sessions", sessionLimiter, requireAuth, async (req: any, res: any) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { difficulty = "medium", playStyle, participants = [], totalQuestions = 10 } = req.body;
    const picked = await pickQuestions(difficulty, totalQuestions);
    const id = generateId();
    const pin = generatePin();
    const hostCode = generateHostCode();

    const createdResult = await (db as any).$client.query(
      `INSERT INTO sessions (id, pin, host_code, status, type, host_user_id, difficulty, play_style, participants, question_ids, total_questions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt"`,
      [id, pin, hostCode, "waiting", "group", auth.userId, difficulty, playStyle ?? null, participants, picked.map((q) => String(q.id)), picked.length],
    );

    const session = createdResult.rows[0];
    (res as any).status(201).json(mapSession(session, picked));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to create session");
    (res as any).status(500).json({ error: "Failed to create session" });
  }
});

router.post("/sessions/duel", sessionLimiter, requireAuth, async (req: any, res: any) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { difficulty = "medium", totalQuestions = 10, hostName = "Player" } = req.body;
    const picked = await pickQuestions(difficulty, Math.min(Number(totalQuestions) || 10, 20));
    const id = generateId();
    const pin = generatePin();
    const hostCode = generateHostCode();
    const displayName = dedupeName(String(hostName), []);

    const createdResult = await (db as any).$client.query(
      `INSERT INTO sessions (id, pin, host_code, status, type, host_user_id, difficulty, participants, question_ids, total_questions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt"`,
      [id, pin, hostCode, "waiting", "duel", auth.userId, difficulty, [displayName], picked.map((q) => String(q.id)), picked.length],
    );

    const session = createdResult.rows[0];
    await (db as any).$client.query(
      `INSERT INTO session_participants (session_id, user_id, display_name) VALUES ($1, $2, $3)`,
      [id, auth.userId, displayName],
    );

    (res as any).status(201).json(mapSession(session, picked));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to create duel");
    (res as any).status(500).json({ error: "Failed to create duel" });
  }
});

router.post("/sessions/duel/join", sessionLimiter, requireAuth, async (req: any, res: any) => {
  let client: any;
  try {
    const auth = (req as AuthedRequest).auth!;
    const { pin, playerName = "Player" } = req.body;

    if (!pin) {
      (res as any).status(400).json({ error: "Code required" });
      return;
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const sessionResult = await client.query(
      `SELECT id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt" FROM sessions WHERE pin = $1 FOR UPDATE`,
      [pin],
    );
    const session = sessionResult.rows[0];

    if (!session || session.type !== "duel") {
      await client.query("ROLLBACK");
      (res as any).status(404).json({ error: "Duel not found" });
      return;
    }

    const existingParticipantResult = await client.query(
      `SELECT session_id AS "sessionId", user_id AS "userId", display_name AS "displayName" FROM session_participants WHERE session_id = $1 AND user_id = $2`,
      [session.id, auth.userId],
    );
    const existingParticipant = existingParticipantResult.rows[0];

    if (existingParticipant) {
      const questions = await getSessionQuestions(session.questionIds, client);
      await client.query("COMMIT");
      (res as any).json(mapSession(session, questions));
      return;
    }

    if (session.status !== "waiting" || session.participants.length >= 2) {
      await client.query("ROLLBACK");
      (res as any).status(400).json({ error: "This duel is already full or in progress" });
      return;
    }

    const displayName = dedupeName(String(playerName), session.participants);
    await client.query(
      `INSERT INTO session_participants (session_id, user_id, display_name) VALUES ($1, $2, $3)`,
      [session.id, auth.userId, displayName],
    );

    const newParticipants = [...session.participants, displayName];
    const updatedResult = await client.query(
      `UPDATE sessions SET participants = $1, status = $2, current_question_index = 0 WHERE id = $3 RETURNING id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt"`,
      [newParticipants, newParticipants.length >= 2 ? "active" : session.status, session.id],
    );
    const updated = updatedResult.rows[0];
    const questions = await getSessionQuestions(updated.questionIds, client);

    await client.query("COMMIT");
    (res as any).json(mapSession(updated, questions));
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    (req as any).log.error({ err }, "Failed to join duel");
    (res as any).status(500).json({ error: "Failed to join duel" });
  } finally {
    if (client) client.release();
  }
});

router.post("/sessions/join", sessionLimiter, requireAuth, async (req: any, res: any) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { pin, playerName = "Player" } = req.body;

    if (!pin) {
      (res as any).status(400).json({ error: "PIN required" });
      return;
    }

    const sessionResult = await (db as any).$client.query(
      `SELECT id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt" FROM sessions WHERE pin = $1`,
      [pin],
    );
    const session = sessionResult.rows[0];

    if (!session) {
      (res as any).status(404).json({ error: "Session not found" });
      return;
    }

    if (session.type === "duel") {
      (res as any).status(400).json({ error: "Use the duel join flow for this code" });
      return;
    }

    if (session.status === "completed") {
      (res as any).status(400).json({ error: "Session already completed" });
      return;
    }

    const existingParticipantResult = await (db as any).$client.query(
      `SELECT session_id AS "sessionId", user_id AS "userId", display_name AS "displayName" FROM session_participants WHERE session_id = $1 AND user_id = $2`,
      [session.id, auth.userId],
    );

    if (existingParticipantResult.rows.length > 0) {
      const questions = await getSessionQuestions(session.questionIds);
      (res as any).json(mapSession(session, questions));
      return;
    }

    const displayName = dedupeName(String(playerName), session.participants);
    await (db as any).$client.query(
      `INSERT INTO session_participants (session_id, user_id, display_name) VALUES ($1, $2, $3)`,
      [session.id, auth.userId, displayName],
    );

    const updatedResult = await (db as any).$client.query(
      `UPDATE sessions SET participants = $1 WHERE id = $2 RETURNING id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt"`,
      [[...session.participants, displayName], session.id],
    );
    const updated = updatedResult.rows[0];
    const questions = await getSessionQuestions(updated.questionIds);
    (res as any).json(mapSession(updated, questions));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to join session");
    (res as any).status(500).json({ error: "Failed to join session" });
  }
});

router.get("/sessions/recent", async (req: any, res: any) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 5), 20);
    const sessionsResult = await (db as any).$client.query(
      `SELECT id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt" FROM sessions WHERE status = $1 ORDER BY completed_at DESC LIMIT $2`,
      ["completed", limit],
    );
    (res as any).json(sessionsResult.rows.map((s: any) => mapSession(s)));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to list recent sessions");
    (res as any).status(500).json({ error: "Failed to list recent sessions" });
  }
});

router.get("/sessions/:id", optionalAuth, async (req: any, res: any) => {
  try {
    const sessionResult = await (db as any).$client.query(
      `SELECT id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt" FROM sessions WHERE id = $1`,
      [req.params.id],
    );
    const session = sessionResult.rows[0];

    if (!session) {
      (res as any).status(404).json({ error: "Session not found" });
      return;
    }

    const questions = await getSessionQuestions(session.questionIds);
    let myDisplayName: string | null = null;
    const auth = (req as AuthedRequest).auth;

    if (auth) {
      const participantResult = await (db as any).$client.query(
        `SELECT session_id AS "sessionId", user_id AS "userId", display_name AS "displayName" FROM session_participants WHERE session_id = $1 AND user_id = $2`,
        [session.id, auth.userId],
      );
      myDisplayName = participantResult.rows[0]?.displayName ?? null;
    }

    (res as any).json(mapSession(session, questions, myDisplayName));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to get session");
    (res as any).status(500).json({ error: "Failed to get session" });
  }
});

router.patch("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const sessionResult = await (db as any).$client.query(
      `SELECT id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt" FROM sessions WHERE id = $1`,
      [req.params.id],
    );
    const existing = sessionResult.rows[0];

    if (!existing) {
      (res as any).status(404).json({ error: "Session not found" });
      return;
    }

    if (existing.hostUserId && existing.hostUserId !== auth.userId) {
      (res as any).status(403).json({ error: "Only the host can control this session" });
      return;
    }

    const { status, currentQuestionIndex } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      values.push(status);
      updates.push(`status = $${values.length}`);
    }
    if (currentQuestionIndex !== undefined) {
      values.push(currentQuestionIndex);
      updates.push(`current_question_index = $${values.length}`);
    }
    if (status === "completed") {
      values.push(new Date());
      updates.push(`completed_at = $${values.length}`);
    }

    if (updates.length === 0) {
      (res as any).json(mapSession(existing, await getSessionQuestions(existing.questionIds)));
      return;
    }

    values.push(req.params.id);
    const updatedResult = await (db as any).$client.query(
      `UPDATE sessions SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt"`,
      values,
    );
    const updated = updatedResult.rows[0];
    const questions = await getSessionQuestions(updated.questionIds);
    (res as any).json(mapSession(updated, questions));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to update session");
    (res as any).status(500).json({ error: "Failed to update session" });
  }
});

router.get("/sessions/:id/leaderboard", async (req: any, res: any) => {
  try {
    const leaderboardResult = await (db as any).$client.query(
      `SELECT player_name AS "playerName", SUM(score) AS "totalScore", SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS "correctAnswers", COUNT(*) AS "totalAnswers" FROM session_answers WHERE session_id = $1 GROUP BY player_name ORDER BY "totalScore" DESC`,
      [req.params.id],
    );

    (res as any).json(
      leaderboardResult.rows.map((entry: any, index: number) => ({
        rank: index + 1,
        playerName: entry.playerName,
        score: Number(entry.totalScore),
        correctAnswers: Number(entry.correctAnswers),
        totalAnswers: Number(entry.totalAnswers),
      })),
    );
  } catch (err) {
    (req as any).log.error({ err }, "Failed to get leaderboard");
    (res as any).status(500).json({ error: "Failed to get leaderboard" });
  }
});

router.post("/sessions/:id/answers", requireAuth, async (req: any, res: any) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      (res as any).status(400).json({ error: "questionId and answer required" });
      return;
    }

    const participantResult = await (db as any).$client.query(
      `SELECT session_id AS "sessionId", user_id AS "userId", display_name AS "displayName" FROM session_participants WHERE session_id = $1 AND user_id = $2`,
      [req.params.id, auth.userId],
    );
    const participant = participantResult.rows[0];

    if (!participant) {
      (res as any).status(403).json({ error: "You have not joined this session" });
      return;
    }

    const playerName = participant.displayName;
    const sessionResult = await (db as any).$client.query(
      `SELECT id, pin, host_code AS "hostCode", status, type, difficulty, play_style AS "playStyle", participants, host_user_id AS "hostUserId", question_ids AS "questionIds", total_questions AS "totalQuestions", current_question_index AS "currentQuestionIndex", created_at AS "createdAt", completed_at AS "completedAt" FROM sessions WHERE id = $1`,
      [req.params.id],
    );
    const session = sessionResult.rows[0];

    if (!session) {
      (res as any).status(404).json({ error: "Session not found" });
      return;
    }

    if (session.status !== "active") {
      (res as any).status(400).json({ error: "This session is not currently active" });
      return;
    }

    const currentQuestionId = Number(session.questionIds[session.currentQuestionIndex]);
    if (Number(questionId) !== currentQuestionId) {
      (res as any).status(400).json({ error: "That is not the current question" });
      return;
    }

    const questionResult = await (db as any).$client.query(
      `SELECT id, text, options, correct_answer AS "correctAnswer", difficulty, category_id AS "categoryId", explanation, book, created_at AS "createdAt" FROM questions WHERE id = $1`,
      [Number(questionId)],
    );
    const question = questionResult.rows[0];

    if (!question) {
      (res as any).status(404).json({ error: "Question not found" });
      return;
    }

    const isCorrect = question.correctAnswer === answer;
    const scoreMap: Record<string, number> = { easy: 100, medium: 150, hard: 200 };
    const score = isCorrect ? (scoreMap[question.difficulty] ?? 100) : 0;

    const existingAnswerResult = await (db as any).$client.query(
      `SELECT session_id AS "sessionId", player_name AS "playerName", question_id AS "questionId" FROM session_answers WHERE session_id = $1 AND player_name = $2 AND question_id = $3`,
      [req.params.id, playerName, question.id],
    );
    const existingAnswer = existingAnswerResult.rows[0];

    if (!existingAnswer) {
      await (db as any).$client.query(
        `INSERT INTO session_answers (session_id, player_name, question_id, answer, is_correct, score) VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.params.id, playerName, question.id, answer, isCorrect, score],
      );
    }

    const totalScoreResult = await (db as any).$client.query(
      `SELECT SUM(score) AS "totalScore" FROM session_answers WHERE session_id = $1 AND player_name = $2`,
      [req.params.id, playerName],
    );
    const totalScore = Number(totalScoreResult.rows[0]?.totalScore ?? 0);

    if (session.type === "duel" && !existingAnswer) {
      const answersForQuestionResult = await (db as any).$client.query(
        `SELECT player_name AS "playerName" FROM session_answers WHERE session_id = $1 AND question_id = $2`,
        [session.id, question.id],
      );
      const distinctPlayers = new Set(answersForQuestionResult.rows.map((a: any) => a.playerName));
      if (distinctPlayers.size >= 2) {
        const isLast = session.currentQuestionIndex >= session.totalQuestions - 1;
        if (isLast) {
          await (db as any).$client.query(
            `UPDATE sessions SET status = 'completed', completed_at = $1 WHERE id = $2`,
            [new Date(), session.id],
          );
        } else {
          await (db as any).$client.query(
            `UPDATE sessions SET current_question_index = $1 WHERE id = $2`,
            [session.currentQuestionIndex + 1, session.id],
          );
        }
      }
    }

    (res as any).json({
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      score,
      totalScore,
      explanation: question.explanation ?? null,
    });
  } catch (err) {
    (req as any).log.error({ err }, "Failed to submit answer");
    (res as any).status(500).json({ error: "Failed to submit answer" });
  }
});

export default router;
