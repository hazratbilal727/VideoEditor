import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';
import { SliderInput } from '../common/SliderInput';

interface Props {
  clip: TimelineClip;
}

export const ColorInspector: React.FC<Props> = ({ clip }) => {
  const { updateClipColorGrading } = useEditorStore();
  const cg = clip.colorGrading;

  const handleReset = () => {
    updateClipColorGrading(clip.id, {
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
    });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Color Adjustments
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white"
          title="Reset to camera defaults"
        >
          <RotateCcw size={10} />
          <span>Reset</span>
        </button>
      </div>

      {/* Tone & Exposure */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
        <SliderInput
          label="Exposure"
          value={cg.exposure}
          min={-100}
          max={100}
          onChange={(v) => updateClipColorGrading(clip.id, { exposure: v })}
          defaultValue={0}
        />
        <SliderInput
          label="Brightness"
          value={cg.brightness}
          min={-100}
          max={100}
          onChange={(v) => updateClipColorGrading(clip.id, { brightness: v })}
          defaultValue={0}
        />
        <SliderInput
          label="Contrast"
          value={cg.contrast}
          min={-100}
          max={100}
          onChange={(v) => updateClipColorGrading(clip.id, { contrast: v })}
          defaultValue={0}
        />
        <SliderInput
          label="Saturation"
          value={cg.saturation}
          min={-100}
          max={100}
          onChange={(v) => updateClipColorGrading(clip.id, { saturation: v })}
          defaultValue={0}
        />
      </div>

      {/* Stylization: Grayscale, Sepia, Vignette, Blur */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Stylization
        </span>
        <SliderInput
          label="Grayscale"
          value={cg.grayscale}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateClipColorGrading(clip.id, { grayscale: v })}
          defaultValue={0}
        />
        <SliderInput
          label="Sepia"
          value={cg.sepia}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateClipColorGrading(clip.id, { sepia: v })}
          defaultValue={0}
        />
        <SliderInput
          label="Vignette"
          value={cg.vignette}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateClipColorGrading(clip.id, { vignette: v })}
          defaultValue={0}
        />
        <SliderInput
          label="Blur"
          value={cg.blur}
          min={0}
          max={30}
          unit="px"
          onChange={(v) => updateClipColorGrading(clip.id, { blur: v })}
          defaultValue={0}
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-mono text-neutral-400">INVERT NEGATIVE</span>
          <input
            type="checkbox"
            checked={cg.invert}
            onChange={(e) => updateClipColorGrading(clip.id, { invert: e.target.checked })}
            className="w-4 h-4 rounded bg-[#111] border-[#333] accent-white"
          />
        </div>
      </div>
    </div>
  );
};
