import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Menu,
  Crop,
  Maximize2,
  ChevronDown,
  RotateCw,
  Sliders,
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
    aspectPreset,
    selectedClipIds,
    setPlayhead,
    setIsPlaying,
    togglePlayPause,
    setPlaybackSpeed,
    setPreviewQuality,
    setAspectPreset,
    toggleSafeAreaGuides,
    updateClipTransform,
    setVuMeter,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);
  const [isRotatingGizmo, setIsRotatingGizmo] = useState(false);
  const [isRatioMenuOpen, setIsRatioMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialClipX: number; initialClipY: number }>({
    startX: 0,
    startY: 0,
    initialClipX: 0,
    initialClipY: 0,
  });

  const rotateStartRef = useRef<{ startX: number; initialRotation: number }>({
    startX: 0,
    initialRotation: 0,
  });

  const mediaPoolMap = new Map(
    project.mediaPool.map((m) => [m.id, { url: m.url, type: m.type }])
  );

  const selectedClip = project.clips.find((c) => selectedClipIds.includes(c.id));

  const baseW = project.settings.width || 1920;
  const baseH = project.settings.height || 1080;
  const qualityFactor = previewQuality === 'full' ? 1 : previewQuality === 'half' ? 0.5 : 0.25;
  const renderW = Math.round(baseW * qualityFactor);
  const renderH = Math.round(baseH * qualityFactor);

  // Playback Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const renderLoop = (timestamp: number) => {
      const deltaSec = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        const nextTime = playhead + deltaSec * playbackSpeed;
        const maxDuration = Math.max(6.9, ...project.clips.map((c) => c.start + c.duration));

        if (nextTime >= maxDuration) {
          setPlayhead(maxDuration);
          setIsPlaying(false);
        } else {
          setPlayhead(nextTime);
        }

        const levels = audioEngine.getMeterLevels();
        setVuMeter(levels);
      }

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
            safeAreaGuides,
            isPlaying,
            playbackSpeed
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

  useEffect(() => {
    if (!isPlaying) {
      videoEngine.pauseAll();
    }
  }, [isPlaying]);

  // Handle Canvas Drag to Reposition Selected Clip
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedClip) return;
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

  // Rotate handle below preview
  const handleRotateMouseDown = (e: React.MouseEvent) => {
    if (!selectedClip) return;
    e.stopPropagation();
    setIsRotatingGizmo(true);
    rotateStartRef.current = {
      startX: e.clientX,
      initialRotation: selectedClip.transform.rotation,
    };

    const onMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - rotateStartRef.current.startX;
      const newRotation = (rotateStartRef.current.initialRotation + deltaX * 0.5) % 360;
      updateClipTransform(selectedClip.id, {
        rotation: parseFloat(newRotation.toFixed(2)),
      });
    };

    const onUp = () => {
      setIsRotatingGizmo(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatCapCutTimecode = (seconds: number, fps: number = 30) => {
    const s = Math.max(0, seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * fps);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  };

  const totalDuration = Math.max(6.9, ...project.clips.map((c) => c.start + c.duration));

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-[#111114] border-r border-[#232328] overflow-hidden select-none"
    >
      {/* CapCut Player Top Header: "Player" + Hamburger Menu */}
      <div className="h-8 bg-[#151518] border-b border-[#232328] px-3 flex items-center justify-between text-xs text-neutral-300">
        <span className="font-normal text-[12px] text-neutral-200">Player</span>
        <button
          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#222228] transition-colors cursor-pointer"
          title="Player Settings"
        >
          <Menu size={14} />
        </button>
      </div>

      {/* Center Cinematic Stage Viewport */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-3 bg-[#0c0c0e] overflow-hidden">
        <div
          className="relative max-w-full max-h-[88%] flex items-center justify-center shadow-2xl border border-[#202026] bg-black rounded-[2px]"
          style={{ aspectRatio: `${baseW} / ${baseH}` }}
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

        {/* Circular Rotate Handle below monitor (CapCut Desktop Signature Feature) */}
        {selectedClip && (
          <div
            onMouseDown={handleRotateMouseDown}
            className="mt-2.5 w-6 h-6 rounded-full bg-[#202028] hover:bg-[#2a2a34] border border-[#343440] flex items-center justify-center cursor-ew-resize transition-all shadow-md active:scale-95 text-neutral-300 hover:text-white"
            title="Drag horizontally to rotate clip"
          >
            <RotateCw size={12} className={isRotatingGizmo ? 'text-[#00e5ff]' : ''} />
          </div>
        )}
      </div>

      {/* CapCut Monitor Bottom Control Bar */}
      <div className="h-10 bg-[#151518] border-t border-[#232328] px-3 flex items-center justify-between text-xs text-neutral-300 relative">
        {/* Left: Timecode readout in exact CapCut format */}
        <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums select-none">
          <div className="flex items-center gap-1">
            <span className="text-[#00e5ff] font-semibold">
              {formatCapCutTimecode(playhead, project.settings.fps)}
            </span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">
              {formatCapCutTimecode(totalDuration, project.settings.fps)}
            </span>
          </div>

          {/* Multicam / Audio Track Icon */}
          <div className="flex items-center gap-0.5 text-neutral-500 pl-1" title="Audio Waveform / Track Monitoring">
            <div className="w-0.5 h-3 bg-neutral-600 rounded-full" />
            <div className="w-0.5 h-4 bg-[#00e5ff]/80 rounded-full" />
            <div className="w-0.5 h-2 bg-neutral-600 rounded-full" />
            <div className="w-0.5 h-3.5 bg-neutral-500 rounded-full" />
          </div>
        </div>

        {/* Center: Play / Pause Control */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <button
            onClick={togglePlayPause}
            className="w-7 h-7 flex items-center justify-center text-white hover:text-[#00e5ff] transition-colors cursor-pointer"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Full Quality + Crop + Ratio + Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Quality Button */}
          <div className="relative">
            <button
              onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
              className="px-1.5 py-0.5 rounded text-[10px] text-neutral-300 hover:text-white bg-[#1f1f25] border border-[#2d2d38] flex items-center gap-0.5 transition-colors cursor-pointer"
              title="Preview Resolution"
            >
              <span>{previewQuality === 'full' ? 'Full' : previewQuality === 'half' ? '1/2' : '1/4'}</span>
              <ChevronDown size={9} className="text-neutral-500" />
            </button>

            {isQualityMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsQualityMenuOpen(false)} />
                <div className="absolute right-0 bottom-full mb-1 w-24 bg-[#1c1c22] border border-[#2f2f3a] rounded shadow-xl py-1 z-50 text-[11px]">
                  <button
                    onClick={() => {
                      setPreviewQuality('full');
                      setIsQualityMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1 text-left hover:bg-[#282834] ${
                      previewQuality === 'full' ? 'text-[#00e5ff] font-medium' : 'text-neutral-300'
                    }`}
                  >
                    Full (1080p)
                  </button>
                  <button
                    onClick={() => {
                      setPreviewQuality('half');
                      setIsQualityMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1 text-left hover:bg-[#282834] ${
                      previewQuality === 'half' ? 'text-[#00e5ff] font-medium' : 'text-neutral-300'
                    }`}
                  >
                    1/2 (Draft)
                  </button>
                  <button
                    onClick={() => {
                      setPreviewQuality('quarter');
                      setIsQualityMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1 text-left hover:bg-[#282834] ${
                      previewQuality === 'quarter' ? 'text-[#00e5ff] font-medium' : 'text-neutral-300'
                    }`}
                  >
                    1/4 (Fast)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Crop Tool Icon */}
          <button
            onClick={() => {
              if (selectedClip) {
                // Focus crop
                useEditorStore.getState().setActiveInspectorTab('video');
              }
            }}
            className="p-1 hover:text-white text-neutral-400 hover:bg-[#222228] rounded transition-colors cursor-pointer"
            title="Crop & Transform"
          >
            <Crop size={13} />
          </button>

          {/* Ratio Selector Button */}
          <div className="relative">
            <button
              onClick={() => setIsRatioMenuOpen(!isRatioMenuOpen)}
              className="px-1.5 py-0.5 rounded text-[10px] text-neutral-300 hover:text-white bg-[#1f1f25] border border-[#2d2d38] flex items-center gap-0.5 transition-colors cursor-pointer"
              title="Aspect Ratio"
            >
              <span>Ratio</span>
              <ChevronDown size={9} className="text-neutral-500" />
            </button>

            {isRatioMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsRatioMenuOpen(false)} />
                <div className="absolute right-0 bottom-full mb-1 w-32 bg-[#1c1c22] border border-[#2f2f3a] rounded shadow-xl py-1 z-50 text-[11px]">
                  {[
                    { label: 'Original (16:9)', val: '16:9' as const },
                    { label: '9:16 (TikTok/Shorts)', val: '9:16' as const },
                    { label: '1:1 (Square)', val: '1:1' as const },
                    { label: '4:5 (Portrait)', val: '4:5' as const },
                    { label: '21:9 (Ultrawide)', val: '21:9' as const },
                  ].map((r) => (
                    <button
                      key={r.val}
                      onClick={() => {
                        setAspectPreset(r.val);
                        setIsRatioMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-1 text-left hover:bg-[#282834] ${
                        aspectPreset === r.val ? 'text-[#00e5ff] font-medium' : 'text-neutral-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:text-white text-neutral-400 hover:bg-[#222228] rounded transition-colors cursor-pointer"
            title="Fullscreen"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
