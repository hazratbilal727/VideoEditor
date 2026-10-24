import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import os from 'os';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(os.tmpdir(), 'mono_editor');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Raw body parser for binary video export stream up to 1GB
  app.use(
    '/api/export-ffmpeg',
    express.raw({
      type: '*/*',
      limit: '1000mb',
    })
  );

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // API Status & FFmpeg verification
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

  // Fast FFprobe media inspection
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

  // Real FFmpeg Video Export & Transcoding endpoint
  app.post('/api/export-ffmpeg', async (req: Request, res: Response) => {
    const filenameParam = (req.query.filename as string) || 'mono_video_export';
    const cleanFilename = filenameParam.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFormat = (req.query.format as string) || 'mp4';
    const crf = (req.query.crf as string) || '19';
    const fps = (req.query.fps as string) || '30';

    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'No video stream buffer received' });
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inputPath = path.join(TEMP_DIR, `input_${uniqueId}.webm`);
    const outputPath = path.join(TEMP_DIR, `output_${uniqueId}.${targetFormat === 'wav' ? 'wav' : 'mp4'}`);

    try {
      // 1. Write incoming stream to temp file
      fs.writeFileSync(inputPath, req.body as Buffer);

      // 2. Transcode using real system FFmpeg
      let ffmpegCmd = '';
      if (targetFormat === 'wav') {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vn -c:a pcm_s16le -ar 44100 "${outputPath}"`;
      } else {
        // High quality H.264 MP4 with AAC audio and faststart for instant streaming/playback
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -r ${fps} -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -preset veryfast -crf ${crf} -c:a aac -b:a 192k -ar 44100 -movflags +faststart "${outputPath}"`;
      }

      await execAsync(ffmpegCmd);

      if (!fs.existsSync(outputPath)) {
        throw new Error('Transcoded file was not created by FFmpeg');
      }

      const stat = fs.statSync(outputPath);
      res.setHeader('Content-Type', targetFormat === 'wav' ? 'audio/wav' : 'video/mp4');
      res.setHeader('Content-Length', stat.size);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${cleanFilename}.${targetFormat === 'wav' ? 'wav' : 'mp4'}"`
      );

      const stream = fs.createReadStream(outputPath);
      stream.pipe(res);

      stream.on('finish', () => {
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch {
          // cleanup ignore
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'FFmpeg export failed';
      console.error('FFmpeg export error:', message);
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch {
        // cleanup ignore
      }
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
