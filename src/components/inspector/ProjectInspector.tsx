import React from 'react';
import { Film, Clock, Layers, Sliders } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

export const ProjectInspector: React.FC = () => {
  const { project, setProjectSettingsModalOpen } = useEditorStore();
  const totalClips = project.clips.length;
  const totalDuration = Math.max(0, ...project.clips.map((c) => c.start + c.duration));

  return (
    <div className="space-y-4 text-xs">
      <div className="bg-[#181818] border border-[#242424] p-3 rounded space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-neutral-300 font-semibold tracking-wider">
            Project Overview
          </span>
          <button
            onClick={() => setProjectSettingsModalOpen(true)}
            className="text-[10px] text-neutral-400 hover:text-white underline font-mono"
          >
            Edit Settings
          </button>
        </div>

        <div className="space-y-2 text-neutral-400 pt-1">
          <div className="flex items-center justify-between">
            <span>Resolution</span>
            <span className="font-mono text-white">
              {project.settings.width} × {project.settings.height}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Frame Rate</span>
            <span className="font-mono text-white">{project.settings.fps} FPS</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Audio Rate</span>
            <span className="font-mono text-white">{project.settings.sampleRate} Hz</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Total Duration</span>
            <span className="font-mono text-white">{totalDuration.toFixed(2)}s</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Clips on Timeline</span>
            <span className="font-mono text-white">{totalClips}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Active Tracks</span>
            <span className="font-mono text-white">{project.tracks.length}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#161616] border border-[#222222] rounded text-[11px] text-neutral-500 space-y-1.5">
        <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
          <Film size={13} />
          <span>Quick Editing Tip</span>
        </div>
        <p>
          Select any clip on the timeline or in preview to unlock transforms, color grading, audio envelopes, and typography controls.
        </p>
      </div>
    </div>
  );
};
