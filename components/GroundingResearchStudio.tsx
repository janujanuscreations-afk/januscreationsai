import React, { useState } from 'react';
import { searchGroundingAI, mapsGroundingAI } from '../services/geminiService';
import { triggerNeonExplosion } from '../utils/confetti';

export const GroundingResearchStudio: React.FC = () => {
  const [groundingType, setGroundingType] = useState<'search' | 'maps'>('search');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const SEARCH_PRESETS = [
    'What are the highest-trending audio tracks and viral video themes on TikTok and Instagram this week?',
    'Latest billboard chart breakthroughs and emerging indie genre fusion trends in 2026.',
    'Current breakthrough AI audio synthesis tools and creator monetization benchmarks.',
  ];

  const MAPS_PRESETS = [
    'Top recording studios and music video production soundstages in Los Angeles with Dolby Atmos capabilities.',
    'Best live music performance venues and indie clubs in London for showcase gigs.',
    'Iconic concert amphitheaters and festival grounds across the United States.',
  ];

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setResultText(null);
    setGroundingSources([]);
    setSearchQueries([]);

    try {
      if (groundingType === 'search') {
        const res = await searchGroundingAI(prompt);
        setResultText(res.text);
        setGroundingSources(res.groundingChunks || []);
        setSearchQueries(res.webSearchQueries || []);
      } else {
        const res = await mapsGroundingAI(prompt);
        setResultText(res.text);
        setGroundingSources(res.groundingChunks || []);
      }

      triggerNeonExplosion({
        particleCount: 40,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'subtle',
      });
    } catch (err: any) {
      console.error('Grounding query failed:', err);
      setErrorMsg(err?.message || 'Failed to retrieve grounded intelligence');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0E] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5D4]/20 via-[#C084FC]/20 to-[#38BDF8]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.2)]">
            <i className={`fa-solid ${groundingType === 'search' ? 'fa-magnifying-glass-location' : 'fa-map-location-dot'} text-xl`}></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-black italic text-white tracking-wide">
                Grounded Intelligence Oracle
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[9px] font-mono font-bold uppercase text-[#00F5D4]">
                gemini-3.5-flash
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Live fact-checking and geographical scout backed by Google Search & Google Maps
            </p>
          </div>
        </div>

        {/* Tool Switcher */}
        <div className="flex items-center p-1 bg-black/60 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setGroundingType('search');
              setResultText(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              groundingType === 'search'
                ? 'bg-[#00F5D4]/20 border border-[#00F5D4]/50 text-[#00F5D4] font-bold shadow-[0_0_10px_rgba(0,245,212,0.2)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-brands fa-google text-[10px]"></i>
            <span>Google Search Data</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setGroundingType('maps');
              setResultText(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              groundingType === 'maps'
                ? 'bg-[#C084FC]/20 border border-[#C084FC]/50 text-[#C084FC] font-bold shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-location-dot text-[10px]"></i>
            <span>Google Maps Data</span>
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase text-gray-400 mb-2 block">
          {groundingType === 'search' ? 'Trending Search Topics:' : 'Venue & Location Scout Prompts:'}
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {(groundingType === 'search' ? SEARCH_PRESETS : MAPS_PRESETS).map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(preset)}
              className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 hover:border-[#00F5D4]/40 hover:text-[#00F5D4] text-gray-300 text-xs font-mono whitespace-nowrap transition-all"
            >
              {preset.slice(0, 45)}...
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleExecute} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder={
              groundingType === 'search'
                ? "Ask about real-time market stats, music trends, viral creators, or verify breaking culture events..."
                : "Search for production studios, concert arenas, rehearsal spaces, or travel coordinates..."
            }
            className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4] resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
            <i className="fa-solid fa-circle-check text-[#00F5D4]"></i>
            <span>Grounded via @google/genai {groundingType === 'search' ? 'googleSearch tool' : 'googleMaps tool'}</span>
          </span>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)]"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Querying Grounded Intel...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-satellite-dish"></i>
                <span>Execute Intel Query</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          <i className="fa-solid fa-triangle-exclamation mr-2"></i>
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {resultText && (
        <div className="mt-6 p-5 rounded-xl bg-[#12121A] border border-[#00F5D4]/30 shadow-[0_0_30px_rgba(0,245,212,0.15)] animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-serif font-black italic text-white flex items-center gap-2">
              <i className="fa-solid fa-certificate text-[#00F5D4]"></i>
              <span>Grounded Intelligence Report</span>
            </h4>
            <span className="text-[10px] font-mono uppercase text-[#00F5D4] px-2 py-0.5 rounded bg-[#00F5D4]/10 border border-[#00F5D4]/30">
              Live Grounded
            </span>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
            {resultText}
          </div>

          {/* Web Queries / Grounding Sources */}
          {groundingSources.length > 0 && (
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">
                <i className="fa-solid fa-link mr-1"></i> Grounding Verification Citations:
              </span>
              <div className="flex flex-wrap gap-2">
                {groundingSources.map((chunk, idx) => {
                  const title = chunk?.web?.title || chunk?.maps?.title || `Grounding Source #${idx + 1}`;
                  const uri = chunk?.web?.uri || chunk?.maps?.uri;
                  return uri ? (
                    <a
                      key={idx}
                      href={uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-[#00F5D4] text-[#00F5D4] text-xs font-mono flex items-center gap-1.5 transition-all"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      <span className="truncate max-w-[200px]">{title}</span>
                    </a>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroundingResearchStudio;
