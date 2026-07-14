import { config } from "./config.js";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { pool } from "./lib/db.js";

app.listen(config.port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port: config.port, environment: config.nodeEnv }, "Server listening");
  
  // Log database status
  if (!pool) {
    logger.warn(
      { databaseUrlSet: !!config.databaseUrl },
      "Database pool not initialized - check NEON_DATABASE_URL, DATABASE_URL, or other database environment variables"
    );
  } else {
    logger.info("Database pool initialized successfully");
  }
});
