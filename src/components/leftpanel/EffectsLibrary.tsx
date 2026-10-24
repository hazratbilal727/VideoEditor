import React from 'react';
import { Sliders, Sparkles, Check } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { ClipColorGrading } from '../../types/editor';

interface EffectPreset {
  id: string;
  name: string;
  description: string;
  values: Partial<ClipColorGrading>;
}

const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: 'film_noir',
    name: 'Film Noir 1940s',
    description: 'High contrast monochrome with heavy dramatic vignette',
    values: {
      grayscale: 100,
      contrast: 35,
      brightness: -5,
      vignette: 45,
      sepia: 0,
      blur: 0,
    },
  },
  {
    id: 'vintage_sepia',
    name: 'Vintage Archival',
    description: 'Aged sepia tone with faded contrast',
    values: {
      sepia: 65,
      grayscale: 20,
      contrast: -10,
      brightness: 10,
      vignette: 30,
      blur: 0,
    },
  },
  {
    id: 'cyber_punch',
    name: 'Hyper Contrast',
    description: 'Sharpened dynamic range with crushed deep blacks',
    values: {
      contrast: 50,
      brightness: -10,
      saturation: 15,
      vignette: 20,
      grayscale: 0,
    },
  },
  {
    id: 'dreamy_mist',
    name: 'Dreamy Soft Glow',
    description: 'Subtle atmospheric blur with elevated exposure',
    values: {
      blur: 2,
      brightness: 15,
      contrast: -15,
      vignette: 15,
    },
  },
  {
    id: 'invert_xray',
    name: 'X-Ray Invert',
    description: 'Negative inverted tones for surreal visuals',
    values: {
      invert: true,
      contrast: 20,
    },
  },
  {
    id: 'reset_grade',
    name: 'Natural / Neutral',
    description: 'Reset all grading to original camera look',
    values: {
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
  },
];

export const EffectsLibrary: React.FC = () => {
  const { project, selectedClipIds, updateClipColorGrading, setStatusMessage } = useEditorStore();

  const handleApplyPreset = (preset: EffectPreset) => {
    if (selectedClipIds.length === 0) {
      setStatusMessage('Select a clip on the timeline first');
      return;
    }

    selectedClipIds.forEach((clipId) => {
      updateClipColorGrading(clipId, preset.values);
    });

    setStatusMessage(`Applied "${preset.name}" look`);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-xs p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
        <Sliders size={14} />
        <span>Color Grading & Looks</span>
      </div>
      <p className="text-[11px] text-neutral-500">
        Professional offline color correction filters for cinema, documentary, and creative stylization.
      </p>

      <div className="space-y-2 pt-1">
        {EFFECT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleApplyPreset(preset)}
            className="w-full text-left p-2.5 bg-[#1a1a1a] border border-[#262626] hover:border-[#404040] hover:bg-[#202020] rounded flex items-center justify-between transition-colors group cursor-pointer"
          >
            <div>
              <span className="font-medium text-white block text-[11px] group-hover:text-white">
                {preset.name}
              </span>
              <span className="text-[10px] text-neutral-500">{preset.description}</span>
            </div>
            <div className="p-1 bg-[#242424] group-hover:bg-white group-hover:text-black rounded text-neutral-400 transition-colors">
              <Check size={12} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
