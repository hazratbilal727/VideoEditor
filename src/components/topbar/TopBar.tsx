import React, { useRef, useState } from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Settings,
  HelpCircle,
  Download,
  Scissors,
  Trash2,
  Copy,
  Magnet,
  Maximize2,
  Grid,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { ProjectStorage } from '../../services/projectStorage';

export const TopBar: React.FC = () => {
  const {
    project,
    undoStack,
    redoStack,
    snappingEnabled,
    safeAreaGuides,
    aspectPreset,
    statusMessage,
    selectedClipIds,
    undo,
    redo,
    newProject,
    loadProject,
    saveProjectToFile,
    updateProjectSettings,
    setSnappingEnabled,
    toggleSafeAreaGuides,
    setAspectPreset,
    setExportModalOpen,
    setProjectSettingsModalOpen,
    setShortcutsModalOpen,
    splitClipAtPlayhead,
    deleteSelectedClips,
    duplicateSelectedClips,
    setStatusMessage,
  } = useEditorStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.settings.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      updateProjectSettings({ name: titleInput.trim() });
    } else {
      setTitleInput(project.settings.name);
    }
  };

  const handleOpenProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await ProjectStorage.importProjectFromFile(file);
      loadProject(loaded);
    } catch {
      setStatusMessage('Error reading .mono project file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="h-11 bg-[#111111] border-b border-[#242424] px-3 flex items-center justify-between select-none text-xs text-neutral-300">
      {/* Hidden file input for open project */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".mono,.json"
        className="hidden"
        onChange={handleOpenProjectFile}
      />

      {/* Left: Brand + Project Title + File Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 pr-2 border-r border-[#242424]">
          <div className="w-5 h-5 bg-white text-black font-black text-[11px] flex items-center justify-center rounded-sm tracking-tighter">
            M
          </div>
          <span className="font-bold tracking-widest text-[12px] text-white">MONO</span>
        </div>

        {/* Project Name editable */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTitleInput(project.settings.name);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            className="bg-[#1a1a1a] border border-white text-white px-2 py-0.5 rounded text-xs focus:outline-none w-44"
          />
        ) : (
          <span
            onClick={() => {
              setTitleInput(project.settings.name);
              setIsEditingTitle(true);
            }}
            className="hover:text-white hover:bg-[#1a1a1a] px-2 py-0.5 rounded cursor-pointer max-w-[180px] truncate text-neutral-200"
            title="Click to rename project"
          >
            {project.settings.name}
          </span>
        )}

        {/* File Actions */}
        <div className="flex items-center gap-0.5 pl-1 border-l border-[#242424]">
          <button
            onClick={() => {
              if (window.confirm('Create a new project? Unsaved changes will be replaced.')) {
                newProject();
              }
            }}
            className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
            title="New Project"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
            title="Open Project (.mono)"
          >
            <FolderOpen size={14} />
          </button>
          <button
            onClick={saveProjectToFile}
            className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
            title="Save Project to Disk (Ctrl+S)"
          >
            <Save size={14} />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-l border-[#242424] pl-2">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-1.5 hover:bg-[#202020] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded text-neutral-400"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-1.5 hover:bg-[#202020] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded text-neutral-400"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Quick Edit Tools: Split, Duplicate, Delete */}
        <div className="flex items-center gap-0.5 border-l border-[#242424] pl-2">
          <button
            onClick={() => splitClipAtPlayhead()}
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#202020] hover:text-white rounded text-neutral-300"
            title="Split Clip at Playhead (Ctrl+B / S)"
          >
            <Scissors size={13} />
            <span className="text-[11px]">Split</span>
          </button>
          <button
            onClick={duplicateSelectedClips}
            disabled={selectedClipIds.length === 0}
            className="p-1.5 hover:bg-[#202020] hover:text-white disabled:opacity-30 rounded text-neutral-300"
            title="Duplicate Selected (Ctrl+D)"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={deleteSelectedClips}
            disabled={selectedClipIds.length === 0}
            className="p-1.5 hover:bg-[#202020] hover:text-white disabled:opacity-30 rounded text-neutral-300"
            title="Delete Selected (Del)"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Center: Status Message or Aspect Ratio */}
      <div className="hidden md:flex items-center gap-3">
        {statusMessage ? (
          <span className="text-[11px] text-neutral-400 bg-[#161616] px-2.5 py-0.5 rounded border border-[#262626] animate-pulse">
            {statusMessage}
          </span>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <span>Aspect:</span>
            <select
              value={aspectPreset}
              onChange={(e) => setAspectPreset(e.target.value as unknown as typeof aspectPreset)}
              className="bg-[#171717] border border-[#2b2b2b] text-neutral-200 px-2 py-0.5 rounded text-[11px] focus:outline-none focus:border-white cursor-pointer"
            >
              <option value="16:9">16:9 (1920×1080)</option>
              <option value="9:16">9:16 (1080×1920 Vertical)</option>
              <option value="1:1">1:1 (1080×1080 Square)</option>
              <option value="4:5">4:5 (1080×1350)</option>
              <option value="21:9">21:9 (2560×1080 Ultrawide)</option>
            </select>
          </div>
        )}
      </div>

      {/* Right: Snapping, Guides, Settings, Export */}
      <div className="flex items-center gap-2">
        {/* Magnet Snapping Toggle */}
        <button
          onClick={() => setSnappingEnabled(!snappingEnabled)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border ${
            snappingEnabled
              ? 'bg-[#2a2a2a] text-white border-white'
              : 'bg-[#151515] text-neutral-500 border-[#262626] hover:text-neutral-300'
          }`}
          title="Magnetic Snapping (N)"
        >
          <Magnet size={13} />
          <span className="hidden sm:inline">Snap</span>
        </button>

        {/* Safe Area Guides */}
        <button
          onClick={toggleSafeAreaGuides}
          className={`p-1.5 rounded border ${
            safeAreaGuides
              ? 'bg-[#2a2a2a] text-white border-white'
              : 'bg-[#151515] text-neutral-500 border-[#262626] hover:text-neutral-300'
          }`}
          title="Toggle Safe Area Guides"
        >
          <Grid size={13} />
        </button>

        {/* Shortcuts */}
        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle size={14} />
        </button>

        {/* Settings */}
        <button
          onClick={() => setProjectSettingsModalOpen(true)}
          className="p-1.5 hover:bg-[#202020] hover:text-white rounded text-neutral-400"
          title="Project Settings"
        >
          <Settings size={14} />
        </button>

        {/* Export Button - High contrast monochrome */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 px-3.5 py-1 rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer ml-1"
        >
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
