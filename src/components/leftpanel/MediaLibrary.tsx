import React, { useRef, useState } from 'react';
import {
  Upload,
  Plus,
  Video,
  Music,
  Image as ImageIcon,
  Trash2,
  Search,
  Sparkles,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { MediaAsset, TimelineClip } from '../../types/editor';
import { createDefaultSampleAssets } from '../../services/syntheticMedia';
import { audioEngine } from '../../services/audioEngine';

export const MediaLibrary: React.FC = () => {
  const { project, playhead, addMediaAsset, removeMediaAsset, addClip, setStatusMessage } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      if (!isVideo && !isAudio && !isImage) continue;

      let duration = 5;
      let width = 1920;
      let height = 1080;
      let thumbUrl: string | undefined;

      if (isVideo) {
        try {
          const videoEl = document.createElement('video');
          videoEl.src = url;
          videoEl.muted = true;
          await new Promise((res) => {
            videoEl.onloadedmetadata = res;
            videoEl.onerror = res;
          });
          duration = videoEl.duration || 5;
          width = videoEl.videoWidth || 1920;
          height = videoEl.videoHeight || 1080;

          // Capture high quality thumbnail frame
          videoEl.currentTime = Math.min(1, duration * 0.1);
          await new Promise((res) => {
            videoEl.onseeked = res;
            setTimeout(res, 200);
          });
          const c = document.createElement('canvas');
          c.width = 160;
          c.height = 90;
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, 160, 90);
            thumbUrl = c.toDataURL('image/jpeg', 0.8);
          }
        } catch {
          // fallback
        }
      } else if (isAudio) {
        try {
          const audioEl = document.createElement('audio');
          audioEl.src = url;
          await new Promise((res) => {
            audioEl.onloadedmetadata = res;
            audioEl.onerror = res;
          });
          duration = audioEl.duration || 5;
        } catch {
          // fallback
        }
      } else if (isImage) {
        thumbUrl = url;
      }

      let waveform: number[] | undefined;
      if (isAudio || isVideo) {
        try {
          waveform = await audioEngine.extractWaveform(url, 60);
        } catch {
          // ignore
        }
      }

      const asset: MediaAsset = {
        id: 'asset_' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        url,
        blob: file,
        duration,
        width,
        height,
        thumbnailUrl: thumbUrl,
        waveformData: waveform,
        size: file.size,
        dateAdded: Date.now(),
      };

      addMediaAsset(asset);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const fakeEvent = {
      target: { files: fileList },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileUpload(fakeEvent);
  };

  const handleGenerateSamples = async () => {
    setIsGenerating(true);
    setStatusMessage('Generating offline sample media...');
    try {
      const samples = await createDefaultSampleAssets();
      samples.forEach((asset) => addMediaAsset(asset));
      setStatusMessage('Sample clips added to Media Pool');
    } catch {
      setStatusMessage('Could not generate sample media');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddAssetToTimeline = (asset: MediaAsset) => {
    let track = project.tracks.find((t) => t.type === (asset.type === 'image' ? 'video' : asset.type));
    if (!track) {
      track = project.tracks[0];
    }

    const newClip: TimelineClip = {
      id: 'clip_' + Math.random().toString(36).substring(2, 9),
      trackId: track.id,
      assetId: asset.id,
      type: asset.type,
      name: asset.name,
      start: playhead,
      duration: asset.duration,
      trimStart: 0,
      trimEnd: asset.duration,
      sourceDuration: asset.duration,
      speed: 1,
      reverse: false,
      transform: {
        x: 0,
        y: 0,
        scale: 1,
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
      audio: {
        volume: 1,
        muted: false,
        pan: 0,
        fadeIn: 0,
        fadeOut: 0,
      },
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
      keyframes: [],
    };

    addClip(newClip);
  };

  const filteredAssets = project.mediaPool.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative flex flex-col h-full bg-[#141414] text-xs select-none transition-colors ${
        isDragOver ? 'bg-[#1b1b1b] ring-2 ring-white/40 ring-inset' : ''
      }`}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="video/*,audio/*,image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Drag & drop overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-black/85 z-40 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          <Upload size={32} className="text-white mb-2 animate-bounce" />
          <span className="font-semibold text-white text-xs">Drop media files here</span>
          <span className="text-[10px] text-neutral-400 mt-1">MP4, MOV, WebM, MP3, WAV, PNG, JPG</span>
        </div>
      )}

      {/* CapCut Style Top Sub-bar: Search & Filter Tabs */}
      <div className="p-2.5 pb-2 border-b border-[#222222] flex flex-col gap-2 bg-[#121212]">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search local media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-[#262626] rounded-[4px] pl-7 pr-2 py-1 text-white text-[11px] placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <button
            onClick={handleGenerateSamples}
            disabled={isGenerating}
            className="flex items-center gap-1 bg-[#1a1a1a] hover:bg-[#252525] text-neutral-300 py-1 px-2 rounded-[4px] border border-[#2b2b2b] text-[10px] shrink-0 disabled:opacity-40"
            title="Generate test patterns and sample media"
          >
            <Sparkles size={11} />
            <span>Samples</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {(['all', 'video', 'audio', 'image'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-0.5 rounded-[3px] text-[10px] uppercase font-mono tracking-wider transition-colors ${
                filterType === t
                  ? 'bg-[#2b2b2b] text-white font-medium border border-[#3b3b3b]'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid & CapCut-Style Big Import Box */}
      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="grid grid-cols-2 gap-2">
          {/* CapCut Big '+ Import' Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-24 bg-[#181818] hover:bg-[#202020] border border-dashed border-[#333333] hover:border-neutral-400 rounded-[4px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all group select-none"
            title="Click or drag files here to import"
          >
            <div className="w-8 h-8 rounded-full bg-[#242424] group-hover:bg-white group-hover:text-black flex items-center justify-center text-neutral-300 transition-colors">
              <Plus size={16} />
            </div>
            <span className="text-[11px] font-medium text-neutral-300 group-hover:text-white">
              Import
            </span>
          </div>

          {/* Imported Media Cards */}
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/mono-asset-id', asset.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className="group relative h-24 bg-[#181818] hover:bg-[#1e1e1e] border border-[#262626] hover:border-[#444] rounded-[4px] overflow-hidden flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all select-none"
              onClick={() => handleAddAssetToTimeline(asset)}
            >
              {/* Thumbnail Display */}
              <div className="relative flex-1 bg-[#0c0c0c] flex items-center justify-center overflow-hidden">
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : asset.type === 'video' ? (
                  <Video size={22} className="text-neutral-600" />
                ) : asset.type === 'audio' ? (
                  <Music size={22} className="text-neutral-600" />
                ) : (
                  <ImageIcon size={22} className="text-neutral-600" />
                )}

                {/* Duration Badge */}
                <div className="absolute bottom-1 right-1 bg-black/85 px-1 py-0.2 rounded text-[9px] font-mono text-neutral-300 flex items-center gap-0.5">
                  <Clock size={8} />
                  <span>{asset.duration.toFixed(1)}s</span>
                </div>

                {/* Hover Add Button (+) */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div
                    className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    title="Add to Timeline at playhead"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Delete button top right on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMediaAsset(asset.id);
                  }}
                  className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-neutral-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove file"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Title strip */}
              <div className="px-1.5 py-1 bg-[#141414] border-t border-[#202020]">
                <span
                  className="truncate text-[10px] text-neutral-300 block font-medium"
                  title={asset.name}
                >
                  {asset.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
