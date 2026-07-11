import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import type { IncomingMessage } from 'http';

/**
 * General API rate limiter — 300 requests per 15 minutes per IP.
 * Applied globally to all /api routes.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req: IncomingMessage) => req.method === 'OPTIONS',
});

/**
 * Strict limiter for AI generation endpoints — 10 requests per minute.
 * Prevents abuse of costly Gemini/OpenAI calls.
 */
export const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many generation requests. Please wait a moment.' },
});

/**
 * Auth-adjacent limiter for session creation — 30 per minute.
 */
export const sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many session requests. Please slow down.' },
});
