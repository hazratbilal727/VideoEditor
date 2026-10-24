import React from 'react';
import { Gauge, RotateCcw, FastForward, Repeat } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';
import { SliderInput } from '../common/SliderInput';

interface Props {
  clip: TimelineClip;
}

export const SpeedInspector: React.FC<Props> = ({ clip }) => {
  const { updateClip, pushHistory } = useEditorStore();

  const currentSpeed = clip.speed || 1.0;
  const isReverse = !!clip.reverse;

  const handleSpeedChange = (newSpeed: number) => {
    const safeSpeed = Math.max(0.1, Math.min(10.0, Number(newSpeed.toFixed(2))));
    const sourceDuration = clip.trimEnd - clip.trimStart;
    const newDuration = Math.max(0.1, sourceDuration / safeSpeed);

    updateClip(clip.id, {
      speed: safeSpeed,
      duration: newDuration,
    });
  };

  const handleReset = () => {
    pushHistory();
    const sourceDuration = clip.trimEnd - clip.trimStart;
    updateClip(clip.id, {
      speed: 1.0,
      duration: sourceDuration,
      reverse: false,
    });
  };

  const speedPresets = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 4.0, 8.0];

  return (
    <div className="space-y-4 text-xs select-none">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          <Gauge size={13} className="text-neutral-400" />
          <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
            Speed Curve & Duration
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors"
          title="Reset to 1.0x"
        >
          <RotateCcw size={10} />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed Slider */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-medium">Standard Speed</span>
          <span className="font-mono text-xs text-white font-bold bg-[#202020] px-2 py-0.5 rounded border border-[#2e2e2e]">
            {currentSpeed.toFixed(2)}x
          </span>
        </div>

        <SliderInput
          label="Times Multiplier"
          value={currentSpeed}
          min={0.1}
          max={10.0}
          step={0.05}
          unit="x"
          onChange={handleSpeedChange}
          defaultValue={1.0}
        />

        {/* Quick Presets Grid */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] uppercase font-mono text-neutral-500 font-medium">
            Quick Presets
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {speedPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  pushHistory();
                  handleSpeedChange(preset);
                }}
                className={`py-1 rounded text-[10px] font-mono font-medium border transition-colors ${
                  Math.abs(currentSpeed - preset) < 0.04
                    ? 'bg-white text-black border-white'
                    : 'bg-[#202020] text-neutral-400 border-[#2b2b2b] hover:text-white hover:border-neutral-500'
                }`}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Duration Info Card */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2 font-mono text-[11px]">
        <div className="flex items-center justify-between text-neutral-400">
          <span>Source Range:</span>
          <span className="text-neutral-200">
            {(clip.trimEnd - clip.trimStart).toFixed(2)}s
          </span>
        </div>
        <div className="flex items-center justify-between text-neutral-400">
          <span>Resulting Timeline Duration:</span>
          <span className="text-white font-bold">
            {clip.duration.toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Direction & Playback Options */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Playback Mode
        </span>

        <button
          onClick={() => {
            pushHistory();
            updateClip(clip.id, { reverse: !isReverse });
          }}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded border text-xs font-medium transition-colors ${
            isReverse
              ? 'bg-white text-black border-white'
              : 'bg-[#202020] text-neutral-300 border-[#2b2b2b] hover:border-neutral-500'
          }`}
        >
          <Repeat size={13} />
          <span>{isReverse ? 'Reverse Video (Active)' : 'Reverse Video'}</span>
        </button>

        <p className="text-[10px] text-neutral-500 leading-relaxed pt-1">
          Modifying speed scales the clip duration on the timeline proportionally and adjusts playback rate in real time.
        </p>
      </div>
    </div>
  );
};
