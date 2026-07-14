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

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "..", "..", "..");
const envFile = path.join(workspaceRoot, ".env");

if (existsSync(envFile)) {
  const envContent = readFileSync(envFile, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const rawPort = process.env["PORT"];
const port = Number(rawPort ?? "8081");
const hasValidPort = Number.isFinite(port) && port > 0;

function getFirstEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

const databaseUrl = getFirstEnvValue(
  "NEON_DATABASE_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
);

export const config = Object.freeze({
  /** HTTP port the Express server listens on (from PORT env var). */
  port: hasValidPort ? port : 3000,

  /** Node environment: "development" | "production" | "test". */
  nodeEnv: process.env["NODE_ENV"] ?? "development",

  /** Pino log level (default: "info"). Override with LOG_LEVEL env var. */
  logLevel: process.env["LOG_LEVEL"] ?? "info",

  /** PostgreSQL connection string (NEON_DATABASE_URL takes priority over DATABASE_URL). */
  databaseUrl,

  clerk: Object.freeze({
    /** Clerk secret key for server-side auth and the Clerk proxy middleware. */
    secretKey: getFirstEnvValue("CLERK_SECRET_KEY"),
    /** Clerk publishable key used to initialise the Clerk Express middleware. */
    publishableKey: getFirstEnvValue("CLERK_PUBLISHABLE_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
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
