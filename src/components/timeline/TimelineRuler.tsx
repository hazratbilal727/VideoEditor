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

  // Time intervals: CapCut desktop uses 5-second major intervals by default (00:00, 00:05, 00:10, 00:15, 00:20)
  let stepSec = 5;
  if (zoom > 100) stepSec = 1;
  else if (zoom > 50) stepSec = 2;
  else if (zoom < 20) stepSec = 10;

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

  const formatCapCutRulerTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ width }}
      className="h-6 bg-[#151518] border-b border-[#232328] relative select-none cursor-pointer overflow-hidden"
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
            <span className="text-[9.5px] font-mono text-neutral-400 pl-1 -translate-y-0.5">
              {formatCapCutRulerTime(time)}
            </span>
            <div className="w-px h-2 bg-[#363640]" />
          </div>
        );
      })}

      {/* Sub-tick marks */}
      {Array.from({ length: totalMarkers * 5 }).map((_, i) => {
        const time = (i * stepSec) / 5;
        if (time % stepSec === 0) return null;
        const xPos = time * zoom;
        return (
          <div
            key={`sub_${i}`}
            className="absolute bottom-0 w-px h-1 bg-[#282830]"
            style={{ left: `${xPos}px` }}
          />
        );
      })}

      {/* CapCut Signature White Playhead Handle on Ruler */}
      <div
        className="absolute top-0 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center"
        style={{ left: `${playhead * zoom}px` }}
      >
        <div className="w-3.5 h-3.5 bg-white rounded-t-[2px] rounded-b-full shadow-md flex items-center justify-center">
          <div className="w-1 h-1 bg-black/40 rounded-full" />
        </div>
      </div>
    </div>
  );
};
