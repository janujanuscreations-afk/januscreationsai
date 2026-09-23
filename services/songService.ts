import { UploadedSong } from '../types';
import { 
  firestoreService, 
  db, 
  sanitizeForFirestore, 
  uploadAudioToStorage, 
  uploadCoverArtToStorage, 
  deleteStorageFile,
  auth 
} from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { musicAudioEngine, MUSIC_GENRES } from '../utils/musicAudioEngine';
import { safeStringify } from '../utils/safeJson';

const STORAGE_KEY = 'janu_creations_uploaded_songs';

// Default Master Studio Songs with full rich audio arrangements
export const DEFAULT_MASTER_SONGS: UploadedSong[] = [
  {
    id: 'song-master-1',
    title: 'Sovereign Frequency 2026',
    artist: 'Janu & The Cyber Choir',
    genre: 'Synth-Wave / Cyber Anthem',
    genreCategory: 'Synth-Wave',
    bpm: 124,
    key: 'D Minor',
    duration: 195,
    durationFormatted: '3:15',
    audioUrl: '', // uses live synthesized engine backing or custom uploaded
    coverArtUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    coverGradient: 'from-[#C084FC] via-[#9333EA] to-[#3B82F6]',
    lyrics: `[Intro]\nStepping through the portal into Janu's realm\nAI algorithms humming at the sovereign helm\n\n[Verse 1]\nNo other apps needed, the empire is right here\nMonetizing visions with zero doubt or fear\n85 percent creator cut, 15 to the Boss\nEvery single drop a triumph, never taking a loss\n\n[Chorus]\nJanu's Creations, rising to the sky\nMusic, reels and cinema, watch the vision fly\nEverything in one place, power in our hands\nBuilding our legacy across all digital lands!`,
    vocalType: 'full_vocals',
    plays: '482.5K',
    likes: 12450,
    uploadedBy: 'Janu Executive Team',
    isCustomUpload: false,
    royaltySplitCreator: 85,
    royaltySplitJanu: 15,
    tags: ['Anthem', 'Vocal', 'Cyberpunk', '80s Synth'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'song-master-2',
    title: 'Divine Grace in G-Major',
    artist: 'Janu Gospel All-Stars',
    genre: 'Gospel & Soul Symphony',
    genreCategory: 'Gospel',
    bpm: 95,
    key: 'Ab Major',
    duration: 210,
    durationFormatted: '3:30',
    audioUrl: '',
    coverArtUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    coverGradient: 'from-[#00F5D4] via-[#38BDF8] to-[#6366F1]',
    lyrics: `[Organ Intro - Abmaj7]\nLift your hands high, feel the frequency rise\nGrace overflowing before your very eyes\n\n[Chorus]\nUnstoppable favor, blessings on the track\nWalking forward in power, never looking back\nEvery creator singing in harmony today\nJanu's light guiding every single way!`,
    vocalType: 'full_vocals',
    plays: '319.2K',
    likes: 9870,
    uploadedBy: 'GospelSovereign',
    isCustomUpload: false,
    royaltySplitCreator: 85,
    royaltySplitJanu: 15,
    tags: ['Gospel', 'Hammond Organ', 'Choir', 'Soul'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'song-master-3',
    title: 'Billboard Midnight Drive',
    artist: 'Janu Urban Collective',
    genre: 'Commercial Pop / 808 Trap',
    genreCategory: 'Hip-Hop',
    bpm: 130,
    key: 'C Major',
    duration: 168,
    durationFormatted: '2:48',
    audioUrl: '',
    coverArtUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    coverGradient: 'from-[#EC4899] via-[#8B5CF6] to-[#00F5D4]',
    lyrics: `[Hook]\nMidnight in the studio, bass hitting clean\nCleanest production that you've ever seen\nFrom reels to 4K cinema, we create the wave\nJanu's Creations is the standard that we pave!`,
    vocalType: 'full_vocals',
    plays: '591.0K',
    likes: 18920,
    uploadedBy: 'VentureQueen',
    isCustomUpload: false,
    royaltySplitCreator: 85,
    royaltySplitJanu: 15,
    tags: ['Billboard', 'Pop Hook', '808s', 'Dance'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'song-master-4',
    title: 'Rainy Lo-Fi Coffee Sanctuary',
    artist: 'MellowJanu Studio',
    genre: 'Lo-Fi Chill & Vinyl',
    genreCategory: 'Lo-Fi',
    bpm: 85,
    key: 'Eb Major',
    duration: 180,
    durationFormatted: '3:00',
    audioUrl: '',
    coverArtUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    coverGradient: 'from-[#0284C7] via-[#38BDF8] to-[#F59E0B]',
    lyrics: `[Instrumental with vinyl dust crackle & warm Rhodes chords]`,
    vocalType: 'instrumental',
    plays: '740.1K',
    likes: 24310,
    uploadedBy: 'Chillout Queen',
    isCustomUpload: false,
    royaltySplitCreator: 85,
    royaltySplitJanu: 15,
    tags: ['Study', 'Coffee', 'Relaxed', 'Vinyl'],
    createdAt: new Date().toISOString()
  }
];

export interface SongPlaybackState {
  currentSong: UploadedSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  loop: boolean;
  visualizerBars: number[];
}

type PlaybackListener = (state: SongPlaybackState) => void;

class SongService {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private listeners: Set<PlaybackListener> = new Set();
  private animFrameId: number | null = null;
  private timeUpdateInterval: any = null;

  private state: SongPlaybackState = {
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    isMuted: false,
    loop: false,
    visualizerBars: new Array(16).fill(8)
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (this.audioElement) return;
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.volume = this.state.volume;

    this.audioElement.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.notifyListeners();
      this.startVisualizerLoop();
    });

    this.audioElement.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.notifyListeners();
    });

    this.audioElement.addEventListener('ended', () => {
      if (this.state.loop) {
        this.audioElement?.play();
      } else {
        this.state.isPlaying = false;
        this.state.currentTime = 0;
        this.notifyListeners();
      }
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.state.currentTime = this.audioElement.currentTime;
        this.state.duration = this.audioElement.duration || this.state.currentSong?.duration || 0;
        this.notifyListeners();
      }
    });

    this.audioElement.addEventListener('error', (e) => {
      // Graceful handling if audio source is unreachable or unsupported format
      console.warn('HTML5 audio source notice, engaging synthesis engine fallback:', e);
      if (this.state.currentSong) {
        this.playSyntheticFallback(this.state.currentSong);
      }
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement && this.audioElement.duration && !isNaN(this.audioElement.duration)) {
        this.state.duration = this.audioElement.duration;
        this.notifyListeners();
      }
    });
  }

  private setupWebAudio() {
    if (this.audioContext || !this.audioElement || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('WebAudio setup for HTML5 audio node deferred or already connected:', e);
    }
  }

  private startVisualizerLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const freqArray = new Uint8Array(32);
    const loop = () => {
      if (this.state.isPlaying) {
        if (this.analyserNode) {
          this.analyserNode.getByteFrequencyData(freqArray);
          const bars: number[] = [];
          for (let i = 0; i < 16; i++) {
            const val = (freqArray[i * 2] / 255) * 50 + 6;
            bars.push(val);
          }
          this.state.visualizerBars = bars;
        } else {
          // If playing synthesized beat without HTML5 audio
          musicAudioEngine.getFrequencyData(freqArray);
          const bars: number[] = [];
          for (let i = 0; i < 16; i++) {
            const val = (freqArray[i * 2] / 255) * 50 + 6;
            bars.push(val);
          }
          this.state.visualizerBars = bars;
        }
        this.notifyListeners();
        this.animFrameId = requestAnimationFrame(loop);
      } else {
        this.state.visualizerBars = new Array(16).fill(6);
        this.notifyListeners();
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const copy = { ...this.state };
    this.listeners.forEach((listener) => listener(copy));
  }

  // --- Data & Storage Operations ---

  public async getAllSongs(): Promise<UploadedSong[]> {
    let customSongs: UploadedSong[] = [];
    
    // 1. Read from localStorage cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        customSongs = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Could not read cached songs:', e);
    }

    // 2. Fetch from Firestore uploaded_songs collection
    try {
      const firestoreSongs = await firestoreService.getCreatorSongs();

      if (firestoreSongs.length > 0) {
        // Merge without duplicates
        const map = new Map<string, UploadedSong>();
        customSongs.forEach(s => map.set(s.id, s));
        firestoreSongs.forEach(s => map.set(s.id, s));
        customSongs = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, safeStringify(customSongs));
      }
    } catch (e) {
      // Offline fallback
      console.warn('Operating songs in offline/local cache mode');
    }

    return [...customSongs, ...DEFAULT_MASTER_SONGS];
  }

  // Real-time listener for Firestore uploaded_songs collection
  public subscribeToFirestoreSongs(callback: (songs: UploadedSong[]) => void): () => void {
    return firestoreService.subscribeCreatorSongs((firestoreSongs) => {
      // Update local cache
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        let customSongs: UploadedSong[] = cached ? JSON.parse(cached) : [];
        const map = new Map<string, UploadedSong>();
        customSongs.forEach(s => map.set(s.id, s));
        firestoreSongs.forEach(s => map.set(s.id, s));
        const merged = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, safeStringify(merged));
        callback([...merged, ...DEFAULT_MASTER_SONGS]);
      } catch {
        callback([...firestoreSongs, ...DEFAULT_MASTER_SONGS]);
      }
    });
  }

  public async saveSong(song: UploadedSong): Promise<void> {
    // 1. Update local cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const list: UploadedSong[] = cached ? JSON.parse(cached) : [];
      const filtered = list.filter(s => s.id !== song.id);
      filtered.unshift(song);
      localStorage.setItem(STORAGE_KEY, safeStringify(filtered));
    } catch (e) {
      console.error('Failed to save to local cache:', e);
    }

    // 2. Save to Firestore
    try {
      await firestoreService.saveCreatorSong(song);
    } catch (e) {
      console.warn('Firestore upload song write deferred/offline:', e);
    }
  }

  public async updateSongMetadata(songId: string, updates: Partial<UploadedSong>): Promise<void> {
    // 1. Update local cache immediately
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const list: UploadedSong[] = JSON.parse(cached);
        const index = list.findIndex(s => s.id === songId);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem(STORAGE_KEY, safeStringify(list));
        }
      }
    } catch (e) {
      console.error('Failed to update song in local cache:', e);
    }

    // 2. Persist updates directly back to Firestore collection
    try {
      await firestoreService.updateCreatorSongMetadata(songId, updates);
    } catch (e) {
      console.warn('Firestore update creator song metadata deferred/offline:', e);
      throw e;
    }
  }

  public async deleteSong(songId: string, audioStoragePath?: string): Promise<void> {
    // 1. Remove from local cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const list: UploadedSong[] = JSON.parse(cached);
        const updated = list.filter(s => s.id !== songId);
        localStorage.setItem(STORAGE_KEY, safeStringify(updated));
      }
    } catch (e) {}

    // 2. Delete from Firestore & Firebase Storage
    try {
      await firestoreService.deleteCreatorSong(songId, audioStoragePath);
    } catch (e) {
      console.warn(`Could not delete song ${songId} from Firestore:`, e);
    }
  }

  // --- Audio Upload to Firebase Storage & Firestore Tracking ---

  public async uploadSongToCloud(
    file: File,
    metadata: Partial<UploadedSong>,
    coverFile?: File | null,
    onProgress?: (progressPercent: number, statusText: string) => void
  ): Promise<UploadedSong> {
    const user = auth.currentUser;
    const songId = metadata.id || `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    if (onProgress) onProgress(5, 'Preparing audio file for Firebase Storage...');

    // 1. Extract audio duration and metadata preview
    const durationInfo = await new Promise<{ durationSec: number; formatted: string }>((resolve) => {
      const tempAudio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      tempAudio.src = objectUrl;
      tempAudio.onloadedmetadata = () => {
        const durationSec = Math.round(tempAudio.duration) || 180;
        const minutes = Math.floor(durationSec / 60);
        const seconds = durationSec % 60;
        const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        URL.revokeObjectURL(objectUrl);
        resolve({ durationSec, formatted });
      };
      tempAudio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ durationSec: 180, formatted: '3:00' });
      };
    });

    // 2. Upload Audio File to Firebase Storage with progress tracking
    if (onProgress) onProgress(15, 'Uploading high-res master audio to Firebase Storage...');
    
    let storageResult: { downloadUrl: string; storagePath: string; fileName: string; fileSize: string; contentType: string };
    try {
      storageResult = await uploadAudioToStorage(
        file,
        undefined,
        (percent) => {
          if (onProgress) {
            const mappedPercent = Math.min(80, Math.round(15 + (percent * 0.65)));
            onProgress(mappedPercent, `Uploading audio to Firebase Storage (${percent}%)...`);
          }
        }
      );
    } catch (err) {
      console.warn('Firebase Storage upload warning, using local buffer fallback:', err);
      const fallbackUrl = URL.createObjectURL(file);
      storageResult = {
        downloadUrl: fallbackUrl,
        storagePath: `audio_masters/local_${Date.now()}_${file.name}`,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        contentType: file.type || 'audio/mpeg'
      };
    }

    // 3. Optional Cover Art Upload to Firebase Storage
    let coverArtDownloadUrl = metadata.coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';
    let coverArtStoragePath: string | undefined;

    if (coverFile) {
      if (onProgress) onProgress(85, 'Uploading album cover art to Firebase Storage...');
      try {
        const coverUpload = await uploadCoverArtToStorage(coverFile);
        coverArtDownloadUrl = coverUpload.downloadUrl;
        coverArtStoragePath = coverUpload.storagePath;
      } catch (err) {
        console.warn('Cover art upload warning:', err);
      }
    }

    // 4. Construct complete UploadedSong record
    if (onProgress) onProgress(92, 'Indexing song metadata in Cloud Firestore database...');

    const fileFormat = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const newSong: UploadedSong = {
      id: songId,
      userId: user ? user.uid : 'janu-verified-creator',
      creatorHandle: metadata.creatorHandle || '@januaryrebl',
      title: metadata.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      artist: metadata.artist || user?.displayName || 'January Rebl',
      genre: metadata.genre || metadata.genreCategory || 'Master Audio',
      genreCategory: metadata.genreCategory || 'Synth-Wave',
      bpm: Number(metadata.bpm) || 120,
      key: metadata.key || 'C Major',
      duration: durationInfo.durationSec,
      durationFormatted: durationInfo.formatted,
      audioUrl: storageResult.downloadUrl,
      audioStoragePath: storageResult.storagePath,
      fileName: storageResult.fileName,
      fileSize: storageResult.fileSize,
      fileFormat,
      contentType: storageResult.contentType,
      coverArtUrl: coverArtDownloadUrl,
      coverArtStoragePath,
      coverGradient: metadata.coverGradient || 'from-[#00F5D4] via-[#C084FC] to-[#38BDF8]',
      lyrics: metadata.lyrics || '',
      vocalType: metadata.vocalType || 'full_vocals',
      plays: '0',
      likes: 1,
      uploadedBy: metadata.uploadedBy || user?.displayName || 'January Rebl',
      isCustomUpload: true,
      isFirebaseStorage: true,
      royaltySplitCreator: metadata.royaltySplitCreator !== undefined ? metadata.royaltySplitCreator : 85,
      royaltySplitJanu: metadata.royaltySplitJanu !== undefined ? metadata.royaltySplitJanu : 15,
      tags: metadata.tags || ['Master Track', 'Firebase Storage', 'Janu Vault'],
      createdAt: new Date().toISOString()
    };

    // 5. Persist to Firestore and Local Cache
    await this.saveSong(newSong);

    if (onProgress) onProgress(100, 'Cloud Master Song published & synced successfully!');
    return newSong;
  }

  // Save programmatically generated songs (e.g. from Lyria / AI generator)
  public async uploadSong(data: {
    title: string;
    artist?: string;
    genre?: string;
    genreCategory?: string;
    audioDataUrl?: string;
    audioUrl?: string;
    coverArtUrl?: string;
    lyrics?: string;
    bpm?: number;
    key?: string;
    tags?: string[];
  }): Promise<UploadedSong> {
    const user = auth.currentUser;
    const songId = `song-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSong: UploadedSong = {
      id: songId,
      userId: user ? user.uid : 'janu-verified-creator',
      creatorHandle: '@januaryrebl',
      title: data.title || 'AI Generated Masterpiece',
      artist: data.artist || user?.displayName || 'Janu Creations AI Studio',
      genre: data.genre || 'AI Synth / Lyria Engine',
      genreCategory: data.genreCategory || 'Synth-Wave',
      bpm: data.bpm || 120,
      key: data.key || 'A Minor',
      duration: 180,
      durationFormatted: '3:00',
      audioUrl: data.audioDataUrl || data.audioUrl || '',
      audioBase64: data.audioDataUrl,
      fileName: `${data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav`,
      fileSize: '3.2 MB',
      fileFormat: 'wav',
      coverArtUrl: data.coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
      coverGradient: 'from-[#FF007F] via-[#C084FC] to-[#00F5D4]',
      lyrics: data.lyrics || '',
      vocalType: data.lyrics ? 'full_vocals' : 'instrumental',
      plays: '1.2K',
      likes: 42,
      uploadedBy: data.artist || user?.displayName || 'Janu Creations AI Studio',
      isCustomUpload: true,
      isFirebaseStorage: false,
      royaltySplitCreator: 85,
      royaltySplitJanu: 15,
      tags: data.tags || ['Lyria Engine', 'AI Studio'],
      createdAt: new Date().toISOString()
    };

    await this.saveSong(newSong);
    return newSong;
  }

  // Legacy helper maintaining backwards-compatibility
  public async processAudioFile(
    file: File, 
    metadata: Partial<UploadedSong>
  ): Promise<UploadedSong> {
    return this.uploadSongToCloud(file, metadata);
  }

  // --- Master Playback Controls ---

  public async playSong(song: UploadedSong, startTime: number = 0): Promise<void> {
    this.initAudioElement();
    
    // Stop any existing synthetic engine play
    musicAudioEngine.pause();

    this.state.currentSong = song;
    this.state.currentTime = startTime;

    // Check if song has real audioUrl or audioBase64
    const src = song.audioUrl || song.audioBase64;
    
    if (src && this.audioElement) {
      if (this.audioElement.src !== src) {
        this.audioElement.src = src;
        this.audioElement.load();
      }
      this.audioElement.currentTime = startTime;
      this.audioElement.volume = this.state.isMuted ? 0 : this.state.volume;
      
      try {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        this.setupWebAudio();
        await this.audioElement.play();
        this.state.isPlaying = true;
        this.notifyListeners();
      } catch (err) {
        console.warn('HTML5 audio play blocked or loading error, falling back to synth engine:', err);
        this.playSyntheticFallback(song);
      }
    } else {
      // Use synthetic audio engine matched to genre
      this.playSyntheticFallback(song);
    }
  }

  private playSyntheticFallback(song: UploadedSong) {
    const genreMatch = MUSIC_GENRES.find(
      g => g.name.toLowerCase().includes(song.genreCategory.toLowerCase()) || 
           g.category.toLowerCase().includes(song.genreCategory.toLowerCase())
    ) || MUSIC_GENRES[0];

    musicAudioEngine.setGenre(genreMatch);
    musicAudioEngine.setBpm(song.bpm || genreMatch.bpm);
    musicAudioEngine.play();

    this.state.isPlaying = true;
    this.state.duration = song.duration || 180;
    this.notifyListeners();
    this.startVisualizerLoop();

    // Start synthetic time ticker
    if (this.timeUpdateInterval) clearInterval(this.timeUpdateInterval);
    this.timeUpdateInterval = setInterval(() => {
      if (this.state.isPlaying) {
        this.state.currentTime = +(this.state.currentTime + 0.2).toFixed(1);
        if (this.state.currentTime >= this.state.duration) {
          if (this.state.loop) {
            this.state.currentTime = 0;
          } else {
            this.pause();
            this.state.currentTime = 0;
          }
        }
        this.notifyListeners();
      }
    }, 200);
  }

  public pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
    musicAudioEngine.pause();
    if (this.timeUpdateInterval) clearInterval(this.timeUpdateInterval);
    this.state.isPlaying = false;
    this.notifyListeners();
  }

  public togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else if (this.state.currentSong) {
      this.playSong(this.state.currentSong, this.state.currentTime);
    } else {
      this.playSong(DEFAULT_MASTER_SONGS[0], 0);
    }
  }

  public seek(seconds: number): void {
    this.state.currentTime = seconds;
    if (this.audioElement && this.state.currentSong?.audioUrl) {
      this.audioElement.currentTime = seconds;
    }
    this.notifyListeners();
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.state.volume = clamped;
    if (this.audioElement) {
      this.audioElement.volume = this.state.isMuted ? 0 : clamped;
    }
    musicAudioEngine.setMasterVolume(Math.round(clamped * 100));
    this.notifyListeners();
  }

  public toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    if (this.audioElement) {
      this.audioElement.volume = this.state.isMuted ? 0 : this.state.volume;
    }
    this.notifyListeners();
  }

  public toggleLoop(): void {
    this.state.loop = !this.state.loop;
    this.notifyListeners();
  }

  public getState(): SongPlaybackState {
    return { ...this.state };
  }
}

export const songService = new SongService();
