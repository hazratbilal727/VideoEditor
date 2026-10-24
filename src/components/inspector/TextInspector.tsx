import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';
import { SliderInput } from '../common/SliderInput';

interface Props {
  clip: TimelineClip;
}

export const TextInspector: React.FC<Props> = ({ clip }) => {
  const { updateClipText } = useEditorStore();
  const txt = clip.text;

  if (!txt) {
    return <div className="text-neutral-500 text-xs p-2">Not a text clip.</div>;
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Content Textarea */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Text Content
        </span>
        <textarea
          rows={3}
          value={txt.content}
          onChange={(e) => updateClipText(clip.id, { content: e.target.value })}
          className="w-full bg-[#111111] border border-[#2d2d2d] rounded p-2 text-white font-mono text-xs focus:outline-none focus:border-white resize-y"
          placeholder="Enter text..."
        />
      </div>

      {/* Typography settings */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2.5">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Typography
        </span>

        {/* Font Family */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-mono">FONT</span>
          <select
            value={txt.fontFamily}
            onChange={(e) => updateClipText(clip.id, { fontFamily: e.target.value })}
            className="bg-[#121212] border border-[#2b2b2b] text-neutral-200 px-2 py-1 rounded text-[11px] focus:outline-none w-36"
          >
            <option value="system-ui, sans-serif">Modern Sans</option>
            <option value="Georgia, serif">Editorial Serif</option>
            <option value="Courier New, monospace">Terminal Monospace</option>
            <option value="Impact, sans-serif">Bold Headline</option>
            <option value="Arial, sans-serif">Arial Standard</option>
          </select>
        </div>

        <SliderInput
          label="Font Size"
          value={txt.fontSize}
          min={12}
          max={160}
          step={1}
          unit="px"
          onChange={(v) => updateClipText(clip.id, { fontSize: v })}
          defaultValue={48}
        />

        {/* Alignment */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400 font-mono">ALIGN</span>
          <div className="flex items-center gap-1">
            {(['left', 'center', 'right'] as const).map((al) => (
              <button
                key={al}
                onClick={() => updateClipText(clip.id, { align: al })}
                className={`p-1.5 rounded border ${
                  txt.align === al
                    ? 'bg-white text-black border-white'
                    : 'bg-[#141414] text-neutral-400 border-[#262626] hover:text-white'
                }`}
              >
                {al === 'left' && <AlignLeft size={13} />}
                {al === 'center' && <AlignCenter size={13} />}
                {al === 'right' && <AlignRight size={13} />}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400 font-mono">TEXT COLOR</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={txt.color}
              onChange={(e) => updateClipText(clip.id, { color: e.target.value })}
              className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
            />
            <span className="font-mono text-[11px] text-neutral-300">{txt.color.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Box & Animation */}
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2.5">
        <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
          Animation & Background Box
        </span>

        {/* Animation */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-mono">ANIMATION</span>
          <select
            value={txt.animation}
            onChange={(e) => updateClipText(clip.id, { animation: e.target.value as typeof txt.animation })}
            className="bg-[#121212] border border-[#2b2b2b] text-neutral-200 px-2 py-1 rounded text-[11px] focus:outline-none w-36"
          >
            <option value="none">None (Static)</option>
            <option value="fade">Smooth Fade In</option>
            <option value="typewriter">Typewriter Reveal</option>
            <option value="slide-up">Slide Up</option>
            <option value="scale-in">Scale In Pulse</option>
          </select>
        </div>

        {/* Background Box */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400 font-mono">BACKDROP BOX</span>
          <input
            type="checkbox"
            checked={txt.backgroundBox}
            onChange={(e) => updateClipText(clip.id, { backgroundBox: e.target.checked })}
            className="w-4 h-4 rounded bg-[#111] border-[#333] accent-white"
          />
        </div>

        {txt.backgroundBox && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-neutral-400 font-mono">BOX COLOR</span>
            <input
              type="color"
              value={txt.backgroundColor || '#000000'}
              onChange={(e) => updateClipText(clip.id, { backgroundColor: e.target.value })}
              className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
