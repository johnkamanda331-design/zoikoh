import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Central Express error handler. Must be registered last (after all routes).
 *
 * Normalises errors into a consistent JSON shape:
 *   { error: string, code?: string, details?: unknown }
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Zod validation errors → 400 with field details
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    } satisfies ApiError);
    return;
  }

  // Express body-parser limit exceeded
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type: string }).type === 'entity.too.large'
  ) {
    res.status(413).json({ error: 'Request body too large', code: 'PAYLOAD_TOO_LARGE' });
    return;
  }

  // Typed API errors with a status field
  if (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'message' in err
  ) {
    const typed = err as { status: number; message: string; code?: string };
    const status = typeof typed.status === 'number' ? typed.status : 500;
    res.status(status).json({
      error: typed.message,
      code: typed.code,
    } satisfies ApiError);
    return;
  }

  // Generic unknown errors — log details, hide internals from client
  const message = err instanceof Error ? err.message : 'Internal server error';
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' } satisfies ApiError);
}

/**
 * Thin helper that wraps an async route handler and forwards errors to next().
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
