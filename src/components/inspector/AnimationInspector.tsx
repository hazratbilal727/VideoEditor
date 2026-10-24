import React, { useState } from 'react';
import { Sparkles, Play, RotateCcw } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip, TransitionType } from '../../types/editor';
import { SliderInput } from '../common/SliderInput';

interface Props {
  clip: TimelineClip;
}

const IN_ANIMATIONS: { id: TransitionType; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'No entrance animation' },
  { id: 'cross-dissolve', label: 'Fade In', desc: 'Smooth opacity dissolve' },
  { id: 'zoom-in', label: 'Zoom In', desc: 'Scale up from center' },
  { id: 'slide-right', label: 'Slide Right', desc: 'Enter from left edge' },
  { id: 'slide-left', label: 'Slide Left', desc: 'Enter from right edge' },
  { id: 'wipe-right', label: 'Wipe Right', desc: 'Gradual horizontal reveal' },
  { id: 'spin', label: 'Spin In', desc: 'Rotation scale entrance' },
];

const OUT_ANIMATIONS: { id: TransitionType; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'No exit animation' },
  { id: 'cross-dissolve', label: 'Fade Out', desc: 'Smooth opacity dissolve' },
  { id: 'fade-to-black', label: 'Fade to Black', desc: 'Darken to background' },
  { id: 'fade-to-white', label: 'Fade to White', desc: 'Brightness flash out' },
  { id: 'slide-right', label: 'Slide Right', desc: 'Exit to right edge' },
  { id: 'slide-left', label: 'Slide Left', desc: 'Exit to left edge' },
  { id: 'zoom-in', label: 'Zoom Out', desc: 'Scale down into distance' },
];

const TEXT_ANIMATIONS: { id: NonNullable<TimelineClip['text']>['animation']; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'Static rendering' },
  { id: 'typewriter', label: 'Typewriter', desc: 'Char by char typing effect' },
  { id: 'fade', label: 'Fade Reveal', desc: 'Smooth letter fading' },
  { id: 'slide-up', label: 'Slide Up', desc: 'Pop up from baseline' },
  { id: 'scale-in', label: 'Scale Bounce', desc: 'Dynamic scale entrance' },
  { id: 'glitch', label: 'Cyber Glitch', desc: 'RGB chromatic aberration' },
];

export const AnimationInspector: React.FC<Props> = ({ clip }) => {
  const { updateClip, updateClipText, pushHistory } = useEditorStore();
  const [subTab, setSubTab] = useState<'in' | 'out' | 'combo'>('in');

  const isText = clip.type === 'text';

  const inType = clip.transitionIn?.type || 'none';
  const inDuration = clip.transitionIn?.duration ?? 0.5;

  const outType = clip.transitionOut?.type || 'none';
  const outDuration = clip.transitionOut?.duration ?? 0.5;

  const maxAnimDuration = Math.max(0.2, Math.min(3.0, Number((clip.duration / 2).toFixed(1))));

  const handleInSelect = (type: TransitionType) => {
    pushHistory();
    updateClip(clip.id, {
      transitionIn: {
        type,
        duration: type === 'none' ? 0 : inDuration || 0.5,
      },
    });
  };

  const handleOutSelect = (type: TransitionType) => {
    pushHistory();
    updateClip(clip.id, {
      transitionOut: {
        type,
        duration: type === 'none' ? 0 : outDuration || 0.5,
      },
    });
  };

  const handleComboSelect = (type: TransitionType) => {
    pushHistory();
    updateClip(clip.id, {
      transitionIn: {
        type,
        duration: 0.5,
      },
      transitionOut: {
        type: type === 'fade-to-black' ? 'fade-to-black' : 'cross-dissolve',
        duration: 0.5,
      },
    });
  };

  const handleReset = () => {
    pushHistory();
    updateClip(clip.id, {
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
    });
    if (isText && clip.text) {
      updateClipText(clip.id, { animation: 'none' });
    }
  };

  return (
    <div className="space-y-4 text-xs select-none">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-neutral-400" />
          <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
            Motion Animations
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors"
          title="Clear all animations"
        >
          <RotateCcw size={10} />
          <span>Reset</span>
        </button>
      </div>

      {/* Sub Tabs: In | Out | Combo */}
      <div className="grid grid-cols-3 bg-[#111111] p-0.5 rounded border border-[#242424]">
        <button
          onClick={() => setSubTab('in')}
          className={`py-1 rounded text-[11px] font-mono tracking-tight font-medium transition-colors ${
            subTab === 'in'
              ? 'bg-[#222222] text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          In
        </button>
        <button
          onClick={() => setSubTab('out')}
          className={`py-1 rounded text-[11px] font-mono tracking-tight font-medium transition-colors ${
            subTab === 'out'
              ? 'bg-[#222222] text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Out
        </button>
        <button
          onClick={() => setSubTab('combo')}
          className={`py-1 rounded text-[11px] font-mono tracking-tight font-medium transition-colors ${
            subTab === 'combo'
              ? 'bg-[#222222] text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Combo
        </button>
      </div>

      {/* Text-specific kinetic options if clip is text */}
      {isText && clip.text && (
        <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
          <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider block">
            Text Kinetic Style
          </span>
          <div className="grid grid-cols-2 gap-2">
            {TEXT_ANIMATIONS.map((anim) => {
              const isSelected = clip.text?.animation === anim.id;
              return (
                <button
                  key={anim.id}
                  onClick={() => {
                    pushHistory();
                    updateClipText(clip.id, { animation: anim.id });
                  }}
                  className={`p-2 rounded border text-left transition-colors ${
                    isSelected
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-[#202020] text-neutral-300 border-[#2b2b2b] hover:border-neutral-500'
                  }`}
                >
                  <div className="text-[11px] font-medium">{anim.label}</div>
                  <div className={`text-[9px] ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    {anim.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* In Animations */}
      {subTab === 'in' && (
        <div className="space-y-3">
          {inType !== 'none' && (
            <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
              <SliderInput
                label="In Duration"
                value={inDuration}
                min={0.1}
                max={maxAnimDuration}
                step={0.1}
                unit="s"
                onChange={(v) =>
                  updateClip(clip.id, {
                    transitionIn: { type: inType, duration: v },
                  })
                }
                defaultValue={0.5}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {IN_ANIMATIONS.map((anim) => {
              const isSelected = inType === anim.id;
              return (
                <button
                  key={anim.id}
                  onClick={() => handleInSelect(anim.id)}
                  className={`p-2.5 rounded border text-left flex flex-col justify-between transition-colors ${
                    isSelected
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-[#181818] text-neutral-300 border-[#262626] hover:bg-[#202020] hover:border-neutral-500'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[11px] font-medium">{anim.label}</span>
                    {isSelected && <Play size={10} className="fill-current" />}
                  </div>
                  <span className={`text-[9px] line-clamp-1 ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    {anim.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Out Animations */}
      {subTab === 'out' && (
        <div className="space-y-3">
          {outType !== 'none' && (
            <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
              <SliderInput
                label="Out Duration"
                value={outDuration}
                min={0.1}
                max={maxAnimDuration}
                step={0.1}
                unit="s"
                onChange={(v) =>
                  updateClip(clip.id, {
                    transitionOut: { type: outType, duration: v },
                  })
                }
                defaultValue={0.5}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {OUT_ANIMATIONS.map((anim) => {
              const isSelected = outType === anim.id;
              return (
                <button
                  key={anim.id}
                  onClick={() => handleOutSelect(anim.id)}
                  className={`p-2.5 rounded border text-left flex flex-col justify-between transition-colors ${
                    isSelected
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-[#181818] text-neutral-300 border-[#262626] hover:bg-[#202020] hover:border-neutral-500'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[11px] font-medium">{anim.label}</span>
                    {isSelected && <Play size={10} className="fill-current" />}
                  </div>
                  <span className={`text-[9px] line-clamp-1 ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    {anim.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Combo Animations */}
      {subTab === 'combo' && (
        <div className="space-y-2">
          <p className="text-[10px] text-neutral-500 leading-relaxed px-1">
            Combos link synchronized entrance and exit transitions to smoothly accent key moments in your sequence.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cross-dissolve' as const, label: 'Gentle Fade', desc: 'Fade In + Fade Out' },
              { id: 'zoom-in' as const, label: 'Hero Focus', desc: 'Zoom In + Dissolve Out' },
              { id: 'slide-right' as const, label: 'Pan Sweep', desc: 'Slide In + Slide Out' },
              { id: 'fade-to-black' as const, label: 'Cinematic Dip', desc: 'Cross In + Dip to Black' },
            ].map((combo) => (
              <button
                key={combo.label}
                onClick={() => handleComboSelect(combo.id)}
                className="p-2.5 rounded border text-left bg-[#181818] text-neutral-300 border-[#262626] hover:bg-[#202020] hover:border-neutral-500 transition-colors"
              >
                <div className="text-[11px] font-medium mb-1">{combo.label}</div>
                <div className="text-[9px] text-neutral-500">{combo.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
