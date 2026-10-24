import React from 'react';
import { Volume2, Play, Plus, Sparkles } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { generateSyntheticAudio } from '../../services/syntheticMedia';
import { MediaAsset, TimelineClip } from '../../types/editor';

const BUILT_IN_SOUNDS = [
  { name: '120BPM Studio Drum Beat', type: 'beat' as const, duration: 6 },
  { name: 'Deep Sub Bass Riser', type: 'riser' as const, duration: 5 },
  { name: '1kHz Studio Calibration Tone', type: 'tone' as const, duration: 4 },
];

export const AudioLibrary: React.FC = () => {
  const { project, playhead, addMediaAsset, addClip, setStatusMessage } = useEditorStore();

  const handleInsertAudio = async (item: typeof BUILT_IN_SOUNDS[0]) => {
    setStatusMessage(`Synthesizing "${item.name}"...`);
    try {
      const syn = await generateSyntheticAudio(item.type, item.duration);
      const asset: MediaAsset = {
        id: 'asset_' + Math.random().toString(36).substring(2, 9),
        name: `${item.name}.wav`,
        type: 'audio',
        url: syn.url,
        blob: syn.blob,
        duration: item.duration,
        waveformData: syn.waveform,
        dateAdded: Date.now(),
      };
      addMediaAsset(asset);

      // Add to audio track
      let targetTrack = project.tracks.find((t) => t.type === 'audio');
      if (!targetTrack) {
        targetTrack = project.tracks[project.tracks.length - 1];
      }

      const clip: TimelineClip = {
        id: 'clip_' + Math.random().toString(36).substring(2, 9),
        trackId: targetTrack.id,
        assetId: asset.id,
        type: 'audio',
        name: asset.name,
        start: playhead,
        duration: asset.duration,
        trimStart: 0,
        trimEnd: asset.duration,
        sourceDuration: asset.duration,
        speed: 1,
        reverse: false,
        transform: {
          x: 0,
          y: 0,
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
          muted: false,
          pan: 0,
          fadeIn: 0.1,
          fadeOut: 0.2,
        },
        transitionIn: { type: 'none', duration: 0 },
        transitionOut: { type: 'none', duration: 0 },
        keyframes: [],
      };

      addClip(clip);
      setStatusMessage(`Added "${item.name}" to audio track`);
    } catch {
      setStatusMessage('Error synthesizing audio');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-xs p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
        <Volume2 size={14} />
        <span>Offline Synthesizer & Audio FX</span>
      </div>
      <p className="text-[11px] text-neutral-500">
        Pure mathematical audio generation rendered via offline Web Audio API. 100% offline, latency-free.
      </p>

      <div className="space-y-2 pt-1">
        {BUILT_IN_SOUNDS.map((sound, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 bg-[#1a1a1a] border border-[#262626] hover:border-[#383838] rounded transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-medium text-white text-[11px]">{sound.name}</span>
              <span className="text-[10px] text-neutral-500 font-mono">{sound.duration}s • 44.1kHz WAV Stereo</span>
            </div>
            <button
              onClick={() => handleInsertAudio(sound)}
              className="flex items-center gap-1 bg-[#242424] hover:bg-white hover:text-black text-neutral-200 px-2.5 py-1 rounded transition-colors text-[11px]"
              title="Add to Timeline at playhead"
            >
              <Plus size={12} />
              <span>Add</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
