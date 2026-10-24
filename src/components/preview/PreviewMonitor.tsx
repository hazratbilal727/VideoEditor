import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Volume2,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { videoEngine } from '../../services/videoEngine';
import { audioEngine } from '../../services/audioEngine';

export const PreviewMonitor: React.FC = () => {
  const {
    project,
    playhead,
    isPlaying,
    playbackSpeed,
    previewQuality,
    safeAreaGuides,
    selectedClipIds,
    setPlayhead,
    setIsPlaying,
    togglePlayPause,
    stepFrame,
    jumpToStart,
    jumpToEnd,
    setPlaybackSpeed,
    setPreviewQuality,
    updateClipTransform,
    setVuMeter,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialClipX: number; initialClipY: number }>({
    startX: 0,
    startY: 0,
    initialClipX: 0,
    initialClipY: 0,
  });

  const [meterL, setMeterL] = useState(0);
  const [meterR, setMeterR] = useState(0);

  // Map of media assets for rapid engine access
  const mediaPoolMap = new Map(
    project.mediaPool.map((m) => [m.id, { url: m.url, type: m.type }])
  );

  const selectedClip = project.clips.find((c) => selectedClipIds.includes(c.id));

  // Determine canvas internal resolution based on preview quality
  const baseW = project.settings.width || 1920;
  const baseH = project.settings.height || 1080;
  const qualityFactor = previewQuality === 'full' ? 1 : previewQuality === 'half' ? 0.5 : 0.25;
  const renderW = Math.round(baseW * qualityFactor);
  const renderH = Math.round(baseH * qualityFactor);

  // Animation frame loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const renderLoop = (timestamp: number) => {
      const deltaSec = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        const nextTime = playhead + deltaSec * playbackSpeed;
        const maxDuration = Math.max(5, ...project.clips.map((c) => c.start + c.duration));

        if (nextTime >= maxDuration) {
          setPlayhead(maxDuration);
          setIsPlaying(false);
        } else {
          setPlayhead(nextTime);
        }

        // VU meter update
        const levels = audioEngine.getMeterLevels();
        setMeterL(levels.left);
        setMeterR(levels.right);
        setVuMeter(levels);
      } else {
        setMeterL((prev) => Math.max(0, prev * 0.85));
        setMeterR((prev) => Math.max(0, prev * 0.85));
      }

      // Draw canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          videoEngine.renderComposite(
            ctx,
            renderW,
            renderH,
            playhead,
            project.tracks,
            project.clips,
            mediaPoolMap,
            selectedClipIds[0],
            safeAreaGuides
          );
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isPlaying,
    playhead,
    playbackSpeed,
    project.clips,
    project.tracks,
    renderW,
    renderH,
    safeAreaGuides,
    selectedClipIds,
  ]);

  // Handle Canvas Drag to Reposition Selected Clip
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedClip) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDraggingGizmo(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialClipX: selectedClip.transform.x,
      initialClipY: selectedClip.transform.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingGizmo || !selectedClip || !canvasRef.current) return;

    // Convert screen px delta into video coordinate delta
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleRatio = baseW / rect.width;
    const deltaX = (e.clientX - dragStartRef.current.startX) * scaleRatio;
    const deltaY = (e.clientY - dragStartRef.current.startY) * scaleRatio;

    updateClipTransform(selectedClip.id, {
      x: Math.round(dragStartRef.current.initialClipX + deltaX),
      y: Math.round(dragStartRef.current.initialClipY + deltaY),
    });
  };

  const handleMouseUp = () => {
    setIsDraggingGizmo(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Format Timecode: HH:MM:SS:FF
  const formatTimecode = (seconds: number, fps: number = 30) => {
    const s = Math.max(0, seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * fps);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  };

  const totalDuration = Math.max(5, ...project.clips.map((c) => c.start + c.duration));

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-[#0a0a0a] border-b border-[#242424] overflow-hidden select-none"
    >
      {/* Top Monitor Info Strip */}
      <div className="h-7 bg-[#111111] border-b border-[#1f1f1f] px-3 flex items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-neutral-300">PREVIEW MONITOR</span>
          <span className="text-neutral-600">•</span>
          <span className="font-mono text-[10px] text-neutral-500">
            {baseW}×{baseH} ({project.settings.fps}fps)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Preview Quality Selector */}
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-neutral-500">Quality:</span>
            <select
              value={previewQuality}
              onChange={(e) => setPreviewQuality(e.target.value as unknown as typeof previewQuality)}
              className="bg-[#171717] border border-[#2b2b2b] text-neutral-300 px-1 py-0.5 rounded text-[10px] focus:outline-none"
            >
              <option value="full">Full (100%)</option>
              <option value="half">Half (50%)</option>
              <option value="quarter">Quarter (25%)</option>
            </select>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:text-white text-neutral-400 hover:bg-[#1f1f1f] rounded"
            title="Toggle Fullscreen"
          >
            <Maximize size={12} />
          </button>
        </div>
      </div>

      {/* Center Viewport Stage */}
      <div className="flex-1 relative flex items-center justify-center p-3 bg-[#080808] overflow-hidden">
        <div
          className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl border border-[#202020] bg-black"
          style={{
            aspectRatio: `${baseW} / ${baseH}`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={renderW}
            height={renderH}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`max-w-full max-h-full object-contain ${
              selectedClip ? (isDraggingGizmo ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
          />
        </div>
      </div>

      {/* Transport Control Bar */}
      <div className="h-10 bg-[#121212] border-t border-[#1f1f1f] px-3 flex items-center justify-between text-xs text-neutral-300">
        {/* Left: Timecode + Total Duration */}
        <div className="flex items-center gap-2">
          <div className="bg-[#181818] border border-[#292929] px-2 py-0.5 rounded font-mono text-[12px] text-white tracking-wider tabular-nums shadow-inner">
            {formatTimecode(playhead, project.settings.fps)}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            / {formatTimecode(totalDuration, project.settings.fps)}
          </span>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={jumpToStart}
            className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
            title="Jump to Start (Home)"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={() => stepFrame(-1)}
            className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
            title="Previous Frame (Left Arrow)"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-colors shadow"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" className="ml-0.5" />}
          </button>
          <button
            onClick={() => stepFrame(1)}
            className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
            title="Next Frame (Right Arrow)"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={jumpToEnd}
            className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
            title="Jump to End (End)"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Right: Playback Speed + VU Meter */}
        <div className="flex items-center gap-3">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
            <span>Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-[#181818] border border-[#2b2b2b] text-neutral-200 px-1 py-0.5 rounded text-[10px] focus:outline-none"
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>

          {/* Master Audio Stereo VU Meters */}
          <div className="flex items-center gap-1 text-neutral-500" title="Master Audio Meter">
            <Volume2 size={13} className="text-neutral-400" />
            <div className="flex flex-col gap-0.5 w-16">
              {/* L Channel */}
              <div className="h-1 bg-[#222222] rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{ width: `${Math.round(meterL * 100)}%` }}
                />
              </div>
              {/* R Channel */}
              <div className="h-1 bg-[#222222] rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-300 transition-all duration-75"
                  style={{ width: `${Math.round(meterR * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
