import React from 'react';
import { Type, Plus } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { ClipText, TimelineClip } from '../../types/editor';

interface TextPreset {
  id: string;
  name: string;
  description: string;
  preview: string;
  textConfig: ClipText;
  duration: number;
}

const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'preset_hero_title',
    name: 'Cinematic Minimal Title',
    description: 'Clean bold title for modern cinematic openers',
    preview: 'MONO CINEMA',
    duration: 4,
    textConfig: {
      content: 'MONO CINEMA',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 64,
      fontWeight: '800',
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.7)',
      shadowBlur: 10,
      align: 'center',
      letterSpacing: 8,
      lineHeight: 1.2,
      backgroundBox: false,
      backgroundColor: 'rgba(0,0,0,0.5)',
      animation: 'scale-in',
    },
  },
  {
    id: 'preset_director',
    name: 'Director / Creator Credit',
    description: 'Two-line minimalist credit card',
    preview: 'DIRECTED BY\nH. BILAL',
    duration: 3.5,
    textConfig: {
      content: 'DIRECTED BY\nHAZRAT BILAL',
      fontFamily: 'monospace',
      fontSize: 32,
      fontWeight: '600',
      color: '#E5E5E5',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 6,
      align: 'center',
      letterSpacing: 4,
      lineHeight: 1.4,
      backgroundBox: false,
      backgroundColor: 'rgba(0,0,0,0.5)',
      animation: 'fade',
    },
  },
  {
    id: 'preset_lower_third',
    name: 'Lower Third Badge',
    description: 'Solid dark boxed caption for speaker identification',
    preview: 'GUEST SPEAKER // ARCHITECT',
    duration: 5,
    textConfig: {
      content: 'HAZRAT BILAL\nLead Systems Architect',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 26,
      fontWeight: '600',
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0)',
      shadowBlur: 0,
      align: 'left',
      letterSpacing: 1,
      lineHeight: 1.3,
      backgroundBox: true,
      backgroundColor: 'rgba(10, 10, 10, 0.85)',
      animation: 'slide-up',
    },
  },
  {
    id: 'preset_typewriter',
    name: 'Terminal Typewriter',
    description: 'Letter-by-letter live typing effect',
    preview: '> SYSTEM INITIALIZED...',
    duration: 4,
    textConfig: {
      content: '> SYSTEM OFFLINE\n> ALL ENGINES READY.',
      fontFamily: 'Courier New, monospace',
      fontSize: 30,
      fontWeight: '700',
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.6)',
      shadowBlur: 4,
      align: 'left',
      letterSpacing: 2,
      lineHeight: 1.3,
      backgroundBox: true,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      animation: 'typewriter',
    },
  },
];

export const TextLibrary: React.FC = () => {
  const { project, playhead, addClip, setStatusMessage } = useEditorStore();

  const handleAddTextPreset = (preset: TextPreset) => {
    // Find text track or video track
    let targetTrack = project.tracks.find((t) => t.type === 'text');
    if (!targetTrack) {
      targetTrack = project.tracks[0];
    }

    const clip: TimelineClip = {
      id: 'clip_' + Math.random().toString(36).substring(2, 9),
      trackId: targetTrack.id,
      type: 'text',
      name: preset.name,
      start: playhead,
      duration: preset.duration,
      trimStart: 0,
      trimEnd: preset.duration,
      sourceDuration: preset.duration,
      speed: 1,
      reverse: false,
      text: { ...preset.textConfig },
      transform: {
        x: 0,
        y: preset.id === 'preset_lower_third' ? 240 : 0,
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
      audio: {
        volume: 1,
        muted: true,
        pan: 0,
        fadeIn: 0,
        fadeOut: 0,
      },
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
      keyframes: [],
    };

    addClip(clip);
    setStatusMessage(`Added text clip "${preset.name}" at ${playhead.toFixed(2)}s`);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-xs p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
        <Type size={14} />
        <span>Text & Typography Presets</span>
      </div>
      <p className="text-[11px] text-neutral-500">
        High-resolution typography overlays with animations, boxes, and custom formatting.
      </p>

      <div className="space-y-2.5 pt-1">
        {TEXT_PRESETS.map((preset) => (
          <div
            key={preset.id}
            className="group p-2.5 bg-[#1a1a1a] border border-[#262626] hover:border-[#404040] rounded transition-all"
          >
            <div className="h-16 bg-[#0a0a0a] rounded border border-[#202020] flex items-center justify-center p-2 mb-2 select-none overflow-hidden text-center">
              <span className="text-white text-xs font-mono whitespace-pre-line tracking-wider">
                {preset.preview}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-white block text-[11px]">{preset.name}</span>
                <span className="text-[10px] text-neutral-500">{preset.description}</span>
              </div>
              <button
                onClick={() => handleAddTextPreset(preset)}
                className="flex items-center gap-1 bg-[#242424] hover:bg-white hover:text-black text-neutral-200 px-2.5 py-1 rounded transition-colors text-[11px] shrink-0"
                title="Add to Timeline"
              >
                <Plus size={12} />
                <span>Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
