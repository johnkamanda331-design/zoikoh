import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import { apiLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import router from "./routes";
import { logger } from "./lib/logger";
import { config } from "./config";

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
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
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      config.clerk.publishableKey,
    ),
  })),
);

app.use("/api", router);

// Central error handler — must be last
app.use(errorHandler);

export default app;
