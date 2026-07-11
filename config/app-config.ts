/**
 * Centralized Application Configuration
 * 
 * This file contains all hardcoded API keys and configuration values.
 * It serves as the single source of truth for:
 * - Database connections
 * - Authentication (Clerk) keys
 * - AI/LLM API keys (Gemini, OpenAI)
 * - Vite public configuration
 * 
 * Usage:
 * - Backend: import { config } from '@workspace/config' or require process.env
 * - Frontend: Use via environment variables with VITE_ prefix
 * 
 * IMPORTANT: Update the placeholder values below with your actual API keys
 */

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

export const DATABASE_CONFIG = {
  /**
   * PostgreSQL connection string
   * Options:
   * 1. Replit Managed PostgreSQL: Set automatically by Replit
   * 2. Neon PostgreSQL: postgresql://user:password@host/dbname
   */
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost/zoiko_dev",
  
  /**
   * Neon-specific URL (takes priority over DATABASE_URL if set)
   * Format: postgresql://[user]:[password]@[host]/[dbname]
   * Get from: https://console.neon.tech/app/projects
   */
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || "",

  /**
   * Active database URL (priority: NEON_DATABASE_URL > DATABASE_URL)
   */
  get ACTIVE_DATABASE_URL() {
    return this.NEON_DATABASE_URL || this.DATABASE_URL;
  },
} as const;

// ============================================================================
// CLERK AUTHENTICATION CONFIGURATION
// ============================================================================

export const CLERK_CONFIG = {
  /**
   * Clerk Secret Key - For server-side authentication
   * Get from: https://dashboard.clerk.com → API Keys → Secret Key
   * 
   * NEVER expose this to the frontend
   * Used in: artifacts/api-server/src/app.ts
   */
  SECRET_KEY: process.env.CLERK_SECRET_KEY || "",

  /**
   * Clerk Publishable Key - For frontend and backend initialization
   * Get from: https://dashboard.clerk.com → API Keys → Publishable Key
   * 
   * Safe to expose to frontend
   * Used in: artifacts/api-server/src/config.ts (backend)
   *          artifacts/bible-explorer/src/App.tsx (frontend)
   */
  PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || "",

  /**
   * Vite-specific Clerk Publishable Key (for frontend bundling)
   * Same value as PUBLISHABLE_KEY but prefixed for Vite
   * Used in: artifacts/bible-explorer/src/App.tsx
   */
  VITE_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY || "",

  /**
   * Clerk Proxy URL - For custom domain support
   * Empty in development, set automatically in production
   * Used in: artifacts/bible-explorer/src/App.tsx
   */
  PROXY_URL: process.env.VITE_CLERK_PROXY_URL || "",

  /**
   * Validation helper
   */
  validate() {
    if (!this.SECRET_KEY) {
      console.warn("⚠️  CLERK_SECRET_KEY not set - Clerk authentication may not work");
    }
    if (!this.PUBLISHABLE_KEY) {
      console.warn("⚠️  CLERK_PUBLISHABLE_KEY not set - Clerk will not initialize");
    }
  },
} as const;

// ============================================================================
// AI/LLM CONFIGURATION (Question Generation)
// ============================================================================

export const AI_CONFIG = {
  /**
   * Google Gemini API Key - PRIMARY AI PROVIDER
   * Model: gemini-2.5-flash
   * Get from: https://aistudio.google.com/apikey
   * 
   * Used in: artifacts/api-server/src/routes/questions.ts (line 160+)
   * Priority: GEMINI_API_KEY > OPENAI_API_KEY > Mock questions
   */
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",

  /**
   * OpenAI API Key - FALLBACK AI PROVIDER (currently unused)
   * Model: gpt-4o-mini
   * Get from: https://platform.openai.com/api-keys
   * 
   * Used in: artifacts/api-server/src/routes/questions.ts (line 150+)
   * Note: Fallback only, Gemini is primary
   */
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",

  /**
   * Determine which AI provider is configured
   */
  getActiveProvider(): "gemini" | "openai" | "none" {
    if (this.GEMINI_API_KEY) return "gemini";
    if (this.OPENAI_API_KEY) return "openai";
    return "none";
  },

  /**
   * Validation helper
   */
  validate() {
    const provider = this.getActiveProvider();
    if (provider === "none") {
      console.warn("⚠️  No AI API key configured - Using mock questions for generation");
    } else {
      console.log(`✓ AI Provider: ${provider}`);
    }
  },
} as const;

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

export const SERVER_CONFIG = {
  /**
   * HTTP Server Port
   * Backend: 8080 (development)
   * Frontend: 24116 (development, managed by Vite)
   */
  PORT: Number(process.env.PORT) || 8080,

  /**
   * Node Environment
   * Values: "development" | "production" | "test"
   */
  NODE_ENV: process.env.NODE_ENV || "development",

  /**
   * Logging Level
   * Values: "trace" | "debug" | "info" | "warn" | "error" | "fatal"
   */
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  /**
   * Whether running in production
   */
  IS_PRODUCTION: (process.env.NODE_ENV || "development") === "production",

  /**
   * Validation helper
   */
  validate() {
    if (this.PORT <= 0 || this.PORT > 65535) {
      throw new Error(`Invalid PORT: ${this.PORT}`);
    }
    console.log(`✓ Server: ${this.NODE_ENV} | Port: ${this.PORT} | Log Level: ${this.LOG_LEVEL}`);
  },
} as const;

// ============================================================================
// VITE/FRONTEND CONFIGURATION
// ============================================================================

export const FRONTEND_CONFIG = {
  /**
   * Clerk Publishable Key for Vite (frontend)
   * Same as CLERK_CONFIG.PUBLISHABLE_KEY
   */
  VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY || "",

  /**
   * Clerk Proxy URL for Vite (frontend)
   * Used for custom domain support
   */
  VITE_CLERK_PROXY_URL: process.env.VITE_CLERK_PROXY_URL || "",

  /**
   * Base path for the frontend
   * Default: "/" (root)
   */
  BASE_PATH: process.env.BASE_PATH || "/",

  /**
   * Validation helper
   */
  validate() {
    if (!this.VITE_CLERK_PUBLISHABLE_KEY) {
      console.warn("⚠️  VITE_CLERK_PUBLISHABLE_KEY not set - Clerk frontend won't initialize");
    }
  },
} as const;

// ============================================================================
// COMPOSITE CONFIGURATION
// ============================================================================

/**
 * Main configuration object combining all settings
 * 
 * Access pattern:
 * - config.database.activeUrl
 * - config.clerk.secretKey
 * - config.ai.geminiKey
 * - config.server.port
 * - config.frontend.clerkPublishableKey
 */
export const appConfig = {
  database: DATABASE_CONFIG,
  clerk: CLERK_CONFIG,
  ai: AI_CONFIG,
  server: SERVER_CONFIG,
  frontend: FRONTEND_CONFIG,

  /**
   * Validate all configuration on startup
   */
  validateAll() {
    console.log("\n📋 Validating Configuration...\n");
    CLERK_CONFIG.validate();
    AI_CONFIG.validate();
    SERVER_CONFIG.validate();
    FRONTEND_CONFIG.validate();
    console.log("\n✓ Configuration validated\n");
  },
} as const;

// ============================================================================
// ENVIRONMENT VARIABLES REFERENCE GUIDE
// ============================================================================

/**
 * To use this config, set these environment variables in your system:
 * 
 * Backend (.env or system environment):
 * ─────────────────────────────────────
 * # Database
 * DATABASE_URL=postgresql://user:pass@localhost:5432/zoiko_dev
 * NEON_DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname
 * 
 * # Clerk
 * CLERK_SECRET_KEY=sk_test_xxxxx
 * CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
 * 
 * # AI/LLM
 * GEMINI_API_KEY=AIzaSyXxxxxx
 * OPENAI_API_KEY=sk-proj-xxxxx
 * 
 * # Server
 * PORT=8080
 * NODE_ENV=development
 * LOG_LEVEL=info
 * 
 * 
 * Frontend (.env.local or .env):
 * ────────────────────────────────
 * VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
 * VITE_CLERK_PROXY_URL=/api/auth
 * BASE_PATH=/
 * 
 * 
 * Replit Environment Variables (via .replit or UI):
 * ──────────────────────────────────────────────────
 * DATABASE_URL=<auto-set by Replit>
 * CLERK_SECRET_KEY=sk_test_xxxxx
 * CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
 * GEMINI_API_KEY=AIzaSyXxxxxx
 */

export default appConfig;
