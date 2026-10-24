import { create } from 'zustand';
import {
  ClipAudio,
  ClipColorGrading,
  ClipText,
  ClipTransform,
  MediaAsset,
  ProjectData,
  ProjectSettings,
  TimelineClip,
  TimelineTool,
  TimelineTrack,
} from '../types/editor';
import { ProjectStorage } from '../services/projectStorage';
import { audioEngine } from '../services/audioEngine';

const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  name: 'Untitled Project',
  width: 1920,
  height: 1080,
  fps: 30,
  sampleRate: 44100,
  backgroundColor: '#000000',
};

const DEFAULT_TRACKS: TimelineTrack[] = [
  {
    id: 'track_text_1',
    name: 'Text & Titles',
    type: 'text',
    isLocked: false,
    isMuted: false,
    isVisible: true,
    isSolo: false,
    height: 48,
  },
  {
    id: 'track_video_2',
    name: 'Overlay V2',
    type: 'video',
    isLocked: false,
    isMuted: false,
    isVisible: true,
    isSolo: false,
    height: 64,
  },
  {
    id: 'track_video_1',
    name: 'Main Video V1',
    type: 'video',
    isLocked: false,
    isMuted: false,
    isVisible: true,
    isSolo: false,
    height: 64,
  },
  {
    id: 'track_audio_1',
    name: 'Audio Track A1',
    type: 'audio',
    isLocked: false,
    isMuted: false,
    isVisible: true,
    isSolo: false,
    height: 52,
  },
  {
    id: 'track_audio_2',
    name: 'Music / SFX A2',
    type: 'audio',
    isLocked: false,
    isMuted: false,
    isVisible: true,
    isSolo: false,
    height: 52,
  },
];

export interface EditorStoreState {
  // Project
  project: ProjectData;
  playhead: number; // in seconds
  isPlaying: boolean;
  playbackSpeed: number;

  // Selection & Tools
  selectedClipIds: string[];
  selectedTrackId: string | null;
  activeTool: TimelineTool;
  activeLeftTab: 'media' | 'audio' | 'text' | 'stickers' | 'effects' | 'transitions' | 'filters' | 'adjustments';
  activeInspectorTab: 'video' | 'audio' | 'speed' | 'animation' | 'adjustments' | 'text' | 'project';

  // Timeline Display
  zoom: number; // pixels per second
  snappingEnabled: boolean;
  rippleMode: boolean;
  safeAreaGuides: boolean;
  aspectPreset: '16:9' | '9:16' | '1:1' | '4:5' | '21:9';
  previewQuality: 'full' | 'half' | 'quarter';

  // Modals
  isExportModalOpen: boolean;
  isProjectSettingsModalOpen: boolean;
  isShortcutsModalOpen: boolean;

  // History & Clipboard
  undoStack: ProjectData[];
  redoStack: ProjectData[];
  clipboardClips: TimelineClip[];
  statusMessage: string | null;
  vuMeter: { left: number; right: number };

  // Actions
  setPlayhead: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  setPlaybackSpeed: (speed: number) => void;
  stepFrame: (deltaFrames: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;

  setZoom: (zoom: number) => void;
  setSnappingEnabled: (enabled: boolean) => void;
  setRippleMode: (enabled: boolean) => void;
  setActiveTool: (tool: TimelineTool) => void;
  setActiveLeftTab: (tab: EditorStoreState['activeLeftTab']) => void;
  setActiveInspectorTab: (tab: EditorStoreState['activeInspectorTab']) => void;
  toggleSafeAreaGuides: () => void;
  setAspectPreset: (preset: EditorStoreState['aspectPreset']) => void;
  setPreviewQuality: (quality: EditorStoreState['previewQuality']) => void;

  setExportModalOpen: (open: boolean) => void;
  setProjectSettingsModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setStatusMessage: (msg: string | null) => void;
  setVuMeter: (vu: { left: number; right: number }) => void;

  // Media
  addMediaAsset: (asset: MediaAsset) => void;
  removeMediaAsset: (id: string) => void;

  // Clips
  addClip: (clip: TimelineClip) => void;
  updateClip: (id: string, updates: Partial<TimelineClip>) => void;
  updateClipTransform: (id: string, updates: Partial<ClipTransform>) => void;
  updateClipColorGrading: (id: string, updates: Partial<ClipColorGrading>) => void;
  updateClipAudio: (id: string, updates: Partial<ClipAudio>) => void;
  updateClipText: (id: string, updates: Partial<ClipText>) => void;
  deleteSelectedClips: () => void;
  splitClipAtPlayhead: (targetClipId?: string) => void;
  duplicateSelectedClips: () => void;
  moveClip: (id: string, newStart: number, newTrackId?: string) => void;
  trimClip: (id: string, newStart: number, newDuration: number, newTrimStart: number) => void;
  selectClip: (id: string, multi?: boolean) => void;
  clearSelection: () => void;

  // Tracks
  addTrack: (type: 'video' | 'audio' | 'text', name?: string) => void;
  deleteTrack: (id: string) => void;
  toggleTrackLock: (id: string) => void;
  toggleTrackMute: (id: string) => void;
  toggleTrackVisibility: (id: string) => void;
  toggleTrackSolo: (id: string) => void;
  setSelectedTrackId: (id: string | null) => void;

  // Project & Storage
  newProject: () => void;
  loadProject: (project: ProjectData) => void;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  saveProjectToFile: () => void;
}

const createInitialProject = (): ProjectData => ({
  id: 'proj_' + Math.random().toString(36).substring(2, 9),
  version: '1.0.0',
  settings: { ...DEFAULT_PROJECT_SETTINGS },
  tracks: [...DEFAULT_TRACKS],
  clips: [],
  mediaPool: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  project: createInitialProject(),
  playhead: 0,
  isPlaying: false,
  playbackSpeed: 1.0,

  selectedClipIds: [],
  selectedTrackId: null,
  activeTool: 'select',
  activeLeftTab: 'media',
  activeInspectorTab: 'video',

  zoom: 50, // 50px per second
  snappingEnabled: true,
  rippleMode: false,
  safeAreaGuides: false,
  aspectPreset: '16:9',
  previewQuality: 'full',

  isExportModalOpen: false,
  isProjectSettingsModalOpen: false,
  isShortcutsModalOpen: false,

  undoStack: [],
  redoStack: [],
  clipboardClips: [],
  statusMessage: null,
  vuMeter: { left: 0, right: 0 },

  setPlayhead: (time: number) => {
    const clamped = Math.max(0, time);
    set({ playhead: clamped });
  },

  setIsPlaying: (playing: boolean) => {
    const state = get();
    if (playing !== state.isPlaying) {
      if (playing) {
        // Start Web Audio playback
        const mediaMap = new Map(state.project.mediaPool.map((m) => [m.id, m.url]));
        audioEngine.playClips(state.project.clips, state.project.tracks, state.playhead, mediaMap);
      } else {
        audioEngine.stop();
      }
      set({ isPlaying: playing });
    }
  },

  togglePlayPause: () => {
    const isPlaying = !get().isPlaying;
    get().setIsPlaying(isPlaying);
  },

  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  stepFrame: (deltaFrames: number) => {
    const state = get();
    const fps = state.project.settings.fps || 30;
    const newTime = Math.max(0, state.playhead + deltaFrames * (1 / fps));
    set({ playhead: newTime });
  },

  jumpToStart: () => set({ playhead: 0 }),

  jumpToEnd: () => {
    const state = get();
    const maxEnd = Math.max(0, ...state.project.clips.map((c) => c.start + c.duration));
    set({ playhead: maxEnd });
  },

  setZoom: (zoom: number) => set({ zoom: Math.max(10, Math.min(250, zoom)) }),
  setSnappingEnabled: (enabled: boolean) => set({ snappingEnabled: enabled }),
  setRippleMode: (enabled: boolean) => set({ rippleMode: enabled }),
  setActiveTool: (tool: TimelineTool) => set({ activeTool: tool }),
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  setActiveInspectorTab: (tab) => set({ activeInspectorTab: tab }),
  toggleSafeAreaGuides: () => set((s) => ({ safeAreaGuides: !s.safeAreaGuides })),
  setAspectPreset: (preset) => {
    const dims: Record<string, { width: number; height: number }> = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
      '4:5': { width: 1080, height: 1350 },
      '21:9': { width: 2560, height: 1080 },
    };
    const target = dims[preset] || { width: 1920, height: 1080 };
    set((s) => ({
      aspectPreset: preset,
      project: {
        ...s.project,
        settings: {
          ...s.project.settings,
          width: target.width,
          height: target.height,
        },
      },
    }));
  },
  setPreviewQuality: (previewQuality) => set({ previewQuality }),

  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
  setProjectSettingsModalOpen: (isProjectSettingsModalOpen) => set({ isProjectSettingsModalOpen }),
  setShortcutsModalOpen: (isShortcutsModalOpen) => set({ isShortcutsModalOpen }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setVuMeter: (vuMeter) => set({ vuMeter }),

  pushHistory: () => {
    const state = get();
    const snapshot = JSON.parse(JSON.stringify(state.project));
    set({
      undoStack: [...state.undoStack.slice(-40), snapshot],
      redoStack: [],
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const previous = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);
    const current = JSON.parse(JSON.stringify(state.project));

    set({
      project: previous,
      undoStack: newUndoStack,
      redoStack: [current, ...state.redoStack],
      statusMessage: 'Undo performed',
    });
    ProjectStorage.saveAutosave(previous);
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const next = state.redoStack[0];
    const newRedoStack = state.redoStack.slice(1);
    const current = JSON.parse(JSON.stringify(state.project));

    set({
      project: next,
      undoStack: [...state.undoStack, current],
      redoStack: newRedoStack,
      statusMessage: 'Redo performed',
    });
    ProjectStorage.saveAutosave(next);
  },

  addMediaAsset: (asset: MediaAsset) => {
    get().pushHistory();
    set((s) => {
      const updated = {
        ...s.project,
        mediaPool: [...s.project.mediaPool, asset],
      };
      ProjectStorage.saveAutosave(updated);
      return { project: updated, statusMessage: `Imported "${asset.name}"` };
    });
  },

  removeMediaAsset: (id: string) => {
    get().pushHistory();
    set((s) => {
      const updated = {
        ...s.project,
        mediaPool: s.project.mediaPool.filter((m) => m.id !== id),
        clips: s.project.clips.filter((c) => c.assetId !== id),
      };
      ProjectStorage.saveAutosave(updated);
      return { project: updated };
    });
  },

  addClip: (clip: TimelineClip) => {
    get().pushHistory();
    set((s) => {
      const updated = {
        ...s.project,
        clips: [...s.project.clips, clip],
      };
      ProjectStorage.saveAutosave(updated);
      return {
        project: updated,
        selectedClipIds: [clip.id],
        activeInspectorTab: clip.type === 'text' ? 'text' : 'video',
        statusMessage: `Added clip "${clip.name}"`,
      };
    });
  },

  updateClip: (id: string, updates: Partial<TimelineClip>) => {
    set((s) => {
      const updated = {
        ...s.project,
        clips: s.project.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      };
      return { project: updated };
    });
  },

  updateClipTransform: (id: string, updates: Partial<ClipTransform>) => {
    set((s) => ({
      project: {
        ...s.project,
        clips: s.project.clips.map((c) =>
          c.id === id ? { ...c, transform: { ...c.transform, ...updates } } : c
        ),
      },
    }));
  },

  updateClipColorGrading: (id: string, updates: Partial<ClipColorGrading>) => {
    set((s) => ({
      project: {
        ...s.project,
        clips: s.project.clips.map((c) =>
          c.id === id ? { ...c, colorGrading: { ...c.colorGrading, ...updates } } : c
        ),
      },
    }));
  },

  updateClipAudio: (id: string, updates: Partial<ClipAudio>) => {
    set((s) => ({
      project: {
        ...s.project,
        clips: s.project.clips.map((c) =>
          c.id === id ? { ...c, audio: { ...c.audio, ...updates } } : c
        ),
      },
    }));
  },

  updateClipText: (id: string, updates: Partial<ClipText>) => {
    set((s) => ({
      project: {
        ...s.project,
        clips: s.project.clips.map((c) =>
          c.id === id && c.text ? { ...c, text: { ...c.text, ...updates } } : c
        ),
      },
    }));
  },

  deleteSelectedClips: () => {
    const state = get();
    if (state.selectedClipIds.length === 0) return;
    state.pushHistory();

    const toDelete = new Set(state.selectedClipIds);
    const toDeleteClips = state.project.clips.filter((c) => toDelete.has(c.id));

    set((s) => {
      let updatedClips = s.project.clips.filter((c) => !toDelete.has(c.id));

      // Ripple edit: shift subsequent clips back on the same track
      if (s.rippleMode) {
        toDeleteClips.forEach((delClip) => {
          updatedClips = updatedClips.map((c) => {
            if (c.trackId === delClip.trackId && c.start > delClip.start) {
              return { ...c, start: Math.max(0, c.start - delClip.duration) };
            }
            return c;
          });
        });
      }

      const updated = {
        ...s.project,
        clips: updatedClips,
      };
      ProjectStorage.saveAutosave(updated);
      return {
        project: updated,
        selectedClipIds: [],
        statusMessage: `Deleted ${toDelete.size} clip(s)${s.rippleMode ? ' (Ripple)' : ''}`,
      };
    });
  },

  splitClipAtPlayhead: (targetClipId?: string) => {
    const state = get();
    const playhead = state.playhead;

    // Determine which clip to split: target or selected or any active clip under playhead
    let clipToSplit: TimelineClip | undefined;
    if (targetClipId) {
      clipToSplit = state.project.clips.find((c) => c.id === targetClipId);
    } else if (state.selectedClipIds.length > 0) {
      clipToSplit = state.project.clips.find(
        (c) => state.selectedClipIds.includes(c.id) && playhead > c.start && playhead < c.start + c.duration
      );
    }

    if (!clipToSplit) {
      // Find first clip intersecting playhead
      clipToSplit = state.project.clips.find(
        (c) => playhead > c.start && playhead < c.start + c.duration
      );
    }

    if (!clipToSplit) {
      set({ statusMessage: 'No clip under playhead to split' });
      return;
    }

    state.pushHistory();

    const splitOffset = playhead - clipToSplit.start;
    const firstDuration = splitOffset;
    const secondDuration = clipToSplit.duration - splitOffset;

    const firstClip: TimelineClip = {
      ...clipToSplit,
      duration: firstDuration,
      trimEnd: clipToSplit.trimStart + firstDuration * clipToSplit.speed,
    };

    const secondClip: TimelineClip = {
      ...JSON.parse(JSON.stringify(clipToSplit)),
      id: 'clip_' + Math.random().toString(36).substring(2, 9),
      start: playhead,
      duration: secondDuration,
      trimStart: clipToSplit.trimStart + firstDuration * clipToSplit.speed,
      transitionIn: { type: 'none', duration: 0 },
    };

    set((s) => {
      const updated = {
        ...s.project,
        clips: s.project.clips.map((c) => (c.id === clipToSplit!.id ? firstClip : c)).concat(secondClip),
      };
      ProjectStorage.saveAutosave(updated);
      return {
        project: updated,
        selectedClipIds: [secondClip.id],
        statusMessage: `Split clip "${clipToSplit!.name}" at ${playhead.toFixed(2)}s`,
      };
    });
  },

  duplicateSelectedClips: () => {
    const state = get();
    if (state.selectedClipIds.length === 0) return;
    state.pushHistory();

    const selectedClips = state.project.clips.filter((c) => state.selectedClipIds.includes(c.id));
    const newClips: TimelineClip[] = selectedClips.map((clip) => ({
      ...JSON.parse(JSON.stringify(clip)),
      id: 'clip_' + Math.random().toString(36).substring(2, 9),
      start: clip.start + clip.duration + 0.1, // place immediately adjacent
    }));

    set((s) => {
      const updated = {
        ...s.project,
        clips: [...s.project.clips, ...newClips],
      };
      ProjectStorage.saveAutosave(updated);
      return {
        project: updated,
        selectedClipIds: newClips.map((c) => c.id),
        statusMessage: `Duplicated ${newClips.length} clip(s)`,
      };
    });
  },

  moveClip: (id: string, newStart: number, newTrackId?: string) => {
    const state = get();
    let snappedStart = Math.max(0, newStart);

    // Magnetic snapping to other clip edges or playhead
    if (state.snappingEnabled) {
      const snapThreshold = 10 / state.zoom; // 10px snap window in seconds
      const snapPoints = [0, state.playhead];
      state.project.clips.forEach((c) => {
        if (c.id !== id) {
          snapPoints.push(c.start);
          snapPoints.push(c.start + c.duration);
        }
      });

      const currentClip = state.project.clips.find((c) => c.id === id);
      const clipDuration = currentClip ? currentClip.duration : 0;

      for (const sp of snapPoints) {
        if (Math.abs(snappedStart - sp) < snapThreshold) {
          snappedStart = sp;
          break;
        }
        if (Math.abs(snappedStart + clipDuration - sp) < snapThreshold) {
          snappedStart = sp - clipDuration;
          break;
        }
      }
    }

    set((s) => ({
      project: {
        ...s.project,
        clips: s.project.clips.map((c) =>
          c.id === id
            ? {
                ...c,
                start: Math.max(0, snappedStart),
                trackId: newTrackId || c.trackId,
              }
            : c
        ),
      },
    }));
  },

  trimClip: (id: string, newStart: number, newDuration: number, newTrimStart: number) => {
    set((s) => ({
      project: {
        ...s.project,
        clips: s.project.clips.map((c) =>
          c.id === id
            ? {
                ...c,
                start: Math.max(0, newStart),
                duration: Math.max(0.1, newDuration),
                trimStart: Math.max(0, newTrimStart),
              }
            : c
        ),
      },
    }));
  },

  selectClip: (id: string, multi: boolean = false) => {
    set((s) => {
      const isAlready = s.selectedClipIds.includes(id);
      let newSelection: string[];
      if (multi) {
        newSelection = isAlready ? s.selectedClipIds.filter((cid) => cid !== id) : [...s.selectedClipIds, id];
      } else {
        newSelection = [id];
      }

      const clip = s.project.clips.find((c) => c.id === id);
      return {
        selectedClipIds: newSelection,
        activeInspectorTab: clip?.type === 'text' ? 'text' : 'video',
      };
    });
  },

  clearSelection: () => set({ selectedClipIds: [] }),

  addTrack: (type: 'video' | 'audio' | 'text', name?: string) => {
    get().pushHistory();
    const id = `track_${type}_${Date.now()}`;
    const defaultHeight = type === 'video' ? 64 : type === 'audio' ? 52 : 48;
    const newTrack: TimelineTrack = {
      id,
      name: name || `${type.toUpperCase()} Track`,
      type,
      isLocked: false,
      isMuted: false,
      isVisible: true,
      isSolo: false,
      height: defaultHeight,
    };
    set((s) => {
      const updated = {
        ...s.project,
        tracks: [newTrack, ...s.project.tracks],
      };
      ProjectStorage.saveAutosave(updated);
      return { project: updated, statusMessage: `Added track "${newTrack.name}"` };
    });
  },

  deleteTrack: (id: string) => {
    get().pushHistory();
    set((s) => {
      const updated = {
        ...s.project,
        tracks: s.project.tracks.filter((t) => t.id !== id),
        clips: s.project.clips.filter((c) => c.trackId !== id),
      };
      ProjectStorage.saveAutosave(updated);
      return { project: updated, statusMessage: 'Deleted track' };
    });
  },

  toggleTrackLock: (id: string) => {
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) => (t.id === id ? { ...t, isLocked: !t.isLocked } : t)),
      },
    }));
  },

  toggleTrackMute: (id: string) => {
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) => (t.id === id ? { ...t, isMuted: !t.isMuted } : t)),
      },
    }));
  },

  toggleTrackVisibility: (id: string) => {
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) => (t.id === id ? { ...t, isVisible: !t.isVisible } : t)),
      },
    }));
  },

  toggleTrackSolo: (id: string) => {
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) => (t.id === id ? { ...t, isSolo: !t.isSolo } : t)),
      },
    }));
  },

  setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),

  newProject: () => {
    const fresh = createInitialProject();
    set({
      project: fresh,
      playhead: 0,
      isPlaying: false,
      selectedClipIds: [],
      undoStack: [],
      redoStack: [],
      statusMessage: 'Created new project',
    });
    ProjectStorage.saveAutosave(fresh);
  },

  loadProject: (project: ProjectData) => {
    set({
      project,
      playhead: 0,
      isPlaying: false,
      selectedClipIds: [],
      undoStack: [],
      redoStack: [],
      statusMessage: `Loaded project "${project.settings.name}"`,
    });
    ProjectStorage.saveAutosave(project);
  },

  updateProjectSettings: (settings: Partial<ProjectSettings>) => {
    get().pushHistory();
    set((s) => {
      const updated = {
        ...s.project,
        settings: { ...s.project.settings, ...settings },
      };
      ProjectStorage.saveAutosave(updated);
      return { project: updated, statusMessage: 'Updated project settings' };
    });
  },

  saveProjectToFile: () => {
    const project = get().project;
    ProjectStorage.exportProjectToFile(project);
    set({ statusMessage: `Project saved as ${project.settings.name}.mono` });
  },
}));
