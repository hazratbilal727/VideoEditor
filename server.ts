import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // API Status & System Inspection
  app.get('/api/status', async (_req: Request, res: Response) => {
    let ffmpegAvailable = false;
    let ffprobeAvailable = false;

    try {
      await execAsync('ffmpeg -version');
      ffmpegAvailable = true;
    } catch {
      ffmpegAvailable = false;
    }

    try {
      await execAsync('ffprobe -version');
      ffprobeAvailable = true;
    } catch {
      ffprobeAvailable = false;
    }

    res.json({
      status: 'online',
      mode: 'offline-desktop',
      ffmpeg: ffmpegAvailable,
      ffprobe: ffprobeAvailable,
      timestamp: Date.now(),
    });
  });

  // Fast FFprobe media inspection endpoint
  app.post('/api/probe', async (req: Request, res: Response) => {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath.replace(/"/g, '\\"')}"`
      );
      const parsed = JSON.parse(stdout);
      res.json(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'FFprobe inspection failed';
      res.status(500).json({ error: message });
    }
  });

  // Development vs Production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`MONO EDITOR running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
});
