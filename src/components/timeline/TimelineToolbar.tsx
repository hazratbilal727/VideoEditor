import React from 'react';
import {
  MousePointer,
  Scissors,
  Split,
  Trash2,
  Copy,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineTool } from '../../types/editor';

export const TimelineToolbar: React.FC = () => {
  const {
    activeTool,
    zoom,
    snappingEnabled,
    selectedClipIds,
    project,
    setActiveTool,
    setZoom,
    setSnappingEnabled,
    splitClipAtPlayhead,
    deleteSelectedClips,
    duplicateSelectedClips,
    addTrack,
  } = useEditorStore();

  const handleFitToScreen = () => {
    const maxEnd = Math.max(5, ...project.clips.map((c) => c.start + c.duration));
    const containerWidth = window.innerWidth - 380; // approximate width of timeline area
    const calculatedZoom = Math.max(10, Math.min(200, containerWidth / maxEnd));
    setZoom(calculatedZoom);
  };

  return (
    <div className="h-9 bg-[#141414] border-b border-[#242424] px-3 flex items-center justify-between text-xs text-neutral-300 select-none">
      {/* Left Tools: Selection, Razor/Split, Quick Split, Duplicate, Delete */}
      <div className="flex items-center gap-1">
        {/* Tool: Select */}
        <button
          onClick={() => setActiveTool('select')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono ${
            activeTool === 'select'
              ? 'bg-[#2a2a2a] text-white border border-[#444]'
              : 'text-neutral-400 hover:text-white hover:bg-[#1f1f1f]'
          }`}
          title="Selection Tool (V)"
        >
          <MousePointer size={13} />
          <span>Select</span>
        </button>

        {/* Tool: Split */}
        <button
          onClick={() => setActiveTool('split')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono ${
            activeTool === 'split'
              ? 'bg-[#2a2a2a] text-white border border-[#444]'
              : 'text-neutral-400 hover:text-white hover:bg-[#1f1f1f]'
          }`}
          title="Razor Blade Tool (C)"
        >
          <Scissors size={13} />
          <span>Razor</span>
        </button>

        <div className="h-4 w-px bg-[#262626] mx-1" />

        {/* Action: Split at Playhead */}
        <button
          onClick={() => splitClipAtPlayhead()}
          className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] hover:bg-[#252525] hover:text-white text-neutral-300 rounded border border-[#2e2e2e] text-[11px]"
          title="Split Clip at Playhead (Ctrl+B / S)"
        >
          <Split size={13} />
          <span>Split</span>
        </button>

        {/* Action: Duplicate */}
        <button
          onClick={duplicateSelectedClips}
          disabled={selectedClipIds.length === 0}
          className="p-1 hover:bg-[#222222] hover:text-white disabled:opacity-30 rounded text-neutral-400"
          title="Duplicate Selected (Ctrl+D)"
        >
          <Copy size={13} />
        </button>

        {/* Action: Delete */}
        <button
          onClick={deleteSelectedClips}
          disabled={selectedClipIds.length === 0}
          className="p-1 hover:bg-[#222222] hover:text-white disabled:opacity-30 rounded text-neutral-400"
          title="Delete Selected (Del)"
        >
          <Trash2 size={13} />
        </button>

        <div className="h-4 w-px bg-[#262626] mx-1" />

        {/* Snapping */}
        <button
          onClick={() => setSnappingEnabled(!snappingEnabled)}
          className={`p-1 rounded ${
            snappingEnabled ? 'text-white bg-[#262626]' : 'text-neutral-500 hover:text-neutral-300'
          }`}
          title="Magnetic Snapping (S)"
        >
          <Magnet size={13} />
        </button>
      </div>

      {/* Right: Add Tracks & Zoom Controls */}
      <div className="flex items-center gap-3">
        {/* Add Track Dropdown/Buttons */}
        <div className="flex items-center gap-1 border-r border-[#262626] pr-2">
          <button
            onClick={() => addTrack('video')}
            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#181818] hover:bg-[#222] text-neutral-300 rounded text-[10px] border border-[#2b2b2b]"
            title="Add Video Track"
          >
            <Plus size={10} />
            <span>+Video</span>
          </button>
          <button
            onClick={() => addTrack('audio')}
            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#181818] hover:bg-[#222] text-neutral-300 rounded text-[10px] border border-[#2b2b2b]"
            title="Add Audio Track"
          >
            <Plus size={10} />
            <span>+Audio</span>
          </button>
          <button
            onClick={() => addTrack('text')}
            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#181818] hover:bg-[#222] text-neutral-300 rounded text-[10px] border border-[#2b2b2b]"
            title="Add Text Track"
          >
            <Plus size={10} />
            <span>+Text</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(zoom - 10)}
            className="p-1 hover:text-white text-neutral-400"
            title="Zoom Out (-)"
          >
            <ZoomOut size={13} />
          </button>

          <input
            type="range"
            min={10}
            max={200}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-20 h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
            title="Timeline Zoom"
          />

          <button
            onClick={() => setZoom(zoom + 10)}
            className="p-1 hover:text-white text-neutral-400"
            title="Zoom In (+)"
          >
            <ZoomIn size={13} />
          </button>

          <button
            onClick={handleFitToScreen}
            className="p-1 hover:text-white text-neutral-400"
            title="Fit to Timeline"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
