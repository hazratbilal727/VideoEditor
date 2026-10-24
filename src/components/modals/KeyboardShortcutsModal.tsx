import React from 'react';
import { X, Command } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setShortcutsModalOpen } = useEditorStore();

  if (!isShortcutsModalOpen) return null;

  const shortcuts = [
    { key: 'Space', action: 'Play / Pause playback' },
    { key: 'Ctrl + Z', action: 'Undo last editing step' },
    { key: 'Ctrl + Y', action: 'Redo previously undone action' },
    { key: 'Ctrl + S', action: 'Save project to .mono file' },
    { key: 'S  or  Ctrl + B', action: 'Split clip at current playhead' },
    { key: 'Del / Backspace', action: 'Delete selected clips' },
    { key: 'Ctrl + D', action: 'Duplicate selected clips' },
    { key: 'Left / Right Arrow', action: 'Step 1 frame backward / forward' },
    { key: 'Home / End', action: 'Jump to timeline start / end' },
    { key: 'N', action: 'Toggle magnetic clip snapping' },
    { key: 'V', action: 'Selection tool' },
    { key: 'C', action: 'Razor / Split tool' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-lg w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-xs text-neutral-300">
        <div className="h-11 bg-[#181818] border-b border-[#242424] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Command size={14} className="text-white" />
            <span className="font-semibold text-white text-sm">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1 hover:bg-[#262626] rounded text-neutral-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 bg-[#191919] rounded border border-[#222222]"
            >
              <span className="text-neutral-300 text-[11px]">{sc.action}</span>
              <kbd className="px-2 py-0.5 bg-[#252525] border border-[#353535] rounded font-mono text-[10px] text-white shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="h-11 bg-[#181818] border-t border-[#242424] px-4 flex items-center justify-end">
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="px-4 py-1.5 rounded bg-white text-black hover:bg-neutral-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
