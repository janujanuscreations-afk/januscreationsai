import React, { useState, useEffect, useRef } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { musicAudioEngine, MUSIC_GENRES, MusicGenreTrack } from '../utils/musicAudioEngine';
import { UploadedSong } from '../types';
import { songService } from '../services/songService';
import SongUploadModal from './SongUploadModal';
import EditSongMetadataModal from './EditSongMetadataModal';

export interface MusicTrackItem {
  id: string;
  title: string;
  artist: string;
  genre: string;
  genreCategory: 'Synth-Wave' | 'Lo-Fi' | 'Cinematic' | 'Upbeat' | 'Hip-Hop' | 'Gospel' | 'Afrobeat' | 'Rock' | 'Custom' | 'Other';
  bpm: number;
  key: string;
  duration: string; // e.g. '2:48'
  vibe: string;
  tags: string[];
  coverGradient: string;
  coverArtUrl?: string;
  icon: string;
  plays: string;
  likes: number;
  engineGenreId: string; // references one of the MUSIC_GENRES id
  isTrending?: boolean;
  isNew?: boolean;
  audioUrl?: string;
  lyrics?: string;
  isCustomUpload?: boolean;
  uploadedBy?: string;
}

export const BROWSER_TRACKS: MusicTrackItem[] = [
  // Synth-Wave Tracks
  {
    id: 'track-sw-1',
    title: 'Neon Midnight Runner',
    artist: 'Cyber Janu Syndicate',
    genre: 'Synth-Wave',
    genreCategory: 'Synth-Wave',
    bpm: 120,
    key: 'D Minor',
    duration: '3:15',
    vibe: '80s analog saw arpeggios, gated reverb snare, resonant tape warmth',
    tags: ['Retro', 'Analog 80s', 'Cyberpunk', 'Driving'],
    coverGradient: 'from-[#FF007F] via-[#9333EA] to-[#3B82F6]',
    icon: 'fa-microchip',
    plays: '142.8K',
    likes: 3840,
    engineGenreId: 'synthwave',
    isTrending: true
  },
  {
    id: 'track-sw-2',
    title: 'Cyber Horizon 2088',
    artist: 'VaporPulse',
    genre: 'Synth-Wave',
    genreCategory: 'Synth-Wave',
    bpm: 124,
    key: 'A Minor',
    duration: '2:54',
    vibe: 'Hyper-futuristic neon highway pulse with crystal arps and heavy kick',
    tags: ['Outrun', 'Night Drive', 'Synth Pop'],
    coverGradient: 'from-[#EC4899] via-[#8B5CF6] to-[#06B6D4]',
    icon: 'fa-vr-cardboard',
    plays: '98.4K',
    likes: 2190,
    engineGenreId: 'synthwave',
    isNew: true
  },
  {
    id: 'track-sw-3',
    title: 'Starlight Dreamer',
    artist: 'Janu Astral Unit',
    genre: 'Synth-Wave',
    genreCategory: 'Synth-Wave',
    bpm: 116,
    key: 'D Minor',
    duration: '3:30',
    vibe: 'Lush vintage poly-synths with dreamy chorus and gated snare drops',
    tags: ['Space', 'Dreamwave', 'Chill Synth'],
    coverGradient: 'from-[#A855F7] via-[#EC4899] to-[#F59E0B]',
    icon: 'fa-stars',
    plays: '74.2K',
    likes: 1840,
    engineGenreId: 'synthwave'
  },

  // Lo-Fi Tracks
  {
    id: 'track-lofi-1',
    title: 'Rainy Tokyo Café',
    artist: 'MellowJanu Beats',
    genre: 'Lo-Fi Chill',
    genreCategory: 'Lo-Fi',
    bpm: 85,
    key: 'Eb Major',
    duration: '2:40',
    vibe: 'Jazzy major 9th electric piano, gentle vinyl dust crackle, lazy swung drums',
    tags: ['Study Beats', 'Coffee Shop', 'Relaxed', 'Vinyl'],
    coverGradient: 'from-[#0284C7] via-[#38BDF8] to-[#67E8F9]',
    icon: 'fa-mug-hot',
    plays: '280.5K',
    likes: 8920,
    engineGenreId: 'lofi',
    isTrending: true
  },
  {
    id: 'track-lofi-2',
    title: 'Midnight Study Session',
    artist: 'Chillout Queen',
    genre: 'Lo-Fi Chill',
    genreCategory: 'Lo-Fi',
    bpm: 80,
    key: 'Eb Major',
    duration: '3:05',
    vibe: 'Warm tape saturation, muted jazz guitar loops, low-pass filtered kick',
    tags: ['Deep Focus', 'Late Night', 'Ambient R&B'],
    coverGradient: 'from-[#6366F1] via-[#818CF8] to-[#C084FC]',
    icon: 'fa-book-open-reader',
    plays: '165.1K',
    likes: 4210,
    engineGenreId: 'lofi'
  },
  {
    id: 'track-lofi-3',
    title: 'Sunday Morning Warmth',
    artist: 'Acoustic Lo-Fi Lab',
    genre: 'Lo-Fi Chill',
    genreCategory: 'Lo-Fi',
    bpm: 88,
    key: 'Eb Major',
    duration: '2:30',
    vibe: 'Soft Rhodes chords layered with subtle morning birds and relaxed groove',
    tags: ['Morning Vibe', 'Soulful', 'Acoustic Chill'],
    coverGradient: 'from-[#F59E0B] via-[#FBBF24] to-[#FDE68A]',
    icon: 'fa-sun',
    plays: '112.4K',
    likes: 3150,
    engineGenreId: 'lofi',
    isNew: true
  },

  // Cinematic Tracks
  {
    id: 'track-cine-1',
    title: 'Ascension of Sovereigns',
    artist: 'Janu Symphonic Orchestra',
    genre: 'Cinematic',
    genreCategory: 'Cinematic',
    bpm: 75,
    key: 'C Minor',
    duration: '3:45',
    vibe: 'Sub-bass braam, cinematic strings swell, slow emotional trailer crescendo',
    tags: ['Epic', 'Film Score', 'Trailer', 'Dramatic'],
    coverGradient: 'from-[#E11D48] via-[#BE185D] to-[#831843]',
    icon: 'fa-film',
    plays: '210.3K',
    likes: 6730,
    engineGenreId: 'cinematic',
    isTrending: true
  },
  {
    id: 'track-cine-2',
    title: 'Cosmic Odyssey',
    artist: 'Starborn Ensemble',
    genre: 'Cinematic',
    genreCategory: 'Cinematic',
    bpm: 78,
    key: 'C Minor',
    duration: '4:10',
    vibe: 'Deep space orchestral swells, heavy timpani pulses, ethereal choir pads',
    tags: ['Sci-Fi', 'Orchestral', 'Interstellar'],
    coverGradient: 'from-[#4F46E5] via-[#7C3AED] to-[#DB2777]',
    icon: 'fa-meteor',
    plays: '135.8K',
    likes: 3950,
    engineGenreId: 'cinematic'
  },
  {
    id: 'track-cine-3',
    title: 'Shadows of the Citadel',
    artist: 'Valiant Audio',
    genre: 'Cinematic',
    genreCategory: 'Cinematic',
    bpm: 72,
    key: 'C Minor',
    duration: '3:20',
    vibe: 'Tense minor cello arpeggios, atmospheric drone textures, cinematic percussion',
    tags: ['Suspense', 'Dark Orchestral', 'Heroic'],
    coverGradient: 'from-[#1E293B] via-[#334155] to-[#475569]',
    icon: 'fa-shield-halved',
    plays: '88.9K',
    likes: 2470,
    engineGenreId: 'cinematic',
    isNew: true
  },

  // Upbeat / EDM / Pop Tracks
  {
    id: 'track-up-1',
    title: 'Festival Mainstage Surge',
    artist: 'ElectroJanu Club',
    genre: 'Upbeat EDM',
    genreCategory: 'Upbeat',
    bpm: 135,
    key: 'A Minor',
    duration: '3:00',
    vibe: 'Festival build-ups, energetic saw supersaws, laser sweeps, heavy bass drops',
    tags: ['Club Drop', 'Festival Trap', 'High Energy', 'Peak Time'],
    coverGradient: 'from-[#00F5D4] via-[#06B6D4] to-[#3B82F6]',
    icon: 'fa-bolt',
    plays: '340.2K',
    likes: 11400,
    engineGenreId: 'edm',
    isTrending: true
  },
  {
    id: 'track-up-2',
    title: 'Golden Hour Euphoria',
    artist: 'PopStar Royalty',
    genre: 'Today’s Hits & Pop',
    genreCategory: 'Upbeat',
    bpm: 128,
    key: 'C Major',
    duration: '2:50',
    vibe: 'Catchy 4-on-the-floor kick, uplifting piano drops, sidechained synth leads',
    tags: ['Radio Hit', 'Summer Anthem', 'Dance Pop'],
    coverGradient: 'from-[#F43F5E] via-[#FB7185] to-[#FDA4AF]',
    icon: 'fa-fire',
    plays: '295.6K',
    likes: 9800,
    engineGenreId: 'hits'
  },
  {
    id: 'track-up-3',
    title: 'Electric Sunset Glow',
    artist: 'Neon Waveform',
    genre: 'Upbeat EDM',
    genreCategory: 'Upbeat',
    bpm: 132,
    key: 'A Minor',
    duration: '3:12',
    vibe: 'Bright sidechained arpeggio leads, punchy snare rolls, euphoric bassline',
    tags: ['Dancefloor', 'Electropop', 'Festival'],
    coverGradient: 'from-[#10B981] via-[#059669] to-[#047857]',
    icon: 'fa-compact-disc',
    plays: '154.3K',
    likes: 4720,
    engineGenreId: 'edm',
    isNew: true
  },

  // Hip-Hop & Trap
  {
    id: 'track-trap-1',
    title: 'Sovereign 808 Menace',
    artist: 'Trap Alchemist',
    genre: 'Hip-Hop & Trap',
    genreCategory: 'Hip-Hop',
    bpm: 140,
    key: 'F Minor',
    duration: '2:45',
    vibe: 'Heavy 808 glides, fast rolling 16th hi-hats, dark minor synth stabs',
    tags: ['Trap Drums', '808 Bass', 'Hard Beat', 'Dark Rap'],
    coverGradient: 'from-[#6366F1] via-[#4338CA] to-[#312E81]',
    icon: 'fa-microphone-lines',
    plays: '412.0K',
    likes: 14200,
    engineGenreId: 'rap',
    isTrending: true
  },
  {
    id: 'track-trap-2',
    title: 'Crown & Dynasty Flow',
    artist: 'Boss Janu Records',
    genre: 'Hip-Hop & Trap',
    genreCategory: 'Hip-Hop',
    bpm: 144,
    key: 'F Minor',
    duration: '3:10',
    vibe: 'Bouncy trap groove, crisp claps, and haunting choir brass melody',
    tags: ['Royalty Flow', 'Modern Drill', 'Bass Heavy'],
    coverGradient: 'from-[#E11D48] via-[#BE123C] to-[#881337]',
    icon: 'fa-crown',
    plays: '189.5K',
    likes: 5600,
    engineGenreId: 'rap'
  },

  // Gospel & Soul
  {
    id: 'track-gospel-1',
    title: 'Divine Grace & Harmony',
    artist: 'Gospel Sovereigns',
    genre: 'Gospel & Soul',
    genreCategory: 'Gospel',
    bpm: 95,
    key: 'Ab Major',
    duration: '3:50',
    vibe: 'Lush Hammond organs, warm soulful choir chords, moving walking bass',
    tags: ['Soulful', 'Hammond Organ', 'Choir Chords', 'Inspirational'],
    coverGradient: 'from-[#00F5D4] via-[#2DD4BF] to-[#14B8A6]',
    icon: 'fa-dove',
    plays: '175.4K',
    likes: 6200,
    engineGenreId: 'gospel',
    isTrending: true
  },

  // Afrobeat & Tropical
  {
    id: 'track-afro-1',
    title: 'Lagos Moonlight Dance',
    artist: 'Afrobeat Sovereign',
    genre: 'Afrobeat & Reggaeton',
    genreCategory: 'Afrobeat',
    bpm: 105,
    key: 'D Minor',
    duration: '2:58',
    vibe: 'Syncopated dembow rhythm, warm kalimba / marimba leads, infectious groove',
    tags: ['Tropical', 'Dembow', 'Dancehall', 'Afropop'],
    coverGradient: 'from-[#F97316] via-[#EA580C] to-[#C2410C]',
    icon: 'fa-drum',
    plays: '230.1K',
    likes: 7890,
    engineGenreId: 'afrobeat',
    isTrending: true
  },

  // Alternative & Rock
  {
    id: 'track-rock-1',
    title: 'Thunderous Ignition',
    artist: 'Overdrive Anthem',
    genre: 'Rock & Metal',
    genreCategory: 'Rock',
    bpm: 165,
    key: 'E Minor',
    duration: '3:25',
    vibe: 'Overdriven power chords, galloping double-kick drum patterns, high energy',
    tags: ['Guitar Power', 'High Octane', 'Heavy Riffs', 'Mosh'],
    coverGradient: 'from-[#C084FC] via-[#A855F7] to-[#7E22CE]',
    icon: 'fa-hand-rock',
    plays: '124.7K',
    likes: 4100,
    engineGenreId: 'rock'
  }
];

export const GENRE_FILTER_OPTIONS = [
  { id: 'all', label: 'All Genres', count: BROWSER_TRACKS.length, icon: 'fa-compact-disc' },
  { id: 'Synth-Wave', label: 'Synth-Wave', count: BROWSER_TRACKS.filter(t => t.genreCategory === 'Synth-Wave').length, icon: 'fa-microchip', color: '#FF007F' },
  { id: 'Lo-Fi', label: 'Lo-Fi', count: BROWSER_TRACKS.filter(t => t.genreCategory === 'Lo-Fi').length, icon: 'fa-mug-hot', color: '#38BDF8' },
  { id: 'Cinematic', label: 'Cinematic', count: BROWSER_TRACKS.filter(t => t.genreCategory === 'Cinematic').length, icon: 'fa-film', color: '#E879F9' },
  { id: 'Upbeat', label: 'Upbeat', count: BROWSER_TRACKS.filter(t => t.genreCategory === 'Upbeat').length, icon: 'fa-bolt', color: '#00F5D4' },
  { id: 'Hip-Hop', label: 'Hip-Hop & Trap', count: BROWSER_TRACKS.filter(t => t.genreCategory === 'Hip-Hop').length, icon: 'fa-microphone-lines', color: '#818CF8' },
  { id: 'Gospel', label: 'Gospel & Soul', count: BROWSER_TRACKS.filter(t => t.genreCategory === 'Gospel').length, icon: 'fa-dove', color: '#2DD4BF' },
  { id: 'Afrobeat', label: 'Afrobeat', count: BROWSER_TRACKS.filter(t => t.genreCategory === 'Afrobeat').length, icon: 'fa-drum', color: '#F97316' },
  { id: 'Rock', label: 'Rock & Metal', count: BROWSER_TRACKS.filter(t => t.genreCategory === 'Rock').length, icon: 'fa-hand-rock', color: '#D8B4FE' }
];

interface CategorizedMusicBrowserProps {
  onSelectTrack?: (track: MusicTrackItem) => void;
  onBroadcastTrack?: (track: MusicTrackItem) => void;
  onSendToReelEditor?: (track: MusicTrackItem) => void;
  onSendToMusicVideo?: (track: MusicTrackItem) => void;
  onSendToPhotoEditor?: (track: MusicTrackItem) => void;
}

export const CategorizedMusicBrowser: React.FC<CategorizedMusicBrowserProps> = ({
  onSelectTrack,
  onBroadcastTrack,
  onSendToReelEditor,
  onSendToMusicVideo,
  onSendToPhotoEditor
}) => {
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'trending' | 'bpm-asc' | 'bpm-desc' | 'likes'>('trending');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSongForEdit, setSelectedSongForEdit] = useState<MusicTrackItem | UploadedSong | null>(null);
  const [allTracks, setAllTracks] = useState<MusicTrackItem[]>(BROWSER_TRACKS);
  const [uploadedSongsList, setUploadedSongsList] = useState<UploadedSong[]>([]);
  
  // 30-second snippet preview state
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [snippetSecondsLeft, setSnippetSecondsLeft] = useState<number>(30);
  const [snippetProgress, setSnippetProgress] = useState<number>(0); // 0 to 100%
  const [activeStemSolo, setActiveStemSolo] = useState<string | null>(null);

  // Frequency visualizer bars
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(12).fill(10));
  const animFrameRef = useRef<number | null>(null);
  const snippetIntervalRef = useRef<any>(null);

  // Load uploaded songs on mount and subscribe to real-time Firestore updates
  useEffect(() => {
    // 1. Initial fetch
    loadSongs();

    // 2. Real-time subscription to Firestore & Storage library
    const unsubscribe = songService.subscribeToFirestoreSongs((updatedSongs) => {
      setUploadedSongsList(updatedSongs.filter(s => s.isCustomUpload));
      syncBrowserTracks(updatedSongs);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncBrowserTracks = (songs: UploadedSong[]) => {
    const customTrackItems: MusicTrackItem[] = songs.map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      genre: s.genre,
      genreCategory: (s.genreCategory as any) || 'Custom',
      bpm: s.bpm || 120,
      key: s.key || 'C Major',
      duration: s.durationFormatted || '3:00',
      vibe: s.lyrics ? `Lyrics: "${s.lyrics.substring(0, 70)}..."` : (s.isFirebaseStorage ? '☁️ Stored in Firebase Storage & Firestore database' : 'Original master track uploaded by creator'),
      tags: s.tags || ['Master Track', 'Original Song'],
      coverGradient: s.coverGradient || 'from-[#00F5D4] via-[#C084FC] to-[#38BDF8]',
      coverArtUrl: s.coverArtUrl,
      icon: s.isFirebaseStorage ? 'fa-cloud' : 'fa-file-audio',
      plays: String(s.plays),
      likes: s.likes,
      engineGenreId: 'synthwave',
      isTrending: true,
      isNew: true,
      audioUrl: s.audioUrl,
      lyrics: s.lyrics,
      isCustomUpload: s.isCustomUpload,
      uploadedBy: s.uploadedBy
    }));

    // Combine without duplicates
    const map = new Map<string, MusicTrackItem>();
    BROWSER_TRACKS.forEach(t => map.set(t.id, t));
    customTrackItems.forEach(t => map.set(t.id, t));
    setAllTracks(Array.from(map.values()));
  };

  const loadSongs = async () => {
    try {
      const songs = await songService.getAllSongs();
      setUploadedSongsList(songs.filter(s => s.isCustomUpload));
      syncBrowserTracks(songs);
    } catch (e) {
      console.warn('Could not load songs for browser:', e);
    }
  };

  const handleDeleteSong = async (track: MusicTrackItem) => {
    if (!track.isCustomUpload) return;
    const confirmDelete = window.confirm(`Delete "${track.title}" from your Cloud Music Library and Firebase Storage?`);
    if (!confirmDelete) return;

    try {
      const songData = uploadedSongsList.find(s => s.id === track.id);
      await songService.deleteSong(track.id, songData?.audioStoragePath);
      if (previewTrackId === track.id) {
        stopSnippetPreview();
      }
      triggerNeonExplosion({
        particleCount: 20,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'subtle'
      });
    } catch (err) {
      console.error('Failed to delete song:', err);
    }
  };

  // Frequency animation loop for active preview
  useEffect(() => {
    const freqArray = new Uint8Array(32);
    const update = () => {
      if (previewTrackId) {
        musicAudioEngine.getFrequencyData(freqArray);
        const sampled = [];
        for (let i = 0; i < 12; i++) {
          const val = (freqArray[i * 2] / 255) * 28 + 6;
          sampled.push(val);
        }
        setVisualizerBars(sampled);
      } else {
        setVisualizerBars(new Array(12).fill(6));
      }
      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [previewTrackId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (snippetIntervalRef.current) clearInterval(snippetIntervalRef.current);
      if (previewTrackId) {
        musicAudioEngine.pause();
      }
    };
  }, [previewTrackId]);

  // Stop snippet countdown helper
  const stopSnippetPreview = () => {
    if (snippetIntervalRef.current) {
      clearInterval(snippetIntervalRef.current);
      snippetIntervalRef.current = null;
    }
    musicAudioEngine.pause();
    setPreviewTrackId(null);
    setSnippetSecondsLeft(30);
    setSnippetProgress(0);
  };

  // Start 30-second snippet preview
  const handleTogglePreview = (track: MusicTrackItem) => {
    // If clicking same track that is already playing, pause it
    if (previewTrackId === track.id) {
      stopSnippetPreview();
      return;
    }

    // Clear previous timer if any
    if (snippetIntervalRef.current) {
      clearInterval(snippetIntervalRef.current);
      snippetIntervalRef.current = null;
    }

    // Find engine preset
    const enginePreset = MUSIC_GENRES.find(g => g.id === track.engineGenreId) || MUSIC_GENRES[0];
    
    // Set engine genre & BPM
    musicAudioEngine.setGenre(enginePreset);
    musicAudioEngine.setBpm(track.bpm);
    musicAudioEngine.play();

    setPreviewTrackId(track.id);
    setSnippetSecondsLeft(30);
    setSnippetProgress(0);

    const totalSeconds = 30;
    let elapsed = 0;

    snippetIntervalRef.current = setInterval(() => {
      elapsed += 0.25;
      const remaining = Math.max(0, totalSeconds - elapsed);
      const progressPct = Math.min(100, (elapsed / totalSeconds) * 100);

      setSnippetSecondsLeft(Math.ceil(remaining));
      setSnippetProgress(progressPct);

      if (remaining <= 0) {
        stopSnippetPreview();
        triggerNeonExplosion({
          particleCount: 30,
          origin: { x: 0.5, y: 0.6 },
          intensity: 'subtle'
        });
      }
    }, 250);

    triggerNeonExplosion({
      particleCount: 20,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
  };

  const handleSelectTrack = (track: MusicTrackItem) => {
    if (onSelectTrack) {
      onSelectTrack(track);
    }
    triggerNeonExplosion({
      particleCount: 40,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'medium'
    });
  };

  const handleBroadcast = (track: MusicTrackItem) => {
    if (onBroadcastTrack) {
      onBroadcastTrack(track);
    }
    triggerNeonExplosion({
      particleCount: 50,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'grand'
    });
  };

  // Filter and Sort tracks
  const filteredTracks = allTracks.filter(track => {
    if (selectedGenreFilter === 'my-uploads') {
      return track.isCustomUpload || track.genreCategory === 'Custom';
    }
    const matchesGenre = selectedGenreFilter === 'all' || track.genreCategory === selectedGenreFilter;
    const matchesQuery = searchQuery === '' || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.vibe.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGenre && matchesQuery;
  }).sort((a, b) => {
    if (sortBy === 'trending') return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
    if (sortBy === 'bpm-asc') return a.bpm - b.bpm;
    if (sortBy === 'bpm-desc') return b.bpm - a.bpm;
    if (sortBy === 'likes') return b.likes - a.likes;
    return 0;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Upload Song Modal */}
      <SongUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSongUploaded={(newSong) => {
          loadSongs();
          setSelectedGenreFilter('my-uploads');
        }}
      />

      {/* Edit Song Metadata Modal (Firestore Collection uploaded_songs) */}
      <EditSongMetadataModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSongForEdit(null);
        }}
        song={selectedSongForEdit}
        onSongUpdated={(updatedSong) => {
          loadSongs();
        }}
      />

      {/* Top Banner & Search / Filter Controls */}
      <div className="p-6 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F5D4]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF007F]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] shadow-[0_0_8px_#00F5D4] animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-[#00F5D4]">
                Audio & Music Master Studio • Pure USD 85/15 Monetization
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white">
              Song Catalog & Creator Audio Vault
            </h3>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Upload your own vocal & master songs, audition 30s clips, and attach music directly to your Reels, Videos, Artworks & Music Videos.
            </p>
          </div>

          {/* Top Actions: Upload Song CTA & Active Snippet Playing */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-upload-full-song"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] hover:opacity-95 text-black font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,212,0.4)] flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
              <span>Upload Full Song (MP3 / WAV)</span>
            </button>

            {previewTrackId && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-950/90 border border-[#FF007F]/50 shadow-[0_0_25px_rgba(255,0,127,0.3)] animate-pulse">
                <div className="flex items-center gap-1.5 h-6">
                  {visualizerBars.map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[#FF007F] rounded-full transition-all duration-75"
                      style={{ height: `${h}px` }}
                    ></div>
                  ))}
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-mono uppercase text-[#00F5D4] font-bold block">
                    Audio Playing
                  </span>
                  <span className="text-xs font-mono font-black text-white">
                    0:{snippetSecondsLeft.toString().padStart(2, '0')} remaining
                  </span>
                </div>
                <button
                  onClick={stopSnippetPreview}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer ml-1"
                  title="Stop snippet"
                >
                  <i className="fa-solid fa-stop"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by song title, artist, genre, lyrics, or vibe..."
              className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:border-[#00F5D4] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#00F5D4] cursor-pointer"
            >
              <option value="trending">🔥 Trending First</option>
              <option value="likes">❤️ Most Popular</option>
              <option value="bpm-asc">⚡ BPM: Low to High</option>
              <option value="bpm-desc">⚡ BPM: High to Low</option>
            </select>
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-filter text-[#00F5D4]"></i>
            <span>Browse Library:</span>
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* My Uploaded Songs Pill */}
            <button
              onClick={() => setSelectedGenreFilter('my-uploads')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedGenreFilter === 'my-uploads'
                  ? 'bg-[#00F5D4] text-black font-black shadow-[0_0_15px_rgba(0,245,212,0.4)] scale-105'
                  : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
              <span>My Uploaded Songs</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${selectedGenreFilter === 'my-uploads' ? 'bg-black/30 text-black' : 'bg-white/10 text-gray-400'}`}>
                {uploadedSongsList.length}
              </span>
            </button>

            {GENRE_FILTER_OPTIONS.map((g) => {
              const isSelected = selectedGenreFilter === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGenreFilter(g.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-black shadow-[0_0_15px_rgba(0,245,212,0.4)] scale-105'
                      : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <i className={`fa-solid ${g.icon}`} style={{ color: isSelected ? '#000' : g.color }}></i>
                  <span>{g.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isSelected ? 'bg-black/30 text-black' : 'bg-white/10 text-gray-400'}`}>
                    {g.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTracks.map((track) => {
          const isCurrentPreview = previewTrackId === track.id;

          return (
            <div
              key={track.id}
              className={`p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between group ${
                isCurrentPreview
                  ? 'bg-zinc-950/95 border-[#FF007F] shadow-[0_0_30px_rgba(255,0,127,0.25)] ring-1 ring-[#FF007F]/40'
                  : 'bg-black/40 hover:bg-black/70 border-white/10 hover:border-white/20'
              }`}
            >
              {/* 30-Second Snippet Progress Bar at Top of Card */}
              {isCurrentPreview && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00F5D4] via-[#FF007F] to-[#C084FC] transition-all duration-300"
                    style={{ width: `${snippetProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Card Header & Album Art Pill */}
              <div>
                <div className="flex items-start gap-3.5 mb-3.5">
                  {/* Genre / Cover Art Icon */}
                  {track.coverArtUrl ? (
                    <img 
                      src={track.coverArtUrl} 
                      alt={track.title} 
                      className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/15"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${track.coverGradient} flex items-center justify-center flex-shrink-0 shadow-lg relative group-hover:scale-105 transition-transform duration-300`}
                    >
                      <i className={`fa-solid ${track.icon} text-white text-xl drop-shadow-md`}></i>
                      {track.isTrending && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF007F] flex items-center justify-center text-[8px] text-white font-bold shadow-md">
                          🔥
                        </span>
                      )}
                    </div>
                  )}

                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[8px] font-mono font-bold uppercase text-[#00F5D4] tracking-wider truncate">
                        {track.genre}
                      </span>
                      <span className="text-[9px] font-mono text-gray-400">
                        {track.duration}
                      </span>
                      {track.isCustomUpload && (
                        <span className="px-1.5 py-0.2 rounded-md bg-[#00F5D4]/20 text-[8px] font-mono font-bold uppercase text-[#00F5D4] border border-[#00F5D4]/30 flex items-center gap-1">
                          <i className="fa-solid fa-cloud text-[7px]"></i>
                          <span>Cloud Master</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-sm font-serif font-black italic text-white truncate group-hover:text-[#00F5D4] transition-colors">
                        {track.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          id={`btn-edit-track-${track.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSongForEdit(track);
                            setIsEditModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-[#00F5D4] p-1 rounded hover:bg-[#00F5D4]/10 transition-colors cursor-pointer"
                          title="Edit song metadata (Track Name, BPM, Genre, Key) in Firestore"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        {track.isCustomUpload && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSong(track);
                            }}
                            className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete song from Cloud Library and Firebase Storage"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] font-mono text-gray-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Vibe / Sonic Description */}
                <p className="text-[11px] font-mono text-gray-300 mb-3.5 line-clamp-2 leading-relaxed bg-white/[0.02] p-2 rounded-xl border border-white/5">
                  {track.vibe}
                </p>

                {/* Musical Key & BPM Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className="px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-[9px] font-mono text-[#C084FC] font-bold">
                    ⚡ {track.bpm} BPM
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-[9px] font-mono text-[#00F5D4] font-bold">
                    🎹 {track.key}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-[9px] font-mono text-gray-300">
                    <i className="fa-solid fa-play text-[8px] text-gray-500 mr-1"></i>{track.plays}
                  </span>
                </div>

                {/* Genre Sound Tags */}
                <div className="flex flex-wrap items-center gap-1 mb-4">
                  {track.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-mono text-gray-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons: 30s Preview & Load into Studio */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                
                {/* Play / Preview Button */}
                <button
                  onClick={() => handleTogglePreview(track)}
                  className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                    isCurrentPreview
                      ? 'bg-[#FF007F] text-white shadow-[0_0_20px_#FF007F] scale-[1.02]'
                      : 'bg-white/10 hover:bg-[#00F5D4] text-white hover:text-black border border-white/15 hover:border-[#00F5D4]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid ${isCurrentPreview ? 'fa-pause' : 'fa-play'}`}></i>
                    <span>{isCurrentPreview ? 'Playing Audio' : 'Play / Preview'}</span>
                  </div>

                  <div className="text-[10px] opacity-90 font-mono">
                    {isCurrentPreview ? (
                      <span className="animate-pulse">
                        0:{snippetSecondsLeft.toString().padStart(2, '0')} / 0:30
                      </span>
                    ) : (
                      <span>Full Master</span>
                    )}
                  </div>
                </button>

                {/* Cross-Studio Actions: Use in Reel, Use in Music Video, Attach to Artwork, Load Studio */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onSendToReelEditor ? onSendToReelEditor(track) : handleSelectTrack(track)}
                    className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-[#C084FC]/20 border border-white/10 hover:border-[#C084FC]/40 text-gray-200 hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Put music on a Reel or Video in the Reel Studio"
                  >
                    <i className="fa-solid fa-video text-[#C084FC]"></i>
                    <span>Use in Reel</span>
                  </button>

                  <button
                    onClick={() => onSendToMusicVideo ? onSendToMusicVideo(track) : handleSelectTrack(track)}
                    className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-[#00F5D4]/20 border border-white/10 hover:border-[#00F5D4]/40 text-gray-200 hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Sync with scenes in the Music Video Creator"
                  >
                    <i className="fa-solid fa-clapperboard text-[#00F5D4]"></i>
                    <span>Music Video</span>
                  </button>

                  <button
                    onClick={() => onSendToPhotoEditor ? onSendToPhotoEditor(track) : handleSelectTrack(track)}
                    className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-[#38BDF8]/20 border border-white/10 hover:border-[#38BDF8]/40 text-gray-200 hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Attach soundtrack to photo artwork in Photo Studio"
                  >
                    <i className="fa-solid fa-image text-[#38BDF8]"></i>
                    <span>Photo Reel</span>
                  </button>

                  <button
                    onClick={() => handleSelectTrack(track)}
                    className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Load into Synthesizer & Stem Mixer"
                  >
                    <i className="fa-solid fa-sliders text-[#E879F9]"></i>
                    <span>Mixer</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTracks.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-black/40 border border-white/10">
          <i className="fa-solid fa-music-slash text-4xl text-gray-600 mb-3"></i>
          <h4 className="text-lg font-serif italic text-white mb-1">No tracks found</h4>
          <p className="text-xs font-mono text-gray-400 mb-4">
            Try adjusting your search query or choosing a different genre filter above.
          </p>
          <button
            onClick={() => {
              setSelectedGenreFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorizedMusicBrowser;
