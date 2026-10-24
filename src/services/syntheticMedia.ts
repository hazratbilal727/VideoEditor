import { MediaAsset } from '../types/editor';

/**
 * Creates audio WAV blobs using Web Audio API offline rendering
 */
function createWavBlobFromAudioBuffer(audioBuffer: AudioBuffer): Blob {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sampleRate = audioBuffer.sampleRate;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  while (pos < audioBuffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

/**
 * Generates synthetic audio tracks
 */
export async function generateSyntheticAudio(
  type: 'beat' | 'riser' | 'tone',
  durationSec: number = 5
): Promise<{ blob: Blob; url: string; waveform: number[] }> {
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  if (type === 'tone') {
    const osc = offlineCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, 0); // 1 kHz test tone
    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.2, 0);
    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(0);
    osc.stop(durationSec);
  } else if (type === 'beat') {
    // Generate a punchy 120bpm drum loop
    const bpm = 120;
    const beatInterval = 60 / bpm;
    const totalBeats = Math.floor(durationSec / beatInterval);

    for (let i = 0; i < totalBeats; i++) {
      const time = i * beatInterval;
      // Kick drum on beats 0, 2
      if (i % 2 === 0) {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(time);
        osc.stop(time + 0.25);
      }
      // Snare / Rimshot on beats 1, 3
      if (i % 2 === 1) {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
      }
      // Hi-hat on every eighth note
      const oscH = offlineCtx.createOscillator();
      const gainH = offlineCtx.createGain();
      oscH.type = 'square';
      oscH.frequency.setValueAtTime(8000, time);
      gainH.gain.setValueAtTime(0.08, time);
      gainH.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      oscH.connect(gainH);
      gainH.connect(offlineCtx.destination);
      oscH.start(time);
      oscH.stop(time + 0.05);
    }
  } else {
    // Cinematic Sub Riser
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, 0);
    osc.frequency.exponentialRampToValueAtTime(320, durationSec * 0.9);
    gain.gain.setValueAtTime(0.1, 0);
    gain.gain.linearRampToValueAtTime(0.6, durationSec * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.001, durationSec);

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, 0);
    filter.frequency.exponentialRampToValueAtTime(2500, durationSec * 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(0);
    osc.stop(durationSec);
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = createWavBlobFromAudioBuffer(renderedBuffer);
  const url = URL.createObjectURL(wavBlob);

  // Extract 100 peak points for waveform visualization
  const channelData = renderedBuffer.getChannelData(0);
  const samples = 100;
  const blockSize = Math.floor(channelData.length / samples);
  const waveform: number[] = [];
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[i * blockSize + j]);
    }
    waveform.push(Math.min(1, (sum / blockSize) * 2.5));
  }

  return { blob: wavBlob, url, waveform };
}

/**
 * Generates an animated video clip via Offscreen Canvas and MediaRecorder
 */
export async function generateSyntheticVideo(
  type: 'countdown' | 'wireframe' | 'smpte',
  durationSec: number = 5
): Promise<{ blob: Blob; url: string; thumbnailUrl: string }> {
  const width = 1280;
  const height = 720;
  const fps = 30;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Stream recording setup
  const stream = canvas.captureStream(fps);
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 3000000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  mediaRecorder.start();

  let firstFrameThumbnail = '';
  const totalFrames = durationSec * fps;

  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / fps;

    // Clear background
    ctx.fillStyle = '#090909';
    ctx.fillRect(0, 0, width, height);

    if (type === 'countdown') {
      // Classic Film Leader Countdown 5..4..3..2..1
      const count = Math.max(1, 5 - Math.floor(t));
      const sweepAngle = ((t % 1) * Math.PI * 2) - Math.PI / 2;

      // Outer target rings
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 220, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#555555';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 170, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 260, height / 2);
      ctx.lineTo(width / 2 + 260, height / 2);
      ctx.moveTo(width / 2, height / 2 - 260);
      ctx.lineTo(width / 2, height / 2 + 260);
      ctx.stroke();

      // Radial sweep wedge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.arc(width / 2, height / 2, 170, -Math.PI / 2, sweepAngle);
      ctx.closePath();
      ctx.fill();

      // Number in center
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count.toString(), width / 2, height / 2);

      // Top label
      ctx.font = '600 20px monospace';
      ctx.fillStyle = '#888888';
      ctx.fillText('MONO FILM LEADER // 30 FPS', width / 2, 90);
    } else if (type === 'wireframe') {
      // 3D Isometric Wireframe Cube
      const rotX = t * 0.8;
      const rotY = t * 1.2;
      const size = 130;

      // 8 Vertices of cube
      const points = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ];

      // Projected points
      const projected = points.map(([px, py, pz]) => {
        // Rotate Y
        let x1 = px * Math.cos(rotY) - pz * Math.sin(rotY);
        let z1 = px * Math.sin(rotY) + pz * Math.cos(rotY);
        // Rotate X
        let y2 = py * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = py * Math.sin(rotX) + z1 * Math.cos(rotX);

        const zoom = 500 / (z2 + 3.5);
        return {
          x: width / 2 + x1 * size * zoom * 0.003,
          y: height / 2 + y2 * size * zoom * 0.003,
        };
      });

      // Edges
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      // Grid background
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#EEEEEE';
      ctx.lineWidth = 3;
      edges.forEach(([p1, p2]) => {
        ctx.beginPath();
        ctx.moveTo(projected[p1].x, projected[p1].y);
        ctx.lineTo(projected[p2].x, projected[p2].y);
        ctx.stroke();
      });

      ctx.fillStyle = '#AAAAAA';
      ctx.font = '500 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`GEOMETRIC ROTATION // T: ${t.toFixed(2)}s`, width / 2, height - 70);
    } else {
      // Monochrome SMPTE test pattern with 8 greyscale bars and ramp
      const bars = ['#FFFFFF', '#DDDDDD', '#BBBBBB', '#888888', '#555555', '#333333', '#1C1C1C', '#000000'];
      const barWidth = width / bars.length;
      bars.forEach((color, idx) => {
        ctx.fillStyle = color;
        ctx.fillRect(idx * barWidth, 0, barWidth, height * 0.7);
      });

      // Continuous gradient bar below
      const grad = ctx.createLinearGradient(0, height * 0.7, width, height * 0.7);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.5, '#777777');
      grad.addColorStop(1, '#FFFFFF');
      ctx.fillStyle = grad;
      ctx.fillRect(0, height * 0.7, width, height * 0.15);

      // Bottom info bar
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, height * 0.85, width, height * 0.15);
      ctx.fillStyle = '#EEEEEE';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MONO EDITOR // SMPTE MONOCHROME STANDARD 1080p', width / 2, height * 0.93);
    }

    if (frame === 15) {
      firstFrameThumbnail = canvas.toDataURL('image/jpeg', 0.8);
    }

    // Wait for frame capture interval (simulate realtime generation)
    await new Promise((r) => setTimeout(r, 8));
  }

  mediaRecorder.stop();
  const videoBlob = await recordingPromise;
  const url = URL.createObjectURL(videoBlob);

  if (!firstFrameThumbnail) {
    firstFrameThumbnail = canvas.toDataURL('image/jpeg', 0.8);
  }

  return { blob: videoBlob, url, thumbnailUrl: firstFrameThumbnail };
}

/**
 * Creates default sample media assets for fresh project
 */
export async function createDefaultSampleAssets(): Promise<MediaAsset[]> {
  try {
    const [countdown, wireframe, tone, beat] = await Promise.all([
      generateSyntheticVideo('countdown', 5),
      generateSyntheticVideo('wireframe', 6),
      generateSyntheticAudio('tone', 4),
      generateSyntheticAudio('beat', 6),
    ]);

    const assets: MediaAsset[] = [
      {
        id: 'asset_fashion_models',
        name: 'Fashion show of models. Two beautiful models of Slavic appearance. Two be...',
        type: 'video',
        url: '/fashion_models.mp4',
        duration: 6.9,
        width: 1280,
        height: 720,
        fps: 30,
        thumbnailUrl: '/fashion_models.jpg',
        dateAdded: Date.now(),
      },
      {
        id: 'asset_countdown',
        name: 'Film_Leader_Countdown.webm',
        type: 'video',
        url: countdown.url,
        blob: countdown.blob,
        duration: 5,
        width: 1280,
        height: 720,
        fps: 30,
        thumbnailUrl: countdown.thumbnailUrl,
        dateAdded: Date.now() + 1,
      },
      {
        id: 'asset_drum_beat',
        name: 'Minimal_Studio_Beat_120BPM.wav',
        type: 'audio',
        url: beat.url,
        blob: beat.blob,
        duration: 6,
        sampleRate: 44100,
        channels: 2,
        waveformData: beat.waveform,
        dateAdded: Date.now() + 2,
      },
      {
        id: 'asset_test_tone',
        name: 'Calibration_Tone_1kHz.wav',
        type: 'audio',
        url: tone.url,
        blob: tone.blob,
        duration: 4,
        sampleRate: 44100,
        channels: 2,
        waveformData: tone.waveform,
        dateAdded: Date.now() + 3,
      },
    ];

    return assets;
  } catch (err) {
    console.error('Failed to create default sample assets:', err);
    return [];
  }
}
