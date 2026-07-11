/**
 * Vercel Serverless Function entry point for the ZOIKO API.
 *
 * Wraps the existing Express application so it can run as a Vercel
 * serverless function.  Vercel's Node.js runtime calls this handler
 * directly — it does not need `app.listen()`.
 *
 * Environment variables are read from Vercel's project settings and are
 * available to all workspace packages that are bundled here.
 */

// Ensure PORT has a value before config.ts runs its guard check.
// On Vercel the server never actually binds to a port — the runtime
// calls the exported handler directly — so any valid number is fine.
if (!process.env['PORT']) {
  process.env['PORT'] = '3000';
}

import app from '../artifacts/api-server/src/app';

export default app;
