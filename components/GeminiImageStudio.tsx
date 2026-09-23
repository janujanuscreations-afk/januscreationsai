import React, { useState, useRef } from 'react';
import { generateImageAI, editImageAI } from '../services/geminiService';
import { triggerNeonExplosion } from '../utils/confetti';
import { firestoreService, auth } from '../services/firebase';

interface GeminiImageStudioProps {
  onImageSaved?: (imageUrl: string) => void;
}

const STYLE_PRESETS = [
  { id: 'editorial', label: 'High-End Editorial', desc: 'Minimalist, sharp focus, studio lighting.' },
  { id: 'cinematic', label: 'Cinematic Anamorphic', desc: 'Film flares, chiaroscuro, 35mm grain.' },
  { id: 'photorealistic', label: 'Ultra Photorealistic', desc: 'Natural macro detail, 8K realism.' },
  { id: 'cyber-neon', label: 'Cyberpunk Fluorescent', desc: 'Vibrant neon teal #00F5D4 & purple #C084FC.' },
  { id: 'avant-garde', label: 'Avant-Garde Concept', desc: 'Surreal abstract forms and luxury textures.' },
];

export const GeminiImageStudio: React.FC<GeminiImageStudioProps> = ({ onImageSaved }) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('16:9');
  const [imageSize, setImageSize] = useState<'512px' | '1K' | '2K' | '4K'>('1K');
  const [selectedStyle, setSelectedStyle] = useState('editorial');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultDesc, setResultDesc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveToAssetLibrary = async () => {
    if (!resultImage) return;
    try {
      const user = auth.currentUser;
      await firestoreService.saveAIAsset({
        type: 'image',
        title: prompt ? prompt.slice(0, 40) + '...' : 'Gemini AI Artwork',
        prompt,
        mediaUrl: resultImage,
        thumbnailUrl: resultImage,
        aspectRatio,
        modelUsed: 'gemini-3.1-flash-image',
        fileSize: imageSize === '4K' ? '8.4 MB' : (imageSize === '2K' ? '4.2 MB' : '2.1 MB'),
        tags: [selectedStyle, 'Gemini Image', aspectRatio, 'AI Art'],
        isFavorite: true,
        creatorName: user?.displayName || 'January Rebl'
      });
      setIsSavedToLibrary(true);
      triggerNeonExplosion({ particleCount: 30, intensity: 'subtle' });
    } catch (err) {
      console.warn('Error saving to asset library:', err);
    }
  };

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;
    if (mode === 'edit' && !sourceImage) {
      setErrorMsg('Please upload a source image to edit');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setResultImage(null);

    try {
      if (mode === 'create') {
        const res = await generateImageAI(
          prompt,
          aspectRatio,
          imageSize,
          selectedStyle,
          'gemini-3.1-flash-image-preview'
        );
        setResultImage(res.imageUrl);
        setResultDesc(res.description);
      } else {
        const res = await editImageAI(
          prompt,
          sourceImage!,
          'image/png',
          'gemini-3.1-flash-image-preview'
        );
        setResultImage(res.imageUrl);
        setResultDesc(res.description);
      }

      triggerNeonExplosion({
        particleCount: 50,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'medium'
      });
    } catch (err: any) {
      console.error('Image AI error:', err);
      setErrorMsg(err?.message || 'Failed to process image with Gemini');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#0A0A0E] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5D4]/20 via-[#C084FC]/20 to-[#38BDF8]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.2)]">
            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-black italic text-white tracking-wide">
                Gemini Image Alchemist
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[9px] font-mono font-bold uppercase text-[#00F5D4]">
                gemini-3.1-flash-image-preview
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Create 4K neural visual artwork from text or edit existing creator imagery
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 bg-black/60 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              mode === 'create'
                ? 'bg-[#00F5D4]/20 border border-[#00F5D4]/50 text-[#00F5D4] font-bold shadow-[0_0_10px_rgba(0,245,212,0.2)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Create New</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              mode === 'edit'
                ? 'bg-[#C084FC]/20 border border-[#C084FC]/50 text-[#C084FC] font-bold shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-pen-to-square text-[10px]"></i>
            <span>Edit Existing</span>
          </button>
        </div>
      </div>

      {/* Style Chips (Create Mode) */}
      {mode === 'create' && (
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase text-gray-400 mb-2 block">Aesthetic Archetype:</span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                  selectedStyle === style.id
                    ? 'bg-[#00F5D4]/20 border-[#00F5D4] text-[#00F5D4] font-bold shadow-[0_0_10px_rgba(0,245,212,0.2)]'
                    : 'bg-white/5 border-white/5 text-gray-300 hover:border-white/20'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleExecute} className="space-y-4">
        {mode === 'edit' && (
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSourceUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-2 transition-all"
              >
                <i className="fa-solid fa-upload text-[#C084FC]"></i>
                <span>{sourceImage ? 'Replace Source Image' : 'Upload Image to Edit'}</span>
              </button>

              {sourceImage && (
                <div className="relative group">
                  <img src={sourceImage} alt="Source" className="w-12 h-12 rounded-lg object-cover border border-[#C084FC]" />
                  <button
                    type="button"
                    onClick={() => setSourceImage(null)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] font-mono text-gray-400">
              Prompt will instruct the model on how to modify the image (e.g. &quot;Add futuristic cyberpunk glasses&quot;).
            </p>
          </div>
        )}

        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder={
              mode === 'create'
                ? "Describe your visual concept, subject, lighting, colors, and camera angle..."
                : "Describe the exact modifications or additions to apply to the source image..."
            }
            className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4] resize-none"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Aspect Ratio */}
            {mode === 'create' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-gray-400">Aspect:</span>
                <select
                  value={aspectRatio}
                  onChange={(e: any) => setAspectRatio(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-black border border-white/20 text-xs font-mono text-[#00F5D4] focus:outline-none focus:border-[#00F5D4]"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="3:4">3:4 Vertical</option>
                </select>
              </div>
            )}

            {/* Resolution */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-gray-400">Resolution:</span>
              <select
                value={imageSize}
                onChange={(e: any) => setImageSize(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-black border border-white/20 text-xs font-mono text-gray-300 focus:outline-none focus:border-[#00F5D4]"
              >
                <option value="1K">1K High-Res</option>
                <option value="2K">2K Ultra-Res</option>
                <option value="4K">4K Studio Master</option>
                <option value="512px">512px Fast</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)] ml-auto"
          >
            {isProcessing ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Rendering Neural Imagery...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-image"></i>
                <span>{mode === 'create' ? 'Generate Image' : 'Apply AI Edit'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          <i className="fa-solid fa-triangle-exclamation mr-2"></i>
          {errorMsg}
        </div>
      )}

      {/* Result Display */}
      {resultImage && (
        <div className="mt-6 p-5 rounded-xl bg-[#12121A] border border-[#00F5D4]/30 shadow-[0_0_30px_rgba(0,245,212,0.15)] animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-serif font-black italic text-white">
                Rendered Artwork Master
              </h4>
              <p className="text-xs font-mono text-[#00F5D4]">
                gemini-3.1-flash-image • {aspectRatio} • {imageSize}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveToAssetLibrary}
                className={`px-3.5 py-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  isSavedToLibrary
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-[#C084FC]/20 border-[#C084FC] text-[#C084FC] hover:bg-[#C084FC]/30 shadow-[0_0_15px_rgba(192,132,252,0.2)]'
                }`}
              >
                <i className={`fa-solid ${isSavedToLibrary ? 'fa-check' : 'fa-folder-bookmark'}`}></i>
                <span>{isSavedToLibrary ? 'Saved in Vault' : 'Save to Library'}</span>
              </button>

              <a
                href={resultImage}
                download="gemini-alchemist-artwork.png"
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <i className="fa-solid fa-download text-[#00F5D4]"></i>
                <span>Download PNG</span>
              </a>

              {onImageSaved && (
                <button
                  type="button"
                  onClick={() => onImageSaved(resultImage)}
                  className="px-4 py-2 rounded-lg bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] hover:bg-[#00F5D4]/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,245,212,0.2)]"
                >
                  <i className="fa-solid fa-palette"></i>
                  <span>Send to Photo Editor</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[500px]">
            <img
              src={resultImage}
              alt="Generated AI Artwork"
              className="max-h-[500px] w-auto object-contain rounded-xl"
            />
          </div>

          {resultDesc && (
            <p className="text-xs font-mono text-gray-400 bg-black/40 p-3 rounded-lg border border-white/5">
              {resultDesc}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiImageStudio;
