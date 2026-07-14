/**
 * Application database instance.
 *
 * The backend routes use raw SQL and the pg client directly to avoid
 * transitive Drizzle ORM type dependencies in the API server package.
 */
import pg from "pg";
import { config } from "../config.js";

const pool = config.databaseUrl
  ? new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
    })
  : null;

const fallbackClient = {
  query: async () => {
    throw new Error("Database is not configured for this deployment.");
  },
  connect: async () => {
    throw new Error("Database is not configured for this deployment.");
  },
};

let initializationPromise: Promise<void> | null = null;

async function initializeDatabase() {
  if (!pool) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        options TEXT[] NOT NULL,
        correct_answer TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'medium',
        category_id INTEGER NOT NULL DEFAULT 1 REFERENCES categories(id) ON DELETE SET DEFAULT,
        explanation TEXT,
        book TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      INSERT INTO categories (name, description)
      VALUES ('General', 'General Bible trivia')
      ON CONFLICT (name) DO NOTHING;
    `);

    const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM questions;`);
    const questionCount = rows?.[0]?.count ?? 0;

    if (questionCount === 0) {
      await client.query(
        `
          INSERT INTO questions (text, options, correct_answer, difficulty, category_id, explanation, book)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7),
            ($8, $9, $10, $11, $12, $13, $14),
            ($15, $16, $17, $18, $19, $20, $21),
            ($22, $23, $24, $25, $26, $27, $28),
            ($29, $30, $31, $32, $33, $34, $35),
            ($36, $37, $38, $39, $40, $41, $42),
            ($43, $44, $45, $46, $47, $48, $49),
            ($50, $51, $52, $53, $54, $55, $56)
        `,
        [
          "Who was swallowed by a large fish?",
          ["Jonah", "Moses", "Elijah", "Daniel"],
          "Jonah",
          "easy",
          1,
          "Jonah was swallowed by a great fish after fleeing from God.",
          "Jonah",
          "How many days did it take to create the world?",
          ["6 days", "7 days", "5 days", "10 days"],
          "6 days",
          "easy",
          1,
          "God created the world in 6 days and rested on the 7th.",
          "Genesis",
          "Who was the first king of Israel?",
          ["Saul", "David", "Solomon", "Samuel"],
          "Saul",
          "easy",
          1,
          "Saul was anointed by Samuel as the first king of Israel.",
          "1 Samuel",
          "What is the shortest verse in the Bible?",
          ["Jesus wept", "God is love", "Fear not", "Be still"],
          "Jesus wept",
          "medium",
          1,
          "John 11:35 — 'Jesus wept' is the shortest verse.",
          "John",
          "Who wrote the book of Revelation?",
          ["John", "Paul", "Peter", "James"],
          "John",
          "medium",
          1,
          "The Apostle John wrote Revelation while exiled on Patmos.",
          "Revelation",
          "How many books are in the New Testament?",
          ["27", "39", "66", "24"],
          "27",
          "medium",
          1,
          "The New Testament contains 27 books.",
          null,
          "What was the first miracle Jesus performed?",
          ["Turning water into wine", "Healing a blind man", "Walking on water", "Feeding 5000"],
          "Turning water into wine",
          "hard",
          1,
          "Jesus turned water into wine at the wedding in Cana.",
          "John",
          "Who betrayed Jesus for 30 pieces of silver?",
          ["Judas Iscariot", "Peter", "Thomas", "Pilate"],
          "Judas Iscariot",
          "hard",
          1,
          "Judas Iscariot betrayed Jesus to the chief priests for 30 pieces of silver.",
          "Matthew",
        ]
      );
    }
  } finally {
    client.release();
  }
}

async function ensureDatabaseInitialized() {
  if (!pool) {
    const msg = `Database connection pool not initialized. Check that NEON_DATABASE_URL or DATABASE_URL environment variable is set.`;
    console.error(msg);
    throw new Error(msg);
  }

  if (!initializationPromise) {
    initializationPromise = Promise.race([
      initializeDatabase().catch((error) => {
        const msg = `Failed to initialize database schema: ${error instanceof Error ? error.message : String(error)}`;
        console.error(msg);
        // Don't throw in serverless - let the query attempt and fail gracefully if needed
        return;
      }),
      new Promise((resolve) =>
        setTimeout(() => {
          console.warn("Database initialization timeout - proceeding without guarantee of schema");
          resolve(undefined);
        }, 5000) // 5 second timeout for serverless
      ),
    ]);
  }

  await initializationPromise;
}

const wrappedClient = pool
  ? {
      query: async (...args: Parameters<typeof pool.query>) => {
        try {
          await ensureDatabaseInitialized();
          return pool.query(...args);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`Database query failed: ${msg}`);
          throw error;
        }
      },
      connect: async () => {
        await ensureDatabaseInitialized();
        return pool.connect();
      },
    }
  : fallbackClient;

export const db = { $client: wrappedClient } as any;
export { pool };
