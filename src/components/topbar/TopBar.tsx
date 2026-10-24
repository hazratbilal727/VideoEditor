import React, { useRef, useState } from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Settings,
  HelpCircle,
  Share2,
  Diamond,
  ChevronDown,
  Edit2,
  Check,
  Download,
  Minus,
  Square,
  X,
  LayoutGrid,
  Columns,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { ProjectStorage } from '../../services/projectStorage';

export const TopBar: React.FC = () => {
  const {
    project,
    aspectPreset,
    updateProjectSettings,
    setExportModalOpen,
    setProjectSettingsModalOpen,
    setShortcutsModalOpen,
    loadProject,
    newProject,
    saveProjectToFile,
    setStatusMessage,
  } = useEditorStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.settings.name || '1129');
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      updateProjectSettings({ name: titleInput.trim() });
    } else {
      setTitleInput(project.settings.name || '1129');
    }
  };

  const handleOpenProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await ProjectStorage.importProjectFromFile(file);
      loadProject(loaded);
      setStatusMessage('Project loaded successfully');
    } catch {
      setStatusMessage('Error reading project file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsFileMenuOpen(false);
  };

  return (
    <header className="h-9 bg-[#121214] border-b border-[#232328] px-2.5 flex items-center justify-between select-none text-xs text-neutral-300 z-40 relative">
      <input
        type="file"
        ref={fileInputRef}
        accept=".mono,.json"
        className="hidden"
        onChange={handleOpenProjectFile}
      />

      {/* Left: CapCut Brand Logo + Menu Dropdown + Auto Saved Status */}
      <div className="flex items-center gap-2.5">
        {/* CapCut Desktop Logo Icon */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="w-5 h-5 bg-[#1e1e24] border border-[#2e2e38] rounded flex items-center justify-center p-0.5 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" preserveAspectRatio="xMidYMid meet">
              <path d="M4 6.5C4 5.67 4.67 5 5.5 5h3.2c.6 0 1.15.36 1.38.92l1.6 3.84c.16.39.54.64.96.64h.72c.42 0 .8-.25.96-.64l1.6-3.84c.23-.56.78-.92 1.38-.92h3.2c.83 0 1.5.67 1.5 1.5v2.2c0 .6-.36 1.15-.92 1.38l-3.84 1.6c-.39.16-.64.54-.64.96v.72c0 .42.25.8.64.96l3.84 1.6c.56.23.92.78.92 1.38v2.2c0 .83-.67 1.5-1.5 1.5h-3.2c-.6 0-1.15-.36-1.38-.92l-1.6-3.84c-.16-.39-.54-.64-.96-.64h-.72c-.42 0-.8.25-.96.64l-1.6 3.84c-.23.56-.78.92-1.38.92H5.5c-.83 0-1.5-.67-1.5-1.5v-2.2c0-.6.36-1.15.92-1.38l3.84-1.6c.39-.16.64-.54.64-.96v-.72c0-.42-.25-.8-.64-.96L4.92 9.08C4.36 8.85 4 8.3 4 7.7V6.5z" />
            </svg>
          </div>
          <span className="font-semibold tracking-tight text-[12.5px] text-white">CapCut</span>
        </div>

        {/* Menu Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
            className="flex items-center gap-1 bg-[#222226] hover:bg-[#2b2b31] px-2 py-0.5 rounded text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer border border-[#2b2b32]"
          >
            <span>Menu</span>
            <ChevronDown size={10} className="text-neutral-400" />
          </button>

          {isFileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsFileMenuOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-48 bg-[#1a1a1e] border border-[#2d2d35] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    if (window.confirm('Start a new project?')) newProject();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#272730] hover:text-white text-left text-neutral-300"
                >
                  <FilePlus size={13} />
                  <span>New Project</span>
                </button>
                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#272730] hover:text-white text-left text-neutral-300"
                >
                  <FolderOpen size={13} />
                  <span>Open Project (.mono)</span>
                </button>
                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    saveProjectToFile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#272730] hover:text-white text-left text-neutral-300"
                >
                  <div className="flex items-center gap-2">
                    <Save size={13} />
                    <span>Save Project</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Ctrl+S</span>
                </button>
                <div className="h-px bg-[#26262e] my-1" />
                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    setProjectSettingsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#272730] hover:text-white text-left text-neutral-300"
                >
                  <Settings size={13} />
                  <span>Project Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    setShortcutsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#272730] hover:text-white text-left text-neutral-300"
                >
                  <HelpCircle size={13} />
                  <span>Shortcuts Cheatsheet</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Auto saved: 00:43:49 status pill */}
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 pl-1">
          <div className="w-3.5 h-3.5 rounded-full bg-[#00d7e6]/20 text-[#00e5ff] flex items-center justify-center">
            <Check size={9} strokeWidth={3} />
          </div>
          <span className="text-neutral-400">Auto saved: 00:43:49</span>
        </div>
      </div>

      {/* Center: Project Title (e.g. 1129) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTitleInput(project.settings.name || '1129');
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            className="bg-[#1f1f25] border border-[#00e5ff] text-white px-2 py-0.5 rounded text-[11px] focus:outline-none w-36 text-center font-medium"
          />
        ) : (
          <div
            onClick={() => {
              setTitleInput(project.settings.name || '1129');
              setIsEditingTitle(true);
            }}
            className="flex items-center gap-1 hover:bg-[#202026] px-2 py-0.5 rounded cursor-pointer group transition-colors"
            title="Click to rename project"
          >
            <span className="font-medium text-white text-[12px] tracking-wide">
              {project.settings.name || '1129'}
            </span>
            <Edit2 size={9} className="text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Right: Layout Switcher + Pro + Share + Export + Window Controls */}
      <div className="flex items-center gap-2">
        {/* Layout Mode Icons */}
        <div className="flex items-center gap-1 text-neutral-400 mr-0.5">
          <button
            className="p-1 hover:text-white hover:bg-[#222228] rounded flex items-center gap-0.5 transition-colors cursor-pointer"
            title="Workspace Layout"
          >
            <Columns size={13} />
            <ChevronDown size={8} className="text-neutral-500" />
          </button>
          <button
            className="p-1 hover:text-white hover:bg-[#222228] rounded transition-colors cursor-pointer"
            title="Panel Layout"
          >
            <LayoutGrid size={13} />
          </button>
        </div>

        {/* Pro Badge Button */}
        <button
          onClick={() => setStatusMessage('CapCut Pro features active')}
          className="flex items-center gap-1.5 bg-[#222226] hover:bg-[#2c2c34] text-white px-2.5 py-1 rounded text-[11px] font-medium transition-colors border border-[#2d2d36] cursor-pointer"
          title="CapCut Pro"
        >
          <Diamond size={11} className="text-[#a855f7] fill-[#a855f7]" />
          <span>Pro</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            navigator.clipboard?.writeText?.(window.location.href);
            setStatusMessage('Project link copied to clipboard');
          }}
          className="flex items-center gap-1.5 bg-[#222226] hover:bg-[#2c2c34] text-white px-2.5 py-1 rounded text-[11px] font-medium transition-colors border border-[#2d2d36] cursor-pointer"
          title="Share Project"
        >
          <Share2 size={11} className="text-neutral-300" />
          <span>Share</span>
        </button>

        {/* CapCut Signature Vibrant Cyan Export Button */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#00f0ff] hover:bg-[#00d7e6] text-black font-semibold text-[11px] px-3 py-1 rounded transition-all shadow-sm active:scale-95 cursor-pointer ml-0.5"
          title="Export Video (Local FFmpeg)"
        >
          <Download size={12} strokeWidth={2.5} />
          <span>Export</span>
        </button>

        {/* Desktop Window Controls */}
        <div className="flex items-center ml-2 border-l border-[#26262e] pl-1.5 text-neutral-400">
          <button
            className="p-1 hover:text-white hover:bg-[#222228] rounded transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            className="p-1 hover:text-white hover:bg-[#222228] rounded transition-colors cursor-pointer"
            title="Maximize"
          >
            <Square size={10} />
          </button>
          <button
            className="p-1 hover:text-white hover:bg-red-600/80 rounded transition-colors cursor-pointer"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </header>
  );
};
