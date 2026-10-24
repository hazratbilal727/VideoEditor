import React from 'react';
import { FlipHorizontal, FlipVertical, RotateCcw } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';
import { SliderInput } from '../common/SliderInput';

interface Props {
  clip: TimelineClip;
}

export const TransformInspector: React.FC<Props> = ({ clip }) => {
  const { updateClipTransform, updateClip } = useEditorStore();
  const tf = clip.transform;

  return (
    <div className="space-y-4 text-xs">
      {/* Position X and Y */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Position & Scale
        </span>

        <SliderInput
          label="Position X"
          value={tf.x}
          min={-1920}
          max={1920}
          step={1}
          unit="px"
          onChange={(v) => updateClipTransform(clip.id, { x: v })}
          defaultValue={0}
        />

        <SliderInput
          label="Position Y"
          value={tf.y}
          min={-1080}
          max={1080}
          step={1}
          unit="px"
          onChange={(v) => updateClipTransform(clip.id, { y: v })}
          defaultValue={0}
        />

        <SliderInput
          label="Scale"
          value={tf.scale * 100}
          min={10}
          max={400}
          step={1}
          unit="%"
          onChange={(v) => updateClipTransform(clip.id, { scale: v / 100 })}
          defaultValue={100}
        />

        <SliderInput
          label="Rotation"
          value={tf.rotation}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(v) => updateClipTransform(clip.id, { rotation: v })}
          defaultValue={0}
        />

        <SliderInput
          label="Opacity"
          value={tf.opacity * 100}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => updateClipTransform(clip.id, { opacity: v / 100 })}
          defaultValue={100}
        />
      </div>

      {/* Flips and Blend Modes */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-3">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Orientation & Compositing
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateClipTransform(clip.id, { flipH: !tf.flipH })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border text-[11px] ${
              tf.flipH
                ? 'bg-white text-black border-white font-medium'
                : 'bg-[#202020] text-neutral-300 border-[#2b2b2b] hover:border-neutral-500'
            }`}
          >
            <FlipHorizontal size={13} />
            <span>Flip H</span>
          </button>

          <button
            onClick={() => updateClipTransform(clip.id, { flipV: !tf.flipV })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border text-[11px] ${
              tf.flipV
                ? 'bg-white text-black border-white font-medium'
                : 'bg-[#202020] text-neutral-300 border-[#2b2b2b] hover:border-neutral-500'
            }`}
          >
            <FlipVertical size={13} />
            <span>Flip V</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-mono">BLEND MODE</span>
          <select
            value={tf.blendMode}
            onChange={(e) =>
              updateClipTransform(clip.id, {
                blendMode: e.target.value as typeof tf.blendMode,
              })
            }
            className="bg-[#121212] border border-[#2b2b2b] text-neutral-200 px-2 py-1 rounded text-[11px] focus:outline-none"
          >
            <option value="normal">Normal</option>
            <option value="screen">Screen</option>
            <option value="multiply">Multiply</option>
            <option value="overlay">Overlay</option>
            <option value="lighten">Lighten</option>
            <option value="darken">Darken</option>
          </select>
        </div>
      </div>

      {/* Speed & Reverse */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Playback Speed
        </span>

        <SliderInput
          label="Speed"
          value={clip.speed}
          min={0.2}
          max={5.0}
          step={0.1}
          unit="x"
          onChange={(v) => updateClip(clip.id, { speed: v })}
          defaultValue={1.0}
        />
      </div>

      {/* Crop */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Crop (% inset)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <SliderInput
            label="Top"
            value={tf.crop.top}
            min={0}
            max={50}
            unit="%"
            onChange={(v) =>
              updateClipTransform(clip.id, {
                crop: { ...tf.crop, top: v },
              })
            }
          />
          <SliderInput
            label="Bottom"
            value={tf.crop.bottom}
            min={0}
            max={50}
            unit="%"
            onChange={(v) =>
              updateClipTransform(clip.id, {
                crop: { ...tf.crop, bottom: v },
              })
            }
          />
          <SliderInput
            label="Left"
            value={tf.crop.left}
            min={0}
            max={50}
            unit="%"
            onChange={(v) =>
              updateClipTransform(clip.id, {
                crop: { ...tf.crop, left: v },
              })
            }
          />
          <SliderInput
            label="Right"
            value={tf.crop.right}
            min={0}
            max={50}
            unit="%"
            onChange={(v) =>
              updateClipTransform(clip.id, {
                crop: { ...tf.crop, right: v },
              })
            }
          />
        </div>
      </div>
    </div>
  );
};
