import React, { useState, useRef, useEffect } from 'react';
import { generateVeoVideo, checkVeoStatus, downloadVeoVideoBlob } from '../services/geminiService';
import { triggerNeonExplosion } from '../utils/confetti';
import { firestoreService, auth } from '../services/firebase';

interface VeoVideoGeneratorProps {
  onVideoExportedToReel?: (videoUrl: string) => void;
}

const VEO_PROMPT_PRESETS = [
  { label: 'Cyberpunk Drone Flight', prompt: 'Cinematic drone shot flying through a neon-lit futuristic cyberpunk city with holographic billboards and flying vehicles at dusk.' },
  { label: 'Holographic Stage Performance', prompt: 'Dramatic concert stage with a laser light show, holographic particle effects, and an electrifying music performance.' },
  { label: 'Macro Fluid Dynamics', prompt: 'Hypnotic macro shot of luminescent neon fluid swirls blending in zero gravity with fluorescent purple and teal particles.' },
  { label: 'Executive Portrait Animation', prompt: 'Subtle cinematic slow-motion portrait with dramatic studio rim lighting, cinematic depth of field, and elegant bokeh.' }
];

const VEO_LOADING_STAGES = [
  "01 / 04 • Parsing spatial coordinates and neural scene dynamics...",
  "02 / 04 • Generating temporal motion vectors with Veo 3 Engine...",
  "03 / 04 • Synthesizing cinematic volumetric lighting and shaders...",
  "04 / 04 • Finalizing 60 FPS master render and encoding MP4 stream..."
];

export const VeoVideoGenerator: React.FC<VeoVideoGeneratorProps> = ({ onVideoExportedToReel }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSavedToVault, setIsSavedToVault] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollIntervalRef = useRef<any>(null);

  const handleSaveToAssetVault = async () => {
    if (!videoUrl) return;
    try {
      const user = auth.currentUser;
      await firestoreService.saveAIAsset({
        type: 'video',
        title: prompt ? prompt.slice(0, 36) + '...' : 'Veo 3 Motion Master',
        prompt,
        mediaUrl: videoUrl,
        thumbnailUrl: sourceImage || videoUrl,
        aspectRatio,
        duration: 6,
        durationFormatted: '0:06',
        modelUsed: 'veo-3.1-fast-generate-preview',
        fileSize: '7.8 MB',
        tags: ['Veo 3', 'Video Render', aspectRatio, 'AI Motion'],
        isFavorite: true,
        creatorName: user?.displayName || 'January Rebl'
      });
      setIsSavedToVault(true);
      triggerNeonExplosion({ particleCount: 30, intensity: 'subtle' });
    } catch (err) {
      console.warn('Error saving video to asset vault:', err);
    }
  };

  useEffect(() => {
    if (!isGenerating) {
      setLoadingStageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStageIndex(prev => (prev + 1) % VEO_LOADING_STAGES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !sourceImage) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setVideoUrl(null);
    setOperationName(null);

    try {
      const res = await generateVeoVideo(
        prompt,
        aspectRatio,
        resolution,
        sourceImage || undefined,
        'veo-3.1-fast-generate-preview'
      );

      const opName = res.operationName;
      setOperationName(opName);

      // Start polling for video completion
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await checkVeoStatus(opName);
          if (statusRes.done) {
            clearInterval(pollIntervalRef.current);
            if (statusRes.error) {
              throw new Error(statusRes.error.message || 'Veo video rendering encountered an issue');
            }
            // Download video blob
            const downloadedUrl = await downloadVeoVideoBlob(opName);
            setVideoUrl(downloadedUrl);
            setIsGenerating(false);

            triggerNeonExplosion({
              particleCount: 70,
              origin: { x: 0.5, y: 0.5 },
              intensity: 'medium'
            });
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
          clearInterval(pollIntervalRef.current);
          setErrorMsg(pollErr?.message || 'Failed during video rendering');
          setIsGenerating(false);
        }
      }, 5000);

    } catch (err: any) {
      console.warn('Veo video initiation response:', err?.message || err);
      let msg = err?.message || 'Could not start Veo video generation';
      try {
        if (typeof msg === 'string' && msg.includes('{')) {
          const jsonStart = msg.indexOf('{');
          const parsed = JSON.parse(msg.slice(jsonStart));
          if (parsed?.error?.message) msg = parsed.error.message;
        }
      } catch {
        // keep fallback msg
      }
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('limit: 0')) {
        msg = 'Veo Video Generation requires a paid Google AI Studio tier with billing enabled (Free tier quota is 0 for Veo). Please upgrade your Gemini plan or verify billing details at ai.google.dev/pricing.';
      }
      setErrorMsg(msg);
      setIsGenerating(false);
    }
  };

  const handleExportToReelStudio = () => {
    if (!videoUrl) return;
    if (onVideoExportedToReel) {
      onVideoExportedToReel(videoUrl);
      triggerNeonExplosion({ particleCount: 30, origin: { x: 0.5, y: 0.5 }, intensity: 'subtle' });
    }
  };

  return (
    <div className="bg-[#0A0A0E] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5D4]/20 via-[#C084FC]/20 to-[#38BDF8]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.2)]">
            <i className="fa-solid fa-film text-xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-black italic text-white tracking-wide">
                Veo 3 Video Generator
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#C084FC]/10 border border-[#C084FC]/30 text-[9px] font-mono font-bold uppercase text-[#C084FC]">
                veo-3.1-fast-generate-preview
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Generate cinematic video from text or animate photos into motion videos
            </p>
          </div>
        </div>

        {/* Aspect Ratio Selector (16:9 landscape vs 9:16 portrait) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-black/60 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                aspectRatio === '16:9'
                  ? 'bg-[#00F5D4]/20 border border-[#00F5D4]/50 text-[#00F5D4] font-bold shadow-[0_0_10px_rgba(0,245,212,0.2)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-panorama text-[10px]"></i>
              <span>16:9 Landscape</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                aspectRatio === '9:16'
                  ? 'bg-[#C084FC]/20 border border-[#C084FC]/50 text-[#C084FC] font-bold shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-mobile-screen text-[10px]"></i>
              <span>9:16 Portrait Reel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase text-gray-400 mb-2 block">Quick Cinematic Prompts:</span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {VEO_PROMPT_PRESETS.map((preset, idx) => (
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

      {/* Input Form */}
      <form onSubmit={handleStartGeneration} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the camera motion, lighting atmosphere, characters, visual style, and environment..."
            className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4] resize-none"
          />
        </div>

        {/* Photo Animation Attachment & Controls */}
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
              <i className="fa-solid fa-wand-magic-sparkles text-[#00F5D4]"></i>
              <span>{sourceImage ? 'Change Image to Animate' : 'Animate Image into Video (Optional)'}</span>
            </button>

            {sourceImage && (
              <div className="relative group">
                <img src={sourceImage} alt="Starting frame" className="w-9 h-9 rounded-lg object-cover border border-[#00F5D4]" />
                <button
                  type="button"
                  onClick={() => setSourceImage(null)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <select
              value={resolution}
              onChange={(e: any) => setResolution(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black border border-white/20 text-xs font-mono text-gray-300 focus:outline-none focus:border-[#00F5D4]"
            >
              <option value="720p">720p HD</option>
              <option value="1080p">1080p Full HD</option>
            </select>

            <button
              type="submit"
              disabled={(!prompt.trim() && !sourceImage) || isGenerating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)]"
            >
              {isGenerating ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Rendering Veo Video...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-video"></i>
                  <span>Generate Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Loading Progress State */}
      {isGenerating && (
        <div className="mt-6 p-6 rounded-xl bg-[#12121A] border border-[#00F5D4]/30 shadow-[0_0_30px_rgba(0,245,212,0.15)] text-center animate-fade-in space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-[#00F5D4] border-t-transparent animate-spin mx-auto"></div>
          <h4 className="text-sm font-serif font-black italic text-white tracking-wide">
            Veo 3 Video Neural Synthesizer Active
          </h4>
          <p className="text-xs font-mono text-[#00F5D4] animate-pulse">
            {VEO_LOADING_STAGES[loadingStageIndex]}
          </p>
          <p className="text-[11px] font-mono text-gray-400 max-w-md mx-auto">
            High-definition generative video rendering may take 1-2 minutes. Please stay on this tab while our cloud workers finalize your frames.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          <i className="fa-solid fa-triangle-exclamation mr-2"></i>
          {errorMsg}
        </div>
      )}

      {/* Generated Video Player */}
      {videoUrl && (
        <div className="mt-6 p-5 rounded-xl bg-[#12121A] border border-[#00F5D4]/30 shadow-[0_0_30px_rgba(0,245,212,0.15)] animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-serif font-black italic text-white">
                Generated Veo 3 Video Master
              </h4>
              <p className="text-xs font-mono text-[#00F5D4]">
                Aspect Ratio: {aspectRatio} • {resolution} • MP4 H.264
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveToAssetVault}
                className={`px-3.5 py-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  isSavedToVault
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-[#C084FC]/20 border-[#C084FC] text-[#C084FC] hover:bg-[#C084FC]/30 shadow-[0_0_15px_rgba(192,132,252,0.2)]'
                }`}
              >
                <i className={`fa-solid ${isSavedToVault ? 'fa-check' : 'fa-folder-bookmark'}`}></i>
                <span>{isSavedToVault ? 'Saved in Vault' : 'Save to Library'}</span>
              </button>

              <a
                href={videoUrl}
                download="veo-video-generation.mp4"
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <i className="fa-solid fa-download text-[#00F5D4]"></i>
                <span>Download MP4</span>
              </a>

              {onVideoExportedToReel && (
                <button
                  type="button"
                  onClick={handleExportToReelStudio}
                  className="px-4 py-2 rounded-lg bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] hover:bg-[#00F5D4]/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,245,212,0.2)]"
                >
                  <i className="fa-solid fa-scissors"></i>
                  <span>Send to Reel Editor</span>
                </button>
              )}
            </div>
          </div>

          <div className={`relative rounded-xl overflow-hidden bg-black flex items-center justify-center ${aspectRatio === '9:16' ? 'max-w-xs mx-auto aspect-[9/16]' : 'aspect-video w-full'}`}>
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              onError={(e) => console.warn('Veo video playback notice:', e)}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VeoVideoGenerator;
