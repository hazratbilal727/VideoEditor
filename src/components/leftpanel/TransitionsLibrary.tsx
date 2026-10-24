import React from 'react';
import { Shuffle, ArrowRight, Sun, Moon, Maximize, MoveRight } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TransitionType } from '../../types/editor';

interface TransitionItem {
  type: TransitionType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const TRANSITIONS: TransitionItem[] = [
  {
    type: 'cross-dissolve',
    name: 'Cross Dissolve',
    description: 'Smooth alpha blending between consecutive shots',
    icon: <Shuffle size={14} />,
  },
  {
    type: 'fade-to-black',
    name: 'Fade to Black',
    description: 'Classic cinematic cut to darkness',
    icon: <Moon size={14} />,
  },
  {
    type: 'fade-to-white',
    name: 'Flash to White',
    description: 'High-exposure dramatic flash transition',
    icon: <Sun size={14} />,
  },
  {
    type: 'slide-left',
    name: 'Slide Left',
    description: 'Smooth lateral push from right to left',
    icon: <ArrowRight size={14} />,
  },
  {
    type: 'slide-right',
    name: 'Slide Right',
    description: 'Lateral push from left to right',
    icon: <MoveRight size={14} />,
  },
  {
    type: 'zoom-in',
    name: 'Zoom In Pulse',
    description: 'Dynamic scale ramp entrance',
    icon: <Maximize size={14} />,
  },
];

export const TransitionsLibrary: React.FC = () => {
  const { project, selectedClipIds, updateClip, setStatusMessage } = useEditorStore();

  const handleApplyTransition = (type: TransitionType, position: 'in' | 'out') => {
    if (selectedClipIds.length === 0) {
      setStatusMessage('Select a clip on the timeline first');
      return;
    }

    selectedClipIds.forEach((clipId) => {
      const clip = project.clips.find((c) => c.id === clipId);
      if (!clip) return;

      if (position === 'in') {
        updateClip(clipId, {
          transitionIn: { type, duration: 0.8 },
        });
      } else {
        updateClip(clipId, {
          transitionOut: { type, duration: 0.8 },
        });
      }
    });

    setStatusMessage(`Applied ${type} transition to ${selectedClipIds.length} clip(s)`);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-xs p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
        <Shuffle size={14} />
        <span>Transitions Library</span>
      </div>
      <p className="text-[11px] text-neutral-500">
        Click to apply seamlessly to the In or Out point of selected clip.
      </p>

      <div className="space-y-2 pt-1">
        {TRANSITIONS.map((trans) => (
          <div
            key={trans.type}
            className="p-2.5 bg-[#1a1a1a] border border-[#262626] hover:border-[#383838] rounded flex flex-col gap-2 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#242424] text-neutral-300 rounded">
                  {trans.icon}
                </div>
                <div>
                  <span className="font-medium text-white block text-[11px]">{trans.name}</span>
                  <span className="text-[10px] text-neutral-500">{trans.description}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-[#222222]">
              <button
                onClick={() => handleApplyTransition(trans.type, 'in')}
                className="flex-1 py-1 bg-[#222222] hover:bg-white hover:text-black text-neutral-300 rounded text-[10px] font-mono tracking-wider transition-colors"
              >
                + Apply In (0.8s)
              </button>
              <button
                onClick={() => handleApplyTransition(trans.type, 'out')}
                className="flex-1 py-1 bg-[#222222] hover:bg-white hover:text-black text-neutral-300 rounded text-[10px] font-mono tracking-wider transition-colors"
              >
                + Apply Out (0.8s)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
