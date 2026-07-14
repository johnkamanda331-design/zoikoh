import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
const pinoHttpMiddleware = pinoHttp as unknown as any;
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { config } from "./config.js";

const app = express();

app.use(
  pinoHttpMiddleware({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Security headers (before anything else)
app.use(
  helmet({
    contentSecurityPolicy: false, // Clerk injects its own scripts
    crossOriginEmbedderPolicy: false,
  }),
);

// Global rate limiter
app.use(apiLimiter);

// Clerk proxy must be mounted before express.json()
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

const allowedOrigins = process.env['ALLOWED_ORIGINS']
  ? process.env['ALLOWED_ORIGINS'].split(',').map((o) => o.trim())
  : true; // allow all in dev

app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Resolve the publishable key from the incoming request host so the same
// server can serve multiple Clerk custom domains. Falls back to
// CLERK_PUBLISHABLE_KEY when the host doesn't map to a custom domain.
app.use(
  clerkMiddleware((req: Request) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      config.clerk.publishableKey,
    ),
  })),
);

app.use("/api", router);
app.use("/", router);

// Central error handler — must be last
app.use(errorHandler);

export default app;
