import React from 'react';
import { Smile, Plus, Camera, AlertCircle, Circle, Play, ShieldAlert, Sparkles, Clock, Target, Radio } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';

interface StickerItem {
  id: string;
  name: string;
  category: string;
  iconName: string;
  previewText: string;
  duration: number;
}

const STICKER_ITEMS: StickerItem[] = [
  { id: 'stk_rec', name: 'REC 4K Badge', category: 'Overlays', iconName: 'Radio', previewText: '● REC [4K]', duration: 4 },
  { id: 'stk_crosshair', name: 'Precision Crosshair', category: 'Elements', iconName: 'Target', previewText: '⌖ FOCUS 100%', duration: 4 },
  { id: 'stk_live', name: 'LIVE Broadcast', category: 'Badges', iconName: 'Radio', previewText: 'LIVE STREAM', duration: 4 },
  { id: 'stk_time', name: 'Timecode Stamp', category: 'Elements', iconName: 'Clock', previewText: 'TC: 00:01:24:18', duration: 4 },
  { id: 'stk_cine', name: 'Widescreen 2.35:1', category: 'Overlays', iconName: 'Sparkles', previewText: 'CINEMATIC SCOPE', duration: 5 },
  { id: 'stk_arrow', name: 'Dynamic Pointer', category: 'Badges', iconName: 'Plus', previewText: '➔ VIEW HERE', duration: 3 },
];

export const StickersLibrary: React.FC = () => {
  const { project, playhead, addClip, setStatusMessage } = useEditorStore();

  const handleAddSticker = (item: StickerItem) => {
    let targetTrack = project.tracks.find((t) => t.type === 'text') || project.tracks[0];

    const clip: TimelineClip = {
      id: 'clip_stk_' + Math.random().toString(36).substring(2, 9),
      trackId: targetTrack.id,
      type: 'text',
      name: `Sticker: ${item.name}`,
      start: playhead,
      duration: item.duration,
      trimStart: 0,
      trimEnd: item.duration,
      sourceDuration: item.duration,
      speed: 1,
      reverse: false,
      text: {
        content: item.previewText,
        fontFamily: 'monospace',
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 2,
        shadowColor: 'rgba(0,0,0,0.8)',
        shadowBlur: 6,
        align: 'center',
        letterSpacing: 2,
        lineHeight: 1.2,
        backgroundBox: true,
        backgroundColor: 'rgba(10, 10, 10, 0.85)',
        animation: 'scale-in',
      },
      transform: {
        x: 0,
        y: item.category === 'Overlays' ? -260 : 200,
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
      audio: { volume: 1, muted: true, pan: 0, fadeIn: 0, fadeOut: 0 },
      transitionIn: { type: 'zoom-in', duration: 0.4 },
      transitionOut: { type: 'none', duration: 0 },
      keyframes: [],
    };

    addClip(clip);
    setStatusMessage(`Added sticker "${item.name}" at ${playhead.toFixed(2)}s`);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-xs p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
        <Smile size={14} />
        <span>Stickers & Graphic Elements</span>
      </div>
      <p className="text-[11px] text-neutral-500">
        Monochrome broadcast stamps, camera HUD overlays, and graphic markers.
      </p>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {STICKER_ITEMS.map((stk) => (
          <div
            key={stk.id}
            onClick={() => handleAddSticker(stk)}
            className="group p-2.5 bg-[#1a1a1a] border border-[#262626] hover:border-[#444] rounded flex flex-col items-center justify-between text-center gap-2 cursor-pointer transition-all hover:bg-[#202020]"
          >
            <div className="w-full h-12 bg-[#0c0c0c] border border-[#202020] rounded flex items-center justify-center px-1 font-mono text-[10px] text-white font-bold tracking-wider">
              {stk.previewText}
            </div>
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] text-neutral-300 font-medium truncate">{stk.name}</span>
              <div className="p-1 bg-[#252525] group-hover:bg-white group-hover:text-black rounded text-neutral-400 transition-colors">
                <Plus size={11} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
