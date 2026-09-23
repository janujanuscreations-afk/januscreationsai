import React, { useState, useEffect, useRef } from 'react';
import { UploadedSong } from '../types';
import { MusicTrackItem } from './CategorizedMusicBrowser';
import { songService } from '../services/songService';
import { uploadCoverArtToStorage } from '../services/firebase';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

export interface EditSongMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: UploadedSong | MusicTrackItem | null;
  onSongUpdated?: (updatedSong: UploadedSong) => void;
}

const CURATED_GENRES = [
  'Synth-Wave',
  'Lo-Fi',
  'Hip-Hop',
  'Trap',
  'Drill',
  'Gospel',
  'Afrobeat',
  'Commercial Pop',
  'Cinematic',
  'Rock & Alternative',
  'R&B / Soul',
  'Neo-Soul',
  'Electronic & Club',
  'House & Techno',
  'EDM',
  'Upbeat',
  'Ambient & Chill',
  'Cyberpunk',
  'Reggae / Dancehall',
  'Funk & Disco',
  'Jazz & Blues',
  'Acoustic & Folk',
  'Hyperpop',
  'Latin & Reggaeton',
  'Indie Rock'
];

const GENRE_GROUPS: { label: string; genres: string[] }[] = [
  { label: 'Electronic & Synth', genres: ['Synth-Wave', 'Cyberpunk', 'Electronic & Club', 'House & Techno', 'EDM', 'Upbeat'] },
  { label: 'Hip-Hop & Urban', genres: ['Hip-Hop', 'Trap', 'Drill', 'Afrobeat', 'R&B / Soul', 'Neo-Soul', 'Latin & Reggaeton'] },
  { label: 'Chill & Mood', genres: ['Lo-Fi', 'Ambient & Chill', 'Cinematic', 'Acoustic & Folk', 'Jazz & Blues'] },
  { label: 'Pop & Traditional', genres: ['Commercial Pop', 'Gospel', 'Rock & Alternative', 'Funk & Disco', 'Reggae / Dancehall', 'Hyperpop', 'Indie Rock'] }
];

const MUSICAL_KEYS = [
  'C Major', 'A Minor',
  'G Major', 'E Minor',
  'D Major', 'B Minor',
  'A Major', 'F# Minor',
  'E Major', 'C# Minor',
  'F Major', 'D Minor',
  'Bb Major', 'G Minor',
  'Eb Major', 'C Minor',
  'Ab Major', 'F Minor',
  'Db Major', 'Bb Minor'
];

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop'
];

export const EditSongMetadataModal: React.FC<EditSongMetadataModalProps> = ({
  isOpen,
  onClose,
  song,
  onSongUpdated
}) => {
  // State for form fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [genreCategory, setGenreCategory] = useState('Synth-Wave');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Synth-Wave']);
  const [genreFilterText, setGenreFilterText] = useState('');
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [activeGenreTab, setActiveGenreTab] = useState('All');
  const [bpm, setBpm] = useState(120);
  const [musicalKey, setMusicalKey] = useState('C Major');
  const [vocalType, setVocalType] = useState<'full_vocals' | 'instrumental' | 'acapella' | 'stem_mixed'>('full_vocals');
  const [lyrics, setLyrics] = useState('');
  const [coverArtUrl, setCoverArtUrl] = useState('');
  const [creatorHandle, setCreatorHandle] = useState('@januaryrebl');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [royaltySplitCreator, setRoyaltySplitCreator] = useState(85);

  // Cover image upload
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Status & submission
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tap Tempo state
  const tapTimesRef = useRef<number[]>([]);

  // Initialize or reset form state when song changes
  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || 'January Rebl');

      // Parse initial genres into multi-select list
      const extractedGenres: string[] = [];
      const primaryCat = (song as any).genreCategory;
      if (primaryCat && primaryCat !== 'Custom') {
        extractedGenres.push(primaryCat);
      }
      if (song.genre) {
        song.genre.split(/[,•/|]/).forEach((g: string) => {
          const trimmed = g.trim();
          if (trimmed && !extractedGenres.includes(trimmed)) {
            extractedGenres.push(trimmed);
          }
        });
      }
      if (extractedGenres.length === 0) {
        extractedGenres.push('Synth-Wave');
      }

      setSelectedGenres(extractedGenres);
      setGenre(extractedGenres.join(' • '));
      setGenreCategory(extractedGenres[0] || 'Synth-Wave');
      setGenreFilterText('');
      setCustomGenreInput('');
      setActiveGenreTab('All');

      setBpm(Number(song.bpm) || 120);
      setMusicalKey(song.key || 'C Major');
      setVocalType((song as UploadedSong).vocalType || 'full_vocals');
      setLyrics((song as any).lyrics || (song as any).vibe || '');
      setCoverArtUrl(song.coverArtUrl || COVER_PRESETS[0]);
      setCoverPreview(null);
      setCoverFile(null);
      setCreatorHandle((song as UploadedSong).creatorHandle || '@januaryrebl');
      setRoyaltySplitCreator((song as UploadedSong).royaltySplitCreator || 85);

      if (song.tags && Array.isArray(song.tags)) {
        setTags([...song.tags]);
      } else {
        setTags(['Master Track', 'Original Song', 'Cloud Storage']);
      }

      setSaveSuccess(false);
      setErrorMessage(null);
      tapTimesRef.current = [];
    }
  }, [song, isOpen]);

  if (!isOpen || !song) return null;

  // Toggle a genre chip on/off
  const handleToggleGenre = (g: string) => {
    bossAudio.playLaserBeep();
    let updated: string[];
    if (selectedGenres.includes(g)) {
      updated = selectedGenres.filter(item => item !== g);
    } else {
      updated = [...selectedGenres, g];
    }
    setSelectedGenres(updated);
    if (updated.length > 0) {
      setGenreCategory(updated[0]);
      setGenre(updated.join(' • '));
    }
  };

  // Add custom typed genre chip
  const handleAddCustomGenre = () => {
    const clean = customGenreInput.trim().replace(/^[#•]/, '');
    if (clean && !selectedGenres.includes(clean)) {
      bossAudio.playCashChime();
      const updated = [...selectedGenres, clean];
      setSelectedGenres(updated);
      setGenreCategory(updated[0]);
      setGenre(updated.join(' • '));
      setCustomGenreInput('');
    }
  };

  // Quick select preset group
  const handleSelectGenreGroup = (groupGenres: string[]) => {
    bossAudio.playLaserBeep();
    const set = new Set([...selectedGenres, ...groupGenres]);
    const updated = Array.from(set);
    setSelectedGenres(updated);
    setGenreCategory(updated[0]);
    setGenre(updated.join(' • '));
  };

  // Clear all selected genres
  const handleClearAllGenres = () => {
    setSelectedGenres([]);
  };

  // Handle Cover Art File Picker
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    const localUrl = URL.createObjectURL(file);
    setCoverPreview(localUrl);

    // Auto-upload cover art to Firebase Storage
    setIsUploadingCover(true);
    try {
      const res = await uploadCoverArtToStorage(file);
      setCoverArtUrl(res.downloadUrl);
      bossAudio.playLaserBeep();
      triggerNeonExplosion({
        particleCount: 20,
        origin: { x: 0.3, y: 0.4 },
        intensity: 'subtle'
      });
    } catch (err: any) {
      console.warn('Cover art upload warning:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Tap Tempo algorithm
  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    
    // Clear history if gap is greater than 2.5 seconds
    if (taps.length > 0 && now - taps[taps.length - 1] > 2500) {
      taps.length = 0;
    }
    
    taps.push(now);
    if (taps.length > 5) taps.shift();

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
        bossAudio.playLaserBeep();
      }
    }
  };

  // Add Tag
  const handleAddTag = () => {
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Form Submit: Save to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a valid track title.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      bossAudio.playLevelUp();

      // If a cover file was selected but not uploaded yet
      let finalCoverUrl = coverArtUrl;
      let coverArtStoragePath: string | undefined = (song as UploadedSong).coverArtStoragePath;
      if (coverFile && !finalCoverUrl.includes('firebasestorage')) {
        try {
          const coverUpload = await uploadCoverArtToStorage(coverFile);
          finalCoverUrl = coverUpload.downloadUrl;
          coverArtStoragePath = coverUpload.storagePath;
        } catch (coverErr) {
          console.warn('Cover art upload error fallback:', coverErr);
        }
      }

      const combinedTags = Array.from(new Set([...tags, ...selectedGenres]));
      const finalGenreString = selectedGenres.length > 0 ? selectedGenres.join(' • ') : (genre.trim() || genreCategory || 'Synth-Wave');
      const finalCategory = selectedGenres[0] || genreCategory || 'Synth-Wave';

      const updatedPayload: Partial<UploadedSong> = {
        title: title.trim(),
        artist: artist.trim() || 'January Rebl',
        genre: finalGenreString,
        genreCategory: finalCategory,
        bpm: Number(bpm) || 120,
        key: musicalKey,
        vocalType,
        lyrics: lyrics.trim(),
        coverArtUrl: finalCoverUrl,
        coverArtStoragePath,
        creatorHandle: creatorHandle.trim() || '@januaryrebl',
        tags: combinedTags.length > 0 ? combinedTags : ['Master Track', 'Cloud Storage'],
        royaltySplitCreator: Number(royaltySplitCreator) || 85,
        royaltySplitJanu: 100 - (Number(royaltySplitCreator) || 85),
        updatedAt: new Date().toISOString()
      };

      // Save directly to Firestore and local cache
      await songService.updateSongMetadata(song.id, updatedPayload);

      const fullUpdatedSong: UploadedSong = {
        ...(song as any),
        ...updatedPayload
      };

      setSaveSuccess(true);
      bossAudio.playCashChime();
      triggerNeonExplosion({
        particleCount: 50,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'high'
      });

      if (onSongUpdated) {
        onSongUpdated(fullUpdatedSong);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update song metadata in Firestore:', err);
      setErrorMessage(err?.message || 'Failed to update song metadata in Firestore. Please try again.');
      bossAudio.playError();
    } finally {
      setIsSaving(false);
    }
  };

  const isCustomSong = (song as any).isCustomUpload || (song as any).audioStoragePath;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        id="modal-edit-song-metadata"
        className="relative w-full max-w-3xl bg-[#0A0A12] border border-white/15 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Glow Highlights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F5D4]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C084FC]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00F5D4] via-[#38BDF8] to-[#C084FC] text-black flex items-center justify-center font-black text-lg shadow-[0_0_20px_rgba(0,245,212,0.4)]">
              <i className="fa-solid fa-sliders"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-black italic text-white tracking-tight">
                  Edit Song Metadata
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-[9px] font-mono font-bold uppercase tracking-wider">
                  Firestore Live
                </span>
              </div>
              <p className="text-xs font-mono text-gray-400 font-light mt-0.5">
                Update track name, BPM, genre & tags saved in Firestore collection <code className="text-gray-300">uploaded_songs</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-edit-song-modal"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-7 space-y-6 relative z-10 custom-scrollbar flex-1">
          {/* Firestore & File Identification Banner */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-[#00F5D4]">
                <i className="fa-solid fa-cloud"></i>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Document Reference</span>
                <span className="text-white font-bold truncate block max-w-xs">
                  uploaded_songs/{song.id}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-gray-300 text-[10px]">
                {isCustomSong ? '☁️ Cloud Master File' : '🎵 Studio Preset'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-[10px] font-bold">
                85% Creator Cut
              </span>
            </div>
          </div>

          {/* Core Track Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Track Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-gray-400 font-bold flex items-center justify-between">
                <span>Track Name / Title *</span>
                <span className="text-gray-500 text-[9px]">Required</span>
              </label>
              <div className="relative">
                <i className="fa-solid fa-music absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sovereign Midnight Runner"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono transition-colors"
                />
              </div>
            </div>

            {/* Artist Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-gray-400 font-bold block">
                Artist / Producer Name
              </label>
              <div className="relative">
                <i className="fa-solid fa-user-astronaut absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. January Rebl"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Musical Metadata: Multi-Select Genres, BPM, Key, Vocals */}
          <div className="p-5 sm:p-6 rounded-2xl bg-black/50 border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <h4 className="text-xs font-mono uppercase font-bold text-[#00F5D4] flex items-center gap-2">
                <i className="fa-solid fa-tags text-sm"></i>
                <span>Genre Tags & Sub-Genres (Multi-Select Chips)</span>
              </h4>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold">
                  {selectedGenres.length} {selectedGenres.length === 1 ? 'Genre' : 'Genres'} Selected
                </span>
                {selectedGenres.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllGenres}
                    className="text-[10px] font-mono text-gray-400 hover:text-rose-400 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Active Selected Genre Chips Tray */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 min-h-[52px] flex flex-wrap items-center gap-2">
              {selectedGenres.length === 0 ? (
                <span className="text-xs font-mono text-gray-500 italic flex items-center gap-2">
                  <i className="fa-solid fa-hand-pointer text-gray-600 text-xs"></i>
                  <span>No genres selected yet. Click genre chips below or add a custom tag to tag this track.</span>
                </span>
              ) : (
                selectedGenres.map((g, idx) => (
                  <span
                    key={g}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      idx === 0
                        ? 'bg-gradient-to-r from-[#00F5D4]/25 to-[#38BDF8]/25 border border-[#00F5D4] text-[#00F5D4] shadow-[0_0_12px_rgba(0,245,212,0.3)]'
                        : 'bg-[#C084FC]/20 border border-[#C084FC]/50 text-[#C084FC] shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                    }`}
                  >
                    <i className="fa-solid fa-check text-[10px]"></i>
                    <span>{g}</span>
                    {idx === 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00F5D4]/30 text-white font-mono uppercase tracking-wider">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleGenre(g)}
                      className="ml-1 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title={`Remove ${g}`}
                    >
                      <i className="fa-solid fa-xmark text-[11px]"></i>
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Search & Custom Genre Chip Input Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Filter chips search input */}
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                <input
                  type="text"
                  value={genreFilterText}
                  onChange={(e) => setGenreFilterText(e.target.value)}
                  placeholder="Filter genres (e.g. synth, rock, drill)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono placeholder:text-gray-600 transition-colors"
                />
                {genreFilterText && (
                  <button
                    type="button"
                    onClick={() => setGenreFilterText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* Custom Genre Creator */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <i className="fa-solid fa-plus absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00F5D4] text-xs"></i>
                  <input
                    type="text"
                    value={customGenreInput}
                    onChange={(e) => setCustomGenreInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomGenre();
                      }
                    }}
                    placeholder="Type custom genre & press Enter..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono placeholder:text-gray-600 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomGenre}
                  disabled={!customGenreInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#00F5D4]/20 hover:bg-[#00F5D4] text-[#00F5D4] hover:text-black border border-[#00F5D4]/40 font-mono text-xs font-bold transition-all disabled:opacity-30 cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Category Tabs for Fast Discovery */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {['All', ...GENRE_GROUPS.map(g => g.label)].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveGenreTab(tab);
                    bossAudio.playLaserBeep();
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    activeGenreTab === tab
                      ? 'bg-white/15 text-white border border-white/30'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Curated Interactive Genre Chips Grid */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-black/40 border border-white/5 custom-scrollbar">
                {CURATED_GENRES
                  .filter((g) => {
                    if (activeGenreTab !== 'All') {
                      const grp = GENRE_GROUPS.find(gr => gr.label === activeGenreTab);
                      if (grp && !grp.genres.includes(g)) return false;
                    }
                    if (genreFilterText.trim()) {
                      return g.toLowerCase().includes(genreFilterText.toLowerCase().trim());
                    }
                    return true;
                  })
                  .map((g) => {
                    const isSelected = selectedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleToggleGenre(g)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer select-none active:scale-95 ${
                          isSelected
                            ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] font-bold shadow-[0_0_12px_rgba(0,245,212,0.3)] ring-1 ring-[#00F5D4]/40'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
                        }`}
                      >
                        <i className={`fa-solid ${isSelected ? 'fa-check text-[#00F5D4]' : 'fa-plus text-gray-500 text-[10px]'}`}></i>
                        <span>{g}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Quick Group Preset Selection Packs */}
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-gray-400">
                <span className="uppercase text-gray-500 font-bold">Quick Packs:</span>
                {GENRE_GROUPS.map((grp) => (
                  <button
                    key={grp.label}
                    type="button"
                    onClick={() => handleSelectGenreGroup(grp.genres)}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-[#00F5D4]/10 border border-white/10 hover:border-[#00F5D4]/30 text-gray-300 hover:text-[#00F5D4] transition-all cursor-pointer"
                  >
                    + {grp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Musical Key & Vocal Arrangement Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              {/* Musical Key */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Musical Key Signature
                </label>
                <select
                  value={musicalKey}
                  onChange={(e) => setMusicalKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono transition-colors cursor-pointer"
                >
                  {MUSICAL_KEYS.map((k) => (
                    <option key={k} value={k} className="bg-zinc-900 text-white">
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vocal Arrangement Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Vocal Arrangement
                </label>
                <select
                  value={vocalType}
                  onChange={(e) => setVocalType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono transition-colors cursor-pointer"
                >
                  <option value="full_vocals" className="bg-zinc-900 text-white">Full Vocals</option>
                  <option value="instrumental" className="bg-zinc-900 text-white">Instrumental Master</option>
                  <option value="acapella" className="bg-zinc-900 text-white">Acapella / Lead</option>
                  <option value="stem_mixed" className="bg-zinc-900 text-white">Stem Mixed</option>
                </select>
              </div>
            </div>

            {/* Interactive BPM & Tempo Control */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                    Tempo / BPM:
                  </span>
                  <span className="text-base font-mono font-black text-[#00F5D4]">
                    {bpm} BPM
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTapTempo}
                  className="px-3 py-1 rounded-lg bg-[#00F5D4]/10 hover:bg-[#00F5D4]/20 border border-[#00F5D4]/30 text-[#00F5D4] text-[10px] font-mono font-bold uppercase transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  title="Click repeatedly on the beat to calculate BPM"
                >
                  <i className="fa-solid fa-hand-pointer text-[9px]"></i>
                  <span>Tap Tempo</span>
                </button>
              </div>

              {/* Slider & Quick Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBpm(Math.max(40, bpm - 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  -1
                </button>

                <input
                  type="range"
                  min="40"
                  max="220"
                  step="1"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="flex-1 accent-[#00F5D4] cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => setBpm(Math.min(240, bpm + 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  +1
                </button>

                <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                  {[80, 100, 120, 128, 140, 160].map((presetBpm) => (
                    <button
                      key={presetBpm}
                      type="button"
                      onClick={() => setBpm(presetBpm)}
                      className={`px-2 py-1 rounded-md text-[9px] font-mono transition-all cursor-pointer ${
                        bpm === presetBpm
                          ? 'bg-[#00F5D4] text-black font-black'
                          : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {presetBpm}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cover Art Image Section */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase font-bold text-[#C084FC] flex items-center gap-2">
                <i className="fa-solid fa-image"></i>
                <span>Album & Cover Art Artwork</span>
              </h4>
              {isUploadingCover && (
                <span className="text-[10px] font-mono text-[#00F5D4] flex items-center gap-1">
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Uploading to Firebase Storage...</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Cover Preview Box */}
              <div className="relative group shrink-0">
                <img
                  src={coverPreview || coverArtUrl || COVER_PRESETS[0]}
                  alt="Cover preview"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:border-[#00F5D4] transition-all"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-mono transition-opacity cursor-pointer gap-1"
                >
                  <i className="fa-solid fa-cloud-arrow-up text-sm text-[#00F5D4]"></i>
                  <span>Change Art</span>
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
              </div>

              {/* Cover Presets & Direct URL Input */}
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-gray-400 block">
                    Cover Image URL or Firebase Storage Download URL
                  </label>
                  <input
                    type="url"
                    value={coverArtUrl}
                    onChange={(e) => {
                      setCoverArtUrl(e.target.value);
                      setCoverPreview(null);
                    }}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#C084FC] focus:outline-none text-white text-xs font-mono transition-colors"
                  />
                </div>

                <div>
                  <span className="text-[9px] font-mono uppercase text-gray-500 block mb-1.5">
                    Studio Art Presets:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {COVER_PRESETS.map((presetUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCoverArtUrl(presetUrl);
                          setCoverPreview(null);
                        }}
                        className={`w-9 h-9 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                          coverArtUrl === presetUrl && !coverPreview
                            ? 'border-[#00F5D4] scale-110 shadow-[0_0_10px_#00F5D4]'
                            : 'border-white/10 hover:border-white/40 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-gray-300 hover:text-white text-[10px] font-mono flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <i className="fa-solid fa-plus text-[9px] text-[#00F5D4]"></i>
                      <span>Upload File</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags & Genre Descriptors */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase text-gray-400 font-bold block">
              Musical Tags & Descriptors
            </label>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-gray-200 text-xs font-mono flex items-center gap-1.5 group"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 group-hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag e.g. Cyberpunk, 80s Analog, Chill..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#00F5D4] text-white hover:text-black font-mono text-xs uppercase font-bold transition-all cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Lyrics, Vibe Description & Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-gray-400 font-bold flex items-center justify-between">
              <span>Lyrics / Sonic Vibe / Production Notes</span>
              <span className="text-gray-500 text-[9px]">Optional</span>
            </label>
            <textarea
              rows={3}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Enter lyrics, chorus hooks, synthesizer patches or arrangement notes..."
              className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono placeholder:text-gray-600 resize-none transition-colors"
            />
          </div>

          {/* Royalty Split Customization */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-gray-300 font-bold block">Royalty Split Schedule</span>
              <span className="text-[10px] text-gray-500">Pure USD split on tips & streams</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#00F5D4] font-bold">
                {royaltySplitCreator}% Creator
              </span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">
                {100 - royaltySplitCreator}% Platform
              </span>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-3">
              <i className="fa-solid fa-triangle-exclamation mt-0.5 text-base shrink-0"></i>
              <div className="space-y-1">
                <p className="font-bold">Error Updating Metadata</p>
                <p className="text-[11px] leading-relaxed text-red-300">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Message Display */}
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-xs font-mono flex items-start gap-3 animate-fade-in">
              <i className="fa-solid fa-circle-check mt-0.5 text-base shrink-0"></i>
              <div className="space-y-0.5">
                <p className="font-bold">Metadata Saved Successfully to Firestore!</p>
                <p className="text-[11px] text-gray-300">
                  Track details updated in <code className="text-[#00F5D4]">uploaded_songs/{song.id}</code>
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Modal Sticky Footer Actions */}
        <div className="p-5 sm:p-6 bg-black/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="text-[11px] font-mono text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse"></span>
            <span>Real-time sync to all Music Studio views</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="btn-cancel-edit-song"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              id="btn-save-song-metadata"
              onClick={handleSubmit}
              disabled={isSaving || !title.trim()}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] hover:opacity-95 text-black font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,245,212,0.4)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Saving to Firestore...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
                  <span>Save Updates to Firestore</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSongMetadataModal;
