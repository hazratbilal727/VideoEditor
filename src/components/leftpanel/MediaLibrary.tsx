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
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { MediaAsset, TimelineClip } from '../../types/editor';
import { createDefaultSampleAssets, generateSyntheticAudio, generateSyntheticVideo } from '../../services/syntheticMedia';

export const MediaLibrary: React.FC = () => {
  const { project, playhead, addMediaAsset, removeMediaAsset, addClip, setStatusMessage } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
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

      let duration = 5; // default for images
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

          // Capture thumbnail
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
            thumbUrl = c.toDataURL('image/jpeg', 0.7);
          }
        } catch {
          // fallback duration
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
        size: file.size,
        dateAdded: Date.now(),
      };

      addMediaAsset(asset);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
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
    // Find target track
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
    <div className="flex flex-col h-full bg-[#141414] text-xs">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="video/*,audio/*,image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Action buttons */}
      <div className="p-2 border-b border-[#222222] flex items-center gap-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#202020] hover:bg-[#2b2b2b] text-white py-1.5 px-2 rounded border border-[#333333] transition-colors"
          title="Import Video, Audio, or Image files"
        >
          <Upload size={13} />
          <span>Import Files</span>
        </button>

        <button
          onClick={handleGenerateSamples}
          disabled={isGenerating}
          className="flex items-center justify-center gap-1 bg-[#1a1a1a] hover:bg-[#242424] text-neutral-300 py-1.5 px-2 rounded border border-[#2b2b2b] disabled:opacity-40"
          title="Generate built-in offline test videos & audio"
        >
          <Sparkles size={13} />
          <span>Samples</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="px-2 py-1.5 border-b border-[#222222] flex flex-col gap-1.5">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#262626] rounded pl-6 pr-2 py-1 text-white text-[11px] placeholder-neutral-600 focus:outline-none focus:border-white"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'video', 'audio', 'image'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`flex-1 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider ${
                filterType === t
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#181818] text-neutral-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Media Assets List / Grid */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredAssets.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-neutral-500 text-center px-4">
            <Upload size={24} className="mb-2 opacity-40 text-neutral-400" />
            <p className="text-neutral-400 font-medium">No media imported</p>
            <p className="text-[11px] text-neutral-600 mt-1">
              Click &quot;Import Files&quot; or &quot;Samples&quot; to begin editing
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative bg-[#181818] hover:bg-[#202020] border border-[#262626] hover:border-[#404040] rounded overflow-hidden flex flex-col transition-all cursor-pointer"
                onClick={() => handleAddAssetToTimeline(asset)}
              >
                {/* Media Thumbnail */}
                <div className="relative h-20 bg-[#0d0d0d] flex items-center justify-center overflow-hidden">
                  {asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : asset.type === 'video' ? (
                    <Video size={24} className="text-neutral-600" />
                  ) : asset.type === 'audio' ? (
                    <Music size={24} className="text-neutral-600" />
                  ) : (
                    <ImageIcon size={24} className="text-neutral-600" />
                  )}

                  {/* Duration Badge */}
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-neutral-300 flex items-center gap-0.5">
                    <Clock size={8} />
                    <span>{asset.duration.toFixed(1)}s</span>
                  </div>

                  {/* Hover Add Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                    <div className="p-1.5 bg-white text-black rounded-full shadow" title="Add to Timeline">
                      <Plus size={14} />
                    </div>
                  </div>
                </div>

                {/* Name & Delete */}
                <div className="p-1.5 flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] text-neutral-200 group-hover:text-white" title={asset.name}>
                    {asset.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMediaAsset(asset.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-white transition-opacity"
                    title="Remove from pool"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
