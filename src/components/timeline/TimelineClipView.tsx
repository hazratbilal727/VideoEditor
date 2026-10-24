import React, { useRef, useState } from 'react';
import { Video, Music, Type, Shuffle } from 'lucide-react';
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
    project,
  } = useEditorStore();

  const isSelected = selectedClipIds.includes(clip.id);
  const clipRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isTrimmingLeft, setIsTrimmingLeft] = useState(false);
  const [isTrimmingRight, setIsTrimmingRight] = useState(false);

  const startDragInfoRef = useRef({
    initialMouseX: 0,
    initialStart: 0,
    initialDuration: 0,
    initialTrimStart: 0,
  });

  const asset = project.mediaPool.find((m) => m.id === clip.assetId);

  // Dragging to Move Clip
  const handleBodyMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If split tool is active, split clip at clicked time
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
      moveClip(clip.id, newStart);
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
      // Max delta is duration - 0.2
      const maxDelta = startDragInfoRef.current.initialDuration - 0.2;
      const clampedDelta = Math.min(maxDelta, deltaSec);

      const newStart = Math.max(0, startDragInfoRef.current.initialStart + clampedDelta);
      const newDuration = startDragInfoRef.current.initialDuration - clampedDelta;
      const newTrimStart = Math.max(0, startDragInfoRef.current.initialTrimStart + clampedDelta * clip.speed);

      trimClip(clip.id, newStart, newDuration, newTrimStart);
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
    };

    const onMouseUp = () => {
      setIsTrimmingRight(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const clipWidth = Math.max(8, clip.duration * zoom);
  const leftPos = clip.start * zoom;

  // Background styling & accents
  const isVideo = clip.type === 'video';
  const isAudio = clip.type === 'audio';
  const isText = clip.type === 'text';

  return (
    <div
      ref={clipRef}
      onMouseDown={handleBodyMouseDown}
      style={{
        left: `${leftPos}px`,
        width: `${clipWidth}px`,
        height: `${trackHeight - 6}px`,
        top: '3px',
      }}
      className={`absolute select-none rounded overflow-hidden flex flex-col justify-between transition-shadow group ${
        isDragging ? 'opacity-80 z-40' : 'z-10'
      } ${
        isSelected
          ? 'border-2 border-white shadow-lg bg-[#262626]'
          : 'border border-[#383838] hover:border-[#555] bg-[#1a1a1a]'
      }`}
    >
      {/* Left Trim Handle */}
      <div
        onMouseDown={handleLeftTrimMouseDown}
        className="absolute left-0 top-0 bottom-0 w-2.5 hover:bg-white/40 cursor-ew-resize z-20 transition-colors flex items-center justify-center"
        title="Trim In-point"
      >
        <div className="w-0.5 h-3 bg-neutral-400 group-hover:bg-white rounded" />
      </div>

      {/* Right Trim Handle */}
      <div
        onMouseDown={handleRightTrimMouseDown}
        className="absolute right-0 top-0 bottom-0 w-2.5 hover:bg-white/40 cursor-ew-resize z-20 transition-colors flex items-center justify-center"
        title="Trim Out-point"
      >
        <div className="w-0.5 h-3 bg-neutral-400 group-hover:bg-white rounded" />
      </div>

      {/* In-Transition visual wedge */}
      {clip.transitionIn && clip.transitionIn.type !== 'none' && (
        <div
          style={{ width: `${Math.min(clipWidth / 2, clip.transitionIn.duration * zoom)}px` }}
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white/30 to-transparent pointer-events-none z-15 flex items-center pl-3"
        >
          <Shuffle size={10} className="text-white opacity-70" />
        </div>
      )}

      {/* Out-Transition visual wedge */}
      {clip.transitionOut && clip.transitionOut.type !== 'none' && (
        <div
          style={{ width: `${Math.min(clipWidth / 2, clip.transitionOut.duration * zoom)}px` }}
          className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-white/30 to-transparent pointer-events-none z-15 flex items-center justify-end pr-3"
        >
          <Shuffle size={10} className="text-white opacity-70" />
        </div>
      )}

      {/* Clip Header Label */}
      <div className="px-3 pt-1 flex items-center gap-1.5 overflow-hidden z-10">
        {isVideo && <Video size={10} className="text-neutral-400 shrink-0" />}
        {isAudio && <Music size={10} className="text-neutral-400 shrink-0" />}
        {isText && <Type size={10} className="text-neutral-400 shrink-0" />}
        <span className="text-[10px] font-medium text-white truncate drop-shadow">
          {clip.name}
        </span>
      </div>

      {/* Center Waveform or Filmstrip Thumbnails */}
      <div className="flex-1 flex items-center px-3 overflow-hidden pointer-events-none opacity-60">
        {isAudio && (
          <div className="w-full h-4 flex items-center gap-0.5">
            {(asset?.waveformData || Array.from({ length: 40 }, () => 0.5)).map((v, i) => (
              <div
                key={i}
                className="flex-1 bg-white rounded-full"
                style={{ height: `${Math.max(2, v * 16)}px` }}
              />
            ))}
          </div>
        )}
        {isVideo && asset?.thumbnailUrl && clipWidth > 50 && (
          <div className="flex items-center gap-1 overflow-hidden h-5">
            <img
              src={asset.thumbnailUrl}
              alt=""
              className="h-full w-8 object-cover rounded opacity-40"
            />
          </div>
        )}
      </div>

      {/* Duration & Speed footer */}
      <div className="px-3 pb-0.5 flex items-center justify-between text-[9px] font-mono text-neutral-400 z-10">
        <span>{clip.duration.toFixed(2)}s</span>
        {clip.speed !== 1 && <span>{clip.speed}x</span>}
      </div>
    </div>
  );
};
