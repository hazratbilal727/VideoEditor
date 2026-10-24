import React from 'react';
import { SlidersHorizontal, Plus, Check } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface AdjustmentPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  values: {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
    vignette: number;
    grayscale: number;
    sepia: number;
    blur: number;
  };
}

const ADJUSTMENT_PRESETS: AdjustmentPreset[] = [
  {
    id: 'adj_kodak',
    name: '35mm Film Grain Look',
    category: 'Film Stock',
    description: 'Analog film curve with lifted shadows and vignette',
    values: { brightness: -5, contrast: 25, saturation: 10, exposure: 0, vignette: 25, grayscale: 0, sepia: 15, blur: 0 },
  },
  {
    id: 'adj_bleach',
    name: 'Bleach Bypass Silver',
    category: 'Cinema',
    description: 'Desaturated high-contrast cinematic process',
    values: { brightness: 0, contrast: 45, saturation: -60, exposure: 5, vignette: 30, grayscale: 0, sepia: 0, blur: 0 },
  },
  {
    id: 'adj_deep_mono',
    name: 'Deep Monochrome Contrast',
    category: 'Black & White',
    description: 'Crushed deep shadows with crisp whites',
    values: { brightness: -10, contrast: 50, saturation: -100, exposure: 0, vignette: 35, grayscale: 100, sepia: 0, blur: 0 },
  },
  {
    id: 'adj_subtle_glow',
    name: 'Pro-Mist Diffusion',
    category: 'Lens Filters',
    description: 'Halation glow with softened highlight roll-off',
    values: { brightness: 10, contrast: -10, saturation: 5, exposure: 5, vignette: 10, grayscale: 0, sepia: 0, blur: 1.5 },
  },
];

export const AdjustmentsLibrary: React.FC = () => {
  const { selectedClipIds, updateClipColorGrading, setStatusMessage } = useEditorStore();

  const handleApply = (adj: AdjustmentPreset) => {
    if (selectedClipIds.length === 0) {
      setStatusMessage('Select a clip on the timeline to apply adjustment');
      return;
    }

    selectedClipIds.forEach((id) => {
      updateClipColorGrading(id, adj.values);
    });

    setStatusMessage(`Applied "${adj.name}" adjustment`);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-xs p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
        <SlidersHorizontal size={14} />
        <span>Color Adjustment Presets & LUTs</span>
      </div>
      <p className="text-[11px] text-neutral-500">
        Professional grading curves and film emulation LUTs for selected clips.
      </p>

      <div className="space-y-2 pt-1">
        {ADJUSTMENT_PRESETS.map((preset) => (
          <div
            key={preset.id}
            onClick={() => handleApply(preset)}
            className="p-2.5 bg-[#1a1a1a] border border-[#262626] hover:border-[#444] rounded flex items-center justify-between cursor-pointer transition-all hover:bg-[#202020] group"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-white text-[11px]">{preset.name}</span>
                <span className="text-[9px] font-mono text-neutral-500 bg-[#141414] px-1.5 py-0.2 rounded border border-[#242424]">
                  {preset.category}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 block mt-0.5">{preset.description}</span>
            </div>
            <div className="p-1.5 bg-[#252525] group-hover:bg-white group-hover:text-black rounded text-neutral-400 transition-colors">
              <Check size={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
