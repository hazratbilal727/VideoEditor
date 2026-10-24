import React from 'react';
import {
  Video,
  Music,
  Type,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Trash2,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineTrack } from '../../types/editor';

interface Props {
  track: TimelineTrack;
}

export const TimelineTrackHeader: React.FC<Props> = ({ track }) => {
  const {
    toggleTrackLock,
    toggleTrackVisibility,
    toggleTrackMute,
    toggleTrackSolo,
    deleteTrack,
  } = useEditorStore();

  const getTrackIcon = () => {
    switch (track.type) {
      case 'video':
        return <Video size={13} className="text-neutral-400" />;
      case 'audio':
        return <Music size={13} className="text-neutral-400" />;
      case 'text':
        return <Type size={13} className="text-neutral-400" />;
    }
  };

  return (
    <div
      style={{ height: track.height }}
      className="w-56 bg-[#161616] border-b border-[#242424] px-2.5 flex items-center justify-between text-xs select-none border-r border-[#262626] shrink-0"
    >
      {/* Icon & Name */}
      <div className="flex items-center gap-2 overflow-hidden pr-1">
        <div className="p-1 bg-[#202020] rounded border border-[#2e2e2e] shrink-0">
          {getTrackIcon()}
        </div>
        <span
          className="font-medium text-neutral-200 text-[11px] truncate tracking-tight"
          title={track.name}
        >
          {track.name}
        </span>
      </div>

      {/* Controls: Lock, Visibility, Mute, Solo, Delete */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Lock */}
        <button
          onClick={() => toggleTrackLock(track.id)}
          className={`p-1 rounded ${
            track.isLocked ? 'bg-[#333] text-white' : 'text-neutral-500 hover:text-neutral-300'
          }`}
          title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
        >
          {track.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>

        {/* Visibility */}
        <button
          onClick={() => toggleTrackVisibility(track.id)}
          className={`p-1 rounded ${
            !track.isVisible ? 'bg-[#333] text-neutral-400' : 'text-neutral-400 hover:text-white'
          }`}
          title={track.isVisible ? 'Hide Track' : 'Show Track'}
        >
          {track.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        {/* Mute (Audio / Video) */}
        {(track.type === 'audio' || track.type === 'video') && (
          <button
            onClick={() => toggleTrackMute(track.id)}
            className={`p-1 rounded ${
              track.isMuted ? 'bg-[#333] text-white' : 'text-neutral-400 hover:text-white'
            }`}
            title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
          >
            {track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        )}

        {/* Solo */}
        {(track.type === 'audio' || track.type === 'video') && (
          <button
            onClick={() => toggleTrackSolo(track.id)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold ${
              track.isSolo
                ? 'bg-white text-black'
                : 'text-neutral-500 hover:text-neutral-300 bg-[#202020]'
            }`}
            title="Solo Track"
          >
            S
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => deleteTrack(track.id)}
          className="p-1 text-neutral-600 hover:text-neutral-300 rounded"
          title="Delete Track"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};
