#!/usr/bin/env node
/**
 * Direct Vite Server Launcher for ZOIKO Bible Explorer
 * Bypasses pnpm wrapper issues on Windows
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up environment
process.env.NODE_ENV = 'development';
process.env.VITE_CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_...';
process.env.VITE_CLERK_PROXY_URL = process.env.VITE_CLERK_PROXY_URL || '/api/auth';
process.env.BASE_PATH = process.env.BASE_PATH || '/';

const PORT = process.env.PORT || 24116;
const HOST = '0.0.0.0';

console.log(`Starting ZOIKO Bible Explorer Frontend`);
console.log(`Port: ${PORT}`);
console.log(`Host: ${HOST}`);

try {
  // Create and start dev server
  (async () => {
    const server = await createServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: {
        middlewareMode: false,
        port: PORT,
        host: HOST,
        hmr: { host: 'localhost', port: PORT },
        cors: true,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY),
        'process.env.VITE_CLERK_PROXY_URL': JSON.stringify(process.env.VITE_CLERK_PROXY_URL),
        'process.env.BASE_PATH': JSON.stringify(process.env.BASE_PATH),
      },
    });

    await server.listen();
    console.log(`✓ Frontend dev server ready on http://${HOST}:${PORT}`);
    console.log(`✓ Access the app at http://localhost:${PORT}`);
  })();
} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}
