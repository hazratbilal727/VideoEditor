import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

export const ProjectSettingsModal: React.FC = () => {
  const {
    project,
    isProjectSettingsModalOpen,
    setProjectSettingsModalOpen,
    updateProjectSettings,
  } = useEditorStore();

  const [name, setName] = useState(project.settings.name);
  const [width, setWidth] = useState(project.settings.width);
  const [height, setHeight] = useState(project.settings.height);
  const [fps, setFps] = useState(project.settings.fps);
  const [sampleRate, setSampleRate] = useState(project.settings.sampleRate);

  if (!isProjectSettingsModalOpen) return null;

  const handleSave = () => {
    updateProjectSettings({
      name,
      width,
      height,
      fps,
      sampleRate,
    });
    setProjectSettingsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-lg w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-xs text-neutral-300">
        <div className="h-11 bg-[#181818] border-b border-[#242424] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-white" />
            <span className="font-semibold text-white text-sm">Project Settings</span>
          </div>
          <button
            onClick={() => setProjectSettingsModalOpen(false)}
            className="p-1 hover:bg-[#262626] rounded text-neutral-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              PROJECT NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                WIDTH (PX)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 1920)}
                className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                HEIGHT (PX)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 1080)}
                className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                TIMELINE FPS
              </label>
              <select
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-white"
              >
                <option value="24">24 FPS (Cinematic Film)</option>
                <option value="25">25 FPS (PAL Standard)</option>
                <option value="30">30 FPS (NTSC Standard)</option>
                <option value="60">60 FPS (High Motion)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                AUDIO SAMPLE RATE
              </label>
              <select
                value={sampleRate}
                onChange={(e) => setSampleRate(parseInt(e.target.value))}
                className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-white"
              >
                <option value="44100">44,100 Hz (CD Quality)</option>
                <option value="48000">48,000 Hz (Broadcast Quality)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="h-12 bg-[#181818] border-t border-[#242424] px-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setProjectSettingsModalOpen(false)}
            className="px-3.5 py-1.5 rounded bg-[#222222] hover:bg-[#2c2c2c] text-neutral-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 rounded bg-white text-black hover:bg-neutral-200 font-semibold"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
