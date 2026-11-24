import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helyi fejlesztői middleware kizárólag a /api/snow-forecast végponthoz, hogy
// localhoston is a helyi Netlify Function fusson (minden más /api/* az éles proxyra megy továbbra is).
function snowForecastDevPlugin() {
  return {
    name: 'snow-forecast-dev-endpoint',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || (!req.url.startsWith('/api/snow-forecast') && req.url !== '/api/snow-forecast')) {
          return next();
        }
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const queryStringParameters = Object.fromEntries(urlObj.searchParams.entries());
          const { handler } = await import('./netlify/functions/snow-forecast.js');
          const result = await handler({ queryStringParameters, httpMethod: req.method });
          res.statusCode = result.statusCode || 200;
          if (result.headers) {
            for (const [k, v] of Object.entries(result.headers)) {
              res.setHeader(k, v);
            }
          }
          res.end(result.body);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: err?.message || 'Dev snow-forecast hiba' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), snowForecastDevPlugin()],
  server: {
    port: 3001,
    strictPort: true,
    host: true,
    proxy: {
      // /api/* csak Netlify-n létezik (serverless function + redirect), sima
      // vite dev szerver alatt 404-et adna — itt az éles oldalra irányítjuk,
      // hogy localhoston is valódi időjárás-adatot lássunk.
      '/api': {
        target: 'https://kiemet.hu',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'fuse.js': path.resolve(__dirname, 'node_modules/fuse.js/dist/fuse.mjs')
    }
  }
});
