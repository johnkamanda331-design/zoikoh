
import { Router } from "express";
import type { Request, Response } from 'express';

const router = Router();

router.get("/healthz", (_req: Request, res: Response) => {
  (res as any).json({ status: 'ok' });
});

export default router;
