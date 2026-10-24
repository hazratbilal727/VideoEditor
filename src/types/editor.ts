export type MediaType = 'video' | 'audio' | 'image' | 'text';

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  blob?: Blob;
  duration: number; // in seconds
  width?: number;
  height?: number;
  fps?: number;
  sampleRate?: number;
  channels?: number;
  format?: string;
  thumbnailUrl?: string;
  waveformData?: number[]; // normalized 0-1 peak points for audio
  size?: number;
  dateAdded: number;
}

export interface ClipTransform {
  x: number; // px offset from center
  y: number; // px offset from center
  scale: number; // 1.0 = 100%
  rotation: number; // degrees
  opacity: number; // 0.0 to 1.0
  flipH: boolean;
  flipV: boolean;
  blendMode: 'normal' | 'screen' | 'multiply' | 'overlay' | 'lighten' | 'darken';
  crop: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ClipColorGrading {
  brightness: number; // -100 to 100, 0 default
  contrast: number; // -100 to 100, 0 default
  saturation: number; // -100 to 100, 0 default
  exposure: number; // -100 to 100, 0 default
  temperature: number; // -100 to 100, 0 default (cool to warm)
  tint: number; // -100 to 100, 0 default
  vignette: number; // 0 to 100, 0 default
  grayscale: number; // 0 to 100, 0 default
  sepia: number; // 0 to 100, 0 default
  blur: number; // 0 to 50 px, 0 default
  sharpen: number; // 0 to 100, 0 default
  invert: boolean;
}

export interface ClipAudio {
  volume: number; // 0 to 2.0 (1.0 = 100%)
  muted: boolean;
  pan: number; // -1.0 (left) to 1.0 (right)
  fadeIn: number; // seconds
  fadeOut: number; // seconds
}

export interface ClipText {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  backgroundBox: boolean;
  backgroundColor: string;
  animation: 'none' | 'fade' | 'typewriter' | 'slide-up' | 'scale-in' | 'glitch';
}

export type TransitionType =
  | 'none'
  | 'cross-dissolve'
  | 'fade-to-black'
  | 'fade-to-white'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'wipe-right'
  | 'spin';

export interface ClipTransition {
  type: TransitionType;
  duration: number; // seconds
}

export interface Keyframe {
  id: string;
  time: number; // relative time in clip seconds
  property: 'scale' | 'x' | 'y' | 'rotation' | 'opacity' | 'volume';
  value: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface TimelineClip {
  id: string;
  trackId: string;
  assetId?: string; // Optional if standalone text
  type: MediaType;
  name: string;
  
  // Timing on timeline
  start: number; // in seconds
  duration: number; // in seconds
  trimStart: number; // in source media seconds
  trimEnd: number; // in source media seconds
  sourceDuration: number; // full original source media duration

  speed: number; // 0.1x to 10x
  reverse: boolean;

  // Visual Properties
  transform: ClipTransform;
  colorGrading: ClipColorGrading;
  audio: ClipAudio;
  text?: ClipText;

  // Transitions
  transitionIn: ClipTransition;
  transitionOut: ClipTransition;

  // Keyframes
  keyframes: Keyframe[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  isLocked: boolean;
  isMuted: boolean;
  isVisible: boolean;
  isSolo: boolean;
  height: number;
}

export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  fps: number;
  sampleRate: number;
  backgroundColor: string;
}

export interface ExportSettings {
  format: 'mp4' | 'webm' | 'mov' | 'wav' | 'png-frame';
  resolution: {
    width: number;
    height: number;
    label: string;
  };
  fps: number;
  quality: 'ultra' | 'high' | 'medium' | 'draft';
  bitrateKbps: number;
  filename: string;
}

export interface ProjectData {
  id: string;
  version: string;
  settings: ProjectSettings;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  mediaPool: MediaAsset[];
  createdAt: number;
  updatedAt: number;
}

export type TimelineTool = 'select' | 'split' | 'trim' | 'hand';
