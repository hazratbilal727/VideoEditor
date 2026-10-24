import { TimelineClip, TimelineTrack } from '../types/editor';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private activeSources: {
    source: AudioBufferSourceNode;
    gain: GainNode;
    panner: StereoPannerNode;
  }[] = [];
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private meterDataArray: Uint8Array<ArrayBuffer> | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.meterDataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext {
    this.init();
    return this.ctx!;
  }

  /**
   * Load and decode an audio buffer from URL or Blob
   */
  public async loadAudio(id: string, url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(id)) {
      return this.bufferCache.get(id)!;
    }

    try {
      this.init();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
      this.bufferCache.set(id, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.warn(`Failed to decode audio for ${id}:`, e);
      return null;
    }
  }

  /**
   * Extract normalized waveform data (array of 0-1 values)
   */
  public async extractWaveform(url: string, samples: number = 80): Promise<number[]> {
    try {
      this.init();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j] || 0);
        }
        waveform.push(Math.min(1, (sum / blockSize) * 2.5));
      }
      return waveform;
    } catch (err) {
      console.warn('Waveform extraction failed:', err);
      // Fallback pseudo waveform
      return Array.from({ length: samples }, () => Math.random() * 0.4 + 0.2);
    }
  }

  /**
   * Start playback of all eligible clips at current playhead
   */
  public playClips(
    clips: TimelineClip[],
    tracks: TimelineTrack[],
    playhead: number,
    mediaPoolMap: Map<string, string> // assetId -> url
  ) {
    this.stop();
    this.init();

    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const masterGain = this.masterGain;

    // Determine solo tracks
    const hasSolo = tracks.some((t) => t.isSolo);
    const trackMap = new Map(tracks.map((t) => [t.id, t]));

    clips.forEach((clip) => {
      const track = trackMap.get(clip.trackId);
      if (!track || !track.isVisible) return;
      if (hasSolo && !track.isSolo) return;
      if (track.isMuted || clip.audio.muted) return;

      // Only clips that have audio (audio type or video with audio)
      if (clip.type !== 'audio' && clip.type !== 'video') return;
      if (!clip.assetId) return;

      const mediaUrl = mediaPoolMap.get(clip.assetId);
      if (!mediaUrl) return;

      const buffer = this.bufferCache.get(clip.assetId);
      if (!buffer) {
        // Asynchronously load it for next playback
        this.loadAudio(clip.assetId, mediaUrl);
        return;
      }

      // Check if clip is active at or after playhead
      const clipStart = clip.start;
      const clipEnd = clip.start + clip.duration;

      if (playhead >= clipEnd) return; // already passed

      let offsetInSource = clip.trimStart;
      let delayUntilStart = 0;

      if (playhead >= clipStart) {
        // playhead is inside clip
        const elapsedInClip = (playhead - clipStart) * clip.speed;
        offsetInSource = clip.trimStart + elapsedInClip;
        delayUntilStart = 0;
      } else {
        // clip starts in future
        delayUntilStart = clipStart - playhead;
        offsetInSource = clip.trimStart;
      }

      // Remaining duration to play
      const remainingDuration = (clipEnd - Math.max(playhead, clipStart)) / clip.speed;
      if (remainingDuration <= 0) return;

      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = clip.speed;

        // Gain node
        const gain = ctx.createGain();
        const baseVolume = clip.audio.volume;
        gain.gain.setValueAtTime(baseVolume, ctx.currentTime + delayUntilStart);

        // Fade in
        if (clip.audio.fadeIn > 0 && delayUntilStart === 0 && playhead === clipStart) {
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(baseVolume, ctx.currentTime + clip.audio.fadeIn);
        }

        // Stereo Panner
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, clip.audio.pan));

        source.connect(gain);
        gain.connect(panner);
        panner.connect(masterGain);

        const startTime = ctx.currentTime + delayUntilStart;
        source.start(startTime, offsetInSource, remainingDuration);

        this.activeSources.push({ source, gain, panner });
      } catch (err) {
        console.warn('Error starting audio clip:', err);
      }
    });
  }

  /**
   * Stop all active playing audio nodes
   */
  public stop() {
    this.activeSources.forEach(({ source }) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore already stopped
      }
    });
    this.activeSources = [];
  }

  /**
   * Get real-time audio levels for VU meter (0 to 1)
   */
  public getMeterLevels(): { left: number; right: number } {
    if (!this.analyser || !this.meterDataArray) {
      return { left: 0, right: 0 };
    }
    this.analyser.getByteFrequencyData(this.meterDataArray);
    let sum = 0;
    for (let i = 0; i < this.meterDataArray.length; i++) {
      sum += this.meterDataArray[i];
    }
    const avg = sum / (this.meterDataArray.length * 255);
    return {
      left: Math.min(1, avg * 1.5),
      right: Math.min(1, avg * 1.4),
    };
  }
}

export const audioEngine = new AudioEngine();
