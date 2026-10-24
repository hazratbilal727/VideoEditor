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
  const totalDuration = Math.max(25, maxClipEnd + 10);
  const timelineContentWidth = Math.max(1600, totalDuration * zoom + 400);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Wheel zoom with Alt/Ctrl or horizontal scroll with Shift
  const handleWheel = (e: React.WheelEvent) => {
    if (e.altKey || e.ctrlKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -10 : 10;
      useEditorStore.getState().setZoom(zoom + zoomDelta);
    } else if (e.shiftKey && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleTrackDrop = async (e: React.DragEvent<HTMLDivElement>, track: typeof project.tracks[0]) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
    const dropTime = Math.max(0, clickX / zoom);

    // 1. Asset dragged from Media Library
    const assetId = e.dataTransfer.getData('application/mono-asset-id');
    if (assetId) {
      const asset = project.mediaPool.find((m) => m.id === assetId);
      if (asset) {
        useEditorStore.getState().addClip({
          id: 'clip_' + Math.random().toString(36).substring(2, 9),
          trackId: track.id,
          assetId: asset.id,
          type: asset.type,
          name: asset.name,
          start: dropTime,
          duration: asset.duration,
          trimStart: 0,
          trimEnd: asset.duration,
          sourceDuration: asset.duration,
          speed: 1,
          reverse: false,
          transform: {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1,
            flipH: false,
            flipV: false,
            blendMode: 'normal',
            crop: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          colorGrading: {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            exposure: 0,
            temperature: 0,
            tint: 0,
            vignette: 0,
            grayscale: 0,
            sepia: 0,
            blur: 0,
            sharpen: 0,
            invert: false,
          },
          audio: { volume: 1, muted: false, pan: 0, fadeIn: 0, fadeOut: 0 },
          transitionIn: { type: 'none', duration: 0 },
          transitionOut: { type: 'none', duration: 0 },
          keyframes: [],
        });
      }
      return;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] select-none text-xs">
      {/* Timeline Controls Toolbar */}
      <TimelineToolbar />

      {/* Multitrack Workspace: Left Fixed Headers + Right Scrollable Lanes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Fixed Track Headers */}
        <div className="w-44 bg-[#141416] border-r border-[#232328] flex flex-col shrink-0 z-20 shadow-md">
          {/* Header corner spacer aligning with ruler */}
          <div className="h-6 bg-[#161619] border-b border-[#232328] px-2.5 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <span>TRACKS</span>
            <span className="text-neutral-500">{project.tracks.length}</span>
          </div>

          {/* List of track headers */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {project.tracks.map((track, idx) => (
              <TimelineTrackHeader key={track.id} track={track} index={idx} />
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas Area */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative bg-[#0e0e11]"
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
            {/* White Playhead Vertical Needle spanning all tracks */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white z-25 pointer-events-none shadow-sm"
              style={{ left: `${playhead * zoom}px` }}
            >
              <div className="w-2.5 h-3 bg-white -translate-x-[4.5px] -translate-y-1 rounded-b-sm shadow" />
            </div>

            {/* Track Lanes */}
            {project.tracks.map((track) => {
              const trackClips = project.clips.filter((c) => c.trackId === track.id);
              return (
                <div
                  key={track.id}
                  data-track-id={track.id}
                  data-track-type={track.type}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={(e) => handleTrackDrop(e, track)}
                  style={{ height: `${track.height}px` }}
                  className="track-lane relative border-b border-[#1c1c22] bg-[#121216] hover:bg-[#15151a] transition-colors"
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
