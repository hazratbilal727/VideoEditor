import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackHeader } from './TimelineTrackHeader';
import { TimelineClipView } from './TimelineClipView';

export const Timeline: React.FC = () => {
  const {
    project,
    playhead,
    zoom,
    setPlayhead,
    clearSelection,
    togglePlayPause,
    undo,
    redo,
    splitClipAtPlayhead,
    deleteSelectedClips,
    duplicateSelectedClips,
    saveProjectToFile,
  } = useEditorStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const maxClipEnd = project.clips.length > 0
    ? Math.max(...project.clips.map((c) => c.start + c.duration))
    : 0;
  const totalDuration = Math.max(15, maxClipEnd + 10);
  const timelineContentWidth = Math.max(1600, totalDuration * zoom + 400);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedClips();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProjectToFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        splitClipAtPlayhead();
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        splitClipAtPlayhead();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedClips();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlayPause,
    deleteSelectedClips,
    undo,
    redo,
    saveProjectToFile,
    splitClipAtPlayhead,
    duplicateSelectedClips,
  ]);

  // Click on track empty space to seek playhead or deselect
  const handleTrackAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('track-lane')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
      setPlayhead(Math.max(0, clickX / zoom));
      clearSelection();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] select-none text-xs">
      {/* Timeline Controls Toolbar */}
      <TimelineToolbar />

      {/* Multitrack Workspace: Left Headers + Right Scrollable Lanes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Fixed Track Headers */}
        <div className="w-56 bg-[#161616] border-r border-[#242424] flex flex-col shrink-0 z-20 shadow-md">
          {/* Header corner spacer aligning with ruler */}
          <div className="h-6 bg-[#181818] border-b border-[#242424] px-3 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <span>TRACKS</span>
            <span>{project.tracks.length}</span>
          </div>

          {/* List of track headers */}
          <div className="flex-1 overflow-y-auto">
            {project.tracks.map((track) => (
              <TimelineTrackHeader key={track.id} track={track} />
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative bg-[#0d0d0d]"
        >
          {/* Sticky Ruler */}
          <div className="sticky top-0 z-30">
            <TimelineRuler totalDuration={totalDuration} width={timelineContentWidth} />
          </div>

          {/* Tracks Lanes Container */}
          <div
            onClick={handleTrackAreaClick}
            style={{ width: `${timelineContentWidth}px` }}
            className="flex-1 relative pb-10"
          >
            {/* Red Playhead Vertical Needle spanning all tracks */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white z-25 pointer-events-none shadow-sm"
              style={{ left: `${playhead * zoom}px` }}
            >
              <div className="w-2.5 h-2.5 bg-white rotate-45 -translate-x-[4px] -translate-y-1 shadow" />
            </div>

            {/* Track Lanes */}
            {project.tracks.map((track) => {
              const trackClips = project.clips.filter((c) => c.trackId === track.id);
              return (
                <div
                  key={track.id}
                  style={{ height: `${track.height}px` }}
                  className="track-lane relative border-b border-[#1f1f1f] bg-[#121212] hover:bg-[#141414] transition-colors timeline-track-grid"
                >
                  {trackClips.map((clip) => (
                    <TimelineClipView
                      key={clip.id}
                      clip={clip}
                      trackHeight={track.height}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
