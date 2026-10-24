/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useEditorStore } from './store/editorStore';
import { TopBar } from './components/topbar/TopBar';
import { LeftPanel } from './components/leftpanel/LeftPanel';
import { PreviewMonitor } from './components/preview/PreviewMonitor';
import { PropertiesInspector } from './components/inspector/PropertiesInspector';
import { Timeline } from './components/timeline/Timeline';
import { ExportModal } from './components/modals/ExportModal';
import { ProjectSettingsModal } from './components/modals/ProjectSettingsModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { ProjectStorage } from './services/projectStorage';
import { createDefaultSampleAssets } from './services/syntheticMedia';
import { TimelineClip } from './types/editor';

export default function App() {
  const {
    project,
    loadProject,
    addMediaAsset,
    addClip,
    setStatusMessage,
  } = useEditorStore();

  const [timelineHeightPercent, setTimelineHeightPercent] = useState<number>(38);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(430);
  const [inspectorWidth, setInspectorWidth] = useState<number>(340);
  const [isResizingTimeline, setIsResizingTimeline] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Project and default offline media assets
  useEffect(() => {
    const initApp = async () => {
      const saved = ProjectStorage.loadAutosave();
      if (saved && saved.tracks && saved.clips) {
        loadProject(saved);
        setStatusMessage('Autosaved project restored');
        setIsLoaded(true);
        return;
      }

      // Generate default offline sample clips so the user has immediate working content
      try {
        const samples = await createDefaultSampleAssets();
        samples.forEach((asset) => addMediaAsset(asset));

        // Place initial sample clips onto the timeline
        const videoTrack = project.tracks.find((t) => t.type === 'video');
        const audioTrack = project.tracks.find((t) => t.type === 'audio');
        const textTrack = project.tracks.find((t) => t.type === 'text');

        if (videoTrack && samples[0]) {
          const sampleVideo1: TimelineClip = {
            id: 'clip_sample_1',
            trackId: videoTrack.id,
            assetId: samples[0].id,
            type: 'video',
            name: samples[0].name,
            start: 0,
            duration: samples[0].duration,
            trimStart: 0,
            trimEnd: samples[0].duration,
            sourceDuration: samples[0].duration,
            speed: 1,
            reverse: false,
            transform: {
              x: 0,
              y: 0,
              scale: 1.19, // 119% matching CapCut screenshot
              rotation: 0,
              opacity: 1,
              flipH: false,
              flipV: false,
              blendMode: 'normal',
              crop: { top: 0, bottom: 0, left: 0, right: 0 },
            },
            colorGrading: {
              brightness: 0,
              contrast: 0,
              saturation: 0,
              exposure: 0,
              temperature: 0,
              tint: 0,
              vignette: 0,
              grayscale: 0,
              sepia: 0,
              blur: 0,
              sharpen: 0,
              invert: false,
            },
            audio: { volume: 1, muted: false, pan: 0, fadeIn: 0, fadeOut: 0 },
            transitionIn: { type: 'none', duration: 0 },
            transitionOut: { type: 'none', duration: 0 },
            keyframes: [],
          };
          addClip(sampleVideo1);
          useEditorStore.getState().selectClip('clip_sample_1', false);
          useEditorStore.getState().setPlayhead(1.37); // 00:00:01:11
          useEditorStore.getState().setActiveLeftTab('audio');
          useEditorStore.getState().updateProjectSettings({ name: '1129' });
        }

        setStatusMessage('Ready. Offline sample project initialized.');
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    initApp();
  }, []);

  // Periodic autosave every 25 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      ProjectStorage.saveAutosave(useEditorStore.getState().project);
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  // Resize Left Panel
  const handleLeftResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizingLeft(true);
    const startX = e.clientX;
    const startW = leftPanelWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const newW = Math.max(260, Math.min(520, startW + deltaX));
      setLeftPanelWidth(newW);
    };

    const onMouseUp = () => {
      setIsResizingLeft(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Resize Right Inspector
  const handleInspectorResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizingInspector(true);
    const startX = e.clientX;
    const startW = inspectorWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const deltaX = startX - ev.clientX;
      const newW = Math.max(250, Math.min(480, startW + deltaX));
      setInspectorWidth(newW);
    };

    const onMouseUp = () => {
      setIsResizingInspector(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Vertical resize handle between Upper workspace and Timeline
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizingTimeline(true);
    const startY = e.clientY;
    const startPercent = timelineHeightPercent;

    const onMouseMove = (ev: MouseEvent) => {
      const deltaY = startY - ev.clientY;
      const windowH = window.innerHeight;
      const deltaPercent = (deltaY / windowH) * 100;
      const newPercent = Math.max(25, Math.min(65, startPercent + deltaPercent));
      setTimelineHeightPercent(newPercent);
    };

    const onMouseUp = () => {
      setIsResizingTimeline(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090909] text-white overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <TopBar />

      {/* Main Workspace Area (Upper section + Bottom timeline) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Upper Workspace: Left Panel + Center Preview + Right Inspector */}
        <div
          style={{ height: `${100 - timelineHeightPercent}%` }}
          className="flex flex-row overflow-hidden"
        >
          {/* Left Media & Tools Panel */}
          <LeftPanel width={leftPanelWidth} />

          {/* Left Resizer */}
          <div
            onMouseDown={handleLeftResizeMouseDown}
            className={`w-1.5 hover:bg-white cursor-col-resize bg-[#1c1c1c] border-x border-[#242424] transition-colors z-20 flex items-center justify-center shrink-0 ${
              isResizingLeft ? 'bg-white' : ''
            }`}
            title="Drag to resize panel"
          >
            <div className="h-6 w-0.5 bg-[#444] rounded" />
          </div>

          {/* Center Preview Monitor */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0c] overflow-hidden">
            <PreviewMonitor />
          </div>

          {/* Right Resizer */}
          <div
            onMouseDown={handleInspectorResizeMouseDown}
            className={`w-1.5 hover:bg-white cursor-col-resize bg-[#1c1c1c] border-x border-[#242424] transition-colors z-20 flex items-center justify-center shrink-0 ${
              isResizingInspector ? 'bg-white' : ''
            }`}
            title="Drag to resize inspector"
          >
            <div className="h-6 w-0.5 bg-[#444] rounded" />
          </div>

          {/* Right Properties Inspector */}
          <PropertiesInspector width={inspectorWidth} />
        </div>

        {/* Horizontal Resize Bar */}
        <div
          onMouseDown={handleResizeMouseDown}
          className={`h-1.5 bg-[#1a1a1a] hover:bg-white cursor-row-resize border-y border-[#262626] transition-colors z-30 flex items-center justify-center ${
            isResizingTimeline ? 'bg-white' : ''
          }`}
          title="Drag to resize timeline height"
        >
          <div className="w-8 h-0.5 bg-[#444] rounded" />
        </div>

        {/* Bottom Multitrack Timeline */}
        <div
          style={{ height: `${timelineHeightPercent}%` }}
          className="overflow-hidden bg-[#111111]"
        >
          <Timeline />
        </div>
      </div>

      {/* Dialog Modals */}
      <ExportModal />
      <ProjectSettingsModal />
      <KeyboardShortcutsModal />
    </div>
  );
}
