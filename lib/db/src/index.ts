import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

/**
 * Creates a Drizzle ORM client and pg Pool from a connection URL.
 *
 * The caller is responsible for supplying the URL (e.g. from a centralised
 * config module). This keeps the library free of direct process.env reads so
 * the connection string is always provided explicitly.
 */
export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  return { pool, db };
}

export * from "./schema";
