import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function wingbitsDevProxy(apiKey) {
  return {
    name: 'wingbits-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (!req.url?.startsWith('/api/wingbits/')) return next();

          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Missing WINGBITS_API_KEY (set it in ../.env.local and restart dev server)' }));
            return;
          }

          const upstreamPath = req.url.replace(/^\/api\/wingbits/, '');
          const upstreamUrl = new URL(upstreamPath, 'https://customer-api.wingbits.com');

          const headers = new Headers();
          headers.set('x-api-key', apiKey);
          headers.set('accept', 'application/json');

          let body = undefined;
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            body = Buffer.concat(chunks);
            const ct = req.headers['content-type'];
            if (typeof ct === 'string') headers.set('content-type', ct);
          }

          const upstreamRes = await fetch(upstreamUrl, { method: req.method || 'GET', headers, body });

          res.statusCode = upstreamRes.status;
          const resCt = upstreamRes.headers.get('content-type');
          if (resCt) res.setHeader('content-type', resCt);

          const buf = Buffer.from(await upstreamRes.arrayBuffer());
          res.end(buf);
        } catch {
          res.statusCode = 502;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Wingbits proxy failed' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // This repo is a single Vite app (not a monorepo). Read secrets from repo root.
  const envDir = __dirname;
  const env = loadEnv(mode, envDir, '');

  // GitHub project Pages serves the site at /<repo-name>/; set CI_PAGES_BASE in CI (see deploy workflow).
  const base = process.env.CI_PAGES_BASE?.replace(/\/?$/, '/') || '/';

  return {
    base,
    plugins: [react(), wingbitsDevProxy(env.WINGBITS_API_KEY)],
    // Ensure `.env.local` at repo root is picked up.
    envDir,
  };
});
