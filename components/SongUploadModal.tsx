import React, { useState, useRef } from 'react';
import { UploadedSong } from '../types';
import { songService } from '../services/songService';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface SongUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongUploaded?: (newSong: UploadedSong) => void;
  initialCategory?: string;
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

export const SongUploadModal: React.FC<SongUploadModalProps> = ({
  isOpen,
  onClose,
  onSongUploaded,
  initialCategory
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genreCategory, setGenreCategory] = useState(initialCategory || 'Synth-Wave');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([initialCategory || 'Synth-Wave']);
  const [genreFilterText, setGenreFilterText] = useState('');
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [activeGenreTab, setActiveGenreTab] = useState('All');
  const [subGenre, setSubGenre] = useState('');
  const [bpm, setBpm] = useState(120);
  const [musicalKey, setMusicalKey] = useState('C Major');
  const [vocalType, setVocalType] = useState<'full_vocals' | 'instrumental' | 'acapella' | 'stem_mixed'>('full_vocals');
  const [lyrics, setLyrics] = useState('');
  const [coverArtUrl, setCoverArtUrl] = useState('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop');
  const [creatorSplit, setCreatorSplit] = useState(85);
  const [tagsInput, setTagsInput] = useState('Original Song, Master Audio, Janu Vault, Firebase Cloud');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Toggle genre chip
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
    }
  };

  // Add custom genre chip
  const handleAddCustomGenre = () => {
    const clean = customGenreInput.trim().replace(/^[#•]/, '');
    if (clean && !selectedGenres.includes(clean)) {
      bossAudio.playCashChime();
      const updated = [...selectedGenres, clean];
      setSelectedGenres(updated);
      setGenreCategory(updated[0]);
      setCustomGenreInput('');
    }
  };

  // Quick group select
  const handleSelectGenreGroup = (groupGenres: string[]) => {
    bossAudio.playLaserBeep();
    const set = new Set([...selectedGenres, ...groupGenres]);
    const updated = Array.from(set);
    setSelectedGenres(updated);
    setGenreCategory(updated[0]);
  };

  // Clear all genres
  const handleClearAllGenres = () => {
    setSelectedGenres([]);
  };

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorMessage(null);
    
    // Auto-fill title if empty
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }
    if (!artist) {
      setArtist('January Rebl');
    }

    const url = URL.createObjectURL(selectedFile);
    setAudioPreviewUrl(url);
    triggerNeonExplosion({
      particleCount: 30,
      origin: { x: 0.5, y: 0.3 },
      intensity: 'subtle'
    });
  };

  const handleTogglePreview = () => {
    if (!audioRef.current) return;
    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingPreview(true)).catch(console.error);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedCover = e.target.files?.[0];
    if (selectedCover) {
      setCoverFile(selectedCover);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCoverArtUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(selectedCover);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select an audio master file (.mp3, .wav, .m4a, .flac).');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(5);
    setProgressStatus('Initializing Firebase Storage session...');
    setErrorMessage(null);
    bossAudio.playLevelUp();

    try {
      const inputTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const combinedTags = Array.from(new Set([...inputTags, ...selectedGenres]));
      const finalGenreString = selectedGenres.length > 0 ? selectedGenres.join(' • ') : (subGenre.trim() || genreCategory);
      const finalCategory = selectedGenres[0] || genreCategory;

      const newSong = await songService.uploadSongToCloud(
        file,
        {
          title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
          artist: artist.trim() || 'January Rebl',
          genre: finalGenreString,
          genreCategory: finalCategory,
          bpm: Number(bpm) || 120,
          key: musicalKey,
          coverArtUrl: coverArtUrl,
          lyrics: lyrics.trim(),
          vocalType: vocalType,
          royaltySplitCreator: creatorSplit,
          royaltySplitJanu: 100 - creatorSplit,
          tags: combinedTags.length > 0 ? combinedTags : ['Master Track', 'Firebase Storage', 'Janu Vault']
        },
        coverFile,
        (progress, status) => {
          setUploadProgress(progress);
          setProgressStatus(status);
        }
      );

      setIsProcessing(false);
      setUploadSuccess(true);

      triggerNeonExplosion({
        particleCount: 80,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'grand'
      });

      if (onSongUploaded) {
        onSongUploaded(newSong);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Song cloud upload failed:', err);
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Upload encountered an issue. Re-saved to local resilient cache.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950/95 border border-white/15 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#C084FC]/15 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#00F5D4]/15 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00F5D4]/20 to-[#C084FC]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4]">
              <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse"></span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-[#00F5D4]">
                  Firebase Storage & Firestore Synced
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white">
                Upload Song to Creator Cloud Library
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-400"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Upload Progress Banner when uploading */}
        {isProcessing && (
          <div className="mb-6 p-4 rounded-3xl bg-zinc-900/90 border border-[#00F5D4]/50 shadow-[0_0_30px_rgba(0,245,212,0.2)]">
            <div className="flex items-center justify-between text-xs font-mono text-white mb-2">
              <span className="flex items-center gap-2 text-[#00F5D4] font-bold">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>{progressStatus || 'Uploading to Firebase Storage...'}</span>
              </span>
              <span className="font-bold text-[#00F5D4]">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#00F5D4] via-[#818CF8] to-[#C084FC] transition-all duration-300 rounded-full shadow-[0_0_12px_#00F5D4]"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Content Scroll Area */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-6 pr-2 custom-scrollbar flex-1">
          
          {/* 1. Drag and Drop Audio File Box */}
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 block mb-2 flex items-center justify-between">
              <span>1. Audio Master File (.mp3, .wav, .m4a, .flac, .aac, .ogg)</span>
              <span className="text-[10px] text-[#00F5D4] font-mono">Firebase Storage Bucket</span>
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,.mp3,.wav,.m4a,.flac,.aac,.ogg"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-white/20 hover:border-[#00F5D4] rounded-3xl p-8 text-center bg-white/[0.02] hover:bg-[#00F5D4]/5 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/5 group-hover:bg-[#00F5D4]/10 border border-white/10 group-hover:border-[#00F5D4]/40 flex items-center justify-center text-gray-400 group-hover:text-[#00F5D4] transition-all">
                  <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
                </div>
                <h4 className="text-sm font-mono font-bold text-white mb-1">
                  Drag & drop your song audio file here
                </h4>
                <p className="text-xs font-mono text-gray-400">
                  Or click to browse from device • High-res lossless master audio auto-synced to Cloud
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-white/5 border border-[#00F5D4]/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="w-12 h-12 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center text-[#00F5D4] shrink-0">
                    <i className="fa-solid fa-file-audio text-xl"></i>
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-mono font-bold text-white truncate">{file.name}</h4>
                    <p className="text-[11px] font-mono text-gray-400 flex items-center gap-2">
                      <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span className="text-[#00F5D4]">Firebase Storage Ready</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {audioPreviewUrl && (
                    <>
                      <audio 
                        ref={audioRef} 
                        src={audioPreviewUrl} 
                        onEnded={() => setIsPlayingPreview(false)} 
                        onError={() => {
                          console.warn('Audio upload preview notice');
                          setIsPlayingPreview(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleTogglePreview}
                        className="px-3 py-2 rounded-xl bg-[#00F5D4]/20 hover:bg-[#00F5D4]/30 border border-[#00F5D4]/40 text-[#00F5D4] font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className={`fa-solid ${isPlayingPreview ? 'fa-pause' : 'fa-play'}`}></i>
                        <span>{isPlayingPreview ? 'Pause' : 'Audition'}</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setAudioPreviewUrl(null);
                      setIsPlayingPreview(false);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/10 transition-all cursor-pointer"
                    title="Change file"
                  >
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Metadata Grid & Multi-Select Genre Chips */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 block mb-1.5">Track Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sovereign Grace 2026"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono text-white focus:border-[#00F5D4] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 block mb-1.5">Artist / Vocalist *</label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. January Rebl"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono text-white focus:border-[#00F5D4] outline-none"
                />
              </div>
            </div>

            {/* Genre Multi-Select Chips Box */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-[#00F5D4] font-bold flex items-center gap-2">
                  <i className="fa-solid fa-tags text-xs"></i>
                  <span>Genre Tags (Multi-Select Chips)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-[9px] font-mono font-bold">
                    {selectedGenres.length} Selected
                  </span>
                  {selectedGenres.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllGenres}
                      className="text-[9px] font-mono text-gray-400 hover:text-rose-400 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Chips */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 min-h-[44px] flex flex-wrap items-center gap-1.5">
                {selectedGenres.length === 0 ? (
                  <span className="text-[11px] font-mono text-gray-500 italic">No genres selected yet. Click chips below.</span>
                ) : (
                  selectedGenres.map((g, idx) => (
                    <span
                      key={g}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold ${
                        idx === 0
                          ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4]'
                          : 'bg-[#C084FC]/20 border border-[#C084FC]/40 text-[#C084FC]'
                      }`}
                    >
                      <i className="fa-solid fa-check text-[9px]"></i>
                      <span>{g}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleGenre(g)}
                        className="ml-1 text-gray-400 hover:text-rose-400 cursor-pointer"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Filter & Custom Add */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={genreFilterText}
                  onChange={(e) => setGenreFilterText(e.target.value)}
                  placeholder="Filter genres (e.g. drill, lofi)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono placeholder:text-gray-600 focus:border-[#00F5D4] outline-none"
                />
                <div className="flex items-center gap-1.5">
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
                    placeholder="Custom genre tag..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono placeholder:text-gray-600 focus:border-[#00F5D4] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGenre}
                    disabled={!customGenreInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-[#00F5D4]/20 hover:bg-[#00F5D4] text-[#00F5D4] hover:text-black font-mono text-xs font-bold transition-all disabled:opacity-30 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Group Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                {['All', ...GENRE_GROUPS.map(g => g.label)].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveGenreTab(tab)}
                    className={`px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                      activeGenreTab === tab
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Genre Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-black/40 border border-white/5 custom-scrollbar">
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] font-bold shadow-[0_0_8px_rgba(0,245,212,0.2)]'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white'
                        }`}
                      >
                        <i className={`fa-solid ${isSelected ? 'fa-check' : 'fa-plus text-[9px] text-gray-500'}`}></i>
                        <span>{g}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 block mb-1.5">Vocal & Stem Structure</label>
                <select
                  value={vocalType}
                  onChange={(e) => setVocalType(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono text-white focus:border-[#00F5D4] outline-none"
                >
                  <option value="full_vocals" className="bg-zinc-900 text-white">Full Vocal Master</option>
                  <option value="instrumental" className="bg-zinc-900 text-white">Instrumental Master</option>
                  <option value="acapella" className="bg-zinc-900 text-white">Acapella / Lead</option>
                  <option value="stem_mixed" className="bg-zinc-900 text-white">Stem Mixed</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 block mb-1.5">Tempo (BPM)</label>
                <input
                  type="number"
                  min="50"
                  max="240"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono text-white focus:border-[#00F5D4] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 block mb-1.5">Musical Key</label>
                <input
                  type="text"
                  value={musicalKey}
                  onChange={(e) => setMusicalKey(e.target.value)}
                  placeholder="e.g. C Major, D Minor"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono text-white focus:border-[#00F5D4] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Cover Art & Lyrics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="text-[11px] font-mono uppercase text-gray-400 block mb-1.5">Album Artwork</label>
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="relative group w-full h-32 rounded-2xl overflow-hidden border border-white/15 cursor-pointer"
              >
                <img src={coverArtUrl} alt="Cover Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono font-bold">
                  <i className="fa-solid fa-camera mr-1"></i> Upload Image
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono uppercase text-gray-400 block mb-1.5">Lyrics / Storyboard Subtitles (Optional)</label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Add song verses, chorus, and lyrics for auto video subtitles and scene generation..."
                rows={4}
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-3 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
              />
            </div>
          </div>

          {/* 4. Monetization & Split Info Card (Pure USD) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00F5D4]/10 via-[#C084FC]/10 to-transparent border border-[#00F5D4]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4]">
                <i className="fa-solid fa-sack-dollar text-base"></i>
              </div>
              <div>
                <h5 className="text-xs font-mono font-bold text-white">Creator Cloud Storage & Royalties</h5>
                <p className="text-[10px] font-mono text-gray-300">
                  <span className="text-[#00F5D4] font-bold">85% Net Payout</span> directly to your Wallet • <span className="text-[#C084FC] font-bold">15% Janu Studio Split</span>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#00F5D4]/20 text-[#00F5D4] text-[10px] font-mono font-bold uppercase">
              Pure USD
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-gray-300 font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isProcessing}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] hover:opacity-90 text-black font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Uploading to Firebase ({uploadProgress}%)...</span>
                </>
              ) : uploadSuccess ? (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Master Published & Synced!</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Upload & Sync to Cloud Library</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SongUploadModal;

