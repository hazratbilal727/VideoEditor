import React, { useRef } from 'react';
import {
  Folder,
  Music,
  Type,
  Smile,
  Sparkles,
  Shuffle,
  FileText,
  Palette,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { MediaLibrary } from './MediaLibrary';
import { AudioLibrary } from './AudioLibrary';
import { TextLibrary } from './TextLibrary';
import { StickersLibrary } from './StickersLibrary';
import { EffectsLibrary } from './EffectsLibrary';
import { TransitionsLibrary } from './TransitionsLibrary';
import { AdjustmentsLibrary } from './AdjustmentsLibrary';

interface Props {
  width?: number;
}

export const LeftPanel: React.FC<Props> = ({ width = 440 }) => {
  const { activeLeftTab, setActiveLeftTab } = useEditorStore();
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'media' as const, label: 'Media', icon: <Folder size={14} /> },
    { id: 'audio' as const, label: 'Audio', icon: <Music size={14} /> },
    { id: 'text' as const, label: 'Text', icon: <Type size={14} /> },
    { id: 'stickers' as const, label: 'Stickers', icon: <Smile size={14} /> },
    { id: 'effects' as const, label: 'Effects', icon: <Sparkles size={14} /> },
    { id: 'transitions' as const, label: 'Transitions', icon: <Shuffle size={14} /> },
    { id: 'captions' as const, label: 'Captions', icon: <FileText size={14} /> },
    { id: 'filters' as const, label: 'Filters', icon: <Palette size={14} /> },
    { id: 'adjustments' as const, label: 'Adjustments', icon: <SlidersHorizontal size={14} /> },
  ];

  const handleScrollRight = () => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft += 80;
    }
  };

  return (
    <div
      style={{ width: `${width}px` }}
      className="flex flex-col h-full bg-[#141416] border-r border-[#232328] select-none shrink-0 overflow-hidden"
    >
      {/* CapCut Top Tab Strip with Cyan active state */}
      <div className="flex items-center bg-[#101012] border-b border-[#232328] relative px-1 h-12">
        <div
          ref={tabsScrollRef}
          className="flex-1 flex items-center overflow-x-auto no-scrollbar scroll-smooth"
        >
          {tabs.map((tab) => {
            const isActive = activeLeftTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLeftTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 px-2.5 min-w-[50px] transition-all relative group cursor-pointer ${
                  isActive
                    ? 'text-[#00e5ff] font-medium'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className={`mb-0.5 transition-transform ${isActive ? 'text-[#00e5ff]' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll arrow to right */}
        <button
          onClick={handleScrollRight}
          className="w-5 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors cursor-pointer shrink-0 bg-gradient-to-l from-[#101012] via-[#101012] to-transparent pl-1"
          title="Scroll tabs"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-[#141416]">
        {activeLeftTab === 'media' && <MediaLibrary />}
        {activeLeftTab === 'audio' && <AudioLibrary />}
        {activeLeftTab === 'text' && <TextLibrary />}
        {activeLeftTab === 'stickers' && <StickersLibrary />}
        {activeLeftTab === 'effects' && <EffectsLibrary />}
        {activeLeftTab === 'transitions' && <TransitionsLibrary />}
        {activeLeftTab === 'captions' && <TextLibrary />}
        {activeLeftTab === 'filters' && <EffectsLibrary />}
        {activeLeftTab === 'adjustments' && <AdjustmentsLibrary />}
      </div>
    </div>
  );
};
