/**
 * Application database instance.
 *
 * The backend routes use raw SQL and the pg client directly to avoid
 * transitive Drizzle ORM type dependencies in the API server package.
 */
import pg from "pg";
import { config } from "../config.js";

const pool = config.databaseUrl
  ? new pg.Pool({ connectionString: config.databaseUrl })
  : null;

const fallbackClient = {
  query: async () => {
    throw new Error("Database is not configured for this deployment.");
  },
  connect: async () => {
    throw new Error("Database is not configured for this deployment.");
  },
};

export const db = { $client: pool ?? fallbackClient } as any;
export { pool };
