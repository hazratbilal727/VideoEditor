import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';
import { SliderInput } from '../common/SliderInput';

interface Props {
  clip: TimelineClip;
}

export const AudioInspector: React.FC<Props> = ({ clip }) => {
  const { updateClipAudio } = useEditorStore();
  const aud = clip.audio;

  return (
    <div className="space-y-4 text-xs">
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-2.5">
        <div className="flex items-center justify-between pb-1">
          <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
            Audio Levels & Stereo Pan
          </span>
          <button
            onClick={() => updateClipAudio(clip.id, { muted: !aud.muted })}
            className={`p-1 rounded ${
              aud.muted ? 'bg-white text-black' : 'bg-[#222] text-neutral-400 hover:text-white'
            }`}
            title="Toggle Mute"
          >
            {aud.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>

        <SliderInput
          label="Volume"
          value={aud.volume * 100}
          min={0}
          max={200}
          step={1}
          unit="%"
          onChange={(v) => updateClipAudio(clip.id, { volume: v / 100 })}
          defaultValue={100}
        />

        <SliderInput
          label="Stereo Pan"
          value={aud.pan * 100}
          min={-100}
          max={100}
          step={1}
          unit=""
          onChange={(v) => updateClipAudio(clip.id, { pan: v / 100 })}
          defaultValue={0}
        />

        <SliderInput
          label="Fade In"
          value={aud.fadeIn}
          min={0}
          max={5}
          step={0.1}
          unit="s"
          onChange={(v) => updateClipAudio(clip.id, { fadeIn: v })}
          defaultValue={0}
        />

        <SliderInput
          label="Fade Out"
          value={aud.fadeOut}
          min={0}
          max={5}
          step={0.1}
          unit="s"
          onChange={(v) => updateClipAudio(clip.id, { fadeOut: v })}
          defaultValue={0}
        />
      </div>
    </div>
  );
};
