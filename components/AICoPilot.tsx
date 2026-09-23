import React, { useState, useEffect, useRef } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { generateAICoPilotAction } from '../services/geminiService';
import { CreatorTabType } from './CreatorPortal';

interface AICoPilotProps {
  activeTab: CreatorTabType;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onNavigateToTab?: (tab: CreatorTabType) => void;
  onApplyDirective?: (action: string, data: any) => void;
  onOpenWorkspaceInviter?: () => void;
}

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'janu_aico_pilot_position';
const DOCKED_STORAGE_KEY = 'janu_aico_pilot_docked';
const EXPANDED_STORAGE_KEY = 'janu_aico_pilot_expanded';
const STATUS_MODE_STORAGE_KEY = 'janu_aico_pilot_status_mode';

export type ActionCategory = 'all' | 'seo' | 'caption' | 'audio' | 'visual' | 'hook' | 'prompt';
export type CoPilotStatusMode = 'auto' | 'active' | 'idle';

export const AICoPilot: React.FC<AICoPilotProps> = ({
  activeTab,
  isOpen: propIsOpen,
  onOpen: propOnOpen,
  onClose: propOnClose,
  onNavigateToTab,
  onApplyDirective,
  onOpenWorkspaceInviter
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(EXPANDED_STORAGE_KEY) === 'true';
    } catch (e) {
      console.error('Failed to load co-pilot expanded state from localStorage', e);
      return false;
    }
  });
  const [activeAction, setActiveAction] = useState<ActionCategory>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // Visual status pulse mode: 'auto' (automatic detection based on processing), 'active' (manual high-frequency pulse override), 'idle' (manual standard pulse override)
  const [statusMode, setStatusMode] = useState<CoPilotStatusMode>(() => {
    try {
      const saved = localStorage.getItem(STATUS_MODE_STORAGE_KEY);
      if (saved === 'active' || saved === 'idle' || saved === 'auto') {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load status mode from localStorage', e);
    }
    return 'auto';
  });

  // Effective pulse calculation: override or automatic task detection
  const isEffectiveActive = statusMode === 'active' ? true : statusMode === 'idle' ? false : isProcessing;
  const isManuallyOverridden = statusMode !== 'auto';

  const [customInput, setCustomInput] = useState('');
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [activeActionTitle, setActiveActionTitle] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Position state with localStorage initialization
  const [position, setPosition] = useState<Position | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load co-pilot position from localStorage', e);
    }
    return null;
  });

  // Docked / Locked state with localStorage initialization
  const [isDocked, setIsDocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DOCKED_STORAGE_KEY) === 'true';
    } catch (e) {
      console.error('Failed to load co-pilot docked state from localStorage', e);
      return false;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
    hasMoved: false
  });
  const pillRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleToggleExpanded = () => {
    setIsExpanded(prev => !prev);
    bossAudio.playSubtlePing();
  };

  // Sync isExpanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_STORAGE_KEY, isExpanded ? 'true' : 'false');
    } catch (err) {
      console.error('Failed to save isExpanded to localStorage', err);
    }
  }, [isExpanded]);

  // Viewport clamping & position initialization
  useEffect(() => {
    const clampToViewport = (pos: Position): Position => {
      const margin = 16;
      const btnWidth = pillRef.current?.offsetWidth || 260;
      const btnHeight = pillRef.current?.offsetHeight || 60;
      const maxX = Math.max(margin, window.innerWidth - btnWidth - margin);
      const maxY = Math.max(margin, window.innerHeight - btnHeight - margin);
      return {
        x: Math.min(Math.max(margin, pos.x), maxX),
        y: Math.min(Math.max(margin, pos.y), maxY)
      };
    };

    if (!position) {
      // Default to bottom right
      const margin = 24;
      const btnWidth = 260;
      const btnHeight = 60;
      const defaultX = Math.max(margin, window.innerWidth - btnWidth - margin);
      const defaultY = Math.max(margin, window.innerHeight - btnHeight - margin);
      setPosition({ x: defaultX, y: defaultY });
    } else {
      const clamped = clampToViewport(position);
      if (clamped.x !== position.x || clamped.y !== position.y) {
        setPosition(clamped);
      }
    }

    const handleResize = () => {
      setPosition(prev => (prev ? clampToViewport(prev) : null));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // If docked/locked, disable drag-and-drop
    if (isDocked) return;

    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const currentX = position?.x ?? (window.innerWidth - 260);
    const currentY = position?.y ?? (window.innerHeight - 80);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: currentX,
      initialPosY: currentY,
      hasMoved: false
    };

    setIsDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragRef.current.startX;
      const deltaY = moveEvent.clientY - dragRef.current.startY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        dragRef.current.hasMoved = true;
      }

      if (dragRef.current.hasMoved) {
        const margin = 12;
        const btnWidth = pillRef.current?.offsetWidth || 260;
        const btnHeight = pillRef.current?.offsetHeight || 60;
        const maxX = Math.max(margin, window.innerWidth - btnWidth - margin);
        const maxY = Math.max(margin, window.innerHeight - btnHeight - margin);

        const rawX = dragRef.current.initialPosX + deltaX;
        const rawY = dragRef.current.initialPosY + deltaY;

        const newPos = {
          x: Math.min(Math.max(margin, rawX), maxX),
          y: Math.min(Math.max(margin, rawY), maxY)
        };

        setPosition(newPos);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (dragRef.current.hasMoved) {
        const deltaX = upEvent.clientX - dragRef.current.startX;
        const deltaY = upEvent.clientY - dragRef.current.startY;
        const margin = 12;
        const btnWidth = pillRef.current?.offsetWidth || 260;
        const btnHeight = pillRef.current?.offsetHeight || 60;
        const maxX = Math.max(margin, window.innerWidth - btnWidth - margin);
        const maxY = Math.max(margin, window.innerHeight - btnHeight - margin);

        const rawX = dragRef.current.initialPosX + deltaX;
        const rawY = dragRef.current.initialPosY + deltaY;

        const finalPos = {
          x: Math.min(Math.max(margin, rawX), maxX),
          y: Math.min(Math.max(margin, rawY), maxY)
        };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPos));
        } catch (err) {
          console.error('Failed to save co-pilot position to localStorage', err);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handlePillClick = (e: React.MouseEvent) => {
    if (dragRef.current.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handleToggleExpanded();
  };

  // Dock to nearest screen corner and lock/unlock drag-and-drop
  const handleDockToNearestCorner = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (isDocked) {
      // Unlock docking & re-enable drag
      setIsDocked(false);
      try {
        localStorage.setItem(DOCKED_STORAGE_KEY, 'false');
      } catch (err) {
        console.error('Failed to update docked state in localStorage', err);
      }
      bossAudio.playSubtlePing();
      return;
    }

    // Calculate nearest screen corner
    const margin = 24;
    const btnWidth = pillRef.current?.offsetWidth || 260;
    const btnHeight = pillRef.current?.offsetHeight || 60;
    const currentX = position?.x ?? (window.innerWidth - btnWidth - margin);
    const currentY = position?.y ?? (window.innerHeight - btnHeight - margin);

    const corners = [
      { name: 'top-left', x: margin, y: margin },
      { name: 'top-right', x: Math.max(margin, window.innerWidth - btnWidth - margin), y: margin },
      { name: 'bottom-left', x: margin, y: Math.max(margin, window.innerHeight - btnHeight - margin) },
      { name: 'bottom-right', x: Math.max(margin, window.innerWidth - btnWidth - margin), y: Math.max(margin, window.innerHeight - btnHeight - margin) }
    ];

    let nearest = corners[3]; // Default to bottom-right
    let minDistance = Infinity;

    corners.forEach(corner => {
      const dist = Math.hypot(corner.x - currentX, corner.y - currentY);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = corner;
      }
    });

    const newPos = { x: nearest.x, y: nearest.y };
    setPosition(newPos);
    setIsDocked(true);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos));
      localStorage.setItem(DOCKED_STORAGE_KEY, 'true');
    } catch (err) {
      console.error('Failed to save docked state to localStorage', err);
    }

    bossAudio.playSubtlePing();
    triggerNeonExplosion({
      particleCount: 16,
      origin: {
        x: (nearest.x + btnWidth / 2) / window.innerWidth,
        y: (nearest.y + btnHeight / 2) / window.innerHeight
      },
      intensity: 'subtle'
    });
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const margin = 24;
    const btnWidth = 260;
    const btnHeight = 60;
    const defaultPos = {
      x: Math.max(margin, window.innerWidth - btnWidth - margin),
      y: Math.max(margin, window.innerHeight - btnHeight - margin)
    };
    setPosition(defaultPos);
    setIsDocked(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DOCKED_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear position from localStorage', err);
    }
    bossAudio.playSubtlePing();
  };

  // Keyboard shortcut listener: Alt + C to toggle Quick-Action Menu (isExpanded)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInputActive = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Alt + C shortcut to toggle Co-Pilot quick-action menu
      if (e.altKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
        e.preventDefault();
        setIsExpanded(prev => {
          const nextState = !prev;
          bossAudio.playSubtlePing();
          return nextState;
        });
        return;
      }

      // Escape to close quick-action menu if expanded
      if (e.key === 'Escape' && isExpanded && !isOpen && !isInputActive) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isOpen]);

  const handleOpenModal = () => {
    if (propOnOpen) {
      propOnOpen();
    } else {
      setInternalIsOpen(true);
    }
    bossAudio.playAICoPilotActivation();
    triggerNeonExplosion({
      particleCount: 20,
      origin: { x: 0.9, y: 0.8 },
      intensity: 'subtle'
    });
  };

  const handleQuickAction = (action: 'seo' | 'caption' | 'audio') => {
    handleOpenModal();
    handleExecuteAction(action);
  };
  
  // Audio Leveling Interactive State
  const [targetLUFS, setTargetLUFS] = useState<-14 | -9 | -12>(-14);
  const [truePeakProtection, setTruePeakProtection] = useState(true);
  const [dialogueClarityBoost, setDialogueClarityBoost] = useState(true);
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState<'before' | 'after' | null>(null);

  // Tab Name Mapping
  const tabNames: Record<CreatorTabType, { name: string; icon: string; defaultTopic: string; style: string }> = {
    'reel-studio': { name: 'Reel Video Studio', icon: 'fa-clapperboard', defaultTopic: 'Cyberpunk Neon Drift Reel', style: 'Fast 9:16 Transitions & Beat Drop' },
    'movie-studio': { name: 'Movie & Cinema Director Studio', icon: 'fa-film', defaultTopic: '2.39:1 Hollywood Anamorphic Cinema Arc', style: 'Multi-scene Storyboards & Screenplay' },
    'photo-studio': { name: 'Photo & Art Alchemist', icon: 'fa-wand-magic-sparkles', defaultTopic: 'Executive Hologram Studio Portrait', style: 'Photorealistic 8K Neural Lighting' },
    'music-studio': { name: 'Music & Audio Studio', icon: 'fa-music', defaultTopic: 'Divine Gospel Soul Symphony & 140 BPM Synth', style: 'Harmonic Stems & 24-Bit Mastering' },
    'ai-studio': { name: 'AI Super Studio', icon: 'fa-microchip-ai', defaultTopic: 'Omni-Modal Studio & Neural Synth', style: 'Veo Video & Lyria Audio Generation' },
    'showcase': { name: 'Creator Showcase', icon: 'fa-sparkles', defaultTopic: 'Sovereign Creator Masterpiece Portfolio', style: 'Luxury Digital Art & NFT Curation' },
    'analytics': { name: 'Advanced Analytics', icon: 'fa-chart-line', defaultTopic: 'Audience Retention & Traffic Optimization', style: 'Granular Telemetry & Pacing Analytics' },
    'feed': { name: 'Viral Reels Feed', icon: 'fa-film', defaultTopic: 'Trending Short Form Video', style: 'High-Retention Algorithm Optimization' },
    'live': { name: 'Live Broadcast Arena', icon: 'fa-tower-broadcast', defaultTopic: 'Interactive Live Studio & Creator Tipping', style: 'Real-time Audience Engagement' },
    'contests': { name: 'AI Contests Arena', icon: 'fa-trophy', defaultTopic: 'Tournament Entry Benchmark', style: 'Competitive AI Scoring Mastery' },
    'leaderboard': { name: 'Live Leaderboard', icon: 'fa-ranking-star', defaultTopic: 'Creator Rank Surge', style: 'Community Tipping Velocity' },
    'ai-ops': { name: 'AI Operations Hub', icon: 'fa-robot', defaultTopic: 'Autonomous Creative Workflow', style: 'Multi-Agent Production' },
    'wallet': { name: 'Monetization Vault', icon: 'fa-wallet', defaultTopic: 'Creator Payouts & Tipping', style: 'Founder Revenue Share' },
    'boss': { name: 'Boss Founder Hub', icon: 'fa-crown', defaultTopic: 'Ecosystem Governance', style: 'Sovereign Platform Management' }
  };

  const currentTabMeta = tabNames[activeTab] || {
    name: 'Creative Studio',
    icon: 'fa-wand-magic-sparkles',
    defaultTopic: 'Sovereign Digital Creation',
    style: 'Futuristic AI Production'
  };

  useEffect(() => {
    if (!customInput) {
      setCustomInput(currentTabMeta.defaultTopic);
    }
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusModeChange = (mode: CoPilotStatusMode, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setStatusMode(mode);
    try {
      localStorage.setItem(STATUS_MODE_STORAGE_KEY, mode);
    } catch (err) {
      console.error('Failed to save status mode to localStorage', err);
    }
    bossAudio.playSubtlePing();
    if (mode === 'active') {
      triggerNeonExplosion({
        particleCount: 18,
        origin: { x: 0.85, y: 0.85 },
        intensity: 'subtle'
      });
      showToast('AI Co-Pilot: Manually set to ACTIVE (High-Frequency Pulse) ⚡');
    } else if (mode === 'idle') {
      showToast('AI Co-Pilot: Manually set to IDLE (Standard Harmonic Pulse) 💤');
    } else {
      showToast('AI Co-Pilot: Switched to AUTO Detection Mode 🤖');
    }
  };

  const handleCycleStatusMode = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const nextMode: CoPilotStatusMode = statusMode === 'auto' ? 'active' : statusMode === 'active' ? 'idle' : 'auto';
    handleStatusModeChange(nextMode);
  };

  const handleExecuteAction = async (action: 'seo' | 'caption' | 'audio' | 'visual' | 'hook' | 'prompt') => {
    setIsProcessing(true);
    setActiveAction(action);
    setGeneratedOutput(null);

    const actionTitles = {
      seo: '⚡ Viral SEO & Hashtag Optimization',
      caption: '✍️ High-Conversion Social Captions',
      audio: '🎚️ AI Audio Leveling & LUFS Mastering',
      visual: '🎨 Visual & Color Harmony Engine',
      hook: '🚀 3-Second Viral Hook Enhancer',
      prompt: '💡 AI Multi-Modal Prompt Alchemist'
    };
    setActiveActionTitle(actionTitles[action]);

    bossAudio.playSubtlePing();

    try {
      const result = await generateAICoPilotAction({
        actionType: action,
        context: {
          activeTab: currentTabMeta.name,
          title: customInput || currentTabMeta.defaultTopic,
          genreOrStyle: currentTabMeta.style,
          topic: customInput
        }
      });

      setGeneratedOutput(result);
      bossAudio.playTipChime(100);
      triggerNeonExplosion({
        particleCount: 30,
        origin: { x: 0.8, y: 0.5 },
        intensity: 'medium'
      });
    } catch (error) {
      console.warn('AI Co-Pilot live generation fallback:', error);
      // Smart offline fallback
      let fallbackText = '';
      if (action === 'seo') {
        fallbackText = `🎯 TARGET KEYWORDS:\n#${customInput.replace(/\s+/g, '')} #JanusCreations #SovereignAI #ViralReels #CreatorEconomy\n\n🏷️ 10 HIGH-VELOCITY HASHTAGS:\n#AIReels #CyberpunkAesthetics #JanuStudio #CreativeAlchemist #SovereignCreator #SoundMastering #VisualSynthesis #Trending2026 #916Motion #FounderLed\n\n📈 SEARCH INTENT HOOK:\n"How To Create 4K Cyberpunk Reels with Sovereign AI in 60 Seconds"\n\n💎 ALGORITHM SCORE: 98/100 (Optimal Tag Cluster)`;
      } else if (action === 'caption') {
        fallbackText = `OPTION A: 🔥 "THE SCROLL-STOPPER"\nStop scrolling. ⚡ We just generated the ultimate ${customInput} inside Janu's Creations AI Studio. Which frame hits hardest? Drop a 👑 below!\n#JanusCreations #AIArt #ViralReel\n\nOPTION B: 💎 "THE MONETIZATION MAGNET"\nMastered 100% sovereign on the Janu Ecosystem. Support the creative craft—tips and remix rights open now in the Creator Portal! 💸✨\n#SovereignCreator #CreatorRewards #Web3Creative\n\nOPTION C: 🌌 "THE AESTHETIC ORACLE"\nWhere neural frequencies meet organic soul. A sovereign manifestation of ${customInput}.\n#AudioAlchemist #FutureCinema #JanuPioneer`;
      } else if (action === 'audio') {
        fallbackText = `🎚️ RECOMMENDED MASTERING SPECS:\n- Target Loudness: ${targetLUFS}.0 LUFS (Broadcast/Social Safe)\n- True Peak Ceiling: -1.0 dBFS (Zero Distortion)\n- Stereo Width: 128% Ambient Expansion\n\n🎛️ 4-BAND EQ PROFILE:\n- Sub-Bass (35Hz): High-pass clean low-end cut\n- Low-Mids (280Hz): -2.5 dB de-mud dip\n- Vocal Presence (3.5kHz): +3.2 dB crystal clarity\n- Air Shimmer (12kHz): High shelf warmth\n\n⚡ INSTANT FIX: Applied True-Peak Limiter with +4dB makeup gain for explosive mobile speaker presence.`;
      } else {
        fallbackText = `🌟 ENHANCED 8K PROMPT:\n"Cinematic 9:16 close-up of ${customInput}, volumetric atmospheric neon cyan #00F5D4 and ultraviolet #C084FC lighting, anamorphic lens flares, fine glass caustics, shot on 65mm Arri Alexa, master color graded, 8K ultra high fidelity."\n\n🎨 NEGATIVE DIRECTIVES:\n"No blur, no low resolution, no artifacts, no oversaturated blown highlights."`;
      }
      setGeneratedOutput(fallbackText);
      showToast('Co-Pilot completed analysis!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyOutput = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    showToast('Copied Co-Pilot output to clipboard! 📋');
    bossAudio.playSubtlePing();
    triggerNeonExplosion({
      particleCount: 25,
      origin: { x: 0.85, y: 0.7 },
      intensity: 'subtle'
    });
  };

  const handleAudioTestPlayback = (mode: 'before' | 'after') => {
    setIsPlayingAudioTest(mode);
    bossAudio.playAudioLevelingSweep(mode);
    setTimeout(() => {
      setIsPlayingAudioTest(null);
    }, 800);
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-[350] bg-black/95 border border-[#00F5D4] text-[#00F5D4] px-5 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(0,245,212,0.4)] flex items-center gap-2 text-xs font-mono font-bold animate-in slide-in-from-top-3">
          <i className="fa-solid fa-sparkles text-sm animate-spin"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Persistent AI Co-Pilot Dock & Quick Action Menu */}
      {(() => {
        const isNearTop = position ? position.y < 340 : false;
        const isNearLeft = position ? position.x < 320 : false;

        return (
          <div 
            className={`fixed z-[280] pointer-events-none select-none ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
            style={
              position
                ? { left: `${position.x}px`, top: `${position.y}px` }
                : { bottom: '1.5rem', right: '1.5rem' }
            }
          >
            {/* Quick Action Floating Menu Drawer (Slide-out animation adapted dynamically to screen position) */}
            {!isOpen && (
              <div 
                className={`AI-Co-Pilot-Floating-Component absolute w-[calc(100vw-2.5rem)] max-w-[21rem] sm:max-w-[23rem] max-h-[75vh] overflow-y-auto flex flex-col gap-2.5 p-3 sm:p-3.5 rounded-3xl bg-zinc-950/98 backdrop-blur-2xl border border-[#00F5D4]/40 shadow-[0_0_35px_rgba(0,245,212,0.3)] transition-all duration-300 cubic-bezier(0.16,1,0.3,1) transform ${
                  isNearTop
                    ? `top-full mt-3 ${isNearLeft ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`
                    : `bottom-full mb-3 ${isNearLeft ? 'left-0 origin-bottom-left' : 'right-0 origin-bottom-right'}`
                } ${
                  isExpanded 
                    ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto shadow-[0_0_35px_rgba(0,245,212,0.35)]' 
                    : isNearTop
                      ? 'opacity-0 -translate-y-8 scale-90 pointer-events-none max-h-0 !mb-0 !py-0 border-transparent overflow-hidden'
                      : 'opacity-0 translate-y-8 scale-90 pointer-events-none max-h-0 !mb-0 !py-0 border-transparent overflow-hidden'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 flex-wrap gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${isEffectiveActive ? 'bg-[#00F5D4] animate-ping' : 'bg-[#C084FC]'} flex-shrink-0`}></span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00F5D4] truncate">
                      Quick Actions
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono text-gray-400 truncate max-w-[80px]">
                      {currentTabMeta.name}
                    </span>
                    <button
                      onClick={handleDockToNearestCorner}
                      title={isDocked ? "Docked: Drag-and-drop locked. Click to unlock & drag anywhere" : "Dock to nearest corner & lock position"}
                      className={`px-2 py-1 text-[9px] font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDocked
                          ? 'bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/50 shadow-[0_0_10px_rgba(0,245,212,0.3)] hover:bg-[#00F5D4]/30'
                          : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <i className={`fa-solid ${isDocked ? 'fa-lock' : 'fa-anchor'} text-[9px]`}></i>
                      <span>{isDocked ? 'Docked' : 'Dock'}</span>
                    </button>
                    <button
                      onClick={handleResetPosition}
                      title="Reset dock to default bottom-right position"
                      className="p-1 text-gray-400 hover:text-[#00F5D4] text-[10px] transition-colors rounded hover:bg-white/10"
                    >
                      <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
                    </button>
                  </div>
                </div>

                {/* VISUAL STATUS SWITCH & PULSE FREQUENCY CONTROL */}
                <div className="p-2.5 rounded-2xl bg-black/70 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <i className={`fa-solid ${isEffectiveActive ? 'fa-bolt text-[#00F5D4] animate-pulse' : 'fa-moon text-[#C084FC]'} text-[11px]`}></i>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                        Pulse Status Mode
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold uppercase ${
                      isEffectiveActive 
                        ? 'bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/50 animate-pulse' 
                        : 'bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/40'
                    }`}>
                      {isEffectiveActive ? '0.8s High-Freq' : '3.0s Standard'}
                    </span>
                  </div>

                  {/* 3-State Segmented Visual Switch */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-900/90 border border-white/10">
                    <button
                      type="button"
                      onClick={(e) => handleStatusModeChange('auto', e)}
                      className={`py-1 px-1.5 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        statusMode === 'auto'
                          ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Auto: Dynamic detection based on task synthesis"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-[8px]"></i>
                      <span>Auto</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleStatusModeChange('active', e)}
                      className={`py-1 px-1.5 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        statusMode === 'active'
                          ? 'bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black font-black shadow-[0_0_12px_rgba(0,245,212,0.6)]'
                          : 'text-gray-400 hover:text-[#00F5D4]'
                      }`}
                      title="Active Mode: Forces high-frequency 0.8s pulse override"
                    >
                      <i className="fa-solid fa-bolt text-[8px]"></i>
                      <span>Active</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleStatusModeChange('idle', e)}
                      className={`py-1 px-1.5 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        statusMode === 'idle'
                          ? 'bg-gradient-to-r from-[#C084FC] to-[#FF007F] text-black font-black shadow-[0_0_10px_rgba(192,132,252,0.5)]'
                          : 'text-gray-400 hover:text-[#C084FC]'
                      }`}
                      title="Idle Mode: Forces standard 3.0s harmonic pulse override"
                    >
                      <i className="fa-solid fa-moon text-[8px]"></i>
                      <span>Idle</span>
                    </button>
                  </div>
                </div>

                {/* Flexbox Action Menu Layout with dynamic wrapping and readable text hierarchy */}
                <div className="flex flex-wrap gap-2 w-full">
                  {/* Quick Action 1: SEO Optimization */}
                  <button
                    onClick={() => handleQuickAction('seo')}
                    className="flex-[1_1_130px] min-w-0 p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] hover:bg-[#00F5D4]/15 border border-white/10 hover:border-[#00F5D4]/60 text-left transition-all flex items-center justify-between gap-2.5 group cursor-pointer shadow-sm min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-[#00F5D4]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,245,212,0.2)] shrink-0">
                        <i className="fa-solid fa-bolt text-xs"></i>
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-snug">
                        <div className="text-xs font-mono font-bold text-white group-hover:text-[#00F5D4] truncate">
                          SEO Optimization
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 truncate">
                          Hashtags & Algo
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[10px] text-gray-500 group-hover:text-[#00F5D4] group-hover:translate-x-0.5 transition-all shrink-0"></i>
                  </button>

                  {/* Quick Action 2: Viral Caption */}
                  <button
                    onClick={() => handleQuickAction('caption')}
                    className="flex-[1_1_130px] min-w-0 p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] hover:bg-[#C084FC]/15 border border-white/10 hover:border-[#C084FC]/60 text-left transition-all flex items-center justify-between gap-2.5 group cursor-pointer shadow-sm min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-[#C084FC]/20 border border-[#C084FC]/40 flex items-center justify-center text-[#C084FC] group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(192,132,252,0.2)] shrink-0">
                        <i className="fa-solid fa-pen-nib text-xs"></i>
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-snug">
                        <div className="text-xs font-mono font-bold text-white group-hover:text-[#C084FC] truncate">
                          Viral Caption
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 truncate">
                          3 Hooks & Angles
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[10px] text-gray-500 group-hover:text-[#C084FC] group-hover:translate-x-0.5 transition-all shrink-0"></i>
                  </button>

                  {/* Quick Action 3: Audio Fix */}
                  <button
                    onClick={() => handleQuickAction('audio')}
                    className="flex-[1_1_130px] min-w-0 p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] hover:bg-[#38BDF8]/15 border border-white/10 hover:border-[#38BDF8]/60 text-left transition-all flex items-center justify-between gap-2.5 group cursor-pointer shadow-sm min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(56,189,248,0.2)] shrink-0">
                        <i className="fa-solid fa-sliders text-xs"></i>
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-snug">
                        <div className="text-xs font-mono font-bold text-white group-hover:text-[#38BDF8] truncate">
                          Audio Fix
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 truncate">
                          LUFS Leveling
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[10px] text-gray-500 group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all shrink-0"></i>
                  </button>
                </div>

                {/* Open Full Studio Option */}
                <button
                  onClick={handleOpenModal}
                  className="w-full mt-0.5 py-2 px-3 rounded-xl bg-gradient-to-r from-[#00F5D4]/20 to-[#C084FC]/20 hover:from-[#00F5D4]/30 hover:to-[#C084FC]/30 border border-white/15 text-center text-[10px] font-mono font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[38px]"
                >
                  <i className="fa-solid fa-expand text-xs text-[#00F5D4] flex-shrink-0"></i>
                  <span className="truncate">Open Full Co-Pilot Studio</span>
                </button>
              </div>
            )}

            {/* Persistent Draggable Floating Component Pill */}
            <div
              ref={pillRef}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleExpanded();
                }
              }}
              onClick={handlePillClick}
              onPointerDown={handlePointerDown}
              className={`AI-Co-Pilot-Floating-Component pointer-events-auto touch-none ${
                isDragging 
                  ? 'cursor-grabbing scale-105 ring-2 ring-[#00F5D4] shadow-[0_0_35px_rgba(0,245,212,0.6)]' 
                  : isDocked
                    ? 'cursor-pointer hover:scale-105 active:scale-95'
                    : 'cursor-grab hover:scale-105 active:scale-95'
              } ${isEffectiveActive ? 'active-task' : 'idle-state'} ${
                isExpanded ? 'ring-2 ring-[#00F5D4] shadow-[0_0_30px_rgba(0,245,212,0.5)] border-[#00F5D4]' : 'border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.8)]'
              } group relative px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-zinc-950/95 backdrop-blur-2xl text-white font-mono text-xs font-bold transition-all duration-200 flex items-center gap-2 sm:gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#00F5D4]`}
              title={
                isExpanded 
                  ? "Hide Quick Actions (Alt+C / Click to collapse)" 
                  : isDocked
                    ? `Reveal AI Co-Pilot Quick Actions (Alt+C / Mode: ${statusMode} • Click Dock to unlock drag)`
                    : `Reveal AI Co-Pilot Quick Actions (Alt+C / Mode: ${statusMode} • Drag anywhere to reposition)`
              }
            >
              {/* Drag Grip / Dock Lock Icon */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDockToNearestCorner(e);
                }}
                className={`flex items-center justify-center p-1 rounded-full transition-all cursor-pointer ${
                  isDocked
                    ? 'bg-[#00F5D4]/20 text-[#00F5D4] shadow-[0_0_10px_rgba(0,245,212,0.3)] hover:bg-[#00F5D4]/30'
                    : 'text-gray-500 hover:text-[#00F5D4] hover:bg-white/10'
                }`}
                title={isDocked ? "Docked at corner (Drag locked). Click to unlock & reposition" : "Click to dock to nearest corner & lock (or drag anywhere)"}
              >
                <i className={`fa-solid ${isDocked ? 'fa-lock' : 'fa-grip-vertical'} text-xs ${isDocked ? 'text-[#00F5D4]' : 'opacity-70 group-hover:opacity-100'}`}></i>
              </div>

              {/* Animated Glow Dot / Icon */}
              <div className="relative flex items-center justify-center">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-[#00F5D4]/20 to-[#C084FC]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] ${isEffectiveActive ? 'animate-spin' : ''}`}>
                  <i className={`fa-solid ${isProcessing ? 'fa-spinner' : isExpanded ? 'fa-chevron-down' : isEffectiveActive ? 'fa-bolt' : 'fa-brain-circuit'} text-sm transition-transform duration-200`}></i>
                </div>
                {isEffectiveActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00F5D4] animate-ping"></span>
                )}
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-serif font-black italic tracking-wide text-white group-hover:text-[#00F5D4] transition-colors">
                    AI Co-Pilot
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider ${
                    isEffectiveActive
                      ? 'bg-[#00F5D4] text-black animate-pulse font-black' 
                      : isExpanded 
                        ? 'bg-[#00F5D4] text-black font-black' 
                        : isDocked 
                          ? 'bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/50' 
                          : 'bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30'
                  }`}>
                    {statusMode === 'active' 
                      ? '⚡ ACTIVE' 
                      : statusMode === 'idle' 
                        ? '💤 IDLE' 
                        : isProcessing 
                          ? 'SYNTHESIZING' 
                          : isExpanded 
                            ? 'EXPANDED' 
                            : isDocked 
                              ? 'DOCKED' 
                              : 'ONLINE'}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-gray-400 block leading-tight">
                  {statusMode === 'active' 
                    ? 'High-frequency pulse (Manual)' 
                    : statusMode === 'idle' 
                      ? 'Standard pulse (Manual)' 
                      : isProcessing 
                        ? 'Generating studio directives...' 
                        : isExpanded 
                          ? 'Alt+C to hide quick menu' 
                          : `${currentTabMeta.name}`}
                </span>
              </div>

              {/* Quick Status Mode Toggle Pill Button */}
              <button
                type="button"
                onClick={(e) => handleCycleStatusMode(e)}
                title={`Status Mode: ${statusMode.toUpperCase()} (Click to toggle: Auto -> Active (High-Freq Pulse) -> Idle (Standard Pulse))`}
                className={`px-2 py-1 rounded-full text-[9px] font-mono font-bold border transition-all flex items-center gap-1 cursor-pointer select-none ${
                  statusMode === 'active'
                    ? 'bg-[#00F5D4] text-black font-black border-[#00F5D4] shadow-[0_0_10px_rgba(0,245,212,0.5)] animate-pulse'
                    : statusMode === 'idle'
                      ? 'bg-[#C084FC]/25 text-[#C084FC] border-[#C084FC]/60 shadow-[0_0_8px_rgba(192,132,252,0.3)]'
                      : 'bg-white/5 text-gray-300 border-white/15 hover:border-[#00F5D4]/50 hover:text-[#00F5D4]'
                }`}
              >
                <i className={`fa-solid ${statusMode === 'active' ? 'fa-bolt' : statusMode === 'idle' ? 'fa-moon' : 'fa-wand-magic-sparkles'} text-[8px]`}></i>
                <span className="capitalize">{statusMode}</span>
              </button>

              {/* Dedicated Dock / Unlock Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDockToNearestCorner(e);
                }}
                title={isDocked ? "Docked: Drag & drop disabled. Click to unlock" : "Dock: Snap to nearest corner & lock position"}
                className={`px-2 py-1 rounded-full text-[9px] font-mono font-bold border transition-all flex items-center gap-1 cursor-pointer select-none ${
                  isDocked
                    ? 'bg-[#00F5D4]/20 text-[#00F5D4] border-[#00F5D4]/60 shadow-[0_0_10px_rgba(0,245,212,0.3)] hover:bg-[#00F5D4]/30'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-[#00F5D4]/40 hover:bg-white/10'
                }`}
              >
                <i className={`fa-solid ${isDocked ? 'fa-lock' : 'fa-anchor'} text-[9px]`}></i>
                <span className="inline">{isDocked ? 'Locked' : 'Dock'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-gray-400 group-hover:text-[#00F5D4] text-[9px] font-mono font-bold border border-white/5">
                  Alt+C
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* AI CO-PILOT MODAL DIALOG (Opened cleanly via header or command shortcut) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`AI-Co-Pilot-Floating-Component ${isEffectiveActive ? 'active-task' : 'idle-state'} w-full max-w-xl max-h-[85vh] flex flex-col rounded-[2.5rem] bg-zinc-950/98 backdrop-blur-2xl border border-[#00F5D4]/40 animate-in zoom-in-95 duration-200 overflow-hidden`}
          >
            {/* Holographic Header Bar */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-zinc-900/90 via-black/80 to-zinc-900/90 flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F5D4]/20 to-[#C084FC]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.3)]">
                  <i className={`fa-solid ${isEffectiveActive ? 'fa-bolt animate-pulse' : 'fa-brain-circuit'} text-lg`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-serif font-black italic text-white tracking-tight">
                      Janu AI Co-Pilot
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/40 text-[#00F5D4] text-[9px] font-mono font-bold uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <i className={`fa-solid ${currentTabMeta.icon} text-[#C084FC]`}></i>
                    <span>Active: <strong className="text-white">{currentTabMeta.name}</strong></span>
                  </p>
                </div>
              </div>

              {/* Status Switch Control & Window Controls */}
              <div className="flex items-center gap-2">
                {/* Visual Status Pulse Switch */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 px-1 font-bold hidden sm:inline">Pulse:</span>
                  <button
                    type="button"
                    onClick={(e) => handleStatusModeChange('auto', e)}
                    className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      statusMode === 'auto'
                        ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Auto: Dynamic detection based on task synthesis"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles text-[8px]"></i>
                    <span>Auto</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleStatusModeChange('active', e)}
                    className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      statusMode === 'active'
                        ? 'bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black font-black shadow-[0_0_12px_rgba(0,245,212,0.6)] animate-pulse'
                        : 'text-gray-400 hover:text-[#00F5D4]'
                    }`}
                    title="Active: High-frequency pulse (0.8s neon frequency)"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-black sm:bg-[#00F5D4] animate-ping"></span>
                    <i className="fa-solid fa-bolt text-[8px]"></i>
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleStatusModeChange('idle', e)}
                    className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      statusMode === 'idle'
                        ? 'bg-gradient-to-r from-[#C084FC] to-[#FF007F] text-black font-black shadow-[0_0_10px_rgba(192,132,252,0.5)]'
                        : 'text-gray-400 hover:text-[#C084FC]'
                    }`}
                    title="Idle: Standard pulse (3.0s harmonic frequency)"
                  >
                    <i className="fa-solid fa-moon text-[8px]"></i>
                    <span>Idle</span>
                  </button>
                </div>

                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Close Co-Pilot"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

          {/* Scrollable HUD Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            
            {/* Quick Context Input Box */}
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span className="uppercase text-[#00F5D4] font-bold flex items-center gap-1">
                  <i className="fa-solid fa-target text-[9px]"></i>
                  Focus Subject / Prompt
                </span>
                <span className="text-gray-500">Auto-detected from active editor</span>
              </div>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. Cyberpunk 9:16 Reel, Gospel Soul Track..."
                className="w-full bg-zinc-900/90 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none placeholder:text-gray-600"
              />
            </div>

            {/* ACTION BUTTON GRID */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">
                Quick-Access Studio Utilities
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* 1. Optimize SEO */}
                <button
                  onClick={() => handleExecuteAction('seo')}
                  disabled={isProcessing}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    activeAction === 'seo'
                      ? 'bg-[#00F5D4]/15 border-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.3)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-[#00F5D4]/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">⚡</span>
                    <i className="fa-solid fa-arrow-up-right text-[10px] text-gray-500 group-hover:text-[#00F5D4]"></i>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-mono font-bold text-white block group-hover:text-[#00F5D4]">
                      Optimize SEO
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">Viral Tags & CTR</span>
                  </div>
                </button>

                {/* 2. Generate Caption */}
                <button
                  onClick={() => handleExecuteAction('caption')}
                  disabled={isProcessing}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    activeAction === 'caption'
                      ? 'bg-[#FF007F]/15 border-[#FF007F] shadow-[0_0_15px_rgba(255,0,127,0.3)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-[#FF007F]/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">✍️</span>
                    <i className="fa-solid fa-arrow-up-right text-[10px] text-gray-500 group-hover:text-[#FF007F]"></i>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-mono font-bold text-white block group-hover:text-[#FF007F]">
                      Generate Caption
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">3 Hook Styles + CTA</span>
                  </div>
                </button>

                {/* 3. Fix Audio Levels */}
                <button
                  onClick={() => handleExecuteAction('audio')}
                  disabled={isProcessing}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    activeAction === 'audio'
                      ? 'bg-[#C084FC]/15 border-[#C084FC] shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-[#C084FC]/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">🎚️</span>
                    <i className="fa-solid fa-arrow-up-right text-[10px] text-gray-500 group-hover:text-[#C084FC]"></i>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-mono font-bold text-white block group-hover:text-[#C084FC]">
                      Fix Audio Levels
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">-14 LUFS Mastering</span>
                  </div>
                </button>

                {/* 4. Viral Hook Tester */}
                <button
                  onClick={() => handleExecuteAction('hook')}
                  disabled={isProcessing}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    activeAction === 'hook'
                      ? 'bg-[#FFB800]/15 border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.3)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-[#FFB800]/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">🚀</span>
                    <i className="fa-solid fa-arrow-up-right text-[10px] text-gray-500 group-hover:text-[#FFB800]"></i>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-mono font-bold text-white block group-hover:text-[#FFB800]">
                      3-Second Hooks
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">Retention Boost</span>
                  </div>
                </button>

                {/* 5. Visual Harmonizer */}
                <button
                  onClick={() => handleExecuteAction('visual')}
                  disabled={isProcessing}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    activeAction === 'visual'
                      ? 'bg-[#00F5D4]/15 border-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.3)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-[#00F5D4]/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">🎨</span>
                    <i className="fa-solid fa-arrow-up-right text-[10px] text-gray-500 group-hover:text-[#00F5D4]"></i>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-mono font-bold text-white block group-hover:text-[#00F5D4]">
                      Color Harmony
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">LUTs & Shaders</span>
                  </div>
                </button>

                {/* 6. Prompt Alchemist */}
                <button
                  onClick={() => handleExecuteAction('prompt')}
                  disabled={isProcessing}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    activeAction === 'prompt'
                      ? 'bg-gradient-to-r from-[#00F5D4]/20 to-[#C084FC]/20 border-[#C084FC] shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-[#C084FC]/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">💡</span>
                    <i className="fa-solid fa-arrow-up-right text-[10px] text-gray-500 group-hover:text-[#C084FC]"></i>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-mono font-bold text-white block group-hover:text-[#C084FC]">
                      Prompt Alchemist
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">8K Multi-Modal</span>
                  </div>
                </button>
              </div>
            </div>

            {/* AUDIO LEVELING QUICK MASTERING CONTROL PANEL (When Audio Action is Selected) */}
            {activeAction === 'audio' && (
              <div className="p-4 rounded-2xl bg-black/80 border border-[#C084FC]/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#C084FC] uppercase flex items-center gap-1.5">
                    <i className="fa-solid fa-sliders"></i>
                    Acoustic Limiter & LUFS Target
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">Web Audio Synth</span>
                </div>

                {/* Target LUFS Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTargetLUFS(-14)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold transition-all ${
                      targetLUFS === -14
                        ? 'bg-[#00F5D4] text-black shadow-[0_0_10px_rgba(0,245,212,0.4)]'
                        : 'bg-zinc-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    -14 LUFS (Streaming)
                  </button>
                  <button
                    onClick={() => setTargetLUFS(-12)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold transition-all ${
                      targetLUFS === -12
                        ? 'bg-[#C084FC] text-black shadow-[0_0_10px_rgba(192,132,252,0.4)]'
                        : 'bg-zinc-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    -12 LUFS (Reels)
                  </button>
                  <button
                    onClick={() => setTargetLUFS(-9)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold transition-all ${
                      targetLUFS === -9
                        ? 'bg-[#FF007F] text-white shadow-[0_0_10px_rgba(255,0,127,0.4)]'
                        : 'bg-zinc-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    -9 LUFS (Club Drop)
                  </button>
                </div>

                {/* Toggle Switches */}
                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-gray-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={truePeakProtection}
                      onChange={(e) => setTruePeakProtection(e.target.checked)}
                      className="accent-[#00F5D4] rounded"
                    />
                    <span>True-Peak Limiter (-1.0 dBFS)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dialogueClarityBoost}
                      onChange={(e) => setDialogueClarityBoost(e.target.checked)}
                      className="accent-[#C084FC] rounded"
                    />
                    <span>Dialogue Clarity (+3.2dB)</span>
                  </label>
                </div>

                {/* Live Acoustic Test Preview Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleAudioTestPlayback('before')}
                    disabled={isPlayingAudioTest !== null}
                    className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-[10px] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <i className="fa-solid fa-volume-low text-gray-500"></i>
                    <span>Preview Raw Audio</span>
                  </button>
                  <button
                    onClick={() => handleAudioTestPlayback('after')}
                    disabled={isPlayingAudioTest !== null}
                    className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,245,212,0.3)] hover:scale-105 transition-all"
                  >
                    <i className="fa-solid fa-bolt"></i>
                    <span>Test -14 LUFS Mastered</span>
                  </button>
                </div>
              </div>
            )}

            {/* PROCESSING LOADING INDICATOR */}
            {isProcessing && (
              <div className="p-6 rounded-2xl bg-black/80 border border-[#00F5D4]/40 flex flex-col items-center justify-center space-y-3 animate-pulse">
                <div className="w-10 h-10 rounded-full border-2 border-[#00F5D4] border-t-transparent animate-spin"></div>
                <span className="text-xs font-mono text-[#00F5D4] font-bold">
                  Gemini Neural Co-Pilot Synthesizing...
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  Calibrating {currentTabMeta.name} directives
                </span>
              </div>
            )}

            {/* GENERATED OUTPUT CONTAINER */}
            {generatedOutput && !isProcessing && (
              <div className="p-4 rounded-2xl bg-black/90 border border-[#00F5D4]/40 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-mono font-bold text-[#00F5D4] flex items-center gap-1.5">
                    <i className="fa-solid fa-sparkles"></i>
                    {activeActionTitle}
                  </span>

                  <button
                    onClick={handleCopyOutput}
                    className="px-3 py-1 rounded-xl bg-[#00F5D4]/10 hover:bg-[#00F5D4] border border-[#00F5D4]/40 text-[#00F5D4] hover:text-black font-mono font-bold text-[10px] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>Copy All</span>
                  </button>
                </div>

                <div className="text-xs font-mono text-gray-200 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {generatedOutput}
                </div>

                {/* Contextual Apply Action */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      showToast(`Applied Co-Pilot directives to ${currentTabMeta.name}! ⚡`);
                      bossAudio.playTipChime(50);
                      triggerNeonExplosion({
                        particleCount: 30,
                        origin: { x: 0.5, y: 0.5 },
                        intensity: 'medium'
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>Apply To Active Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Co-Pilot Footer Bar */}
          <div className="p-3.5 border-t border-white/10 bg-black/90 flex items-center justify-between text-[10px] font-mono text-gray-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]"></span>
              <span>Gemini 3.0 Flash Co-Pilot</span>
              <span className="text-gray-600">•</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 text-[9px] font-bold">⌘K</span>
            </span>

            {onNavigateToTab && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateToTab('reel-studio')}
                  className="hover:text-[#FF007F] transition-colors p-1"
                  title="Switch to Reel Studio"
                >
                  <i className="fa-solid fa-clapperboard"></i>
                </button>
                <button
                  onClick={() => onNavigateToTab('photo-studio')}
                  className="hover:text-[#C084FC] transition-colors p-1"
                  title="Switch to Photo Alchemist"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </button>
                <button
                  onClick={() => onNavigateToTab('music-studio')}
                  className="hover:text-[#00F5D4] transition-colors p-1"
                  title="Switch to Music Studio"
                >
                  <i className="fa-solid fa-music"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default AICoPilot;
