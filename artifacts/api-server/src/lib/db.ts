/**
 * Application database instance.
 *
 * The backend routes use raw SQL and the pg client directly to avoid
 * transitive Drizzle ORM type dependencies in the API server package.
 */
import pg from "pg";
import { config } from "../config.js";

const pool = new pg.Pool({ connectionString: config.databaseUrl });
export const db = { $client: pool } as any;
export { pool };
