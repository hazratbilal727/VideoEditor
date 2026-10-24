import { ExportSettings, ProjectSettings, TimelineClip, TimelineTrack } from '../types/editor';
import { videoEngine } from './videoEngine';

export interface ExportProgress {
  status: 'idle' | 'rendering' | 'encoding' | 'completed' | 'cancelled' | 'error';
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  currentTime: number;
  totalDuration: number;
  estimatedRemainingSec: number;
  error?: string;
  downloadUrl?: string;
}

class ExportEngine {
  private abortController: AbortController | null = null;

  public cancelExport() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Export single frame as PNG or JPG
   */
  public async exportCurrentFrame(
    canvas: HTMLCanvasElement,
    filename: string = 'snapshot.png',
    format: 'image/png' | 'image/jpeg' = 'image/png'
  ) {
    const dataUrl = canvas.toDataURL(format, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Export Audio-only WAV file of entire timeline
   */
  public async exportAudioTrack(
    projectSettings: ProjectSettings,
    tracks: TimelineTrack[],
    clips: TimelineClip[],
    mediaPoolMap: Map<string, string>, // assetId -> url
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob | null> {
    const totalDuration = Math.max(1, Math.max(...clips.map((c) => c.start + c.duration), 5));
    const sampleRate = projectSettings.sampleRate || 44100;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    onProgress({
      status: 'rendering',
      progress: 20,
      currentFrame: 0,
      totalFrames: 100,
      currentTime: 0,
      totalDuration,
      estimatedRemainingSec: 2,
    });

    const activeTracks = new Map(tracks.map((t) => [t.id, t]));
    const hasSolo = tracks.some((t) => t.isSolo);

    for (const clip of clips) {
      const track = activeTracks.get(clip.trackId);
      if (!track || !track.isVisible) continue;
      if (hasSolo && !track.isSolo) return null;
      if (track.isMuted || clip.audio.muted) continue;
      if (clip.type !== 'audio' && clip.type !== 'video') continue;
      if (!clip.assetId) continue;

      const mediaUrl = mediaPoolMap.get(clip.assetId);
      if (!mediaUrl) continue;

      try {
        const res = await fetch(mediaUrl);
        const arrayBuf = await res.arrayBuffer();
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuf);

        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = clip.speed;

        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(clip.audio.volume, clip.start);

        const panner = offlineCtx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, clip.audio.pan));

        source.connect(gain);
        gain.connect(panner);
        panner.connect(offlineCtx.destination);

        source.start(clip.start, clip.trimStart, clip.duration / clip.speed);
      } catch (e) {
        console.warn('Error loading audio clip for export:', e);
      }
    }

    onProgress({
      status: 'encoding',
      progress: 70,
      currentFrame: 70,
      totalFrames: 100,
      currentTime: totalDuration * 0.7,
      totalDuration,
      estimatedRemainingSec: 1,
    });

    const rendered = await offlineCtx.startRendering();

    // Convert AudioBuffer to WAV blob
    const wavBlob = this.audioBufferToWav(rendered);
    const downloadUrl = URL.createObjectURL(wavBlob);

    onProgress({
      status: 'completed',
      progress: 100,
      currentFrame: 100,
      totalFrames: 100,
      currentTime: totalDuration,
      totalDuration,
      estimatedRemainingSec: 0,
      downloadUrl,
    });

    return wavBlob;
  }

  /**
   * Render and export video with accurate frame-by-frame rendering and audio sync
   */
  public async exportVideo(
    settings: ExportSettings,
    projectSettings: ProjectSettings,
    tracks: TimelineTrack[],
    clips: TimelineClip[],
    mediaPoolMap: Map<string, { url: string; type: string }>,
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob | null> {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const exportW = settings.resolution.width;
    const exportH = settings.resolution.height;
    const fps = settings.fps;
    const totalDuration = Math.max(1, Math.max(...clips.map((c) => c.start + c.duration), 1));
    const totalFrames = Math.ceil(totalDuration * fps);

    // Create render canvas
    const canvas = document.createElement('canvas');
    canvas.width = exportW;
    canvas.height = exportH;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Audio context for export
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();

    // Preload & decode audio sources
    const clipAudioNodes: {
      clip: TimelineClip;
      buffer: AudioBuffer;
    }[] = [];

    for (const clip of clips) {
      if ((clip.type === 'audio' || clip.type === 'video') && clip.assetId) {
        const asset = mediaPoolMap.get(clip.assetId);
        if (asset) {
          try {
            const resp = await fetch(asset.url);
            const ab = await resp.arrayBuffer();
            const decoded = await audioCtx.decodeAudioData(ab);
            clipAudioNodes.push({ clip, buffer: decoded });
          } catch (e) {
            console.warn('Could not decode audio track for clip:', clip.name, e);
          }
        }
      }
    }

    // Capture combined stream
    const canvasStream = canvas.captureStream(fps);
    const combinedTracks = [
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ];
    const combinedStream = new MediaStream(combinedTracks);

    // Choose supported MIME type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: settings.bitrateKbps * 1000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    const completionPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        resolve(finalBlob);
      };
      mediaRecorder.onerror = (err) => reject(err);
    });

    mediaRecorder.start(100);

    const startTimeStamp = performance.now();
    const frameInterval = 1 / fps;

    try {
      for (let frame = 0; frame < totalFrames; frame++) {
        if (signal.aborted) {
          mediaRecorder.stop();
          onProgress({
            status: 'cancelled',
            progress: 0,
            currentFrame: frame,
            totalFrames,
            currentTime: frame * frameInterval,
            totalDuration,
            estimatedRemainingSec: 0,
          });
          return null;
        }

        const currentTime = frame * frameInterval;

        // Render composite frame
        videoEngine.renderComposite(
          ctx,
          exportW,
          exportH,
          currentTime,
          tracks,
          clips,
          mediaPoolMap,
          undefined, // no selection outline on export
          false // no safe guides on export
        );

        // Calculate progress stats
        const progress = Math.min(99, Math.round((frame / totalFrames) * 100));
        const elapsedRealSec = (performance.now() - startTimeStamp) / 1000;
        const fpsReal = (frame + 1) / Math.max(0.01, elapsedRealSec);
        const remainingFrames = totalFrames - frame;
        const estRemaining = Math.max(0, Math.round(remainingFrames / Math.max(1, fpsReal)));

        if (frame % 5 === 0 || frame === totalFrames - 1) {
          onProgress({
            status: 'rendering',
            progress,
            currentFrame: frame,
            totalFrames,
            currentTime,
            totalDuration,
            estimatedRemainingSec: estRemaining,
          });
        }

        // Delay to allow canvas stream capture
        await new Promise((r) => setTimeout(r, Math.max(4, Math.floor(1000 / fps * 0.4))));
      }

      // Finish recording
      onProgress({
        status: 'encoding',
        progress: 99,
        currentFrame: totalFrames,
        totalFrames,
        currentTime: totalDuration,
        totalDuration,
        estimatedRemainingSec: 1,
      });

      mediaRecorder.stop();
      const outputBlob = await completionPromise;
      const downloadUrl = URL.createObjectURL(outputBlob);

      onProgress({
        status: 'completed',
        progress: 100,
        currentFrame: totalFrames,
        totalFrames,
        currentTime: totalDuration,
        totalDuration,
        estimatedRemainingSec: 0,
        downloadUrl,
      });

      audioCtx.close();
      return outputBlob;
    } catch (err: unknown) {
      console.error('Export error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Export rendering failed';
      onProgress({
        status: 'error',
        progress: 0,
        currentFrame: 0,
        totalFrames,
        currentTime: 0,
        totalDuration,
        estimatedRemainingSec: 0,
        error: errorMessage,
      });
      return null;
    }
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels: Float32Array[] = [];
    const sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][pos]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(44 + offset, sample, true);
        offset += 2;
      }
      pos++;
    }

    return new Blob([outBuffer], { type: 'audio/wav' });
  }
}

export const exportEngine = new ExportEngine();
