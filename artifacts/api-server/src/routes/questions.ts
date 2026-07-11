import { Router } from "express";
import { db } from "../lib/db.js";
import { config } from "../config.js";
import { generateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

function mapQuestion(q: any) {
  return {
    id: q.id,
    text: q.text,
    options: q.options,
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty,
    categoryId: q.categoryId,
    explanation: q.explanation ?? null,
    book: q.book ?? null,
    createdAt: q.createdAt.toISOString(),
  };
}

router.get("/questions", async (req: any, res: any) => {
  try {
    const difficulty = req.query.difficulty as string | undefined;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const limit = Math.min(Number(req.query.limit ?? 10), 100);
    const offset = Number(req.query.offset ?? 0);

    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (difficulty) {
      whereClauses.push(`difficulty = $${paramIndex++}`);
      values.push(difficulty);
    }
    if (categoryId) {
      whereClauses.push(`category_id = $${paramIndex++}`);
      values.push(categoryId);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const questionsResult = await (db as any).$client.query(
      `SELECT id, text, options, correct_answer AS "correctAnswer", difficulty, category_id AS "categoryId", explanation, book, created_at AS "createdAt"
       FROM questions ${whereSql}
       ORDER BY id
       LIMIT $${paramIndex}
       OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const totalResult = await (db as any).$client.query(
      `SELECT COUNT(*)::int AS count FROM questions ${whereSql}`,
      values
    );

    (res as any).json({
      questions: questionsResult.rows.map(mapQuestion),
      total: totalResult.rows?.[0]?.count ?? 0,
    });
  } catch (err) {
    (req as any).log.error({ err }, "Failed to list questions");
    (res as any).status(500).json({ error: "Failed to list questions" });
  }
});

router.post("/questions", async (req: any, res: any) => {
  try {
    const { text, options, correctAnswer, difficulty, categoryId, explanation, book } = req.body;

    if (!text || !options || !correctAnswer || !difficulty || !categoryId) {
      (res as any).status(400).json({ error: "Missing required fields" });
      return;
    }

    const createdResult = await (db as any).$client.query(
      `INSERT INTO questions (text, options, correct_answer, difficulty, category_id, explanation, book)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, text, options, correct_answer AS "correctAnswer", difficulty, category_id AS "categoryId", explanation, book, created_at AS "createdAt"`,
      [text, options, correctAnswer, difficulty, categoryId, explanation ?? null, book ?? null]
    );

    (res as any).status(201).json(mapQuestion(createdResult.rows[0]));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to create question" );
    (res as any).status(500).json({ error: "Failed to create question" });
  }
});

router.post("/questions/generate", generateLimiter, async (req: any, res: any) => {
  try {
    const { difficulty = "medium", count: qCount = 5, topic } = req.body;

    const openaiKey = config.ai.openaiApiKey;
    const geminiKey = config.ai.geminiApiKey;

    if (!openaiKey && !geminiKey) {
      // Return mock questions if no AI provider is configured
      const mockQuestions = generateMockQuestions(difficulty as string, Math.min(qCount, 10), topic as string);
      res.json(mockQuestions);
      return;
    }

    const prompt = buildPrompt(difficulty as string, qCount, topic as string | undefined);

    const parsed = openaiKey
      ? await generateWithOpenAI(openaiKey, prompt)
      : await generateWithGemini(geminiKey as string, prompt);

    if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
      res.status(502).json({ error: "Invalid AI response format" });
      return;
    }

    // "mixed" is a session-level pooling concept, not a valid per-question
    // difficulty in the Question schema — spread generated questions evenly
    // across easy/medium/hard instead of tagging them "mixed".
    const perQuestionDifficulties = ["easy", "medium", "hard"];

    const questions = parsed.questions.map((q: unknown, i: number) => {
      const question = q as Record<string, unknown>;
      return {
        id: -(i + 1),
        text: question.text as string,
        options: question.options as string[],
        correctAnswer: question.correctAnswer as string,
        difficulty: difficulty === "mixed" ? perQuestionDifficulties[i % 3] : difficulty,
        categoryId: 1,
        explanation: question.explanation as string | null ?? null,
        book: question.book as string | null ?? null,
        createdAt: new Date().toISOString(),
      };
    });

    res.json(questions);
  } catch (err) {
    req.log.error({ err }, "Failed to generate questions");
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

async function generateWithOpenAI(apiKey: string, prompt: string): Promise<{ questions: unknown[] } | null> {
  const response: any = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a Bible trivia expert. Generate accurate, educational Bible trivia questions. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0].message.content);
}

async function generateWithGemini(apiKey: string, prompt: string): Promise<{ questions: unknown[] } | null> {
  const response: any = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are a Bible trivia expert. Generate accurate, educational Bible trivia questions. Always respond with valid JSON matching the requested schema exactly." }],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  return JSON.parse(text);
}

router.post("/questions/generate/save", async (req: any, res: any) => {
  try {
    const { questions } = req.body as { questions: Array<{ text: string; options: string[]; correctAnswer: string; difficulty: string; categoryId: number; explanation?: string; book?: string }> };

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      (res as any).status(400).json({ error: "No questions provided" });
      return;
    }

    const inserted = await Promise.all(
      questions.map(async (q) => {
        const result = await (db as any).$client.query(
          `INSERT INTO questions (text, options, correct_answer, difficulty, category_id, explanation, book)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, text, options, correct_answer AS "correctAnswer", difficulty, category_id AS "categoryId", explanation, book, created_at AS "createdAt"`,
          [q.text, q.options, q.correctAnswer, q.difficulty, q.categoryId ?? 1, q.explanation ?? null, q.book ?? null]
        );
        return mapQuestion(result.rows[0]);
      })
    );

    (res as any).status(201).json(inserted);
  } catch (err) {
    (req as any).log.error({ err }, "Failed to save generated questions");
    (res as any).status(500).json({ error: "Failed to save questions" });
  }
});

router.get("/questions/:id", async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const questionResult = await (db as any).$client.query(
      `SELECT id, text, options, correct_answer AS "correctAnswer", difficulty, category_id AS "categoryId", explanation, book, created_at AS "createdAt"
       FROM questions
       WHERE id = $1`,
      [id]
    );

    const question = questionResult.rows[0];
    if (!question) {
      (res as any).status(404).json({ error: "Question not found" });
      return;
    }

    (res as any).json(mapQuestion(question));
  } catch (err) {
    (req as any).log.error({ err }, "Failed to get question");
    (res as any).status(500).json({ error: "Failed to get question" });
  }
});

router.delete("/questions/:id", async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    await (db as any).$client.query(`DELETE FROM questions WHERE id = $1`, [id]);
    (res as any).status(204).send();
  } catch (err) {
    (req as any).log.error({ err }, "Failed to delete question");
    (res as any).status(500).json({ error: "Failed to delete question" });
  }
});

function buildPrompt(difficulty: string, count: number, topic?: string) {
  const topicLine = topic ? ` Focus on the topic: "${topic}".` : "";
  return `Generate ${count} ${difficulty}-level Bible trivia questions.${topicLine}

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of the answer",
      "book": "Genesis"
    }
  ]
}

Requirements:
- ${difficulty === "easy" ? "Simple, well-known Bible facts" : difficulty === "medium" ? "Moderate knowledge required" : difficulty === "mixed" ? "A mix of easy, medium, and hard questions spread evenly across the set" : "Deep Bible knowledge required"}
- Each question must have exactly 4 options
- correctAnswer must exactly match one of the options
- Keep explanations concise (1-2 sentences)`;
}

function generateMockQuestions(difficulty: string, count: number, topic?: string) {
  const pool = [
    { text: "Who was swallowed by a large fish?", options: ["Jonah", "Moses", "Elijah", "Daniel"], correctAnswer: "Jonah", explanation: "Jonah was swallowed by a great fish after fleeing from God.", book: "Jonah" },
    { text: "How many days did it take to create the world?", options: ["6 days", "7 days", "5 days", "10 days"], correctAnswer: "6 days", explanation: "God created the world in 6 days and rested on the 7th.", book: "Genesis" },
    { text: "Who was the first king of Israel?", options: ["Saul", "David", "Solomon", "Samuel"], correctAnswer: "Saul", explanation: "Saul was anointed by Samuel as the first king of Israel.", book: "1 Samuel" },
    { text: "What is the shortest verse in the Bible?", options: ["Jesus wept", "God is love", "Fear not", "Be still"], correctAnswer: "Jesus wept", explanation: "John 11:35 — 'Jesus wept' is the shortest verse.", book: "John" },
    { text: "Who wrote the book of Revelation?", options: ["John", "Paul", "Peter", "James"], correctAnswer: "John", explanation: "The Apostle John wrote Revelation while exiled on Patmos.", book: "Revelation" },
    { text: "How many books are in the New Testament?", options: ["27", "39", "66", "24"], correctAnswer: "27", explanation: "The New Testament contains 27 books.", book: null },
    { text: "What was the first miracle Jesus performed?", options: ["Turning water into wine", "Healing a blind man", "Walking on water", "Feeding 5000"], correctAnswer: "Turning water into wine", explanation: "Jesus turned water into wine at the wedding in Cana.", book: "John" },
    { text: "Who betrayed Jesus for 30 pieces of silver?", options: ["Judas Iscariot", "Peter", "Thomas", "Pilate"], correctAnswer: "Judas Iscariot", explanation: "Judas Iscariot betrayed Jesus to the chief priests for 30 pieces of silver.", book: "Matthew" },
  ];

  const perQuestionDifficulties = ["easy", "medium", "hard"];

  return pool.slice(0, count).map((q, i) => ({
    id: -(i + 1),
    ...q,
    explanation: q.explanation ?? null,
    book: q.book ?? null,
    difficulty: difficulty === "mixed" ? perQuestionDifficulties[i % 3] : difficulty,
    categoryId: 1,
    createdAt: new Date().toISOString(),
  }));
}

export default router;
