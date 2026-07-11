/**
 * Application database instance.
 *
 * Constructs the Drizzle ORM client and underlying pg Pool using the
 * connection URL from the central config module. Import `db` and `pool`
 * from here instead of from @workspace/db directly so that the connection
 * string always comes from config rather than process.env.
 */
import { createDb } from "@workspace/db";
import { config } from "../config.js";

export const { db, pool } = createDb(config.databaseUrl);
