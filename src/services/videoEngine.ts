import { ClipColorGrading, ClipTransform, TimelineClip, TimelineTrack } from '../types/editor';

class VideoEngine {
  private videoPool: Map<string, HTMLVideoElement> = new Map();
  private imagePool: Map<string, HTMLImageElement> = new Map();

  /**
   * Get or create a video element for an asset URL
   */
  public getVideoElement(assetId: string, url: string): HTMLVideoElement {
    let video = this.videoPool.get(assetId);
    if (!video) {
      video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      video.muted = true; // avoid audio echo, WebAudio handles sound
      video.playsInline = true;
      this.videoPool.set(assetId, video);
    }
    return video;
  }

  /**
   * Get or create an image element for an asset URL
   */
  public getImageElement(assetId: string, url: string): HTMLImageElement {
    let img = this.imagePool.get(assetId);
    if (!img) {
      img = new Image();
      img.src = url;
      img.crossOrigin = 'anonymous';
      this.imagePool.set(assetId, img);
    }
    return img;
  }

  /**
   * Seek video element to target time
   */
  public seekVideo(video: HTMLVideoElement, targetTime: number): Promise<void> {
    return new Promise((resolve) => {
      if (Math.abs(video.currentTime - targetTime) < 0.03) {
        resolve();
        return;
      }
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked, { once: true });
      video.currentTime = Math.max(0, Math.min(video.duration || 9999, targetTime));
      // Fallback timeout in case seeked doesn't fire
      setTimeout(resolve, 80);
    });
  }

  /**
   * Build CSS filter string from ColorGrading properties
   */
  public buildFilterString(cg: ClipColorGrading): string {
    const filters: string[] = [];

    // Brightness: -100 to 100 -> 0% to 200% (default 100%)
    const brightnessVal = 100 + cg.brightness + (cg.exposure * 0.8);
    if (brightnessVal !== 100) filters.push(`brightness(${Math.max(0, brightnessVal)}%)`);

    // Contrast: -100 to 100 -> 0% to 200%
    const contrastVal = 100 + cg.contrast;
    if (contrastVal !== 100) filters.push(`contrast(${Math.max(0, contrastVal)}%)`);

    // Saturation: -100 to 100 -> 0% to 200%
    const satVal = 100 + cg.saturation;
    if (satVal !== 100) filters.push(`saturate(${Math.max(0, satVal)}%)`);

    // Grayscale: 0 to 100 -> 0% to 100%
    if (cg.grayscale > 0) filters.push(`grayscale(${cg.grayscale}%)`);

    // Sepia: 0 to 100 -> 0% to 100%
    if (cg.sepia > 0) filters.push(`sepia(${cg.sepia}%)`);

    // Blur: 0 to 50px
    if (cg.blur > 0) filters.push(`blur(${cg.blur}px)`);

    // Invert
    if (cg.invert) filters.push(`invert(100%)`);

    return filters.join(' ') || 'none';
  }

  /**
   * Pause all active video elements in the pool
   */
  public pauseAll() {
    this.videoPool.forEach((video) => {
      if (!video.paused) {
        try {
          video.pause();
        } catch {
          // ignore
        }
      }
    });
  }

  /**
   * Render composite frame onto canvas context
   */
  public renderComposite(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    time: number,
    tracks: TimelineTrack[],
    clips: TimelineClip[],
    mediaPoolMap: Map<string, { url: string; type: string }>,
    selectedClipId?: string,
    showGuides: boolean = false,
    isPlaying: boolean = false,
    playbackSpeed: number = 1.0
  ) {
    // 1. Clear background
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Track active video asset IDs to pause unused videos
    const activeVideoAssetIds = new Set<string>();

    // 2. Sort tracks (bottom to top for drawing layers)
    const sortedTracks = [...tracks].reverse();
    const trackMap = new Map(tracks.map((t) => [t.id, t]));

    for (const track of sortedTracks) {
      if (!track.isVisible) continue;

      // Find clips on this track active at current time
      const activeClips = clips.filter(
        (c) => c.trackId === track.id && time >= c.start && time < c.start + c.duration
      );

      for (const clip of activeClips) {
        if (clip.assetId) activeVideoAssetIds.add(clip.assetId);
        this.renderClip(ctx, canvasWidth, canvasHeight, time, clip, mediaPoolMap, isPlaying, playbackSpeed);
      }
    }

    // Pause any video in pool not currently active
    this.videoPool.forEach((video, assetId) => {
      if (!activeVideoAssetIds.has(assetId) && !video.paused) {
        try {
          video.pause();
        } catch {
          // ignore
        }
      }
    });

    // 3. Render Safe Area Guides if enabled
    if (showGuides) {
      this.renderGuides(ctx, canvasWidth, canvasHeight);
    }

    // 4. Render selection bounding box if a clip is selected and active
    if (selectedClipId) {
      const selectedClip = clips.find((c) => c.id === selectedClipId && time >= c.start && time < c.start + c.duration);
      if (selectedClip) {
        this.renderSelectionOutline(ctx, canvasWidth, canvasHeight, selectedClip);
      }
    }

    ctx.restore();
  }

  /**
   * Render an individual clip
   */
  private renderClip(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    time: number,
    clip: TimelineClip,
    mediaPoolMap: Map<string, { url: string; type: string }>,
    isPlaying: boolean = false,
    playbackSpeed: number = 1.0
  ) {
    const elapsed = time - clip.start;
    const remaining = clip.start + clip.duration - time;

    // Transition calculations
    let transitionAlpha = 1.0;
    let transitionOffsetX = 0;
    let transitionScale = 1.0;

    // In-transition
    if (clip.transitionIn && clip.transitionIn.type !== 'none' && clip.transitionIn.duration > 0) {
      if (elapsed < clip.transitionIn.duration) {
        const progress = elapsed / clip.transitionIn.duration;
        switch (clip.transitionIn.type) {
          case 'cross-dissolve':
          case 'fade-to-black':
            transitionAlpha = Math.max(0, Math.min(1, progress));
            break;
          case 'slide-left':
            transitionOffsetX = (1 - progress) * canvasW;
            break;
          case 'slide-right':
            transitionOffsetX = -(1 - progress) * canvasW;
            break;
          case 'zoom-in':
            transitionScale = 0.5 + progress * 0.5;
            transitionAlpha = progress;
            break;
        }
      }
    }

    // Out-transition
    if (clip.transitionOut && clip.transitionOut.type !== 'none' && clip.transitionOut.duration > 0) {
      if (remaining < clip.transitionOut.duration) {
        const progress = remaining / clip.transitionOut.duration;
        switch (clip.transitionOut.type) {
          case 'cross-dissolve':
          case 'fade-to-black':
            transitionAlpha = Math.min(transitionAlpha, Math.max(0, progress));
            break;
          case 'slide-left':
            transitionOffsetX = -(1 - progress) * canvasW;
            break;
          case 'slide-right':
            transitionOffsetX = (1 - progress) * canvasW;
            break;
          case 'zoom-in':
            transitionScale = Math.min(transitionScale, 1.0 + (1 - progress) * 0.4);
            transitionAlpha = Math.min(transitionAlpha, progress);
            break;
        }
      }
    }

    ctx.save();

    // Opacity
    ctx.globalAlpha = Math.max(0, Math.min(1, clip.transform.opacity * transitionAlpha));

    // Blend mode
    if (clip.transform.blendMode && clip.transform.blendMode !== 'normal') {
      ctx.globalCompositeOperation = clip.transform.blendMode as GlobalCompositeOperation;
    }

    // Translation & Transformation
    const centerX = canvasW / 2 + clip.transform.x + transitionOffsetX;
    const centerY = canvasH / 2 + clip.transform.y;

    ctx.translate(centerX, centerY);
    ctx.rotate((clip.transform.rotation * Math.PI) / 180);
    ctx.scale(
      (clip.transform.flipH ? -1 : 1) * clip.transform.scale * transitionScale,
      (clip.transform.flipV ? -1 : 1) * clip.transform.scale * transitionScale
    );

    // Apply CSS filters
    const filterStr = this.buildFilterString(clip.colorGrading);
    if (filterStr !== 'none') {
      ctx.filter = filterStr;
    }

    // RENDER MEDIA CONTENT
    if (clip.type === 'video' && clip.assetId) {
      const asset = mediaPoolMap.get(clip.assetId);
      if (asset) {
        const video = this.getVideoElement(clip.assetId, asset.url);
        const sourceTime = clip.trimStart + elapsed * clip.speed;

        if (isPlaying) {
          video.playbackRate = Math.max(0.1, clip.speed * playbackSpeed);
          if (video.paused) {
            video.currentTime = sourceTime;
            video.play().catch(() => {});
          } else if (Math.abs(video.currentTime - sourceTime) > 0.35) {
            video.currentTime = sourceTime;
          }
        } else {
          if (!video.paused) {
            try {
              video.pause();
            } catch {
              // ignore
            }
          }
          if (Math.abs(video.currentTime - sourceTime) > 0.02) {
            video.currentTime = sourceTime;
          }
        }

        const vW = video.videoWidth || canvasW;
        const vH = video.videoHeight || canvasH;
        // Aspect ratio fit
        const scaleFactor = Math.min(canvasW / vW, canvasH / vH);
        const drawW = vW * scaleFactor;
        const drawH = vH * scaleFactor;

        // Crop handling
        const cropT = (clip.transform.crop.top / 100) * drawH;
        const cropB = (clip.transform.crop.bottom / 100) * drawH;
        const cropL = (clip.transform.crop.left / 100) * drawW;
        const cropR = (clip.transform.crop.right / 100) * drawW;

        if (cropT > 0 || cropB > 0 || cropL > 0 || cropR > 0) {
          ctx.beginPath();
          ctx.rect(
            -drawW / 2 + cropL,
            -drawH / 2 + cropT,
            Math.max(1, drawW - cropL - cropR),
            Math.max(1, drawH - cropT - cropB)
          );
          ctx.clip();
        }

        ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
      }
    } else if (clip.type === 'image' && clip.assetId) {
      const asset = mediaPoolMap.get(clip.assetId);
      if (asset) {
        const img = this.getImageElement(clip.assetId, asset.url);
        const iW = img.naturalWidth || canvasW;
        const iH = img.naturalHeight || canvasH;
        const scaleFactor = Math.min(canvasW / iW, canvasH / iH);
        const drawW = iW * scaleFactor;
        const drawH = iH * scaleFactor;

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      }
    } else if (clip.type === 'text' && clip.text) {
      this.renderTextClip(ctx, clip.text, elapsed);
    }

    // Vignette overlay
    if (clip.colorGrading.vignette > 0) {
      const radius = Math.max(canvasW, canvasH) * 0.7;
      const vignetteGrad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGrad.addColorStop(1, `rgba(0,0,0,${clip.colorGrading.vignette / 100})`);
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(-canvasW / 2, -canvasH / 2, canvasW, canvasH);
    }

    ctx.restore();
  }

  /**
   * Render typography with animations, strokes, and background box
   */
  private renderTextClip(ctx: CanvasRenderingContext2D, text: NonNullable<TimelineClip['text']>, elapsed: number) {
    let content = text.content;

    // Typewriter animation
    if (text.animation === 'typewriter') {
      const charsPerSec = 14;
      const visibleChars = Math.floor(elapsed * charsPerSec);
      content = content.slice(0, visibleChars);
    }

    // Text slide up animation
    if (text.animation === 'slide-up') {
      const animProgress = Math.min(1, elapsed / 0.5);
      ctx.translate(0, (1 - animProgress) * 30);
    }

    // Text scale in animation
    if (text.animation === 'scale-in') {
      const animProgress = Math.min(1, elapsed / 0.4);
      ctx.scale(animProgress, animProgress);
    }

    ctx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily || 'sans-serif'}`;
    ctx.textAlign = text.align;
    ctx.textBaseline = 'middle';

    const lines = content.split('\n');
    const lineHeight = text.fontSize * text.lineHeight;
    const totalHeight = lines.length * lineHeight;
    const startY = -totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      const metrics = ctx.measureText(line);

      // Background Box
      if (text.backgroundBox) {
        ctx.save();
        ctx.fillStyle = text.backgroundColor || 'rgba(0, 0, 0, 0.7)';
        const padX = 14;
        const padY = 6;
        let boxX = -metrics.width / 2 - padX;
        if (text.align === 'left') boxX = -padX;
        if (text.align === 'right') boxX = -metrics.width - padX;

        ctx.fillRect(boxX, y - lineHeight / 2 + padY / 2, metrics.width + padX * 2, lineHeight - padY);
        ctx.restore();
      }

      // Shadow
      if (text.shadowBlur > 0) {
        ctx.shadowColor = text.shadowColor || 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = text.shadowBlur;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      // Stroke Outline
      if (text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor || '#000000';
        ctx.lineWidth = text.strokeWidth;
        ctx.strokeText(line, 0, y);
      }

      // Main Text Fill
      ctx.fillStyle = text.color || '#FFFFFF';
      ctx.fillText(line, 0, y);
    });
  }

  /**
   * Safe area guides (Action safe, Title safe, Rule of thirds)
   */
  private renderGuides(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([4, 4]);

    // Action Safe (90%)
    const asW = width * 0.9;
    const asH = height * 0.9;
    ctx.strokeRect((width - asW) / 2, (height - asH) / 2, asW, asH);

    // Title Safe (80%)
    const tsW = width * 0.8;
    const tsH = height * 0.8;
    ctx.strokeRect((width - tsW) / 2, (height - tsH) / 2, tsW, tsH);

    // Rule of Thirds
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo((2 * width) / 3, 0);
    ctx.lineTo((2 * width) / 3, height);
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, (2 * height) / 3);
    ctx.lineTo(width, (2 * height) / 3);
    ctx.stroke();

    // Center Cross
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    const crossSize = 12;
    ctx.beginPath();
    ctx.moveTo(width / 2 - crossSize, height / 2);
    ctx.lineTo(width / 2 + crossSize, height / 2);
    ctx.moveTo(width / 2, height / 2 - crossSize);
    ctx.lineTo(width / 2, height / 2 + crossSize);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render white dashed outline and corner handles for selected clip
   */
  private renderSelectionOutline(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    clip: TimelineClip
  ) {
    ctx.save();
    const centerX = canvasW / 2 + clip.transform.x;
    const centerY = canvasH / 2 + clip.transform.y;

    ctx.translate(centerX, centerY);
    ctx.rotate((clip.transform.rotation * Math.PI) / 180);
    ctx.scale(clip.transform.scale, clip.transform.scale);

    const boxW = canvasW * 0.7;
    const boxH = canvasH * 0.7;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

    // Corner Handles
    ctx.setLineDash([]);
    ctx.fillStyle = '#FFFFFF';
    const handleSize = 8;
    const corners = [
      [-boxW / 2, -boxH / 2],
      [boxW / 2, -boxH / 2],
      [boxW / 2, boxH / 2],
      [-boxW / 2, boxH / 2],
    ];

    corners.forEach(([hx, hy]) => {
      ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    });

    // Rotation Handle at Top
    ctx.beginPath();
    ctx.moveTo(0, -boxH / 2);
    ctx.lineTo(0, -boxH / 2 - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -boxH / 2 - 20, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export const videoEngine = new VideoEngine();
