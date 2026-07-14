import pino from "pino";
import { config } from "../config.js";

// Determine if we should use pretty printing
const isDevelopment = config.nodeEnv === "development" || process.env.NODE_ENV === "development";
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.GOOGLE_CLOUD_PROJECT;

export const logger = pino({
  level: config.logLevel,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  // Only use pretty printing in local development, never in production or serverless
  ...(isDevelopment && !isServerless
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});
