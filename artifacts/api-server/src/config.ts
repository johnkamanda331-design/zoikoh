/**
 * Central application configuration.
 *
 * This is the single place where process.env is read for the application
 * runtime. All backend modules import their configuration values from here.
 *
 * Note: lib/db/drizzle.config.ts reads process.env directly because it is
 * invoked by the drizzle-kit CLI as a standalone dev-tooling script, not by
 * the application at runtime.
 */

const rawPort = process.env["PORT"];
const port = Number(rawPort);
if (!rawPort || Number.isNaN(port) || port <= 0) {
  throw new Error(
    `Invalid or missing PORT environment variable: "${rawPort}". The server must be started via its workflow so PORT is set automatically.`,
  );
}

const databaseUrl =
  process.env["NEON_DATABASE_URL"] ?? process.env["DATABASE_URL"] ?? "";
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL (or NEON_DATABASE_URL) must be set. Did you forget to provision a database?",
  );
}

export const config = Object.freeze({
  /** HTTP port the Express server listens on (from PORT env var). */
  port,

  /** Node environment: "development" | "production" | "test". */
  nodeEnv: process.env["NODE_ENV"] ?? "development",

  /** Pino log level (default: "info"). Override with LOG_LEVEL env var. */
  logLevel: process.env["LOG_LEVEL"] ?? "info",

  /** PostgreSQL connection string (NEON_DATABASE_URL takes priority over DATABASE_URL). */
  databaseUrl,

  clerk: Object.freeze({
    /** Clerk secret key for server-side auth and the Clerk proxy middleware. */
    secretKey: process.env["CLERK_SECRET_KEY"] ?? "",
    /** Clerk publishable key used to initialise the Clerk Express middleware. */
    publishableKey: process.env["CLERK_PUBLISHABLE_KEY"] ?? "",
  }),

  ai: Object.freeze({
    /**
     * OpenAI API key — optional. When set, takes priority over Gemini for
     * AI question generation.
     */
    openaiApiKey: process.env["OPENAI_API_KEY"] ?? null,
    /**
     * Google Gemini API key — optional. Used for AI question generation when
     * the OpenAI key is absent. Falls back to mock questions if neither is set.
     */
    geminiApiKey: process.env["GEMINI_API_KEY"] ?? null,
  }),
});
