import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { TransformInspector } from './TransformInspector';
import { ColorInspector } from './ColorInspector';
import { TextInspector } from './TextInspector';
import { AudioInspector } from './AudioInspector';
import { SpeedInspector } from './SpeedInspector';
import { AnimationInspector } from './AnimationInspector';
import { ProjectInspector } from './ProjectInspector';

interface Props {
  width?: number;
}

export const PropertiesInspector: React.FC<Props> = ({ width = 340 }) => {
  const {
    project,
    selectedClipIds,
    activeInspectorTab,
    setActiveInspectorTab,
  } = useEditorStore();

  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'remove_bg' | 'mask' | 'retouch'>('basic');

  const selectedClip = project.clips.find((c) => selectedClipIds.includes(c.id));

  // Determine available tabs
  const isVideo = selectedClip?.type === 'video' || selectedClip?.type === 'image';
  const isAudio = selectedClip?.type === 'audio';
  const isText = selectedClip?.type === 'text';

  // CapCut Inspector Tabs
  const tabs = [
    { id: 'video' as const, label: 'Video', show: true },
    { id: 'speed' as const, label: 'Speed', show: true },
    { id: 'animation' as const, label: 'Animation', show: true },
    { id: 'adjustments' as const, label: 'Adjust', show: true },
    { id: 'ai_stylize' as const, label: 'AI stylize', show: true },
  ];

  return (
    <aside
      style={{ width: `${width}px` }}
      className="h-full bg-[#151518] border-l border-[#232328] flex flex-col select-none text-xs shrink-0 overflow-hidden"
    >
      {/* Top Main Inspector Tabs: Video | Speed | Animation | Adjust | AI stylize */}
      <div className="flex items-center border-b border-[#232328] bg-[#111114] px-2 h-10 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive =
            (activeInspectorTab === tab.id) ||
            (tab.id === 'video' && (activeInspectorTab === 'video' || activeInspectorTab === 'text' || activeInspectorTab === 'project')) ||
            (tab.id === 'adjustments' && activeInspectorTab === 'adjustments');

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'ai_stylize') {
                  setActiveInspectorTab('adjustments');
                } else {
                  setActiveInspectorTab(tab.id as any);
                }
              }}
              className={`px-3 py-2 text-[12px] font-normal transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-[#00e5ff] font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#00e5ff] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Tabs under Video: Basic | Remove BG | Mask | Retouch */}
      {(activeInspectorTab === 'video' || activeInspectorTab === 'project' || activeInspectorTab === 'text') && (
        <div className="px-3 py-2 bg-[#151518] border-b border-[#202026]">
          <div className="flex items-center bg-[#1d1d23] p-0.5 rounded-[5px] text-[11px]">
            <button
              onClick={() => setActiveSubTab('basic')}
              className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
                activeSubTab === 'basic'
                  ? 'bg-[#2a2a34] text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setActiveSubTab('remove_bg')}
              className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
                activeSubTab === 'remove_bg'
                  ? 'bg-[#2a2a34] text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Remove BG
            </button>
            <button
              onClick={() => setActiveSubTab('mask')}
              className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
                activeSubTab === 'mask'
                  ? 'bg-[#2a2a34] text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Mask
            </button>
            <button
              onClick={() => setActiveSubTab('retouch')}
              className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
                activeSubTab === 'retouch'
                  ? 'bg-[#2a2a34] text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Retouch
            </button>
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {selectedClip ? (
          <>
            {(activeInspectorTab === 'video' || activeInspectorTab === 'project') && (
              <TransformInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'text' && isText && (
              <TextInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'audio' && (
              <AudioInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'speed' && (
              <SpeedInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'animation' && (
              <AnimationInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'adjustments' && (
              <ColorInspector clip={selectedClip} />
            )}
          </>
        ) : (
          <ProjectInspector />
        )}
      </div>
    </aside>
  );
};
