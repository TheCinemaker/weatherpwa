import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
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
