import React, { useState, useRef } from 'react';
import { generateLyriaMusic } from '../services/geminiService';
import { songService } from '../services/songService';
import { triggerNeonExplosion } from '../utils/confetti';
import { firestoreService, auth } from '../services/firebase';

interface LyriaMusicGeneratorProps {
  onSongSaved?: () => void;
}

const MUSIC_STYLE_PRESETS = [
  { label: 'Cyberpunk Synthwave', prompt: 'High-energy 80s cyberpunk synthwave with analog arpeggios, punchy gated reverb drums, and glowing neon bassline at 128 BPM.' },
  { label: 'Cinematic Orchestral', prompt: 'Epic cinematic Hans Zimmer style orchestral build with dramatic brass, thunderous timpani, and ethereal choir crescendo.' },
  { label: 'Gospel Soul Symphony', prompt: 'Uplifting warm Gospel soul symphony with rich Hammond B3 organ, vibrant acoustic piano, and soulful harmonic vocal layers at 90 BPM.' },
  { label: 'Lo-Fi Chill Hop', prompt: 'Chill lo-fi hip hop beat with warm vinyl crackle, nostalgic Rhodes piano chords, mellow jazz trumpet, and relaxed 85 BPM swing.' },
  { label: 'Heavy Metal Flame', prompt: 'Aggressive heavy metal track with down-tuned 7-string distorted guitar riffs, thumping double-bass drums, and searing guitar solo.' },
  { label: 'Modern Trap / Hip-Hop', prompt: 'Hard-hitting modern trap banger with sliding 808 sub bass, crisp rolling hi-hats, ambient dark melody bells at 140 BPM.' },
];

export const LyriaMusicGenerator: React.FC<LyriaMusicGeneratorProps> = ({ onSongSaved }) => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedBase64, setGeneratedBase64] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTitle, setTrackTitle] = useState('Lyria AI Masterpiece');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedAudioUrl(null);
    setGeneratedLyrics(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    try {
      const res = await generateLyriaMusic(prompt, model, selectedImage || undefined);
      setGeneratedAudioUrl(res.audioUrl);
      setGeneratedBase64(res.audioBase64);
      setGeneratedLyrics(res.lyrics);
      setTrackTitle(prompt.slice(0, 30) + ' (Lyria Master)');

      triggerNeonExplosion({
        particleCount: 60,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'medium'
      });
      showToast('✨ Lyria audio generated successfully!');
    } catch (err: any) {
      console.error('Lyria generation failed:', err);
      showToast(`⚠️ Generation error: ${err?.message || 'Check model setup'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generatedBase64 || isSaving) return;
    setIsSaving(true);
    try {
      // Save to Firebase song service
      await songService.uploadSong({
        title: trackTitle,
        artist: 'Janu Creations AI Studio',
        genre: 'Lyria AI Engine',
        genreCategory: 'Modern',
        audioDataUrl: `data:audio/wav;base64,${generatedBase64}`,
        coverArtUrl: selectedImage || undefined,
        lyrics: generatedLyrics || undefined,
        bpm: 120,
        key: 'A Minor',
        tags: ['Lyria Gen', 'AI Master', model === 'lyria-3-clip-preview' ? '30s Clip' : 'Full Track'],
      });

      // Also index into AI Asset Library for instant one-click access
      await firestoreService.saveAIAsset({
        type: 'audio_stem',
        title: trackTitle,
        prompt,
        mediaUrl: generatedAudioUrl || `data:audio/wav;base64,${generatedBase64}`,
        thumbnailUrl: selectedImage || undefined,
        bpm: 120,
        key: 'A Minor',
        genre: 'Lyria Master',
        duration: model === 'lyria-3-clip-preview' ? 30 : 180,
        durationFormatted: model === 'lyria-3-clip-preview' ? '0:30' : '3:00',
        modelUsed: model,
        fileSize: '3.8 MB',
        tags: ['Lyria Music', 'Audio Stem', 'AI Master'],
        isFavorite: true,
        creatorName: auth.currentUser?.displayName || 'January Rebl'
      });

      triggerNeonExplosion({ particleCount: 40, origin: { x: 0.5, y: 0.5 }, intensity: 'subtle' });
      showToast('☁️ Saved to Asset Library & Firebase Vault!');
      if (onSongSaved) onSongSaved();
    } catch (e: any) {
      console.error('Save failed:', e);
      showToast(`⚠️ Save error: ${e?.message || 'Could not save'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#0A0A0E] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      {/* Toast */}
      {toastMsg && (
        <div className="absolute top-4 right-4 z-20 px-4 py-2 bg-[#12121A] border border-[#00F5D4]/40 text-[#00F5D4] rounded-xl text-xs font-mono shadow-[0_0_20px_rgba(0,245,212,0.3)] animate-fade-in flex items-center gap-2">
          <i className="fa-solid fa-sparkles"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5D4]/20 via-[#C084FC]/20 to-[#38BDF8]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.2)]">
            <i className="fa-solid fa-music text-xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-black italic text-white tracking-wide">
                Lyria AI Music Generator
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[9px] font-mono font-bold uppercase text-[#00F5D4]">
                Audio Engine
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Generate studio-quality audio clips and full tracks with Lyria 3
            </p>
          </div>
        </div>

        {/* Model Selector Pill */}
        <div className="flex items-center p-1 bg-black/60 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setModel('lyria-3-clip-preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              model === 'lyria-3-clip-preview'
                ? 'bg-[#00F5D4]/20 border border-[#00F5D4]/50 text-[#00F5D4] font-bold shadow-[0_0_10px_rgba(0,245,212,0.2)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-scissors text-[10px]"></i>
            <span>Lyria Clip (30s)</span>
          </button>
          <button
            type="button"
            onClick={() => setModel('lyria-3-pro-preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              model === 'lyria-3-pro-preview'
                ? 'bg-[#C084FC]/20 border border-[#C084FC]/50 text-[#C084FC] font-bold shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-record-vinyl text-[10px]"></i>
            <span>Lyria Pro (Full Track)</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase text-gray-400 mb-2 block">Quick Style Inspirations:</span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {MUSIC_STYLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(preset.prompt)}
              className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 hover:border-[#00F5D4]/40 hover:text-[#00F5D4] text-gray-300 text-xs font-mono whitespace-nowrap transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the sonic atmosphere, BPM, instruments, emotional mood, and musical style..."
            className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4] resize-none"
          />
        </div>

        {/* Optional Mood Reference Image Upload */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 text-xs font-mono flex items-center gap-2 transition-all"
            >
              <i className="fa-solid fa-image text-[#C084FC]"></i>
              <span>{selectedImage ? 'Change Mood Board Image' : 'Attach Mood Board Image (Optional)'}</span>
            </button>

            {selectedImage && (
              <div className="relative group">
                <img src={selectedImage} alt="Mood reference" className="w-9 h-9 rounded-lg object-cover border border-[#C084FC]" />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)] ml-auto"
          >
            {isGenerating ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Synthesizing with {model}...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Generate Music</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generated Audio Result Panel */}
      {generatedAudioUrl && (
        <div className="mt-6 p-5 rounded-xl bg-[#12121A] border border-[#00F5D4]/30 shadow-[0_0_30px_rgba(0,245,212,0.15)] animate-fade-in space-y-4">
          <audio
            ref={audioRef}
            src={generatedAudioUrl}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              console.warn('Lyria audio playback notice');
              setIsPlaying(false);
            }}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00F5D4] to-[#C084FC] text-black flex items-center justify-center text-lg font-bold shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:scale-105 transition-transform"
              >
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-0.5'}`}></i>
              </button>

              <div>
                <input
                  type="text"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="bg-transparent text-white font-serif font-black italic text-base border-b border-transparent hover:border-white/20 focus:border-[#00F5D4] focus:outline-none"
                />
                <p className="text-[11px] font-mono text-[#00F5D4] flex items-center gap-2">
                  <span>Generated with {model}</span>
                  <span>•</span>
                  <span>Master Quality WAV</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={generatedAudioUrl}
                download={`${trackTitle.replace(/\s+/g, '-').toLowerCase()}.wav`}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <i className="fa-solid fa-download text-[#00F5D4]"></i>
                <span>Download</span>
              </a>

              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] hover:bg-[#00F5D4]/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,245,212,0.2)] disabled:opacity-40"
              >
                <i className={`fa-solid ${isSaving ? 'fa-circle-notch fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                <span>{isSaving ? 'Saving...' : 'Save to Cloud Vault'}</span>
              </button>
            </div>
          </div>

          {/* Generated Lyrics / Metadata */}
          {generatedLyrics && (
            <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-xs text-gray-300 font-sans leading-relaxed">
              <span className="text-[10px] font-mono uppercase text-[#C084FC] block mb-1 font-bold">
                <i className="fa-solid fa-align-left mr-1"></i> Generated Lyrics & Acoustic Notes:
              </span>
              <div className="whitespace-pre-wrap">{generatedLyrics}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LyriaMusicGenerator;
