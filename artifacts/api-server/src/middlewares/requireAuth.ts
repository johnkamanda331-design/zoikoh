import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

export interface AuthedRequest extends Request {
  auth?: { userId: string };
}

/**
 * Requires a valid Clerk session. Populates `req.auth.userId` with the
 * verified Clerk user id — this is the only trustworthy source of player
 * identity used by session/duel/player routes, since it can't be spoofed
 * by a client-supplied name or id in the request body.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  (req as AuthedRequest).auth = { userId };
  next();
}

/**
 * Attaches `req.auth.userId` when a valid Clerk session is present, but
 * never rejects the request. Used on public reads (e.g. GET /sessions/:id)
 * that want to additionally tell an authenticated caller which participant
 * record is theirs, without requiring sign-in to view the resource at all.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (auth?.userId) {
    (req as AuthedRequest).auth = { userId: auth.userId };
  }
  next();
}
