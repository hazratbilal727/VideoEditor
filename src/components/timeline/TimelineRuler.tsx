import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';

interface Props {
  totalDuration: number;
  width: number;
}

export const TimelineRuler: React.FC<Props> = ({ totalDuration, width }) => {
  const { playhead, zoom, setPlayhead } = useEditorStore();
  const [isScrubbing, setIsScrubbing] = useState(false);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Time intervals based on zoom
  let stepSec = 1;
  if (zoom < 25) stepSec = 5;
  else if (zoom < 50) stepSec = 2;
  else if (zoom > 100) stepSec = 0.5;

  const totalMarkers = Math.ceil(totalDuration / stepSec) + 5;

  const updatePlayheadFromEvent = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = Math.max(0, clickX / zoom);
    setPlayhead(time);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    updatePlayheadFromEvent(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isScrubbing) {
      updatePlayheadFromEvent(e);
    }
  };

  const handleMouseUp = () => {
    setIsScrubbing(false);
  };

  const formatRulerTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    if (sec % 1 !== 0) {
      return `${mins}:${s.toString().padStart(2, '0')}.${ms}`;
    }
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ width }}
      className="h-6 bg-[#161616] border-b border-[#282828] relative select-none cursor-pointer overflow-hidden"
    >
      {/* Time markers */}
      {Array.from({ length: totalMarkers }).map((_, i) => {
        const time = i * stepSec;
        const xPos = time * zoom;
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 flex flex-col justify-between"
            style={{ left: `${xPos}px` }}
          >
            <span className="text-[9px] font-mono text-neutral-400 pl-1 -translate-y-0.5">
              {formatRulerTime(time)}
            </span>
            <div className="w-px h-2 bg-[#3a3a3a]" />
          </div>
        );
      })}

      {/* Sub-tick marks */}
      {zoom > 40 &&
        Array.from({ length: totalMarkers * 4 }).map((_, i) => {
          const time = (i * stepSec) / 4;
          if (time % stepSec === 0) return null;
          const xPos = time * zoom;
          return (
            <div
              key={`sub_${i}`}
              className="absolute bottom-0 w-px h-1 bg-[#2c2c2c]"
              style={{ left: `${xPos}px` }}
            />
          );
        })}

      {/* Scrubber Playhead Diamond Indicator on Ruler */}
      <div
        className="absolute top-0 -translate-x-1/2 pointer-events-none z-30"
        style={{ left: `${playhead * zoom}px` }}
      >
        <div className="w-3 h-3 bg-white rotate-45 -translate-y-1.5 shadow" />
      </div>
    </div>
  );
};
