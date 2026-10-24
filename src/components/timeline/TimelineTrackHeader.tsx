import React from 'react';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Edit3,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineTrack } from '../../types/editor';

interface Props {
  track: TimelineTrack;
  index: number;
}

export const TimelineTrackHeader: React.FC<Props> = ({ track, index }) => {
  const {
    toggleTrackLock,
    toggleTrackVisibility,
    toggleTrackMute,
    setStatusMessage,
  } = useEditorStore();

  return (
    <div
      style={{ height: track.height }}
      className="w-44 bg-[#141416] border-b border-[#202026] px-2 flex items-center justify-between text-xs select-none border-r border-[#232328] shrink-0"
    >
      {/* Left: Cover button on main track, or track badge */}
      {index === 0 && track.type === 'video' ? (
        <button
          onClick={() => setStatusMessage('Set video cover thumbnail')}
          className="flex items-center gap-1 bg-[#202028] hover:bg-[#282834] border border-[#2e2e3a] text-neutral-200 hover:text-white px-2 py-1 rounded-[4px] text-[11px] transition-colors cursor-pointer"
          title="Edit Video Cover"
        >
          <Edit3 size={11} className="text-neutral-400" />
          <span>Cover</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 overflow-hidden pr-1">
          <span className="font-mono text-[10.5px] text-neutral-400 truncate">
            {track.type === 'video' ? `V${index + 1}` : track.type === 'audio' ? `A${index}` : 'T1'}
          </span>
        </div>
      )}

      {/* Right Controls: Lock, Eye, Volume, More */}
      <div className="flex items-center gap-1 text-neutral-400">
        {/* Lock */}
        <button
          onClick={() => toggleTrackLock(track.id)}
          className={`p-1 rounded transition-colors cursor-pointer ${
            track.isLocked ? 'text-white bg-[#22222a]' : 'hover:text-white hover:bg-[#202026]'
          }`}
          title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
        >
          {track.isLocked ? <Lock size={11} /> : <Unlock size={11} className="opacity-70" />}
        </button>

        {/* Visibility / Solo */}
        <button
          onClick={() => toggleTrackVisibility(track.id)}
          className={`p-1 rounded transition-colors cursor-pointer ${
            !track.isVisible ? 'text-neutral-600' : 'hover:text-white hover:bg-[#202026]'
          }`}
          title={track.isVisible ? 'Hide Track' : 'Show Track'}
        >
          {track.isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
        </button>

        {/* Mute */}
        <button
          onClick={() => toggleTrackMute(track.id)}
          className={`p-1 rounded transition-colors cursor-pointer ${
            track.isMuted ? 'text-white bg-[#22222a]' : 'hover:text-white hover:bg-[#202026]'
          }`}
          title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
        >
          {track.isMuted ? <VolumeX size={11} /> : <Volume2 size={11} className="opacity-80" />}
        </button>

        {/* More options */}
        <button
          className="p-1 hover:text-white hover:bg-[#202026] rounded transition-colors cursor-pointer text-neutral-500"
          title="Track Options"
        >
          <MoreHorizontal size={11} />
        </button>
      </div>
    </div>
  );
};
