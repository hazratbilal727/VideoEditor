import React, { useState } from 'react';
import {
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Diamond,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Check,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';

interface Props {
  clip: TimelineClip;
}

export const TransformInspector: React.FC<Props> = ({ clip }) => {
  const { updateClipTransform } = useEditorStore();
  const tf = clip.transform;

  const [isTransformOpen, setIsTransformOpen] = useState(true);
  const [isBlendOpen, setIsBlendOpen] = useState(false);
  const [isStabilizeOpen, setIsStabilizeOpen] = useState(false);

  const [uniformScale, setUniformScale] = useState(true);
  const [blendEnabled, setBlendEnabled] = useState(true);
  const [stabilizeEnabled, setStabilizeEnabled] = useState(false);

  // Stepper helper
  const handleScaleChange = (val: number) => {
    updateClipTransform(clip.id, { scale: Math.max(0.1, val / 100) });
  };

  const handlePositionX = (val: number) => {
    updateClipTransform(clip.id, { x: val });
  };

  const handlePositionY = (val: number) => {
    updateClipTransform(clip.id, { y: val });
  };

  const handleRotation = (val: number) => {
    updateClipTransform(clip.id, { rotation: val });
  };

  const handleResetTransform = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateClipTransform(clip.id, {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    });
  };

  return (
    <div className="space-y-2.5 text-xs text-neutral-300">
      {/* 1. Transform Section Accordion */}
      <div className="border border-[#25252d] bg-[#1a1a1e] rounded overflow-hidden">
        {/* Accordion Header */}
        <div
          onClick={() => setIsTransformOpen(!isTransformOpen)}
          className="flex items-center justify-between px-3 py-2 bg-[#1d1d23] hover:bg-[#22222a] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-1.5 font-medium text-white text-[11.5px]">
            <span>Transform</span>
            {isTransformOpen ? <ChevronUp size={12} className="text-neutral-400" /> : <ChevronDown size={12} className="text-neutral-400" />}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetTransform}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title="Reset Transform"
            >
              <RotateCcw size={11} />
            </button>
            {/* Keyframe diamond controls < ◇ > */}
            <div className="flex items-center gap-0.5 text-neutral-500 hover:text-neutral-300">
              <span className="text-[10px]">&lt;</span>
              <Diamond size={9} className="hover:text-[#00e5ff]" />
              <span className="text-[10px]">&gt;</span>
            </div>
          </div>
        </div>

        {isTransformOpen && (
          <div className="p-3 space-y-3 bg-[#18181c]">
            {/* Scale Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Scale</span>
                <div className="flex items-center gap-2">
                  {/* Number Box with Steppers (119%) */}
                  <div className="flex items-center bg-[#1f1f26] border border-[#2d2d38] rounded px-1.5 py-0.5 w-16 justify-between">
                    <input
                      type="number"
                      value={Math.round(tf.scale * 100)}
                      onChange={(e) => handleScaleChange(parseFloat(e.target.value) || 100)}
                      className="bg-transparent text-white font-mono text-[11px] w-8 focus:outline-none"
                    />
                    <span className="text-neutral-500 font-mono text-[10px]">%</span>
                    <div className="flex flex-col text-[8px] text-neutral-500 leading-none">
                      <button onClick={() => handleScaleChange(Math.round(tf.scale * 100) + 1)} className="hover:text-white">▲</button>
                      <button onClick={() => handleScaleChange(Math.round(tf.scale * 100) - 1)} className="hover:text-white">▼</button>
                    </div>
                  </div>

                  {/* Keyframe Diamond */}
                  <div className="flex items-center gap-0.5 text-neutral-500 hover:text-neutral-300">
                    <span className="text-[9px]">&lt;</span>
                    <Diamond size={8} className="hover:text-[#00e5ff]" />
                    <span className="text-[9px]">&gt;</span>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={10}
                max={400}
                value={Math.round(tf.scale * 100)}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#282832] rounded appearance-none cursor-pointer accent-[#00e5ff]"
              />
            </div>

            {/* Uniform Scale Toggle Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-neutral-400 text-[11px]">Uniform scale</span>
              <button
                onClick={() => setUniformScale(!uniformScale)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  uniformScale ? 'bg-[#00e5ff]' : 'bg-[#2b2b36]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black transition-transform absolute top-0.5 ${
                    uniformScale ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Position Row (X & Y) */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-neutral-400">Position</span>
              <div className="flex items-center gap-2">
                {/* X */}
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500 font-mono text-[10px]">X</span>
                  <div className="flex items-center bg-[#1f1f26] border border-[#2d2d38] rounded px-1.5 py-0.5 w-14 justify-between">
                    <input
                      type="number"
                      value={tf.x}
                      onChange={(e) => handlePositionX(parseInt(e.target.value) || 0)}
                      className="bg-transparent text-white font-mono text-[11px] w-7 focus:outline-none"
                    />
                    <div className="flex flex-col text-[8px] text-neutral-500 leading-none">
                      <button onClick={() => handlePositionX(tf.x + 10)} className="hover:text-white">▲</button>
                      <button onClick={() => handlePositionX(tf.x - 10)} className="hover:text-white">▼</button>
                    </div>
                  </div>
                </div>

                {/* Y */}
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500 font-mono text-[10px]">Y</span>
                  <div className="flex items-center bg-[#1f1f26] border border-[#2d2d38] rounded px-1.5 py-0.5 w-14 justify-between">
                    <input
                      type="number"
                      value={tf.y}
                      onChange={(e) => handlePositionY(parseInt(e.target.value) || 0)}
                      className="bg-transparent text-white font-mono text-[11px] w-7 focus:outline-none"
                    />
                    <div className="flex flex-col text-[8px] text-neutral-500 leading-none">
                      <button onClick={() => handlePositionY(tf.y + 10)} className="hover:text-white">▲</button>
                      <button onClick={() => handlePositionY(tf.y - 10)} className="hover:text-white">▼</button>
                    </div>
                  </div>
                </div>

                {/* Keyframe Diamond */}
                <div className="flex items-center gap-0.5 text-neutral-500 hover:text-neutral-300">
                  <span className="text-[9px]">&lt;</span>
                  <Diamond size={8} className="hover:text-[#00e5ff]" />
                  <span className="text-[9px]">&gt;</span>
                </div>
              </div>
            </div>

            {/* Rotate Row */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-neutral-400">Rotate</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#1f1f26] border border-[#2d2d38] rounded px-1.5 py-0.5 w-18 justify-between">
                  <input
                    type="number"
                    value={tf.rotation}
                    onChange={(e) => handleRotation(parseFloat(e.target.value) || 0)}
                    className="bg-transparent text-white font-mono text-[11px] w-10 focus:outline-none"
                  />
                  <span className="text-neutral-500 font-mono text-[10px]">°</span>
                  <div className="flex flex-col text-[8px] text-neutral-500 leading-none">
                    <button onClick={() => handleRotation((tf.rotation + 1) % 360)} className="hover:text-white">▲</button>
                    <button onClick={() => handleRotation((tf.rotation - 1) % 360)} className="hover:text-white">▼</button>
                  </div>
                </div>

                {/* Angle Dial Widget */}
                <div
                  onClick={() => handleRotation((tf.rotation + 45) % 360)}
                  className="w-5 h-5 rounded-full border border-[#3b3b48] bg-[#1d1d24] relative flex items-center justify-center cursor-pointer hover:border-[#00e5ff]"
                  title="Click to rotate by 45°"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] absolute"
                    style={{
                      transform: `rotate(${tf.rotation}deg) translate(0, -5px)`,
                    }}
                  />
                </div>

                {/* Keyframe Diamond */}
                <div className="flex items-center gap-0.5 text-neutral-500 hover:text-neutral-300">
                  <span className="text-[9px]">&lt;</span>
                  <Diamond size={8} className="hover:text-[#00e5ff]" />
                  <span className="text-[9px]">&gt;</span>
                </div>
              </div>
            </div>

            {/* Alignment Row (6 buttons matching screenshot) */}
            <div className="flex items-center justify-between bg-[#1f1f25] border border-[#2c2c36] rounded p-1 mt-2">
              <button
                onClick={() => updateClipTransform(clip.id, { x: -400 })}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#2b2b35] transition-colors"
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                onClick={() => updateClipTransform(clip.id, { x: 0 })}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#2b2b35] transition-colors"
                title="Align Center H"
              >
                <AlignCenter size={13} />
              </button>
              <button
                onClick={() => updateClipTransform(clip.id, { x: 400 })}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#2b2b35] transition-colors"
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
              <div className="w-px h-3.5 bg-[#31313d]" />
              <button
                onClick={() => updateClipTransform(clip.id, { y: -250 })}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#2b2b35] transition-colors"
                title="Align Top"
              >
                <AlignVerticalJustifyStart size={13} />
              </button>
              <button
                onClick={() => updateClipTransform(clip.id, { y: 0 })}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#2b2b35] transition-colors"
                title="Align Center V"
              >
                <AlignVerticalJustifyCenter size={13} />
              </button>
              <button
                onClick={() => updateClipTransform(clip.id, { y: 250 })}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#2b2b35] transition-colors"
                title="Align Bottom"
              >
                <AlignVerticalJustifyEnd size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Blend Section Accordion */}
      <div className="border border-[#25252d] bg-[#1a1a1e] rounded overflow-hidden">
        <div
          onClick={() => setIsBlendOpen(!isBlendOpen)}
          className="flex items-center justify-between px-3 py-2 bg-[#1d1d23] hover:bg-[#22222a] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 text-[11.5px] font-medium text-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBlendEnabled(!blendEnabled);
              }}
              className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${
                blendEnabled ? 'bg-[#00e5ff] border-[#00e5ff] text-black' : 'border-[#444] bg-[#18181c]'
              }`}
            >
              {blendEnabled && <Check size={10} strokeWidth={3} />}
            </button>
            <span>Blend</span>
            {isBlendOpen ? <ChevronUp size={12} className="text-neutral-400" /> : <ChevronDown size={12} className="text-neutral-400" />}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateClipTransform(clip.id, { opacity: 1, blendMode: 'normal' });
              }}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title="Reset Blend"
            >
              <RotateCcw size={11} />
            </button>
            <div className="flex items-center gap-0.5 text-neutral-500 hover:text-neutral-300">
              <span className="text-[10px]">&lt;</span>
              <Diamond size={9} className="hover:text-[#00e5ff]" />
              <span className="text-[10px]">&gt;</span>
            </div>
          </div>
        </div>

        {isBlendOpen && (
          <div className="p-3 space-y-2.5 bg-[#18181c]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Mode</span>
              <select
                value={tf.blendMode}
                onChange={(e) => updateClipTransform(clip.id, { blendMode: e.target.value as any })}
                className="bg-[#1f1f26] border border-[#2d2d38] rounded px-2 py-0.5 text-white text-[11px] focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="screen">Screen</option>
                <option value="multiply">Multiply</option>
                <option value="overlay">Overlay</option>
                <option value="lighten">Lighten</option>
                <option value="darken">Darken</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Opacity</span>
                <span className="text-neutral-300 font-mono text-[10px]">{Math.round(tf.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(tf.opacity * 100)}
                onChange={(e) => updateClipTransform(clip.id, { opacity: parseFloat(e.target.value) / 100 })}
                className="w-full h-1 bg-[#282832] rounded appearance-none cursor-pointer accent-[#00e5ff]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Stabilize Section Accordion */}
      <div className="border border-[#25252d] bg-[#1a1a1e] rounded overflow-hidden">
        <div
          onClick={() => setIsStabilizeOpen(!isStabilizeOpen)}
          className="flex items-center justify-between px-3 py-2 bg-[#1d1d23] hover:bg-[#22222a] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 text-[11.5px] font-medium text-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStabilizeEnabled(!stabilizeEnabled);
              }}
              className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${
                stabilizeEnabled ? 'bg-[#00e5ff] border-[#00e5ff] text-black' : 'border-[#444] bg-[#18181c]'
              }`}
            >
              {stabilizeEnabled && <Check size={10} strokeWidth={3} />}
            </button>
            <span>Stabilize</span>
            <Diamond size={11} className="text-[#a855f7] fill-[#a855f7]" />
            {isStabilizeOpen ? <ChevronUp size={12} className="text-neutral-400" /> : <ChevronDown size={12} className="text-neutral-400" />}
          </div>
        </div>

        {isStabilizeOpen && (
          <div className="p-3 text-[11px] text-neutral-400 bg-[#18181c]">
            <p>Gyroflow algorithmic camera stabilizer active. Shaky frames are automatically smoothed in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
};
