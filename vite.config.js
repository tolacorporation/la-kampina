import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleKvCatalog, handleKvSync, handleKvValidateCheckout } from './scripts/kvDevMiddleware.js';

function cloudflareKvDevPlugin() {
  return {
    name: 'cloudflare-kv-dev-plugin',
    configureServer(server) {
      server.middlewares.use('/api/catalog', (req, res, next) => {
        if (req.method === 'GET') {
          handleKvCatalog(req, res);
        } else {
          next();
        }
      });

      server.middlewares.use('/api/sync-kv', (req, res, next) => {
        if (req.method === 'POST') {
          handleKvSync(req, res);
        } else {
          next();
        }
      });

      server.middlewares.use('/api/validate-checkout', (req, res, next) => {
        if (req.method === 'POST') {
          handleKvValidateCheckout(req, res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), cloudflareKvDevPlugin()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    headers: {
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*',
    },
    cors: true,
    hmr: { overlay: true },
    watch: { usePolling: true, interval: 300 },
  },
});
