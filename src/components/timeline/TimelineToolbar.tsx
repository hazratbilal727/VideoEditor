import React from 'react';
import {
  MousePointer,
  Undo2,
  Redo2,
  Trash2,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  Crop,
  Sparkles,
  Mic,
  Snowflake,
  Repeat,
  Link,
  SplitSquareVertical,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

export const TimelineToolbar: React.FC = () => {
  const {
    activeTool,
    zoom,
    snappingEnabled,
    selectedClipIds,
    project,
    undoStack,
    redoStack,
    rippleMode,
    undo,
    redo,
    setRippleMode,
    setActiveTool,
    setZoom,
    setSnappingEnabled,
    splitClipAtPlayhead,
    deleteSelectedClips,
    updateClip,
  } = useEditorStore();

  const handleFitToScreen = () => {
    const maxEnd = Math.max(6.9, ...project.clips.map((c) => c.start + c.duration));
    const containerWidth = window.innerWidth - 380;
    const calculatedZoom = Math.max(15, Math.min(180, containerWidth / maxEnd));
    setZoom(calculatedZoom);
  };

  const selectedClip = project.clips.find((c) => selectedClipIds.includes(c.id));

  const handleSplitLeft = () => {
    const playhead = useEditorStore.getState().playhead;
    if (selectedClip && playhead > selectedClip.start && playhead < selectedClip.start + selectedClip.duration) {
      const trimAmount = playhead - selectedClip.start;
      updateClip(selectedClip.id, {
        start: playhead,
        duration: selectedClip.duration - trimAmount,
        trimStart: selectedClip.trimStart + trimAmount,
      });
    }
  };

  const handleSplitRight = () => {
    const playhead = useEditorStore.getState().playhead;
    if (selectedClip && playhead > selectedClip.start && playhead < selectedClip.start + selectedClip.duration) {
      const newDuration = playhead - selectedClip.start;
      updateClip(selectedClip.id, {
        duration: newDuration,
        trimEnd: selectedClip.trimStart + newDuration,
      });
    }
  };

  return (
    <div className="h-9 bg-[#151518] border-b border-[#232328] px-2.5 flex items-center justify-between text-xs text-neutral-300 select-none">
      {/* Left Tools Matching Screenshot Ordering */}
      <div className="flex items-center gap-1">
        {/* 1. Pointer / Select Tool with chevron */}
        <div className="flex items-center">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-1.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer ${
              activeTool === 'select'
                ? 'text-[#00e5ff] bg-[#22222a]'
                : 'text-neutral-400 hover:text-white hover:bg-[#202026]'
            }`}
            title="Selection Tool (V)"
          >
            <MousePointer size={13} />
            <ChevronDown size={8} className="text-neutral-500" />
          </button>
        </div>

        {/* 2. Undo */}
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] disabled:opacity-30 transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={13} />
        </button>

        {/* 3. Redo */}
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] disabled:opacity-30 transition-colors cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={13} />
        </button>

        {/* 4. Split at Playhead (Highlighted in red box in screenshot!) */}
        <button
          onClick={() => splitClipAtPlayhead()}
          className="px-2 py-1 bg-[#1e1e24] hover:bg-[#272730] text-neutral-200 hover:text-white rounded border border-[#2e2e38] transition-colors cursor-pointer font-mono font-bold text-[12px] flex items-center justify-center tracking-tighter"
          title="Split at Playhead (Ctrl+B / S)"
        >
          <span>][</span>
        </button>

        {/* 5. Split Left (Trim Left of Playhead) */}
        <button
          onClick={handleSplitLeft}
          className="px-1.5 py-1 text-neutral-400 hover:text-white hover:bg-[#202026] rounded transition-colors cursor-pointer font-mono text-[11px]"
          title="Split Left / Delete In-Point (Q)"
        >
          <span>[|</span>
        </button>

        {/* 6. Split Right (Trim Right of Playhead) */}
        <button
          onClick={handleSplitRight}
          className="px-1.5 py-1 text-neutral-400 hover:text-white hover:bg-[#202026] rounded transition-colors cursor-pointer font-mono text-[11px]"
          title="Split Right / Delete Out-Point (W)"
        >
          <span>|]</span>
        </button>

        {/* 7. Delete */}
        <button
          onClick={deleteSelectedClips}
          disabled={selectedClipIds.length === 0}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] disabled:opacity-30 transition-colors cursor-pointer"
          title="Delete Selected (Backspace / Del)"
        >
          <Trash2 size={13} />
        </button>

        {/* 8. Freeze Frame */}
        <button
          onClick={() => {
            if (selectedClip) {
              useEditorStore.getState().setStatusMessage(`Freeze frame captured from ${selectedClip.name}`);
            }
          }}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
          title="Freeze Frame"
        >
          <Snowflake size={13} />
        </button>

        {/* 9. Crop */}
        <button
          onClick={() => {
            if (selectedClip) {
              useEditorStore.getState().setActiveInspectorTab('video');
            }
          }}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
          title="Crop Tool"
        >
          <Crop size={13} />
        </button>

        {/* 10. Reverse / Flip */}
        <button
          onClick={() => {
            if (selectedClip) {
              updateClip(selectedClip.id, { reverse: !selectedClip.reverse });
              useEditorStore.getState().setStatusMessage(`Clip reverse toggled: ${!selectedClip.reverse}`);
            }
          }}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
          title="Reverse / Flip Playback"
        >
          <Repeat size={13} />
        </button>

        {/* 11. HD / Enhance */}
        <button
          className="px-1.5 py-0.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer font-mono font-semibold text-[10px]"
          title="Enhance Clip Quality (HD)"
        >
          HD
        </button>

        {/* 12. Voiceover / Mic */}
        <button
          onClick={() => {
            useEditorStore.getState().setStatusMessage('Microphone recording ready');
          }}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
          title="Record Audio Voiceover"
        >
          <Mic size={13} />
        </button>
      </div>

      {/* Right Controls Matching Screenshot */}
      <div className="flex items-center gap-2">
        {/* Snapping / Magnet (Bright Cyan Active in Screenshot) */}
        <button
          onClick={() => setSnappingEnabled(!snappingEnabled)}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            snappingEnabled
              ? 'bg-[#00e5ff] text-black shadow-sm font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-[#202026]'
          }`}
          title="Magnetic Snapping (N)"
        >
          <Magnet size={13} />
        </button>

        {/* Auto Ripple Toggle */}
        <button
          onClick={() => setRippleMode(!rippleMode)}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            rippleMode
              ? 'text-[#00e5ff] bg-[#202028]'
              : 'text-neutral-400 hover:text-white hover:bg-[#202026]'
          }`}
          title="Auto Ripple Mode"
        >
          <SplitSquareVertical size={13} />
        </button>

        {/* Link / Group Clips with chevron */}
        <button
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#202026] flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Link Clips Selection"
        >
          <Link size={13} />
          <ChevronDown size={8} className="text-neutral-500" />
        </button>

        {/* Split/Razor Tool switch */}
        <button
          onClick={() => setActiveTool(activeTool === 'split' ? 'select' : 'split')}
          className={`p-1.5 rounded transition-colors cursor-pointer flex items-center gap-0.5 ${
            activeTool === 'split'
              ? 'text-[#00e5ff] bg-[#202028]'
              : 'text-neutral-400 hover:text-white hover:bg-[#202026]'
          }`}
          title="Razor Blade Tool (C)"
        >
          <span className="font-mono text-[11px] font-bold">][</span>
          <ChevronDown size={8} className="text-neutral-500" />
        </button>

        {/* Zoom Slider + In / Out + Fit */}
        <div className="flex items-center gap-1 pl-1 border-l border-[#26262e]">
          <button
            onClick={() => setZoom(zoom - 10)}
            className="p-1 hover:text-white text-neutral-400 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut size={12} />
          </button>

          <input
            type="range"
            min={10}
            max={200}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-16 h-1 bg-[#282834] rounded appearance-none cursor-pointer accent-[#00e5ff]"
            title="Timeline Zoom"
          >
          </input>

          <button
            onClick={() => setZoom(zoom + 10)}
            className="p-1 hover:text-white text-neutral-400 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn size={12} />
          </button>

          <button
            onClick={handleFitToScreen}
            className="p-1 hover:text-white text-neutral-400 transition-colors"
            title="Fit to Timeline"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
