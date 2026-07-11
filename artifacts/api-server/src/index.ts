import { config } from "./config.js";
import app from "./app.js";
import { logger } from "./lib/logger.js";

app.listen(config.port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port: config.port }, "Server listening");
});
