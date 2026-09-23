import React, { useState, useEffect } from 'react';
import { generateBrandIdentity, generateConceptImage, generateBrandVoice } from '../services/geminiService';
import { BrandBrief } from '../types';
import Reveal from './Reveal';
import { triggerNeonExplosion } from '../utils/confetti';
import StrategyInsightSidebar from './StrategyInsightSidebar';
import AISuperStudio from './AISuperStudio';

type AspectRatio = "1:1" | "16:9" | "9:16";
type StylePreset = "editorial" | "cinematic" | "photorealistic" | "avant-garde" | "vintage" | "neon" | "abstract";

const LOADING_PHASES = [
  "01 / 04 • Aligning Neural Core & Atmospheric Frequencies",
  "02 / 04 • Deciphering Janu's Creations Heritage & Future Resonance",
  "03 / 04 • Synthesizing Strategic Palette & Voice Archetype",
  "04 / 04 • Rendering 4K Neural Visual Concept"
];

const AIStudio: React.FC = () => {
  const [brief, setBrief] = useState<BrandBrief>({
    name: '',
    industry: '',
    vibe: '',
    targetAudience: ''
  });
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [imageStyle, setImageStyle] = useState<StylePreset>("editorial");
  
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [voiceResult, setVoiceResult] = useState<string | null>(null);
  const [conceptImage, setConceptImage] = useState<string | null>(null);
  const [error, setError] = useState<{message: string, steps: string[], type: 'safety' | 'technical'} | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isVoiceCopied, setIsVoiceCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studioToast, setStudioToast] = useState<string | null>(null);
  const [studioMode, setStudioMode] = useState<'super-studio' | 'brand-oracle'>('super-studio');

  const showStudioToast = (msg: string) => {
    setStudioToast(msg);
    setTimeout(() => setStudioToast(null), 3000);
  };

  // Rotate through subtle luxury AI generation phases when loading
  useEffect(() => {
    if (!loading) {
      setLoadingPhaseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleError = (err: any) => {
    const errorMsg = err?.message?.toLowerCase() || "";
    const isSafety = errorMsg.includes("safety") || errorMsg.includes("blocked") || errorMsg.includes("candidate") || errorMsg.includes("harmful");
    
    if (isSafety) {
      setError({
        type: 'safety',
        message: "Oracle's Vision Clouded by Safety Protocols.",
        steps: [
          "The manifestation prompt may have triggered an AI safety filter.",
          "Try rephrasing with more abstract, professional, or aesthetic descriptors.",
          "Avoid using names of specific public figures or sensitive historical events.",
          "Refine the 'Atmosphere' and 'Industry' to focus purely on brand energy.",
          "If this persists, contact janujanuscreations@gmail.com for executive override."
        ]
      });
    } else {
      setError({
        type: 'technical',
        message: "Spectral Interference Detected.",
        steps: [
          "The connection to the Janu's Creations Neural Engine was interrupted.",
          "Ensure your digital link (network) is stable and try again.",
          "The AI Studio may be experiencing high-energy traffic. Wait a moment.",
          "Verify that all brief parameters are correctly defined."
        ]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setConceptImage(null);

    try {
      // Parallel execution for better UX
      const [textResult, imageResult] = await Promise.all([
        generateBrandIdentity(brief),
        generateConceptImage(
          `Conceptual brand manifest for ${brief.name}. ${brief.vibe} essence for ${brief.industry}.`,
          aspectRatio,
          imageStyle
        )
      ]);
      
      setResult(textResult || "No response received.");
      setConceptImage(imageResult);
      
      // High-end subtle neon confetti explosion on successful AI generation
      triggerNeonExplosion({
        particleCount: 65,
        origin: { x: 0.5, y: 0.4 },
        spread: 80,
        intensity: 'medium'
      });
      
    } catch (err: any) {
      console.error(err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceManifest = async () => {
    if (!brief.name || !brief.vibe) {
      showStudioToast("The Oracle requires at least a Name and a Vibe to manifest a voice.");
      return;
    }
    setVoiceLoading(true);
    setVoiceResult(null);
    setError(null);
    try {
      const res = await generateBrandVoice(brief);
      setVoiceResult(res || "The voice remains silent.");
      
      // High-end subtle neon confetti explosion on voice completion
      triggerNeonExplosion({
        particleCount: 50,
        origin: { x: 0.5, y: 0.55 },
        spread: 60,
        intensity: 'subtle'
      });
    } catch (err) {
      console.error(err);
      handleError(err);
    } finally {
      setVoiceLoading(false);
    }
  };

  const handleDownloadText = (content: string, suffix: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brief.name.replace(/\s+/g, '-').toLowerCase() || 'janus'}-${suffix}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async (content: string, setIsCopiedFn: (val: boolean) => void) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setIsCopiedFn(true);
      setTimeout(() => setIsCopiedFn(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShareText = async (content: string, titleSuffix: string) => {
    if (!content) return;
    const shareData = {
      title: `${brief.name || "Janu's Creations"} | ${titleSuffix}`,
      text: content.substring(0, 1000) + '...',
      url: 'https://januscreations.sintra.site',
    };

    let canShareNatively = false;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        canShareNatively = navigator.canShare(shareData);
      }
    } catch {
      canShareNatively = false;
    }

    if (canShareNatively) {
      try {
        await navigator.share(shareData);
        showStudioToast(`${titleSuffix} manifest shared successfully!`);
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          handleCopyText(content, setIsCopied);
          showStudioToast("Manifest copied to your clipboard!");
        }
      }
    } else {
      handleCopyText(content, setIsCopied);
      showStudioToast("Sharing dialog is unavailable in this environment. The manifest has been copied to your clipboard!");
    }
  };

  return (
    <section id="studio" className="py-32 px-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Toast Notification Banner */}
      {studioToast && (
        <div className="fixed top-24 right-6 z-50 p-4 rounded-2xl bg-zinc-950/95 border border-[#00FFE0]/50 text-white font-mono text-xs shadow-[0_0_30px_rgba(0,255,224,0.3)] animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
          <i className="fa-solid fa-sparkles text-[#00FFE0]"></i>
          <span>{studioToast}</span>
        </div>
      )}
      {/* Dynamic Ambient Neon Glows */}
      <div className="absolute top-1/4 right-0 w-[35rem] h-[35rem] bg-[#FF007F]/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-0 w-[35rem] h-[35rem] bg-[#00F5D4]/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-[30rem] h-[30rem] bg-[#C084FC]/10 rounded-full blur-[180px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Studio Mode Navigation Switcher */}
        <div className="flex justify-center mb-12">
          <div className="p-1.5 rounded-full bg-zinc-900/90 border border-white/10 backdrop-blur-xl flex items-center gap-2 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={() => {
                setStudioMode('super-studio');
                triggerNeonExplosion({ particleCount: 35, intensity: 'subtle' });
              }}
              className={`px-6 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
                studioMode === 'super-studio'
                  ? 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-black shadow-[0_0_20px_rgba(0,245,212,0.4)] scale-105'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>AI Super Studio Suite</span>
              <span className="px-2 py-0.5 rounded-full bg-black/30 text-[9px] font-mono">Veo • Lyria • Gemini</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStudioMode('brand-oracle');
                triggerNeonExplosion({ particleCount: 35, intensity: 'subtle' });
              }}
              className={`px-6 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
                studioMode === 'brand-oracle'
                  ? 'bg-gradient-to-r from-[#FF007F] to-[#00F5D4] text-black font-black shadow-[0_0_20px_rgba(255,0,127,0.4)] scale-105'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-brain-circuit"></i>
              <span>Brand Identity Oracle</span>
            </button>
          </div>
        </div>

        {studioMode === 'super-studio' ? (
          <AISuperStudio />
        ) : (
          <>
            <Reveal className="text-center mb-20">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-6 shadow-[0_0_20px_rgba(255,0,127,0.15)]">
                <span className="w-2 h-2 rounded-full bg-[#FF007F] animate-pulse"></span>
                <span className="text-[11px] font-mono font-bold tracking-[0.4em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4]">
                  Neural Brand Synthesizer
                </span>
              </div>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black mb-6 italic tracking-tight text-3d-luxury">
                The AI <span className="creations-script">Oracle</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed">
                Harness the dual power of timeless heritage and hyper-futuristic innovation. Describe your vision, and the Oracle will manifest its sovereign brand identity and concept artwork.
              </p>
            </Reveal>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Input Form & Voice Oracle */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            <Reveal delayClass="reveal-delay-100">
              <div className="glass p-8 sm:p-10 rounded-[2.5rem] border-[#FF007F]/20 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <h3 className="text-lg font-mono font-bold uppercase tracking-widest flex items-center gap-3 text-white">
                    <span className="w-2.5 h-2.5 bg-[#FF007F] rounded-full shadow-[0_0_10px_#FF007F] animate-pulse"></span>
                    Brand Genesis
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(true)}
                      className="px-3 py-1.5 rounded-full bg-[#00F5D4]/10 hover:bg-[#00F5D4]/20 border border-[#00F5D4]/30 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,245,212,0.15)] hover:scale-105"
                      title="Open Strategy & Trends Insights"
                    >
                      <i className="fa-solid fa-chart-line-up text-xs"></i>
                      <span>Strategy Insights</span>
                    </button>
                    <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase font-bold hidden sm:inline">Live Matrix</span>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2">Project / Brand Name</label>
                    <input 
                      type="text" 
                      value={brief.name}
                      onChange={e => setBrief({...brief, name: e.target.value})}
                      className="w-full bg-black/70 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-[#FF007F] focus:shadow-[0_0_20px_rgba(255,0,127,0.3)] outline-none transition-all text-white placeholder-gray-600 font-sans"
                      placeholder="e.g. Aetheris Luxury Apparel"
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2">Industry</label>
                      <input 
                        type="text" 
                        value={brief.industry}
                        onChange={e => setBrief({...brief, industry: e.target.value})}
                        className="w-full bg-black/70 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-[#00F5D4] focus:shadow-[0_0_20px_rgba(0,245,212,0.3)] outline-none transition-all text-white placeholder-gray-600 font-sans"
                        placeholder="e.g. Haute Couture"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2">Atmosphere / Vibe</label>
                      <input 
                        type="text" 
                        value={brief.vibe}
                        onChange={e => setBrief({...brief, vibe: e.target.value})}
                        className="w-full bg-black/70 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-[#C084FC] focus:shadow-[0_0_20px_rgba(192,132,252,0.3)] outline-none transition-all text-white placeholder-gray-600 font-sans"
                        placeholder="e.g. Cyber Elegance"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2">Target Audience & Purpose</label>
                    <textarea 
                      value={brief.targetAudience}
                      onChange={e => setBrief({...brief, targetAudience: e.target.value})}
                      className="w-full bg-black/70 border border-white/10 rounded-2xl px-5 py-3.5 h-24 focus:border-[#FF007F] focus:shadow-[0_0_20px_rgba(255,0,127,0.3)] outline-none transition-all resize-none text-white placeholder-gray-600 font-sans"
                      placeholder="Who is this sovereign creation built for?"
                      required
                    />
                  </div>

                  {/* Visual Parameters */}
                  <div className="grid sm:grid-cols-2 gap-5 pt-4 border-t border-white/5">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2.5">Aspect Ratio</label>
                      <div className="flex bg-black/60 rounded-xl p-1 border border-white/10">
                        <button 
                          type="button" 
                          onClick={() => setAspectRatio("16:9")} 
                          className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${aspectRatio === "16:9" ? 'bg-gradient-to-r from-[#FF007F] to-[#C084FC] text-white shadow-[0_0_12px_rgba(255,0,127,0.4)]' : 'text-gray-500 hover:text-white'}`}
                        >
                          16:9
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setAspectRatio("1:1")} 
                          className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${aspectRatio === "1:1" ? 'bg-gradient-to-r from-[#FF007F] to-[#C084FC] text-white shadow-[0_0_12px_rgba(255,0,127,0.4)]' : 'text-gray-500 hover:text-white'}`}
                        >
                          1:1
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setAspectRatio("9:16")} 
                          className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${aspectRatio === "9:16" ? 'bg-gradient-to-r from-[#FF007F] to-[#C084FC] text-white shadow-[0_0_12px_rgba(255,0,127,0.4)]' : 'text-gray-500 hover:text-white'}`}
                        >
                          9:16
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2.5">Visual Aesthetic</label>
                      <div className="relative">
                        <select 
                          value={imageStyle} 
                          onChange={(e) => setImageStyle(e.target.value as StylePreset)} 
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-white appearance-none focus:border-[#00F5D4] focus:shadow-[0_0_15px_rgba(0,245,212,0.3)] outline-none cursor-pointer"
                        >
                          <option value="editorial">Editorial Photography</option>
                          <option value="cinematic">Cinematic Film 35mm</option>
                          <option value="photorealistic">Photorealistic Macro</option>
                          <option value="avant-garde">Avant-Garde Concept</option>
                          <option value="vintage">Vintage Retro-Futurism</option>
                          <option value="neon">Cyber Neon Glow</option>
                          <option value="abstract">Abstract Fluid Light</option>
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none"></i>
                      </div>
                    </div>
                  </div>

                  {/* Submission Button */}
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4.5 bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] hover:shadow-[0_0_35px_rgba(255,0,127,0.6)] text-black rounded-2xl font-mono font-black uppercase tracking-[0.3em] text-xs transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Consulting Oracle...</span>
                      </>
                    ) : (
                      <>
                        <span>Consult the Oracle</span>
                        <i className="fa-solid fa-sparkles text-black group-hover:rotate-45 transition-transform"></i>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </Reveal>

            {/* Voice Oracle Section */}
            <Reveal delayClass="reveal-delay-200">
              <div className="glass p-8 rounded-[2.5rem] border-[#C084FC]/20 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                   <h3 className="text-base font-mono font-bold uppercase tracking-widest flex items-center gap-3 text-white">
                    <span className="w-2.5 h-2.5 bg-[#C084FC] rounded-full shadow-[0_0_10px_#C084FC] animate-pulse"></span>
                    Voice Oracle
                  </h3>
                  <button 
                    onClick={handleVoiceManifest}
                    disabled={voiceLoading}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
                      voiceLoading 
                      ? 'bg-white/5 text-gray-500 border border-white/10' 
                      : 'bg-[#C084FC]/15 hover:bg-[#C084FC] text-[#C084FC] hover:text-black border border-[#C084FC]/40 shadow-[0_0_15px_rgba(192,132,252,0.25)] active:scale-95'
                    }`}
                  >
                    {voiceLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-[#C084FC] border-t-transparent rounded-full animate-spin"></div>
                        Synthesizing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <i className="fa-solid fa-waveform-lines text-xs"></i>
                        Manifest Voice
                      </span>
                    )}
                  </button>
                </div>

                {/* Voice Loading Skeleton */}
                {voiceLoading && (
                  <div className="py-6 space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-end gap-1 h-6">
                        <span className="w-1 bg-[#FF007F] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-3"></span>
                        <span className="w-1 bg-[#C084FC] rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-6"></span>
                        <span className="w-1 bg-[#00F5D4] rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-4"></span>
                        <span className="w-1 bg-[#C084FC] rounded-full animate-[pulse_1s_ease-in-out_infinite] h-5"></span>
                        <span className="w-1 bg-[#FF007F] rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-2"></span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC] animate-pulse">
                        Decoding Linguistic Archetype & Tone Frequency...
                      </span>
                    </div>
                    <div className="h-3 rounded-lg skeleton-purple-shimmer w-full"></div>
                    <div className="h-3 rounded-lg skeleton-purple-shimmer w-5/6"></div>
                    <div className="h-3 rounded-lg skeleton-purple-shimmer w-4/6"></div>
                  </div>
                )}

                {voiceResult && !voiceLoading && (
                  <div className="animate-in fade-in duration-700">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#C084FC] flex items-center gap-2">
                        <i className="fa-solid fa-volume-high text-xs"></i> Linguistic Manifest
                      </span>
                      <div className="flex gap-4">
                         <button onClick={() => handleShareText(voiceResult, 'Voice')} className="text-gray-400 hover:text-[#C084FC] transition-colors" title="Share"><i className="fa-solid fa-share-nodes"></i></button>
                         <button onClick={() => handleCopyText(voiceResult, setIsVoiceCopied)} className="text-gray-400 hover:text-white transition-colors" title="Copy"><i className={`fa-solid ${isVoiceCopied ? 'fa-check text-[#00F5D4]' : 'fa-copy'}`}></i></button>
                         <button onClick={() => handleDownloadText(voiceResult, 'voice-manifest')} className="text-gray-400 hover:text-white transition-colors" title="Download"><i className="fa-solid fa-download"></i></button>
                      </div>
                    </div>
                    <div className="text-gray-300 text-xs leading-relaxed max-h-[220px] overflow-y-auto custom-scrollbar whitespace-pre-wrap font-mono">
                      {voiceResult}
                    </div>
                  </div>
                )}

                {!voiceResult && !voiceLoading && (
                  <p className="text-xs text-gray-500 font-mono tracking-wide leading-relaxed">
                    Tap Manifest Voice above to generate custom Linguistic Archetypes, tone frequencies, and signature phrases.
                  </p>
                )}
              </div>
            </Reveal>
          </div>

          {/* Right Column: AI Output & High-End Loading Skeletons */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            {/* Error Display */}
            {error && (
              <Reveal className="mb-2">
                <div className={`glass p-8 rounded-[2.5rem] border-2 animate-in slide-in-from-right-4 duration-500 ${error.type === 'safety' ? 'border-[#FF007F]/60 bg-[#FF007F]/10 shadow-[0_0_30px_rgba(255,0,127,0.25)]' : 'border-amber-500/50 bg-amber-500/10'}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${error.type === 'safety' ? 'bg-[#FF007F]/20 text-[#FF007F]' : 'bg-amber-500/20 text-amber-500'}`}>
                      <i className={`fa-solid ${error.type === 'safety' ? 'fa-shield-halved' : 'fa-triangle-exclamation'} text-xl`}></i>
                    </div>
                    <div>
                      <h4 className="text-base font-mono font-bold uppercase tracking-widest text-white leading-tight">{error.message}</h4>
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Intervention Required</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {error.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF007F] mt-1.5 shrink-0"></div>
                        <p className="text-xs text-gray-300 font-light leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="px-6 py-2.5 border border-white/20 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all"
                  >
                    Dismiss Warning
                  </button>
                </div>
              </Reveal>
            )}

            {/* Strategic Roadmap Container */}
            <Reveal delayClass="reveal-delay-200">
              <div className="glass min-h-[420px] rounded-[2.5rem] p-8 sm:p-10 border-[#00F5D4]/20 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                
                {/* 1. Idle State */}
                {!result && !loading && !error && (
                  <div className="h-[380px] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-white/[0.02] shadow-[0_0_30px_rgba(0,245,212,0.1)]">
                      <i className="fa-solid fa-scroll text-3xl text-gray-500"></i>
                    </div>
                    <h4 className="text-sm font-mono font-bold uppercase tracking-[0.4em] text-gray-400 mb-2">Awaiting Manifestation</h4>
                    <p className="text-xs text-gray-600 max-w-sm font-light">Fill in your brand parameters on the left and consult the Oracle to initiate neural generation.</p>
                  </div>
                )}
                
                {/* 2. High-End Subtle Loading Skeleton (Strategic Roadmap) */}
                {loading && (
                  <div className="relative py-4 space-y-8 animate-in fade-in duration-500">
                    {/* Laser scanline traversing top to bottom */}
                    <div className="laser-scan-line"></div>

                    {/* Top Status & Phase Tracker */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        {/* High-End Concentric Orbital Spinner */}
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-2 border-[#FF007F] border-t-transparent animate-spin"></div>
                          <div className="absolute inset-1 rounded-full border-2 border-[#C084FC] border-b-transparent animate-spin-reverse"></div>
                          <div className="w-2 h-2 rounded-full bg-[#00F5D4] shadow-[0_0_8px_#00F5D4] animate-ping"></div>
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">Synthesizing Manifest</span>
                          <p className="text-[11px] font-mono text-[#00F5D4] tracking-wider mt-0.5">
                            {LOADING_PHASES[loadingPhaseIndex]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-gray-400">
                          Neural Engine 3.0
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Holographic Skeleton Blocks */}
                    <div className="space-y-3">
                      <div className="h-4 rounded-xl skeleton-neon-shimmer w-1/3 mb-2"></div>
                      <div className="h-3.5 rounded-lg skeleton-neon-shimmer w-full"></div>
                      <div className="h-3.5 rounded-lg skeleton-neon-shimmer w-11/12"></div>
                      <div className="h-3.5 rounded-lg skeleton-neon-shimmer w-4/5"></div>
                    </div>

                    {/* Section 2: Color Palette Skeleton Capsules */}
                    <div className="pt-2">
                      <div className="h-3 rounded-lg skeleton-neon-shimmer w-1/4 mb-4"></div>
                      <div className="grid grid-cols-4 gap-3 sm:gap-4">
                        <div className="h-16 rounded-2xl border border-[#FF007F]/40 bg-[#FF007F]/10 flex flex-col justify-end p-2.5 relative overflow-hidden">
                          <div className="absolute inset-0 skeleton-neon-shimmer opacity-40"></div>
                          <span className="relative z-10 text-[9px] font-mono font-bold text-[#FF007F] uppercase tracking-wider">#FF007F</span>
                        </div>
                        <div className="h-16 rounded-2xl border border-[#C084FC]/40 bg-[#C084FC]/10 flex flex-col justify-end p-2.5 relative overflow-hidden">
                          <div className="absolute inset-0 skeleton-purple-shimmer opacity-40"></div>
                          <span className="relative z-10 text-[9px] font-mono font-bold text-[#C084FC] uppercase tracking-wider">#C084FC</span>
                        </div>
                        <div className="h-16 rounded-2xl border border-[#00F5D4]/40 bg-[#00F5D4]/10 flex flex-col justify-end p-2.5 relative overflow-hidden">
                          <div className="absolute inset-0 skeleton-teal-shimmer opacity-40"></div>
                          <span className="relative z-10 text-[9px] font-mono font-bold text-[#00F5D4] uppercase tracking-wider">#00F5D4</span>
                        </div>
                        <div className="h-16 rounded-2xl border border-white/20 bg-white/5 flex flex-col justify-end p-2.5 relative overflow-hidden">
                          <div className="absolute inset-0 skeleton-neon-shimmer opacity-20"></div>
                          <span className="relative z-10 text-[9px] font-mono font-bold text-gray-300 uppercase tracking-wider">#050505</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Strategic Roadmap Timeline Nodes Skeleton */}
                    <div className="pt-2 space-y-4">
                      <div className="h-3 rounded-lg skeleton-neon-shimmer w-1/3 mb-2"></div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border border-[#00F5D4]/50 bg-[#00F5D4]/10 flex items-center justify-center shrink-0">
                          <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse"></span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded-lg skeleton-teal-shimmer w-3/4"></div>
                          <div className="h-2.5 rounded-md skeleton-teal-shimmer w-1/2"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border border-[#C084FC]/50 bg-[#C084FC]/10 flex items-center justify-center shrink-0">
                          <span className="w-2 h-2 rounded-full bg-[#C084FC] animate-pulse"></span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded-lg skeleton-purple-shimmer w-2/3"></div>
                          <div className="h-2.5 rounded-md skeleton-purple-shimmer w-2/5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Generated Result */}
                {result && !loading && (
                  <div className="animate-in fade-in duration-1000">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#00F5D4] shadow-[0_0_10px_#00F5D4]"></div>
                        <span className="text-xs font-mono uppercase font-bold tracking-widest text-[#00F5D4]">
                          Strategic Executive Roadmap
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleShareText(result, 'Strategy')} 
                          className="flex items-center gap-2 px-4 py-2 bg-[#C084FC]/15 hover:bg-[#C084FC] text-[#C084FC] hover:text-black rounded-xl transition-all text-[10px] font-mono font-bold uppercase tracking-widest border border-[#C084FC]/30 shadow-[0_0_12px_rgba(192,132,252,0.2)]"
                        >
                          <i className="fa-solid fa-share-nodes"></i> Share
                        </button>
                        <button 
                          onClick={() => handleCopyText(result, setIsCopied)} 
                          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all text-xs" 
                          title="Copy Full Manifest"
                        >
                          <i className={`fa-solid ${isCopied ? 'fa-check text-[#00F5D4]' : 'fa-copy'}`}></i>
                        </button>
                        <button 
                          onClick={() => handleDownloadText(result, 'brand-strategy')} 
                          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all text-xs" 
                          title="Download Text File"
                        >
                          <i className="fa-solid fa-download"></i>
                        </button>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed overflow-y-auto max-h-[520px] pr-4 custom-scrollbar font-light font-sans">
                      {result}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Visual Concept Image & Skeleton Loader */}
            <div className="relative">
              {/* Image Loading Skeleton */}
              {loading && (
                <div className={`rounded-[2.5rem] overflow-hidden glass border border-[#FF007F]/30 relative flex flex-col items-center justify-center p-8 ${
                  aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[9/16] max-h-[550px] mx-auto'
                }`}>
                  {/* Moving Laser scanline */}
                  <div className="laser-scan-line"></div>

                  {/* Corner High-Tech HUD Brackets */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#FF007F] opacity-80"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00F5D4] opacity-80"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00F5D4] opacity-80"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#C084FC] opacity-80"></div>

                  {/* Central Aperture Hologram */}
                  <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#FF007F] animate-spin-slow"></div>
                    <div className="absolute inset-3 rounded-full border-2 border-dashed border-[#00F5D4] animate-spin-reverse"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF007F] to-[#C084FC] flex items-center justify-center shadow-[0_0_25px_rgba(255,0,127,0.8)] animate-pulse">
                      <i className="fa-solid fa-camera-retro text-black text-sm"></i>
                    </div>
                  </div>

                  <div className="text-center z-10 space-y-2">
                    <h5 className="text-xs font-mono font-bold uppercase tracking-[0.4em] text-white">
                      Rendering Visual Concept
                    </h5>
                    <p className="text-[10px] font-mono text-[#00F5D4] tracking-widest uppercase">
                      Aspect Ratio: {aspectRatio} • Aesthetic: {imageStyle}
                    </p>
                  </div>
                </div>
              )}

              {/* Manifested Image */}
              {conceptImage && !loading && (
                <div className="rounded-[2.5rem] overflow-hidden glass border border-[#C084FC]/30 group relative animate-in zoom-in-95 duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
                  <img 
                    src={conceptImage} 
                    alt={`AI-generated visual manifestation for ${brief.name || 'Janus'} - a ${brief.vibe || ''} concept for the ${brief.industry || 'creative'} industry`} 
                    className="w-full h-auto object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-8">
                    <div>
                      <span className="text-[10px] font-mono text-[#00F5D4] uppercase tracking-widest block mb-1">Janus Visual Manifest</span>
                      <h4 className="text-lg font-serif font-black italic text-white">{brief.name || "Sovereign Brand"}</h4>
                    </div>
                    <a 
                      href={conceptImage} 
                      download={`${brief.name.replace(/\s+/g, '-').toLowerCase() || 'janus'}-manifest.png`} 
                      className="px-6 py-3 bg-gradient-to-r from-[#FF007F] to-[#C084FC] text-black font-mono font-bold uppercase tracking-widest text-[11px] rounded-full shadow-[0_0_20px_rgba(255,0,127,0.5)] hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      <i className="fa-solid fa-download text-xs"></i> Download 4K
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Strategic Insight Sidebar Component */}
      <StrategyInsightSidebar
        brief={brief}
        imageStyle={imageStyle}
        aspectRatio={aspectRatio}
        isTaskRunning={loading || voiceLoading}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onApplyVibeSuggestion={(newVibe) => {
          setBrief((prev) => ({ ...prev, vibe: newVibe }));
          triggerNeonExplosion({
            particleCount: 25,
            origin: { x: 0.8, y: 0.5 },
            intensity: 'subtle'
          });
        }}
        onApplyAudienceSuggestion={(newAudience) => {
          setBrief((prev) => ({ ...prev, targetAudience: newAudience }));
          triggerNeonExplosion({
            particleCount: 25,
            origin: { x: 0.8, y: 0.6 },
            intensity: 'subtle'
          });
        }}
        onApplyNameSuggestion={(newName) => {
          setBrief((prev) => ({ ...prev, name: newName }));
        }}
      />
    </section>
  );
};

export default AIStudio;