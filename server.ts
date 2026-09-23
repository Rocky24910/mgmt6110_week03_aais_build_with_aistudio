import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import environmentHandler from './api/environment.js';
import healthHandler from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production' && process.env.npm_lifecycle_event !== 'start';
  const distPath = path.resolve(__dirname, 'dist');

  app.use(express.json());

  // API endpoints
  app.all('/api/environment', (req, res) => environmentHandler(req, res));
  app.all('/api/health', (req, res) => healthHandler(req, res));

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (req, res) => {
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('Application is building. Please refresh in a moment.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (${isDev ? 'dev' : 'prod'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
