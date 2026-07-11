import { Router } from "express";
import { db } from "../lib/db";
import { sessionsTable, sessionAnswersTable, sessionParticipantsTable, questionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth, optionalAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { sessionLimiter } from "../middlewares/rateLimiter";

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

function mapSession(
  s: typeof sessionsTable.$inferSelect,
  questions?: typeof questionsTable.$inferSelect[],
  myDisplayName?: string | null,
) {
  return {
    id: s.id,
    pin: s.pin,
    hostCode: s.hostCode,
    status: s.status,
    type: s.type,
    difficulty: s.difficulty,
    playStyle: s.playStyle ?? null,
    participants: s.participants,
    // Only populated for the authenticated caller when they're a joined
    // participant — lets the client know its own identity without ever
    // trusting a client-supplied name for scoring.
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
      createdAt: q.createdAt.toISOString(),
    })) ?? [],
    currentQuestionIndex: s.currentQuestionIndex,
    totalQuestions: s.totalQuestions,
    createdAt: s.createdAt.toISOString(),
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  };
}

async function pickQuestions(difficulty: string, totalQuestions: number) {
  const allQuestions =
    difficulty === "mixed"
      ? await db.select().from(questionsTable).limit(300)
      : await db
          .select()
          .from(questionsTable)
          .where(eq(questionsTable.difficulty, difficulty))
          .limit(100);

  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(totalQuestions, shuffled.length));
}

router.post("/sessions", sessionLimiter, requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { difficulty = "medium", playStyle, participants = [], totalQuestions = 10 } = req.body;

    const picked = await pickQuestions(difficulty, totalQuestions);

    const id = generateId();
    const pin = generatePin();
    const hostCode = generateHostCode();

    const [session] = await db
      .insert(sessionsTable)
      .values({
        id,
        pin,
        hostCode,
        status: "waiting",
        type: "group",
        hostUserId: auth.userId,
        difficulty,
        playStyle,
        participants,
        questionIds: picked.map((q) => String(q.id)),
        totalQuestions: picked.length,
      })
      .returning();

    res.status(201).json(mapSession(session, picked));
  } catch (err) {
    req.log.error({ err }, "Failed to create session");
    res.status(500).json({ error: "Failed to create session" });
  }
});

// ── 1v1 Duels ──────────────────────────────────────────────────────────────
// A duel is a session with type="duel": exactly two authenticated players,
// matched by a shared code, both of whom play (there is no spectating host).
// Identity for scoring is always resolved server-side from the caller's
// verified Clerk session — never from a client-supplied name — so a player
// can't submit answers or claim wins on the other participant's behalf.

router.post("/sessions/duel", sessionLimiter, requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { difficulty = "medium", totalQuestions = 10, hostName = "Player" } = req.body;

    const picked = await pickQuestions(difficulty, Math.min(Number(totalQuestions) || 10, 20));
    const id = generateId();
    const pin = generatePin();
    const hostCode = generateHostCode();
    const displayName = dedupeName(String(hostName), []);

    const [session] = await db
      .insert(sessionsTable)
      .values({
        id,
        pin,
        hostCode,
        status: "waiting",
        type: "duel",
        hostUserId: auth.userId,
        difficulty,
        participants: [displayName],
        questionIds: picked.map((q) => String(q.id)),
        totalQuestions: picked.length,
      })
      .returning();

    await db.insert(sessionParticipantsTable).values({ sessionId: id, userId: auth.userId, displayName });

    res.status(201).json(mapSession(session, picked));
  } catch (err) {
    req.log.error({ err }, "Failed to create duel");
    res.status(500).json({ error: "Failed to create duel" });
  }
});

router.post("/sessions/duel/join", sessionLimiter, requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { pin, playerName = "Player" } = req.body;

    if (!pin) {
      res.status(400).json({ error: "Code required" });
      return;
    }

    // The full read-check-write is wrapped in a transaction with a row lock
    // on the session so two simultaneous joiners can't both observe
    // participants.length < 2 and both get inserted, exceeding the 2-player
    // cap for a duel.
    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.pin, pin))
        .for("update");

      if (!session || session.type !== "duel") {
        return { error: { status: 404, message: "Duel not found" } } as const;
      }

      const [existingParticipant] = await tx
        .select()
        .from(sessionParticipantsTable)
        .where(and(eq(sessionParticipantsTable.sessionId, session.id), eq(sessionParticipantsTable.userId, auth.userId)));

      if (existingParticipant) {
        const questions = await getSessionQuestionsTx(tx, session.questionIds);
        return { session, questions } as const;
      }

      if (session.status !== "waiting" || session.participants.length >= 2) {
        return { error: { status: 400, message: "This duel is already full or in progress" } } as const;
      }

      const displayName = dedupeName(String(playerName), session.participants);
      await tx.insert(sessionParticipantsTable).values({ sessionId: session.id, userId: auth.userId, displayName });

      const newParticipants = [...session.participants, displayName];
      const [updated] = await tx
        .update(sessionsTable)
        .set({
          participants: newParticipants,
          status: newParticipants.length >= 2 ? "active" : session.status,
          currentQuestionIndex: 0,
        })
        .where(eq(sessionsTable.id, session.id))
        .returning();

      const questions = await getSessionQuestionsTx(tx, updated.questionIds);
      return { session: updated, questions } as const;
    });

    if (result.error) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }

    res.json(mapSession(result.session, result.questions));
  } catch (err) {
    req.log.error({ err }, "Failed to join duel");
    res.status(500).json({ error: "Failed to join duel" });
  }
});

router.post("/sessions/join", sessionLimiter, requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { pin, playerName = "Player" } = req.body;

    if (!pin) {
      res.status(400).json({ error: "PIN required" });
      return;
    }

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.pin, pin));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Duels have their own 2-player-capped, transactionally-locked join
    // flow — routing them through here would bypass that cap.
    if (session.type === "duel") {
      res.status(400).json({ error: "Use the duel join flow for this code" });
      return;
    }

    if (session.status === "completed") {
      res.status(400).json({ error: "Session already completed" });
      return;
    }

    const [existingParticipant] = await db
      .select()
      .from(sessionParticipantsTable)
      .where(and(eq(sessionParticipantsTable.sessionId, session.id), eq(sessionParticipantsTable.userId, auth.userId)));

    if (existingParticipant) {
      const questions = await getSessionQuestions(session.questionIds);
      res.json(mapSession(session, questions));
      return;
    }

    const displayName = dedupeName(String(playerName), session.participants);
    await db.insert(sessionParticipantsTable).values({ sessionId: session.id, userId: auth.userId, displayName });

    const [updated] = await db
      .update(sessionsTable)
      .set({ participants: [...session.participants, displayName] })
      .where(eq(sessionsTable.id, session.id))
      .returning();

    const questions = await getSessionQuestions(updated.questionIds);
    res.json(mapSession(updated, questions));
  } catch (err) {
    req.log.error({ err }, "Failed to join session");
    res.status(500).json({ error: "Failed to join session" });
  }
});

router.get("/sessions/recent", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 5), 20);

    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "completed"))
      .orderBy(desc(sessionsTable.completedAt))
      .limit(limit);

    res.json(sessions.map((s) => mapSession(s)));
  } catch (err) {
    req.log.error({ err }, "Failed to list recent sessions");
    res.status(500).json({ error: "Failed to list recent sessions" });
  }
});

router.get("/sessions/:id", optionalAuth, async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, (req.params.id as string)));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const questions = await getSessionQuestions(session.questionIds);

    let myDisplayName: string | null = null;
    const auth = (req as AuthedRequest).auth;
    if (auth) {
      const [participant] = await db
        .select()
        .from(sessionParticipantsTable)
        .where(and(eq(sessionParticipantsTable.sessionId, session.id), eq(sessionParticipantsTable.userId, auth.userId)));
      myDisplayName = participant?.displayName ?? null;
    }

    res.json(mapSession(session, questions, myDisplayName));
  } catch (err) {
    req.log.error({ err }, "Failed to get session");
    res.status(500).json({ error: "Failed to get session" });
  }
});

router.patch("/sessions/:id", requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const [existing] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, (req.params.id as string)));

    if (!existing) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Only the session's creator can manually control pacing. Duels
    // auto-advance server-side and don't rely on this endpoint.
    if (existing.hostUserId && existing.hostUserId !== auth.userId) {
      res.status(403).json({ error: "Only the host can control this session" });
      return;
    }

    const { status, currentQuestionIndex } = req.body;

    const updateData: Partial<typeof sessionsTable.$inferInsert> = {};
    if (status !== undefined) updateData.status = status;
    if (currentQuestionIndex !== undefined) updateData.currentQuestionIndex = currentQuestionIndex;
    if (status === "completed") updateData.completedAt = new Date();

    const [updated] = await db
      .update(sessionsTable)
      .set(updateData)
      .where(eq(sessionsTable.id, (req.params.id as string)))
      .returning();

    const questions = await getSessionQuestions(updated.questionIds);
    res.json(mapSession(updated, questions));
  } catch (err) {
    req.log.error({ err }, "Failed to update session");
    res.status(500).json({ error: "Failed to update session" });
  }
});

router.get("/sessions/:id/leaderboard", async (req, res) => {
  try {
    const answers = await db
      .select()
      .from(sessionAnswersTable)
      .where(eq(sessionAnswersTable.sessionId, (req.params.id as string)));

    // Aggregate by player
    const playerMap = new Map<string, { score: number; correct: number; total: number }>();

    for (const answer of answers) {
      const existing = playerMap.get(answer.playerName) ?? { score: 0, correct: 0, total: 0 };
      playerMap.set(answer.playerName, {
        score: existing.score + answer.score,
        correct: existing.correct + (answer.isCorrect ? 1 : 0),
        total: existing.total + 1,
      });
    }

    const leaderboard = Array.from(playerMap.entries())
      .map(([playerName, stats]) => ({ playerName, ...stats }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        rank: index + 1,
        playerName: entry.playerName,
        score: entry.score,
        correctAnswers: entry.correct,
        totalAnswers: entry.total,
      }));

    res.json(leaderboard);
  } catch (err) {
    req.log.error({ err }, "Failed to get leaderboard");
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

router.post("/sessions/:id/answers", requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthedRequest).auth!;
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      res.status(400).json({ error: "questionId and answer required" });
      return;
    }

    // Resolve the caller's identity for THIS session from the verified
    // participant record — never from a client-supplied player name. A
    // request from someone who never joined the session is rejected.
    const [participant] = await db
      .select()
      .from(sessionParticipantsTable)
      .where(and(eq(sessionParticipantsTable.sessionId, (req.params.id as string)), eq(sessionParticipantsTable.userId, auth.userId)));

    if (!participant) {
      res.status(403).json({ error: "You have not joined this session" });
      return;
    }

    const playerName = participant.displayName;

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, (req.params.id as string)));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.status !== "active") {
      res.status(400).json({ error: "This session is not currently active" });
      return;
    }

    // The submitted question must be the session's actual current question —
    // otherwise a participant could answer out-of-turn/future questions to
    // rack up score or force a duel's auto-advance prematurely.
    const currentQuestionId = Number(session.questionIds[session.currentQuestionIndex]);
    if (Number(questionId) !== currentQuestionId) {
      res.status(400).json({ error: "That is not the current question" });
      return;
    }

    const [question] = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, Number(questionId)));

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const isCorrect = question.correctAnswer === answer;
    const scoreMap: Record<string, number> = { easy: 100, medium: 150, hard: 200 };
    const score = isCorrect ? (scoreMap[question.difficulty] ?? 100) : 0;

    const [existingAnswer] = await db
      .select()
      .from(sessionAnswersTable)
      .where(
        and(
          eq(sessionAnswersTable.sessionId, (req.params.id as string)),
          eq(sessionAnswersTable.playerName, playerName),
          eq(sessionAnswersTable.questionId, question.id),
        ),
      );

    if (!existingAnswer) {
      await db.insert(sessionAnswersTable).values({
        sessionId: (req.params.id as string),
        playerName,
        questionId: question.id,
        answer,
        isCorrect,
        score,
      });
    }

    // Get total score for player in this session
    const playerAnswers = await db
      .select()
      .from(sessionAnswersTable)
      .where(
        and(
          eq(sessionAnswersTable.sessionId, (req.params.id as string)),
          eq(sessionAnswersTable.playerName, playerName)
        )
      );

    const totalScore = playerAnswers.reduce((sum, a) => sum + a.score, 0);

    // Duels auto-advance once both participants have answered the current
    // question — there is no host to click "next", so the server drives
    // pacing itself based on verified answer records.
    if (session.type === "duel" && !existingAnswer) {
      const answersForQuestion = await db
        .select()
        .from(sessionAnswersTable)
        .where(and(eq(sessionAnswersTable.sessionId, session.id), eq(sessionAnswersTable.questionId, question.id)));

      const distinctPlayers = new Set(answersForQuestion.map((a) => a.playerName));
      if (distinctPlayers.size >= 2) {
        const isLast = session.currentQuestionIndex >= session.totalQuestions - 1;
        await db
          .update(sessionsTable)
          .set(
            isLast
              ? { status: "completed", completedAt: new Date() }
              : { currentQuestionIndex: session.currentQuestionIndex + 1 },
          )
          .where(eq(sessionsTable.id, session.id));
      }
    }

    res.json({
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      score,
      totalScore,
      explanation: question.explanation ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit answer");
    res.status(500).json({ error: "Failed to submit answer" });
  }
});

async function getSessionQuestions(questionIds: string[]) {
  return getSessionQuestionsTx(db, questionIds);
}

async function getSessionQuestionsTx(
  dbOrTx: Pick<typeof db, "select">,
  questionIds: string[],
) {
  if (questionIds.length === 0) return [];
  const ids = questionIds.map(Number).filter(Boolean);

  const allQuestions = await Promise.all(
    ids.map(async (id) => {
      const [q] = await dbOrTx.select().from(questionsTable).where(eq(questionsTable.id, id));
      return q;
    })
  );

  return allQuestions.filter(Boolean) as typeof questionsTable.$inferSelect[];
}

export default router;
