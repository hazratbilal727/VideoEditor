import React, { useState } from 'react';
import { X, Download, Film, Camera, Music, AlertCircle, CheckCircle } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { ExportProgress, exportEngine } from '../../services/exportEngine';
import { ExportSettings } from '../../types/editor';

export const ExportModal: React.FC = () => {
  const {
    project,
    isExportModalOpen,
    setExportModalOpen,
    setStatusMessage,
  } = useEditorStore();

  const [format, setFormat] = useState<ExportSettings['format']>('mp4');
  const [resolutionPreset, setResolutionPreset] = useState<'1080p' | '720p' | '4k' | 'vertical' | 'square'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [quality, setQuality] = useState<ExportSettings['quality']>('high');
  const [filename, setFilename] = useState<string>(
    `${project.settings.name.replace(/\s+/g, '_')}_export`
  );

  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  if (!isExportModalOpen) return null;

  const resolutionMap = {
    '1080p': { width: 1920, height: 1080, label: '1080p Full HD (1920×1080)' },
    '720p': { width: 1280, height: 720, label: '720p HD (1280×720)' },
    '4k': { width: 3840, height: 2160, label: '4K Ultra HD (3840×2160)' },
    'vertical': { width: 1080, height: 1920, label: '9:16 Vertical (1080×1920)' },
    'square': { width: 1080, height: 1080, label: '1:1 Square (1080×1080)' },
  };

  const bitrateMap = {
    ultra: 16000,
    high: 10000,
    medium: 6000,
    draft: 3000,
  };

  const mediaPoolMap = new Map(
    project.mediaPool.map((m) => [m.id, { url: m.url, type: m.type }])
  );

  const handleStartExport = async () => {
    const selectedRes = resolutionMap[resolutionPreset];
    const settings: ExportSettings = {
      format,
      resolution: selectedRes,
      fps,
      quality,
      bitrateKbps: bitrateMap[quality],
      filename: `${filename}.${format === 'mp4' ? 'mp4' : 'webm'}`,
    };

    setExportProgress({
      status: 'rendering',
      progress: 0,
      currentFrame: 0,
      totalFrames: 100,
      currentTime: 0,
      totalDuration: 10,
      estimatedRemainingSec: 10,
    });

    if (format === 'wav') {
      const urlMap = new Map(project.mediaPool.map((m) => [m.id, m.url]));
      await exportEngine.exportAudioTrack(
        project.settings,
        project.tracks,
        project.clips,
        urlMap,
        (p) => setExportProgress(p)
      );
    } else {
      await exportEngine.exportVideo(
        settings,
        project.settings,
        project.tracks,
        project.clips,
        mediaPoolMap,
        (p) => setExportProgress(p)
      );
    }
  };

  const handleCancel = () => {
    exportEngine.cancelExport();
    setExportProgress(null);
  };

  const handleDownloadSnapshot = () => {
    // Grab canvas currently rendered in preview
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      exportEngine.exportCurrentFrame(canvas, `${filename}_frame.png`, 'image/png');
      setStatusMessage('Snapshot frame exported');
      setExportModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-xs text-neutral-300">
        {/* Header */}
        <div className="h-11 bg-[#181818] border-b border-[#242424] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={14} className="text-white" />
            <span className="font-semibold text-white text-sm">Export Timeline</span>
          </div>
          <button
            onClick={() => {
              if (exportProgress?.status === 'rendering') {
                if (window.confirm('Cancel active export?')) {
                  handleCancel();
                  setExportModalOpen(false);
                }
              } else {
                setExportModalOpen(false);
              }
            }}
            className="p-1 hover:bg-[#262626] rounded text-neutral-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {exportProgress ? (
            /* Progress Display */
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white capitalize">
                  {exportProgress.status === 'completed'
                    ? 'Export Completed!'
                    : exportProgress.status === 'error'
                    ? 'Export Failed'
                    : 'Rendering & Compositing...'}
                </span>
                <span className="font-mono text-white text-sm">
                  {exportProgress.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-[#202020] rounded-full overflow-hidden border border-[#2b2b2b]">
                <div
                  className="h-full bg-white transition-all duration-150"
                  style={{ width: `${exportProgress.progress}%` }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 font-mono bg-[#191919] p-3 rounded border border-[#242424]">
                <div>
                  <span className="text-neutral-500 block">Rendered:</span>
                  <span className="text-white">
                    {exportProgress.currentTime.toFixed(1)}s / {exportProgress.totalDuration.toFixed(1)}s
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Frame:</span>
                  <span className="text-white">
                    {exportProgress.currentFrame} / {exportProgress.totalFrames}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Estimated Remaining:</span>
                  <span className="text-white">
                    {exportProgress.estimatedRemainingSec}s
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Resolution:</span>
                  <span className="text-white">
                    {resolutionMap[resolutionPreset].width}×{resolutionMap[resolutionPreset].height}
                  </span>
                </div>
              </div>

              {/* Actions when completed */}
              {exportProgress.status === 'completed' && exportProgress.downloadUrl && (
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={exportProgress.downloadUrl}
                    download={`${filename}.${format === 'wav' ? 'wav' : format === 'mp4' ? 'mp4' : 'webm'}`}
                    className="flex-1 bg-white text-black py-2 rounded font-semibold text-center hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Download Video File</span>
                  </a>
                  <button
                    onClick={() => {
                      setExportProgress(null);
                      setExportModalOpen(false);
                    }}
                    className="bg-[#242424] hover:bg-[#303030] text-white px-4 py-2 rounded font-medium"
                  >
                    Done
                  </button>
                </div>
              )}

              {exportProgress.status === 'rendering' && (
                <button
                  onClick={handleCancel}
                  className="w-full bg-[#242424] hover:bg-[#333] text-neutral-300 py-1.5 rounded transition-colors"
                >
                  Cancel Export
                </button>
              )}
            </div>
          ) : (
            /* Settings Controls */
            <div className="space-y-3.5">
              {/* File Name */}
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  FILE NAME
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-white"
                />
              </div>

              {/* Format selection */}
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  EXPORT FORMAT
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mp4', 'webm', 'wav'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`py-2 rounded border font-mono text-xs uppercase ${
                        format === fmt
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-[#181818] text-neutral-400 border-[#262626] hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {format !== 'wav' && (
                <>
                  {/* Resolution Preset */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                      RESOLUTION
                    </label>
                    <select
                      value={resolutionPreset}
                      onChange={(e) => setResolutionPreset(e.target.value as typeof resolutionPreset)}
                      className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-white"
                    >
                      <option value="1080p">1080p Full HD (1920×1080)</option>
                      <option value="720p">720p HD (1280×720)</option>
                      <option value="4k">4K Ultra HD (3840×2160)</option>
                      <option value="vertical">9:16 Vertical (1080×1920 Shorts/Reels)</option>
                      <option value="square">1:1 Square (1080×1080)</option>
                    </select>
                  </div>

                  {/* Frame Rate & Quality */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        FRAME RATE (FPS)
                      </label>
                      <select
                        value={fps}
                        onChange={(e) => setFps(parseInt(e.target.value))}
                        className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-white"
                      >
                        <option value="24">24 FPS (Cinematic)</option>
                        <option value="30">30 FPS (Standard)</option>
                        <option value="60">60 FPS (Smooth High-Rate)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        QUALITY / BITRATE
                      </label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value as typeof quality)}
                        className="w-full bg-[#111111] border border-[#2b2b2b] rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-white"
                      >
                        <option value="ultra">Ultra (16 Mbps)</option>
                        <option value="high">High (10 Mbps)</option>
                        <option value="medium">Medium (6 Mbps)</option>
                        <option value="draft">Draft (3 Mbps)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Single Frame snapshot button */}
              <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
                <button
                  onClick={handleDownloadSnapshot}
                  className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-[11px]"
                >
                  <Camera size={13} />
                  <span>Export Current Frame as PNG</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!exportProgress && (
          <div className="h-12 bg-[#181818] border-t border-[#242424] px-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setExportModalOpen(false)}
              className="px-3.5 py-1.5 rounded bg-[#222222] hover:bg-[#2c2c2c] text-neutral-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleStartExport}
              className="px-5 py-1.5 rounded bg-white text-black hover:bg-neutral-200 font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Download size={13} />
              <span>Start Export</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
