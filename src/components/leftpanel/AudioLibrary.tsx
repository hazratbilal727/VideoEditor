import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  Download,
  ChevronDown,
  ChevronUp,
  Music,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { generateSyntheticAudio } from '../../services/syntheticMedia';
import { MediaAsset, TimelineClip } from '../../types/editor';

interface MusicTrackItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  category: string;
  coverBg: string;
  coverType: 'beat' | 'riser' | 'tone';
  coverIcon?: string;
}

const MUSIC_TRACKS: MusicTrackItem[] = [
  {
    id: 'track_violin',
    title: 'Violin Inspiration',
    artist: 'Stanislav Barantsov',
    duration: '01:22',
    durationSec: 82,
    category: 'Trending',
    coverBg: 'from-amber-600 via-orange-500 to-rose-600',
    coverType: 'tone',
  },
  {
    id: 'track_bgm',
    title: 'Background Music',
    artist: 'IlyaSound',
    duration: '03:36',
    durationSec: 216,
    category: 'Trending',
    coverBg: 'from-cyan-600 to-blue-700',
    coverType: 'beat',
  },
  {
    id: 'track_you_have_it',
    title: 'You Have It',
    artist: 'Marscott',
    duration: '02:31',
    durationSec: 151,
    category: 'Trending',
    coverBg: 'from-red-600 to-pink-600',
    coverType: 'beat',
  },
  {
    id: 'track_island_vibes',
    title: 'Island Vibes',
    artist: 'Klaus Richter',
    duration: '02:19',
    durationSec: 139,
    category: 'Trending',
    coverBg: 'from-amber-500 via-orange-600 to-yellow-500',
    coverType: 'beat',
  },
  {
    id: 'track_passo_funk',
    title: 'PASSO FUNK',
    artist: 'Lunak',
    duration: '00:21',
    durationSec: 21,
    category: 'Trending',
    coverBg: 'from-purple-800 via-indigo-900 to-pink-700',
    coverType: 'beat',
  },
  {
    id: 'track_relaxed',
    title: 'Relaxed',
    artist: 'MC Mablo Dos Paredões',
    duration: '00:58',
    durationSec: 58,
    category: 'Trending',
    coverBg: 'from-neutral-800 to-neutral-900',
    coverType: 'riser',
  },
  {
    id: 'track_lofi_chill',
    title: 'Warm Sunlight Lofi',
    artist: 'Aero Sound',
    duration: '02:10',
    durationSec: 130,
    category: 'Vlog',
    coverBg: 'from-amber-700 to-yellow-600',
    coverType: 'beat',
  },
  {
    id: 'track_epic_cinematic',
    title: 'Cinematic Horizon',
    artist: 'Nordic Strings',
    duration: '02:45',
    durationSec: 165,
    category: 'Dreamy',
    coverBg: 'from-cyan-800 to-teal-700',
    coverType: 'tone',
  },
];

export const AudioLibrary: React.FC = () => {
  const { project, playhead, addMediaAsset, addClip, setStatusMessage } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Trending');
  const [isMusicExpanded, setIsMusicExpanded] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadAndInsert = async (item: MusicTrackItem) => {
    setLoadingTrackId(item.id);
    setStatusMessage(`Synthesizing & adding "${item.title}"...`);

    try {
      // Synthesize audio offline (clamped to sensible offline buffer 12s for fast generation)
      const durationToGenerate = Math.min(15, item.durationSec);
      const syn = await generateSyntheticAudio(item.coverType, durationToGenerate);

      const asset: MediaAsset = {
        id: 'asset_' + item.id + '_' + Date.now().toString(36),
        name: `${item.title} - ${item.artist}.wav`,
        type: 'audio',
        url: syn.url,
        blob: syn.blob,
        duration: durationToGenerate,
        waveformData: syn.waveform,
        dateAdded: Date.now(),
      };
      addMediaAsset(asset);

      // Add to audio track
      let targetTrack = project.tracks.find((t) => t.type === 'audio');
      if (!targetTrack) {
        targetTrack = project.tracks[project.tracks.length - 1];
      }

      const clip: TimelineClip = {
        id: 'clip_' + Math.random().toString(36).substring(2, 9),
        trackId: targetTrack.id,
        assetId: asset.id,
        type: 'audio',
        name: `${item.title} - ${item.artist}`,
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
          volume: 0.85,
          muted: false,
          pan: 0,
          fadeIn: 0.1,
          fadeOut: 0.2,
        },
        transitionIn: { type: 'none', duration: 0 },
        transitionOut: { type: 'none', duration: 0 },
        keyframes: [],
      };

      addClip(clip);
      setStatusMessage(`Added "${item.title}" to audio track at ${playhead.toFixed(2)}s`);
    } catch (err) {
      console.error(err);
      setStatusMessage('Error synthesizing audio');
    } finally {
      setLoadingTrackId(null);
    }
  };

  const filteredTracks = MUSIC_TRACKS.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex h-full bg-[#141416] select-none text-xs overflow-hidden">
      {/* Sub-Sidebar (Left Column) */}
      <div className="w-[105px] border-r border-[#232328] bg-[#121214] flex flex-col py-2 px-1.5 shrink-0 overflow-y-auto no-scrollbar space-y-1">
        {/* Import Pill */}
        <button className="w-full py-1.5 px-2 bg-[#222227] hover:bg-[#2b2b32] text-white rounded text-[11px] font-medium transition-colors text-left flex items-center justify-between">
          <span>Import</span>
        </button>

        {/* Yours Expandable */}
        <button className="w-full py-1 px-2 text-neutral-400 hover:text-white rounded text-[11px] transition-colors text-left flex items-center justify-between">
          <span>Yours</span>
          <ChevronDown size={10} className="text-neutral-500" />
        </button>

        {/* AI Music */}
        <button className="w-full py-1 px-2 text-neutral-400 hover:text-white rounded text-[11px] transition-colors text-left">
          <span>AI music</span>
        </button>

        {/* Music Collapsible (Cyan Active in Screenshot) */}
        <div className="pt-1">
          <button
            onClick={() => setIsMusicExpanded(!isMusicExpanded)}
            className="w-full py-1 px-2 text-[#00e5ff] font-medium rounded text-[11px] text-left flex items-center justify-between"
          >
            <span>Music</span>
            {isMusicExpanded ? (
              <ChevronUp size={10} className="text-[#00e5ff]" />
            ) : (
              <ChevronDown size={10} className="text-[#00e5ff]" />
            )}
          </button>

          {isMusicExpanded && (
            <div className="space-y-0.5 pl-2 pt-0.5">
              {[
                { name: 'Trending' },
                { name: 'Hot Bgm' },
                { name: 'Vlog' },
                { name: 'Christmas 🎄' },
                { name: 'Marketing' },
                { name: 'Cute' },
                { name: 'Dreamy' },
                { name: 'Hits' },
              ].map((cat) => {
                const isActive = selectedSubCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedSubCategory(cat.name)}
                    className={`w-full py-0.5 px-2 rounded text-[11px] text-left transition-colors truncate ${
                      isActive
                        ? 'text-[#00e5ff] font-medium bg-[#1d1d23]'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sound Effects */}
        <button className="w-full py-1 px-2 text-neutral-400 hover:text-white rounded text-[11px] transition-colors text-left flex items-center justify-between pt-1">
          <span className="truncate">Sounds effe...</span>
          <ChevronDown size={10} className="text-neutral-500 shrink-0" />
        </button>
      </div>

      {/* Resource Explorer (Right Column) */}
      <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
        {/* Search Bar + Filter Icon */}
        <div className="p-2 border-b border-[#232328] flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={11} className="absolute left-2.5 top-2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search songs or artists"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1c20] border border-[#2b2b32] rounded pl-7 pr-2 py-1 text-white text-[11px] placeholder-neutral-500 focus:outline-none focus:border-[#444]"
            />
          </div>
          <button
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#222228] rounded border border-[#2b2b32] transition-colors"
            title="Filter by duration/genre"
          >
            <SlidersHorizontal size={11} />
          </button>
        </div>

        {/* Category Header */}
        <div className="px-3 py-1.5 text-[11px] font-medium text-neutral-300">
          {selectedSubCategory}
        </div>

        {/* Audio Track List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredTracks.map((item) => {
            const isFav = !!favorites[item.id];
            const isLoading = loadingTrackId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleDownloadAndInsert(item)}
                className="group flex items-center justify-between p-1.5 rounded hover:bg-[#202026] border border-transparent hover:border-[#2b2b34] transition-all cursor-pointer"
              >
                {/* Left: Artwork + Title + Artist */}
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <div
                    className={`w-9 h-9 rounded bg-gradient-to-br ${item.coverBg} flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden`}
                  >
                    <Music size={14} className="text-white/80" />
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-3.5 h-3.5 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-[11.5px] font-medium text-neutral-200 group-hover:text-white truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-neutral-400 truncate">
                      {item.artist} · {item.duration}
                    </span>
                  </div>
                </div>

                {/* Right: Star Icon + Download Icon */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="p-1 text-neutral-500 hover:text-white transition-colors"
                    title="Add to favorites"
                  >
                    <Star
                      size={12}
                      className={isFav ? 'text-amber-400 fill-amber-400' : 'text-neutral-500 hover:text-white'}
                    />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadAndInsert(item);
                    }}
                    className="w-6 h-6 rounded-full bg-[#24242c] group-hover:bg-[#2e2e38] text-neutral-300 hover:text-white hover:border-[#00e5ff] border border-[#32323e] flex items-center justify-center transition-colors shadow-sm"
                    title="Download and add to timeline"
                  >
                    <Download size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
