import React, { useState, useRef } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { generateConceptImage, generateImageAI, editImageAI } from '../services/geminiService';
import { AutoSchedulerUtility } from './AutoSchedulerUtility';
import { autoSchedulerService } from '../services/autoSchedulerService';
import { bossAudio } from '../utils/soundEffects';

interface PhotoArtworkEditorProps {
  onPublishToFeed?: (artworkData: {
    title: string;
    desc: string;
    imageUrl: string;
    author: string;
  }) => void;
}

const samplePhotos = [
  {
    id: 'photo1',
    title: 'Neon Sovereign Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    tag: 'Fashion / Editorial'
  },
  {
    id: 'photo2',
    title: 'Executive Cyber Architecture',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop',
    tag: 'Luxury Estate'
  },
  {
    id: 'photo3',
    title: 'Quantum Hologram Crystal',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    tag: '3D Abstract'
  },
  {
    id: 'photo4',
    title: 'Midnight Stage Performer',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
    tag: 'Music Video Still'
  }
];

export const PhotoArtworkEditor: React.FC<PhotoArtworkEditorProps> = ({ onPublishToFeed }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(samplePhotos[0]);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  
  // Image Adjustment Sliders
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(115);
  const [saturation, setSaturation] = useState(125);
  const [neonGlow, setNeonGlow] = useState(30);
  const [hueRotate, setHueRotate] = useState(0);
  const [blur, setBlur] = useState(0);
  
  // AI Neural Tools Processing State
  const [activeNeuralTask, setActiveNeuralTask] = useState<string | null>(null);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [upscaleLevel, setUpscaleLevel] = useState('Native 4K');
  const [signatureStamp, setSignatureStamp] = useState(true);
  
  // Text Overlay
  const [textOverlay, setTextOverlay] = useState("JANU'S CREATIONS • SOVEREIGN 2026");
  const [textColor, setTextColor] = useState('#00F5D4');
  const [fontFamily, setFontFamily] = useState('font-mono');
  
  // AI Generation & Surgical Edit State (gemini-3.1-flash-image)
  const [aiMode, setAiMode] = useState<'generate' | 'edit'>('generate');
  const [aiPrompt, setAiPrompt] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [imageSizeQuality, setImageSizeQuality] = useState<'512px' | '1K' | '2K' | '4K'>('1K');
  const [imageStylePreset, setImageStylePreset] = useState<'neon' | 'editorial' | 'cyberpunk' | 'cinematic' | 'luxury'>('neon');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStatusText, setAiStatusText] = useState<string | null>(null);

  // Auto-save & Draft State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Auto-Scheduler Modal
  const [isAutoSchedulerModalOpen, setIsAutoSchedulerModalOpen] = useState(false);
  const [scheduledConfirmation, setScheduledConfirmation] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft on mount
  React.useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('janu_photo_editor_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.brightness !== undefined) setBrightness(parsed.brightness);
        if (parsed.contrast !== undefined) setContrast(parsed.contrast);
        if (parsed.saturation !== undefined) setSaturation(parsed.saturation);
        if (parsed.neonGlow !== undefined) setNeonGlow(parsed.neonGlow);
        if (parsed.hueRotate !== undefined) setHueRotate(parsed.hueRotate);
        if (parsed.blur !== undefined) setBlur(parsed.blur);
        if (parsed.bgRemoved !== undefined) setBgRemoved(parsed.bgRemoved);
        if (parsed.upscaleLevel) setUpscaleLevel(parsed.upscaleLevel);
        if (parsed.signatureStamp !== undefined) setSignatureStamp(parsed.signatureStamp);
        if (parsed.textOverlay !== undefined) setTextOverlay(parsed.textOverlay);
        if (parsed.textColor) setTextColor(parsed.textColor);
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
        if (parsed.lastSavedTime) setLastSavedTime(parsed.lastSavedTime);
        setSaveStatus('saved');
      }
    } catch (e) {
      console.warn('Could not load photo editor draft:', e);
    }
  }, []);

  // Periodic and change-triggered auto-save
  React.useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const draftPayload = {
          brightness,
          contrast,
          saturation,
          neonGlow,
          hueRotate,
          blur,
          bgRemoved,
          upscaleLevel,
          signatureStamp,
          textOverlay,
          textColor,
          fontFamily,
          selectedPhotoId: selectedPhoto.id,
          lastSavedTime: timeFormatted
        };
        localStorage.setItem('janu_photo_editor_draft', JSON.stringify(draftPayload));
        setLastSavedTime(timeFormatted);
        setSaveStatus('saved');
      } catch (e) {
        console.warn('Photo auto-save failed:', e);
        setSaveStatus('saved');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [brightness, contrast, saturation, neonGlow, hueRotate, blur, bgRemoved, upscaleLevel, signatureStamp, textOverlay, textColor, fontFamily, selectedPhoto]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImageUrl(url);
      setSelectedPhoto({
        id: 'custom',
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: url,
        tag: 'Custom Upload'
      });
      triggerNeonExplosion({
        particleCount: 25,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'subtle'
      });
    }
  };

  const handleApplyNeuralAction = (action: string) => {
    setActiveNeuralTask(action);
    setTimeout(() => {
      if (action === 'bg-remove') {
        setBgRemoved(prev => !prev);
      } else if (action === 'neon-lighting') {
        setNeonGlow(65);
        setContrast(130);
        setSaturation(150);
      } else if (action === 'upscale') {
        setUpscaleLevel('8K Quantum Master');
      }
      setActiveNeuralTask(null);
      triggerNeonExplosion({
        particleCount: 45,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'medium'
      });
    }, 1200);
  };

  const handleGenerateAiPhoto = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiStatusText('Generating image with gemini-3.1-flash-image...');
    try {
      const res = await generateImageAI(
        aiPrompt,
        imageAspectRatio,
        imageSizeQuality,
        imageStylePreset,
        'gemini-3.1-flash-image'
      );
      if (res.imageUrl) {
        setCustomImageUrl(res.imageUrl);
        setSelectedPhoto({
          id: 'ai-gen-' + Date.now(),
          title: aiPrompt,
          url: res.imageUrl,
          tag: `Gemini 3.1 Flash Image (${imageAspectRatio})`
        });
        bossAudio.playSubtlePing();
        triggerNeonExplosion({
          particleCount: 70,
          origin: { x: 0.5, y: 0.5 },
          intensity: 'grand'
        });
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      alert(err.message || 'Image generation failed');
    } finally {
      setIsAiGenerating(false);
      setAiStatusText(null);
    }
  };

  const handleEditAiPhoto = async () => {
    if (!editInstruction.trim()) return;
    const currentImg = customImageUrl || selectedPhoto.url;
    if (!currentImg) return;

    setIsAiGenerating(true);
    setAiStatusText('Applying surgical generative edit with gemini-3.1-flash-image...');
    try {
      let base64 = currentImg;
      if (currentImg.startsWith('http')) {
        // Convert remote URL to base64 via canvas or fetch
        const resp = await fetch(currentImg);
        const blob = await resp.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const res = await editImageAI(
        editInstruction,
        base64,
        'image/png',
        'gemini-3.1-flash-image'
      );
      if (res.imageUrl) {
        setCustomImageUrl(res.imageUrl);
        setSelectedPhoto({
          id: 'ai-edit-' + Date.now(),
          title: editInstruction,
          url: res.imageUrl,
          tag: 'Gemini 3.1 Flash Image Edit'
        });
        bossAudio.playSubtlePing();
        triggerNeonExplosion({
          particleCount: 80,
          origin: { x: 0.5, y: 0.5 },
          intensity: 'grand'
        });
      }
    } catch (err: any) {
      console.error('Image edit error:', err);
      alert(err.message || 'Image editing failed');
    } finally {
      setIsAiGenerating(false);
      setAiStatusText(null);
    }
  };

  const handleResetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setNeonGlow(0);
    setHueRotate(0);
    setBlur(0);
    setBgRemoved(false);
  };

  const handlePublish = () => {
    if (onPublishToFeed) {
      onPublishToFeed({
        title: selectedPhoto.title,
        desc: textOverlay || 'Mastered high-end visual asset graded in Janu’s Photo Alchemist.',
        imageUrl: customImageUrl || selectedPhoto.url,
        author: 'You (Sovereign Creator)'
      });
    }
    triggerNeonExplosion({
      particleCount: 80,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });
  };

  return (
    <div className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 bg-black/60 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#C084FC]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C084FC] shadow-[0_0_10px_#C084FC] animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#C084FC]">
              Janu’s Photo & Artwork Alchemist
            </span>

            {/* Top-Corner Drafts Saved Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-[#C084FC]/30 text-[10px] font-mono text-gray-300 shadow-inner">
              {saveStatus === 'saving' ? (
                <>
                  <i className="fa-solid fa-arrows-rotate fa-spin text-[#C084FC] text-[9px]"></i>
                  <span className="text-[#C084FC] font-semibold">Saving Draft...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-check text-[#00F5D4] text-[9px]"></i>
                  <span className="text-gray-300 font-medium">
                    Drafts Saved {lastSavedTime ? `• ${lastSavedTime}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white">
            High-End Picture & Visual Studio
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl border border-white/20 hover:border-[#C084FC] text-xs font-mono font-bold uppercase tracking-wider text-white hover:text-[#C084FC] transition-all flex items-center gap-2 cursor-pointer bg-white/5"
          >
            <i className="fa-solid fa-image text-[#C084FC]"></i>
            <span>Upload Photo</span>
          </button>

          <button 
            onClick={() => setIsAutoSchedulerModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFE0]/20 to-[#C084FC]/20 border border-[#00FFE0]/50 hover:border-[#00FFE0] text-xs font-mono font-bold uppercase tracking-wider text-[#00FFE0] hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,255,224,0.2)]"
            title="Analyze audience engagement trends & optimal posting time"
          >
            <i className="fa-solid fa-clock-rotate-left text-xs"></i>
            <span>Auto-Scheduler</span>
          </button>
          
          <button 
            onClick={handlePublish}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C084FC] via-[#818CF8] to-[#00F5D4] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(192,132,252,0.4)] flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-cloud-arrow-up"></i>
            <span>Publish Artwork</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Canvas Stage (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Main Photo Canvas Container */}
          <div className="relative w-full max-w-[520px] aspect-square rounded-[2rem] overflow-hidden border-2 border-white/20 bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center">
            
            {/* Background Checker if BG is removed */}
            {bgRemoved && (
              <div className="absolute inset-0 bg-[linear-gradient(45deg,#151515_25%,transparent_25%),linear-gradient(-45deg,#151515_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151515_75%),linear-gradient(-45deg,transparent_75%,#151515_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]"></div>
            )}

            {/* Rendered Visual Image */}
            <img 
              src={customImageUrl || selectedPhoto.url} 
              alt={selectedPhoto.title}
              className={`w-full h-full object-cover transition-all duration-200 ${bgRemoved ? 'drop-shadow-[0_0_25px_rgba(0,245,212,0.8)]' : ''}`}
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) blur(${blur}px) drop-shadow(0 0 ${neonGlow}px rgba(192,132,252,0.7))`
              }}
            />

            {/* Neural Task Loading Overlay */}
            {activeNeuralTask && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30 animate-in fade-in">
                <i className="fa-solid fa-wand-magic-sparkles text-4xl text-[#00F5D4] animate-spin"></i>
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#00F5D4]">
                  Processing Neural {activeNeuralTask.toUpperCase()}...
                </p>
              </div>
            )}

            {/* Text Overlay on Canvas */}
            {textOverlay && (
              <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none text-center">
                <p 
                  className={`text-sm sm:text-base font-bold tracking-widest uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,1)] ${fontFamily}`}
                  style={{ color: textColor }}
                >
                  {textOverlay}
                </p>
              </div>
            )}

            {/* Janu Signature Stamp */}
            {signatureStamp && (
              <div className="absolute top-5 right-5 z-20 pointer-events-none px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#C084FC]/50 text-[#C084FC] text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(192,132,252,0.4)]">
                <i className="fa-solid fa-crown text-[8px] text-[#00F5D4]"></i>
                <span>Janu's Creations Certified</span>
              </div>
            )}

            {/* Upscale Tag */}
            <div className="absolute top-5 left-5 z-20 pointer-events-none px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[8px] font-mono">
              {upscaleLevel}
            </div>
          </div>

          {/* Quick Neural Action Bar */}
          <div className="w-full max-w-[520px] mt-6 grid grid-cols-3 gap-3">
            <button
              onClick={() => handleApplyNeuralAction('neon-lighting')}
              disabled={activeNeuralTask !== null}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C084FC] text-center transition-all group cursor-pointer hover:bg-[#C084FC]/10"
            >
              <i className="fa-solid fa-bolt text-[#C084FC] mb-1 block group-hover:scale-110 transition-transform"></i>
              <span className="text-[10px] font-mono font-bold text-white uppercase block">AI Neon Grade</span>
            </button>

            <button
              onClick={() => handleApplyNeuralAction('bg-remove')}
              disabled={activeNeuralTask !== null}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F5D4] text-center transition-all group cursor-pointer hover:bg-[#00F5D4]/10"
            >
              <i className="fa-solid fa-scissors text-[#00F5D4] mb-1 block group-hover:scale-110 transition-transform"></i>
              <span className="text-[10px] font-mono font-bold text-white uppercase block">
                {bgRemoved ? 'Restore BG' : 'AI Remove BG'}
              </span>
            </button>

            <button
              onClick={() => handleApplyNeuralAction('upscale')}
              disabled={activeNeuralTask !== null}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D8B4FE] text-center transition-all group cursor-pointer hover:bg-[#D8B4FE]/10"
            >
              <i className="fa-solid fa-arrows-up-to-line text-[#D8B4FE] mb-1 block group-hover:scale-110 transition-transform"></i>
              <span className="text-[10px] font-mono font-bold text-white uppercase block">AI 8K Upscale</span>
            </button>
          </div>
        </div>

        {/* Right: Fine-Tuning Controls & AI Synthesizer (5 Cols) */}
        <div className="lg:col-span-5 bg-white/[0.03] p-6 rounded-3xl border border-white/10 space-y-6">
          
          {/* Preset Photos */}
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-3">
              Sample Visual Assets
            </p>
            <div className="grid grid-cols-4 gap-2">
              {samplePhotos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setCustomImageUrl(null);
                  }}
                  className={`aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    selectedPhoto.id === photo.id && !customImageUrl 
                      ? 'border-[#C084FC] scale-105 shadow-[0_0_15px_rgba(192,132,252,0.4)]' 
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Color & Lighting Sliders */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">Color Grading</span>
              <button 
                onClick={handleResetFilters}
                className="text-[9px] font-mono text-gray-400 hover:text-white cursor-pointer uppercase"
              >
                Reset
              </button>
            </div>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                <span>Brightness</span>
                <span>{brightness}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="180" 
                value={brightness} 
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[#C084FC] cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                <span>Contrast</span>
                <span>{contrast}%</span>
              </div>
              <input 
                type="range" 
                min="60" 
                max="200" 
                value={contrast} 
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-[#00F5D4] cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                <span>Saturation</span>
                <span>{saturation}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="250" 
                value={saturation} 
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-[#D8B4FE] cursor-pointer"
              />
            </div>

            {/* Neon Aura Glow */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                <span>Neon Aura Glow</span>
                <span>{neonGlow}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="60" 
                value={neonGlow} 
                onChange={(e) => setNeonGlow(Number(e.target.value))}
                className="w-full accent-[#C084FC] cursor-pointer"
              />
            </div>
          </div>

          {/* Text Overlay & Typography */}
          <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white block">
              Typography & Watermark
            </span>
            <input 
              type="text" 
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="Enter overlay text..."
              className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
            />
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {['#00F5D4', '#C084FC', '#FFFFFF', '#FCD34D'].map(color => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className="w-6 h-6 rounded-full border border-white/20 cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <button 
                onClick={() => setSignatureStamp(!signatureStamp)}
                className={`px-3 py-1 rounded-xl text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  signatureStamp ? 'bg-[#C084FC] text-black font-black' : 'bg-white/10 text-gray-400'
                }`}
              >
                Signature Stamp: {signatureStamp ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* AI Image Generation & Surgical Edit (gemini-3.1-flash-image) */}
          <div className="space-y-3 p-4 rounded-2xl bg-black/60 border border-[#00F5D4]/40 shadow-[0_0_20px_rgba(0,245,212,0.15)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-xs text-[#00F5D4] animate-pulse"></i>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00F5D4]">
                  Gemini 3.1 Flash Image Alchemist
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-[8px] font-mono font-bold">
                gemini-3.1-flash-image
              </span>
            </div>

            {/* Mode Switcher: Create New vs Edit Current */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/80 border border-white/10">
              <button
                type="button"
                onClick={() => setAiMode('generate')}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  aiMode === 'generate'
                    ? 'bg-[#00F5D4] text-black shadow-[0_0_10px_rgba(0,245,212,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-plus text-[9px]"></i>
                <span>Create Image</span>
              </button>
              <button
                type="button"
                onClick={() => setAiMode('edit')}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  aiMode === 'edit'
                    ? 'bg-[#C084FC] text-black shadow-[0_0_10px_rgba(192,132,252,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-pen-nib text-[9px]"></i>
                <span>Surgical Edit</span>
              </button>
            </div>

            {aiMode === 'generate' ? (
              <div className="space-y-2.5">
                {/* Aspect Ratio and Size Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-mono text-gray-400 block mb-1">Aspect Ratio</label>
                    <select
                      value={imageAspectRatio}
                      onChange={(e) => setImageAspectRatio(e.target.value as any)}
                      className="w-full bg-black/80 border border-white/10 rounded-lg p-1.5 text-[10px] font-mono text-white outline-none focus:border-[#00F5D4]"
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Vertical Reel</option>
                      <option value="4:3">4:3 Standard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-gray-400 block mb-1">Render Quality</label>
                    <select
                      value={imageSizeQuality}
                      onChange={(e) => setImageSizeQuality(e.target.value as any)}
                      className="w-full bg-black/80 border border-white/10 rounded-lg p-1.5 text-[10px] font-mono text-white outline-none focus:border-[#00F5D4]"
                    >
                      <option value="1K">1K High-Res</option>
                      <option value="2K">2K Ultra HD</option>
                      <option value="4K">4K Studio Master</option>
                      <option value="512px">512px Fast Draft</option>
                    </select>
                  </div>
                </div>

                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe artwork (e.g., Luxury sovereign fashion model in cyberpunk neon street, reflection puddles, volumetric smoke)..."
                  rows={2}
                  className="w-full bg-black/80 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
                />

                <button
                  onClick={handleGenerateAiPhoto}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(0,245,212,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAiGenerating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                  <span>{isAiGenerating ? (aiStatusText || 'Manifesting Pixels...') : 'Generate Image (Flash Image)'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[10px] font-mono text-gray-400">
                  Direct instruction for modifying the current photo canvas using <strong className="text-[#C084FC]">gemini-3.1-flash-image</strong>:
                </p>
                <textarea 
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder="E.g., Add glowing neon sunglasses, change background to Tokyo sunset, add cinematic golden hour flares..."
                  rows={2}
                  className="w-full bg-black/80 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#C084FC] outline-none"
                />

                <button
                  onClick={handleEditAiPhoto}
                  disabled={isAiGenerating || !editInstruction.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C084FC] to-[#FF007F] text-white font-mono text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(192,132,252,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAiGenerating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-sliders"></i>}
                  <span>{isAiGenerating ? (aiStatusText || 'Modifying Pixels...') : 'Apply Generative Edit'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Auto-Scheduler Audience Peak Card */}
          {(() => {
            const topSlot = autoSchedulerService.getOptimalSlotRecommendations('photo')[0];
            return (
              <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-[#00FFE0]/15 via-[#C084FC]/10 to-black/60 border border-[#00FFE0]/30 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-bolt text-[#00FFE0] text-xs animate-pulse"></i>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                      Audience Engagement Peak
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#00FFE0]/20 text-[#00FFE0] text-[9px] font-mono font-bold">
                    +{topSlot ? topSlot.viralMultiplier : '142%'} Reach
                  </span>
                </div>

                <p className="text-[11px] font-mono text-gray-300">
                  Recommended Slot: <strong className="text-[#00FFE0]">{topSlot ? `${topSlot.dayName} at ${topSlot.timeSlotFormatted}` : 'Sunday at 4:30 PM EST'}</strong>
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (topSlot) {
                        autoSchedulerService.scheduleMedia({
                          contentType: 'photo',
                          title: textOverlay || selectedPhoto.title,
                          previewUrl: customImageUrl || selectedPhoto.url,
                          scheduledDay: topSlot.dayName,
                          scheduledTime: topSlot.timeSlotFormatted,
                          reason: topSlot.reason,
                          engagementScore: topSlot.score
                        });
                        bossAudio.playAutoSchedulerQueue();
                        triggerNeonExplosion();
                        setScheduledConfirmation(`Queued for ${topSlot.dayName} at ${topSlot.timeSlotFormatted}!`);
                        setTimeout(() => setScheduledConfirmation(null), 6000);
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#00FFE0] hover:bg-[#38BDF8] text-black font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,255,224,0.3)] cursor-pointer"
                  >
                    <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                    <span>One-Click Queue</span>
                  </button>

                  <button
                    onClick={() => setIsAutoSchedulerModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer"
                  >
                    <i className="fa-solid fa-chart-line text-xs text-[#C084FC]"></i>
                    <span>Trend Intel</span>
                  </button>
                </div>

                {scheduledConfirmation && (
                  <div className="p-2.5 rounded-xl bg-[#00FFE0]/15 border border-[#00FFE0]/40 text-[#00FFE0] text-[10px] font-mono text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>{scheduledConfirmation}</span>
                  </div>
                )}
              </div>
            );
          })()}

        </div>

      </div>

      {/* Auto-Scheduler Modal Utility */}
      <AutoSchedulerUtility
        isOpen={isAutoSchedulerModalOpen}
        onClose={() => setIsAutoSchedulerModalOpen(false)}
        contentType="photo"
        mediaTitle={textOverlay || selectedPhoto.title}
        mediaPreviewUrl={customImageUrl || selectedPhoto.url}
        onScheduleSuccess={(item) => {
          setScheduledConfirmation(`Artwork scheduled for ${item.scheduledDay} at ${item.scheduledTime}!`);
          setTimeout(() => setScheduledConfirmation(null), 6000);
        }}
      />
    </div>
  );
};

export default PhotoArtworkEditor;
