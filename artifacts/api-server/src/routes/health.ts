
import { Router } from "express";
import type { Request, Response } from 'express';
import { db, pool } from "../lib/db.js";
import { config } from "../config.js";

const router = Router();

router.get("/healthz", (_req: Request, res: Response) => {
  (res as any).json({ status: 'ok' });
});

router.get("/healthz/db", async (_req: Request, res: Response) => {
  try {
    if (!pool) {
      return (res as any).status(503).json({ status: 'error', message: 'Database pool not initialized - check DATABASE_URL environment variable' });
    }

    const result = await (db as any).$client.query('SELECT 1');
    (res as any).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    (res as any).status(503).json({ status: 'error', database: 'failed', message });
  }
});

router.get("/healthz/config", (_req: Request, res: Response) => {
  (res as any).json({
    status: 'ok',
    environment: config.nodeEnv,
    port: config.port,
    database: {
      configured: !!config.databaseUrl,
      urlPrefix: config.databaseUrl?.substring(0, 20) + '...' || 'not set',
    },
    clerk: {
      secretKeyConfigured: !!config.clerk.secretKey,
      publishableKeyConfigured: !!config.clerk.publishableKey,
    },
    poolInitialized: !!pool,
  });
});

export default router;
