import React, { useState } from 'react';
import GeminiChatbotModal from './GeminiChatbotModal';
import LyriaMusicGenerator from './LyriaMusicGenerator';
import VeoVideoGenerator from './VeoVideoGenerator';
import GeminiImageStudio from './GeminiImageStudio';
import GeminiLiveVoiceModal from './GeminiLiveVoiceModal';
import GroundingResearchStudio from './GroundingResearchStudio';
import AudioTranscribeStudio from './AudioTranscribeStudio';
import { AIVoiceoverStudio } from './AIVoiceoverStudio';
import AIAssetLibrary from './AIAssetLibrary';
import { AIAsset } from '../types';

interface AISuperStudioProps {
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music' | 'movie') => void;
  onOpenLiveVoice?: () => void;
}

export type AISuiteTab = 'overview' | 'library' | 'chat' | 'music' | 'voiceover' | 'video' | 'image' | 'voice' | 'grounding' | 'transcribe';

export const AISuperStudio: React.FC<AISuperStudioProps> = ({
  onNavigateToStudio,
  onOpenLiveVoice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AISuiteTab>('overview');
  const [showChatModal, setShowChatModal] = useState(false);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState(false);

  const AI_CAPABILITIES = [
    {
      id: 'chat',
      title: 'Multi-Turn Co-Pilot',
      model: 'gemini-3.5-flash / 3.1-pro / flash-lite',
      icon: 'fa-messages',
      gradient: 'from-[#00F5D4] to-[#38BDF8]',
      desc: 'Contextual, multi-turn assistant with customizable system instructions, executive personas, and model switching.',
      actionLabel: 'Launch Chat Assistant',
      onClick: () => setActiveSubTab('chat'),
    },
    {
      id: 'music',
      title: 'Lyria AI Music Studio',
      model: 'lyria-3-clip-preview & lyria-3-pro-preview',
      icon: 'fa-music',
      gradient: 'from-[#00F5D4] to-[#C084FC]',
      desc: 'Generate studio-grade audio stems, 30s viral clips, and full track masters from text and mood board images.',
      actionLabel: 'Open Lyria Music Studio',
      onClick: () => setActiveSubTab('music'),
    },
    {
      id: 'voiceover',
      title: 'AI Voiceover & Vocal Alchemist',
      model: 'SpeechProsody & WebAudio DSP',
      icon: 'fa-microphone-lines',
      gradient: 'from-[#00F5D4] via-[#C084FC] to-[#FF007F]',
      desc: 'Generate synthetic vocals from text across 8 voice profiles, 8 emotional resonance modes, pitch shifts, and WAV export.',
      actionLabel: 'Launch Voiceover Studio',
      onClick: () => setActiveSubTab('voiceover'),
    },
    {
      id: 'video',
      title: 'Veo 3 Video Generator',
      model: 'veo-3.1-fast-generate-preview',
      icon: 'fa-video',
      gradient: 'from-[#C084FC] to-[#FF007F]',
      desc: 'Synthesize cinematic 16:9 widescreen or 9:16 vertical videos from text or animate photos into motion videos.',
      actionLabel: 'Open Veo Video Generator',
      onClick: () => setActiveSubTab('video'),
    },
    {
      id: 'movie',
      title: 'Movie & Cinema Director Studio',
      model: 'Hollywood Anamorphic 2.39:1 & Gemini Screenplay',
      icon: 'fa-clapperboard',
      gradient: 'from-[#FF007F] via-[#C084FC] to-[#00FFE0]',
      desc: 'Multi-scene Hollywood storyboards, Gemini screenplay synthesis, 2.39:1 anamorphic framing, and LUT grading.',
      actionLabel: 'Open Movie Director Studio',
      onClick: () => onNavigateToStudio?.('movie'),
    },
    {
      id: 'image',
      title: 'Gemini Image Alchemist',
      model: 'gemini-3.1-flash-image-preview',
      icon: 'fa-wand-magic-sparkles',
      gradient: 'from-[#FF007F] to-[#FCD34D]',
      desc: 'Create up to 4K neural visual artwork from text or apply surgical generative modifications to existing photos.',
      actionLabel: 'Open Image Alchemist',
      onClick: () => setActiveSubTab('image'),
    },
    {
      id: 'voice',
      title: 'Live Voice Stream',
      model: 'gemini-3.1-flash-live-preview',
      icon: 'fa-microphone-lines',
      gradient: 'from-[#00F5D4] to-[#C084FC]',
      desc: 'Zero-latency bidirectional voice conversation via WebSocket using 16kHz microphone capture and 24kHz audio synthesis.',
      actionLabel: 'Start Live Voice Call',
      onClick: () => setShowLiveVoiceModal(true),
    },
    {
      id: 'grounding',
      title: 'Search & Maps Intel',
      model: 'gemini-3.5-flash Grounded',
      icon: 'fa-satellite-dish',
      gradient: 'from-[#38BDF8] to-[#00F5D4]',
      desc: 'Fact-checked cultural trend analyses with Google Search and venue / studio scouting backed by Google Maps.',
      actionLabel: 'Open Grounded Intel',
      onClick: () => setActiveSubTab('grounding'),
    },
    {
      id: 'transcribe',
      title: 'Audio Transcriber',
      model: 'gemini-3.5-transcribe',
      icon: 'fa-file-audio',
      gradient: 'from-[#FCD34D] to-[#00F5D4]',
      desc: 'Ultra-accurate speech-to-text, song lyrics extraction, and podcast transcription from live mic or audio files.',
      actionLabel: 'Open Transcriber',
      onClick: () => setActiveSubTab('transcribe'),
    },
    {
      id: 'library',
      title: 'AI Asset Vault & Library',
      model: 'Cloud Firestore & Storage',
      icon: 'fa-folder-bookmark',
      gradient: 'from-[#00F5D4] via-[#C084FC] to-[#FF007F]',
      desc: 'Store, categorize, and instantly load generated AI art, Lyria audio stems, Veo motion clips, and reel drafts.',
      actionLabel: 'Browse Asset Library',
      onClick: () => setActiveSubTab('library'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-black via-[#0D0D14] to-black border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F5D4]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#C084FC]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[10px] font-mono font-bold uppercase text-[#00F5D4] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
              <span>Gemini 3 Suite • Server-Side API Hub</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-black italic text-white tracking-tight">
              AI Multi-Modal Super-Studio
            </h2>
            <p className="text-xs sm:text-sm font-mono text-gray-400 mt-2 max-w-2xl font-light">
              Autonomous, full-stack creative suite: Chatbot, Lyria Music, Veo 3 Video, Image Alchemist, Live Voice, Search & Maps Grounding, and Audio Transcription.
            </p>
          </div>

          {/* Quick Launch Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowChatModal(true)}
              className="px-4 py-3 rounded-2xl bg-[#00F5D4]/15 hover:bg-[#00F5D4]/25 border border-[#00F5D4]/40 text-[#00F5D4] text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,245,212,0.2)]"
            >
              <i className="fa-solid fa-messages text-sm"></i>
              <span>Open Chatbot Modal</span>
            </button>

            <button
              onClick={() => setShowLiveVoiceModal(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#C084FC] to-[#00F5D4] text-black text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(192,132,252,0.3)]"
            >
              <i className="fa-solid fa-microphone-lines text-sm animate-pulse"></i>
              <span>Live Voice Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-white/10">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-white/15 text-white border border-white/30 shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-grid-2"></i>
          <span>Suite Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('chat')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'chat'
              ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-messages"></i>
          <span>Chat Co-Pilot</span>
        </button>

        <button
          onClick={() => setActiveSubTab('music')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'music'
              ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-music"></i>
          <span>Lyria Music</span>
        </button>

        <button
          onClick={() => setActiveSubTab('voiceover')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'voiceover'
              ? 'bg-gradient-to-r from-[#00F5D4]/20 via-[#C084FC]/20 to-[#FF007F]/20 border border-[#00F5D4] text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-microphone-lines text-[#00F5D4]"></i>
          <span>AI Voiceover</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#00F5D4]/20 text-[9px] font-mono text-[#00F5D4] font-bold">PRO</span>
        </button>

        <button
          onClick={() => setActiveSubTab('video')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'video'
              ? 'bg-[#C084FC]/20 border border-[#C084FC] text-[#C084FC] shadow-[0_0_15px_rgba(192,132,252,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-video"></i>
          <span>Veo 3 Video</span>
        </button>

        <button
          onClick={() => setActiveSubTab('image')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'image'
              ? 'bg-[#FF007F]/20 border border-[#FF007F] text-[#FF007F] shadow-[0_0_15px_rgba(255,0,127,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>Image Alchemist</span>
        </button>

        <button
          onClick={() => setActiveSubTab('grounding')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'grounding'
              ? 'bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-satellite-dish"></i>
          <span>Search & Maps Intel</span>
        </button>

        <button
          onClick={() => setActiveSubTab('transcribe')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'transcribe'
              ? 'bg-[#FCD34D]/20 border border-[#FCD34D] text-[#FCD34D] shadow-[0_0_15px_rgba(252,211,77,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-file-audio"></i>
          <span>Audio Transcribe</span>
        </button>

        <button
          onClick={() => setActiveSubTab('library')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'library'
              ? 'bg-gradient-to-r from-[#00F5D4]/25 via-[#C084FC]/25 to-[#FF007F]/25 border border-[#00F5D4] text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.35)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-folder-bookmark text-[#00F5D4]"></i>
          <span>Asset Library</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#00F5D4]/20 text-[9px] font-mono text-[#00F5D4] font-bold">VAULT</span>
        </button>
      </div>

      {/* Sub-Tab View Rendering */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AI_CAPABILITIES.map((cap) => (
            <div
              key={cap.id}
              className="p-6 rounded-3xl bg-[#0D0D14] border border-white/10 hover:border-[#00F5D4]/40 transition-all group flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cap.gradient} text-black flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                    <i className={`fa-solid ${cap.icon}`}></i>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-gray-300">
                    {cap.model}
                  </span>
                </div>

                <h3 className="text-lg font-serif font-black italic text-white mb-2 group-hover:text-[#00F5D4] transition-colors">
                  {cap.title}
                </h3>
                <p className="text-xs font-mono text-gray-400 leading-relaxed mb-6 font-light">
                  {cap.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={cap.onClick}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-[#00F5D4]/20 border border-white/10 hover:border-[#00F5D4]/50 text-white hover:text-[#00F5D4] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>{cap.actionLabel}</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'chat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-black italic text-white">
              Multi-Turn Gemini Co-Pilot
            </h3>
            <button
              onClick={() => setShowChatModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <i className="fa-solid fa-expand"></i>
              <span>Open in Fullscreen Modal</span>
            </button>
          </div>
          {/* Embedded Chat Preview / Direct Trigger */}
          <div className="p-8 rounded-3xl bg-[#0D0D14] border border-white/10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] flex items-center justify-center text-2xl mx-auto shadow-[0_0_20px_rgba(0,245,212,0.3)]">
              <i className="fa-solid fa-messages"></i>
            </div>
            <h4 className="text-xl font-serif font-black italic text-white">
              Multi-Turn Executive Creative Director
            </h4>
            <p className="text-xs font-mono text-gray-400 max-w-md mx-auto">
              Configure system roles, switch models between Pro, Flash, and Flash Lite, and collaborate seamlessly on scripts, lyrics, strategy, and business scaling.
            </p>
            <button
              onClick={() => setShowChatModal(true)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-bold text-xs uppercase tracking-wider font-mono shadow-[0_0_25px_rgba(0,245,212,0.3)] hover:scale-105 transition-all"
            >
              Launch Multi-Turn Chatbot
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'music' && (
        <LyriaMusicGenerator
          onSongSaved={() => {
            if (onNavigateToStudio) onNavigateToStudio('music');
          }}
        />
      )}

      {activeSubTab === 'voiceover' && (
        <AIVoiceoverStudio
          onNavigateToReelStudio={() => {
            if (onNavigateToStudio) onNavigateToStudio('reel');
          }}
        />
      )}

      {activeSubTab === 'video' && (
        <VeoVideoGenerator
          onVideoExportedToReel={(videoUrl) => {
            if (onNavigateToStudio) onNavigateToStudio('reel');
          }}
        />
      )}

      {activeSubTab === 'image' && (
        <GeminiImageStudio
          onImageSaved={(imageUrl) => {
            if (onNavigateToStudio) onNavigateToStudio('photo');
          }}
        />
      )}

      {activeSubTab === 'grounding' && (
        <GroundingResearchStudio />
      )}

      {activeSubTab === 'transcribe' && (
        <AudioTranscribeStudio
          onLyricsExported={(lyrics) => {
            if (onNavigateToStudio) onNavigateToStudio('music');
          }}
        />
      )}

      {activeSubTab === 'library' && (
        <AIAssetLibrary
          onNavigateToStudio={onNavigateToStudio}
          onSelectAsset={(asset: AIAsset) => {
            if (asset.type === 'reel_draft' && onNavigateToStudio) {
              onNavigateToStudio('reel');
            } else if (asset.type === 'audio_stem' && onNavigateToStudio) {
              onNavigateToStudio('music');
            } else if (asset.type === 'image' && onNavigateToStudio) {
              onNavigateToStudio('photo');
            }
          }}
        />
      )}

      {/* Standalone Modals */}
      <GeminiChatbotModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />

      <GeminiLiveVoiceModal
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
      />
    </div>
  );
};

export default AISuperStudio;
