import React from 'react';
import { Folder, Music, Type, Shuffle, Sliders } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { MediaLibrary } from './MediaLibrary';
import { AudioLibrary } from './AudioLibrary';
import { TextLibrary } from './TextLibrary';
import { TransitionsLibrary } from './TransitionsLibrary';
import { EffectsLibrary } from './EffectsLibrary';

export const LeftPanel: React.FC = () => {
  const { activeLeftTab, setActiveLeftTab } = useEditorStore();

  const tabs = [
    { id: 'media' as const, label: 'Media', icon: <Folder size={15} /> },
    { id: 'audio' as const, label: 'Audio', icon: <Music size={15} /> },
    { id: 'text' as const, label: 'Text', icon: <Type size={15} /> },
    { id: 'transitions' as const, label: 'Transitions', icon: <Shuffle size={15} /> },
    { id: 'effects' as const, label: 'Effects', icon: <Sliders size={15} /> },
  ];

  return (
    <div className="flex h-full border-r border-[#242424] bg-[#111111] select-none">
      {/* Left Icon Navigation Column */}
      <div className="w-12 bg-[#0c0c0c] border-r border-[#202020] flex flex-col items-center py-2 gap-1.5 shrink-0">
        {tabs.map((tab) => {
          const isActive = activeLeftTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveLeftTab(tab.id)}
              className={`w-9 h-9 rounded flex flex-col items-center justify-center transition-colors ${
                isActive
                  ? 'bg-[#242424] text-white border border-[#383838]'
                  : 'text-neutral-500 hover:text-neutral-200 hover:bg-[#161616]'
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span className="text-[8px] font-mono mt-0.5 tracking-tighter uppercase">{tab.label.slice(0, 4)}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="w-72 flex-1 flex flex-col h-full bg-[#141414] overflow-hidden">
        {activeLeftTab === 'media' && <MediaLibrary />}
        {activeLeftTab === 'audio' && <AudioLibrary />}
        {activeLeftTab === 'text' && <TextLibrary />}
        {activeLeftTab === 'transitions' && <TransitionsLibrary />}
        {activeLeftTab === 'effects' && <EffectsLibrary />}
      </div>
    </div>
  );
};
