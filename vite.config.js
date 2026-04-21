import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));



// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // This repo is a single Vite app (not a monorepo). Read secrets from repo root.
  const envDir = __dirname;
  const env = loadEnv(mode, envDir, '');

  // GitHub project Pages serves the site at /<repo-name>/; set CI_PAGES_BASE in CI (see deploy workflow).
  const base = process.env.CI_PAGES_BASE?.replace(/\/?$/, '/') || '/';

  return {
    base,
    plugins: [react()],
    // Ensure `.env.local` at repo root is picked up.
    envDir,
    server: {
      proxy: {
        // Proxy to Yahoo Finance chart API (same backend yfinance uses)
        '/yf': {
          target: 'https://query1.finance.yahoo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/yf/, ''),
          headers: { 'User-Agent': 'Mozilla/5.0' },
        },
      },
    },
  };
});
