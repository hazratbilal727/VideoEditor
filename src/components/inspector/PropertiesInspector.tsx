import React from 'react';
import { Move, Palette, Volume2, Type, Sliders, Film } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { TransformInspector } from './TransformInspector';
import { ColorInspector } from './ColorInspector';
import { TextInspector } from './TextInspector';
import { AudioInspector } from './AudioInspector';
import { ProjectInspector } from './ProjectInspector';

export const PropertiesInspector: React.FC = () => {
  const {
    project,
    selectedClipIds,
    activeInspectorTab,
    setActiveInspectorTab,
  } = useEditorStore();

  const selectedClip = project.clips.find((c) => selectedClipIds.includes(c.id));

  const tabs = [
    { id: 'transform' as const, label: 'Transform', icon: <Move size={13} />, show: !!selectedClip },
    { id: 'color' as const, label: 'Color', icon: <Palette size={13} />, show: !!selectedClip },
    {
      id: 'audio' as const,
      label: 'Audio',
      icon: <Volume2 size={13} />,
      show: !!selectedClip && (selectedClip.type === 'audio' || selectedClip.type === 'video'),
    },
    { id: 'text' as const, label: 'Text', icon: <Type size={13} />, show: !!selectedClip && selectedClip.type === 'text' },
    { id: 'project' as const, label: 'Project', icon: <Film size={13} />, show: true },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <aside className="w-80 h-full bg-[#141414] border-l border-[#242424] flex flex-col select-none text-xs">
      {/* Header with Title and Selected Clip Info */}
      <div className="h-10 border-b border-[#222222] px-3 flex items-center justify-between bg-[#111111]">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Sliders size={13} className="text-neutral-400 shrink-0" />
          <span className="font-mono text-[11px] text-neutral-300 font-semibold tracking-wider uppercase truncate">
            {selectedClip ? selectedClip.name : 'Inspector'}
          </span>
        </div>
        {selectedClip && (
          <span className="font-mono text-[10px] bg-[#1f1f1f] border border-[#2b2b2b] px-1.5 py-0.5 rounded text-neutral-400 uppercase">
            {selectedClip.type}
          </span>
        )}
      </div>

      {/* Inspector Tabs */}
      <div className="flex items-center border-b border-[#222222] bg-[#0f0f0f] px-1 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const isActive = activeInspectorTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveInspectorTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-2 text-[11px] border-b-2 font-mono tracking-tight transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-white text-white font-medium bg-[#171717]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        {!selectedClip && activeInspectorTab !== 'project' ? (
          <ProjectInspector />
        ) : (
          <>
            {activeInspectorTab === 'transform' && selectedClip && (
              <TransformInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'color' && selectedClip && (
              <ColorInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'audio' && selectedClip && (
              <AudioInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'text' && selectedClip && (
              <TextInspector clip={selectedClip} />
            )}
            {activeInspectorTab === 'project' && <ProjectInspector />}
          </>
        )}
      </div>
    </aside>
  );
};
