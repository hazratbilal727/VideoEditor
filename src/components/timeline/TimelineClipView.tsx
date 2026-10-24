import React, { useRef, useState, useEffect } from 'react';
import {
  Video,
  Music,
  Type,
  Shuffle,
  Scissors,
  Copy,
  Trash2,
  Gauge,
  Volume2,
  RotateCcw,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';

interface Props {
  clip: TimelineClip;
  trackHeight: number;
}

export const TimelineClipView: React.FC<Props> = ({ clip, trackHeight }) => {
  const {
    zoom,
    selectedClipIds,
    activeTool,
    selectClip,
    moveClip,
    trimClip,
    splitClipAtPlayhead,
    duplicateSelectedClips,
    deleteSelectedClips,
    setActiveInspectorTab,
    updateClipTransform,
    addClip,
    project,
  } = useEditorStore();

  const isSelected = selectedClipIds.includes(clip.id);
  const clipRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isTrimmingLeft, setIsTrimmingLeft] = useState(false);
  const [isTrimmingRight, setIsTrimmingRight] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const startDragInfoRef = useRef({
    initialMouseX: 0,
    initialStart: 0,
    initialDuration: 0,
    initialTrimStart: 0,
  });

  const asset = project.mediaPool.find((m) => m.id === clip.assetId);

  // Close context menu on outside click
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClose);
      return () => window.removeEventListener('click', handleClose);
    }
  }, [contextMenu]);

  // Context Menu handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectClip(clip.id, false);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Dragging to Move Clip
  const handleBodyMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (activeTool === 'split') {
      const rect = clipRef.current?.getBoundingClientRect();
      if (rect) {
        const clickOffsetSec = (e.clientX - rect.left) / zoom;
        const targetTime = clip.start + clickOffsetSec;
        useEditorStore.getState().setPlayhead(targetTime);
        splitClipAtPlayhead(clip.id);
      }
      return;
    }

    selectClip(clip.id, e.shiftKey || e.metaKey);
    setIsDragging(true);
    startDragInfoRef.current = {
      initialMouseX: e.clientX,
      initialStart: clip.start,
      initialDuration: clip.duration,
      initialTrimStart: clip.trimStart,
    };

    const onMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startDragInfoRef.current.initialMouseX;
      const deltaSec = deltaX / zoom;
      const newStart = Math.max(0, startDragInfoRef.current.initialStart + deltaSec);

      // Check for vertical track change
      let targetTrackId = clip.trackId;
      const elements = document.elementsFromPoint(ev.clientX, ev.clientY);
      for (const el of elements) {
        const tid = (el as HTMLElement).getAttribute('data-track-id');
        const ttype = (el as HTMLElement).getAttribute('data-track-type');
        if (tid && ttype) {
          const compatible =
            (clip.type === 'video' && ttype === 'video') ||
            (clip.type === 'image' && ttype === 'video') ||
            (clip.type === 'audio' && ttype === 'audio') ||
            (clip.type === 'text' && (ttype === 'text' || ttype === 'video'));
          if (compatible) {
            targetTrackId = tid;
            break;
          }
        }
      }

      moveClip(clip.id, newStart, targetTrackId);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Trimming Left Edge (In-point)
  const handleLeftTrimMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrimmingLeft(true);
    startDragInfoRef.current = {
      initialMouseX: e.clientX,
      initialStart: clip.start,
      initialDuration: clip.duration,
      initialTrimStart: clip.trimStart,
    };

    const onMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startDragInfoRef.current.initialMouseX;
      const deltaSec = deltaX / zoom;
      const maxDelta = startDragInfoRef.current.initialDuration - 0.2;
      const clampedDelta = Math.min(maxDelta, deltaSec);

      const newStart = Math.max(0, startDragInfoRef.current.initialStart + clampedDelta);
      const newDuration = startDragInfoRef.current.initialDuration - clampedDelta;
      const newTrimStart = Math.max(0, startDragInfoRef.current.initialTrimStart + clampedDelta * clip.speed);

      trimClip(clip.id, newStart, newDuration, newTrimStart);
      useEditorStore.getState().setPlayhead(newStart);
    };

    const onMouseUp = () => {
      setIsTrimmingLeft(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Trimming Right Edge (Out-point)
  const handleRightTrimMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrimmingRight(true);
    startDragInfoRef.current = {
      initialMouseX: e.clientX,
      initialStart: clip.start,
      initialDuration: clip.duration,
      initialTrimStart: clip.trimStart,
    };

    const onMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startDragInfoRef.current.initialMouseX;
      const deltaSec = deltaX / zoom;
      const newDuration = Math.max(0.2, startDragInfoRef.current.initialDuration + deltaSec);
      trimClip(clip.id, startDragInfoRef.current.initialStart, newDuration, startDragInfoRef.current.initialTrimStart);
      useEditorStore.getState().setPlayhead(startDragInfoRef.current.initialStart + newDuration);
    };

    const onMouseUp = () => {
      setIsTrimmingRight(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const clipWidth = Math.max(10, clip.duration * zoom);
  const leftPos = clip.start * zoom;

  const isVideo = clip.type === 'video';
  const isAudio = clip.type === 'audio';
  const isText = clip.type === 'text';

  // Calculate number of repeated thumbnail frames along the clip width
  const frameWidth = 64;
  const numFrames = Math.max(1, Math.ceil(clipWidth / frameWidth));

  return (
    <>
      <div
        ref={clipRef}
        onMouseDown={handleBodyMouseDown}
        onContextMenu={handleContextMenu}
        style={{
          left: `${leftPos}px`,
          width: `${clipWidth}px`,
          height: `${trackHeight - 6}px`,
          top: '3px',
        }}
        className={`absolute select-none rounded-[3px] overflow-hidden flex flex-col justify-between transition-shadow group ${
          isDragging ? 'opacity-85 z-40' : 'z-10'
        } ${
          isSelected
            ? 'border-[1.5px] border-[#00e5ff] shadow-lg bg-[#142628]'
            : 'border border-[#28383a] hover:border-[#385558] bg-[#162024]'
        }`}
      >
        {/* Left Trim Handle */}
        <div
          onMouseDown={handleLeftTrimMouseDown}
          className="absolute left-0 top-0 bottom-0 w-2 hover:bg-[#00e5ff]/50 cursor-ew-resize z-20 transition-colors flex items-center justify-center"
          title="Trim In-point"
        >
          <div className="w-0.5 h-4 bg-white/60 group-hover:bg-[#00e5ff] rounded" />
        </div>

        {/* Right Trim Handle */}
        <div
          onMouseDown={handleRightTrimMouseDown}
          className="absolute right-0 top-0 bottom-0 w-2 hover:bg-[#00e5ff]/50 cursor-ew-resize z-20 transition-colors flex items-center justify-center"
          title="Trim Out-point"
        >
          <div className="w-0.5 h-4 bg-white/60 group-hover:bg-[#00e5ff] rounded" />
        </div>

        {/* In-Transition visual wedge */}
        {clip.transitionIn && clip.transitionIn.type !== 'none' && (
          <div
            style={{ width: `${Math.min(clipWidth / 2, clip.transitionIn.duration * zoom)}px` }}
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-400/30 to-transparent pointer-events-none z-15 flex items-center pl-2"
          >
            <Shuffle size={9} className="text-white opacity-80" />
          </div>
        )}

        {/* Out-Transition visual wedge */}
        {clip.transitionOut && clip.transitionOut.type !== 'none' && (
          <div
            style={{ width: `${Math.min(clipWidth / 2, clip.transitionOut.duration * zoom)}px` }}
            className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-cyan-400/30 to-transparent pointer-events-none z-15 flex items-center justify-end pr-2"
          >
            <Shuffle size={9} className="text-white opacity-80" />
          </div>
        )}

        {/* Clip Top Header Strip (CapCut Dark Teal Title Bar) */}
        <div className="h-4.5 bg-[#0e3b3e]/90 px-2 flex items-center gap-1.5 overflow-hidden z-10 border-b border-[#144d52]/60 shrink-0">
          {isVideo && <Video size={9} className="text-[#00e5ff] shrink-0" />}
          {isAudio && <Music size={9} className="text-[#00e5ff] shrink-0" />}
          {isText && <Type size={9} className="text-[#00e5ff] shrink-0" />}
          <span className="text-[9.5px] font-medium text-white truncate drop-shadow-sm tracking-tight">
            {clip.name}
          </span>
        </div>

        {/* Center Filmstrip Thumbnails or Waveform */}
        <div className="flex-1 flex items-stretch overflow-hidden pointer-events-none relative bg-[#10191c]">
          {/* Continuous Filmstrip Thumbnails for Video */}
          {isVideo && (
            <div className="flex h-full w-full">
              {Array.from({ length: numFrames }).map((_, i) => (
                <div
                  key={i}
                  className="h-full border-r border-[#1a383b]/60 shrink-0 overflow-hidden relative"
                  style={{ width: `${frameWidth}px` }}
                >
                  {asset?.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover opacity-85"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#18282c] flex items-center justify-center">
                      <div className="w-5 h-3 bg-[#243c42] rounded-sm opacity-50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Audio Waveform */}
          {isAudio && (
            <div className="w-full h-full flex items-center px-2 gap-0.5">
              {(asset?.waveformData || Array.from({ length: Math.min(60, Math.floor(clipWidth / 4)) }, () => 0.4)).map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#00e5ff]/80 rounded-full"
                  style={{ height: `${Math.max(3, v * (trackHeight - 24))}px` }}
                />
              ))}
            </div>
          )}

          {/* Text preview */}
          {isText && clip.text && (
            <div className="w-full h-full flex items-center justify-center px-2">
              <span className="text-[10px] text-white/90 font-bold truncate">
                {clip.text.content}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CapCut Context Menu */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-48 bg-[#1a1a20] border border-[#2e2e3a] rounded shadow-2xl py-1 text-xs select-none backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-mono text-neutral-400 font-semibold border-b border-[#262632] truncate">
            {clip.name}
          </div>

          <button
            onClick={() => {
              splitClipAtPlayhead(clip.id);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-neutral-200 hover:bg-[#252532] hover:text-white transition-colors text-left"
          >
            <Scissors size={12} className="text-[#00e5ff]" />
            <span>Split at Playhead</span>
          </button>

          <button
            onClick={() => {
              duplicateSelectedClips();
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-neutral-200 hover:bg-[#252532] hover:text-white transition-colors text-left"
          >
            <Copy size={12} className="text-neutral-400" />
            <span>Duplicate Clip</span>
          </button>

          <button
            onClick={() => {
              setActiveInspectorTab('speed');
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-neutral-200 hover:bg-[#252532] hover:text-white transition-colors text-left"
          >
            <Gauge size={12} className="text-neutral-400" />
            <span>Speed Adjustments...</span>
          </button>

          <button
            onClick={() => {
              updateClipTransform(clip.id, { x: 0, y: 0, scale: 1, rotation: 0 });
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-neutral-200 hover:bg-[#252532] hover:text-white transition-colors text-left"
          >
            <RotateCcw size={12} className="text-neutral-400" />
            <span>Reset Transform</span>
          </button>

          <div className="h-px bg-[#262632] my-1" />

          <button
            onClick={() => {
              deleteSelectedClips();
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-red-400 hover:bg-[#252532] hover:text-red-300 transition-colors text-left"
          >
            <Trash2 size={12} />
            <span>Delete Clip</span>
          </button>
        </div>
      )}
    </>
  );
};
