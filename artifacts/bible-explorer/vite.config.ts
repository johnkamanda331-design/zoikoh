import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');

  // PORT and BASE_PATH default to safe values so Vercel production builds work
  // without extra env configuration. The dev workflow still sets them explicitly.
  const rawPort = env.PORT ?? '3000';
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = env.BASE_PATH ?? '/';
  const clerkPublishableKey =
    env.VITE_CLERK_PUBLISHABLE_KEY ||
    env.CLERK_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    '';
  const clerkProxyUrl = (
    env.VITE_CLERK_PROXY_URL ||
    env.CLERK_PROXY_URL ||
    env.NEXT_PUBLIC_CLERK_PROXY_URL ||
    ''
  ).trim();

  return {
    base: basePath,
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishableKey),
      'import.meta.env.VITE_CLERK_PROXY_URL': JSON.stringify(clerkProxyUrl),
    },
    plugins: [
      react(),
      tailwindcss({ optimize: false }),
      runtimeErrorOverlay(),
      ...(env.NODE_ENV !== 'production' && env.REPL_ID !== undefined
        ? [
            import('@replit/vite-plugin-cartographer').then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, '..'),
              }),
            ),
            import('@replit/vite-plugin-dev-banner').then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
        },
      },
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
