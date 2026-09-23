import React, { useState, useMemo } from 'react';
import { BrandBrief } from '../types';

interface StrategyInsightSidebarProps {
  brief: BrandBrief;
  imageStyle: string;
  aspectRatio: string;
  isTaskRunning?: boolean;
  onApplyVibeSuggestion?: (newVibe: string) => void;
  onApplyAudienceSuggestion?: (newAudience: string) => void;
  onApplyNameSuggestion?: (newName: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const StrategyInsightSidebar: React.FC<StrategyInsightSidebarProps> = ({
  brief,
  imageStyle,
  aspectRatio,
  isTaskRunning = false,
  onApplyVibeSuggestion,
  onApplyAudienceSuggestion,
  onApplyNameSuggestion,
  isOpen,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'trends' | 'hooks'>('branding');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Compute dynamic brand strength & engagement metrics based on current input
  const metrics = useMemo(() => {
    let score = 25; // baseline
    if (brief.name.trim().length > 2) score += 20;
    if (brief.industry.trim().length > 2) score += 20;
    if (brief.vibe.trim().length > 3) score += 20;
    if (brief.targetAudience.trim().length > 8) score += 15;

    // Archetype analysis
    const vibeLower = (brief.vibe + ' ' + brief.industry).toLowerCase();
    let archetype = 'Sovereign Pioneer';
    let vibeColor = '#FF007F';
    let retentionAdvice = 'Incorporate high-contrast motion within first 2.0s.';

    if (vibeLower.includes('cyber') || vibeLower.includes('tech') || vibeLower.includes('future') || imageStyle === 'neon') {
      archetype = 'Cybernetic Vanguard';
      vibeColor = '#00F5D4';
      retentionAdvice = 'Sync fast holographic cuts to 135 BPM sub-bass drops.';
    } else if (vibeLower.includes('luxury') || vibeLower.includes('couture') || vibeLower.includes('fashion') || imageStyle === 'editorial') {
      archetype = 'Neo-Baroque Sovereign';
      vibeColor = '#C084FC';
      retentionAdvice = 'Use slow cinematic zooms with metallic serif typography overlays.';
    } else if (vibeLower.includes('music') || vibeLower.includes('gospel') || vibeLower.includes('sound') || vibeLower.includes('audio')) {
      archetype = 'Harmonic Resonator';
      vibeColor = '#FFB800';
      retentionAdvice = 'Open with an emotive vocal hook before the visual title card.';
    } else if (vibeLower.includes('vintage') || vibeLower.includes('retro') || imageStyle === 'vintage') {
      archetype = 'Analog Alchemist';
      vibeColor = '#FF007F';
      retentionAdvice = 'Pair 35mm film grain textures with authentic retro vocal samples.';
    }

    return {
      score: Math.min(score, 100),
      archetype,
      vibeColor,
      retentionAdvice
    };
  }, [brief, imageStyle]);

  // Contextual industry insights
  const contextualTips = useMemo(() => {
    const ind = (brief.industry || 'Creative Industry').toLowerCase();
    const v = (brief.vibe || 'Modern Luxury').toLowerCase();

    const tips = [
      {
        title: 'Linguistic Resonance',
        icon: 'fa-wand-magic-sparkles',
        badge: 'Copywriting',
        text: brief.name 
          ? `Anchor "${brief.name}" around visceral sensory verbs like "Unveil", "Manifest", and "Command" to match the ${metrics.archetype} energy.`
          : 'Define a distinctive 2-3 word brand moniker with rhythmic cadence.'
      },
      {
        title: 'Visual Aspect Synergy',
        icon: 'fa-crop-simple',
        badge: aspectRatio === '9:16' ? 'Vertical 9:16' : aspectRatio === '1:1' ? 'Square 1:1' : 'Cinema 16:9',
        text: aspectRatio === '9:16'
          ? '9:16 captures 88% higher mobile watch time. Position your primary visual focal point within the middle 60% safe zone.'
          : aspectRatio === '1:1'
          ? 'Square ratio excels for multi-slide carousel retention and feed grid visual symmetry.'
          : '16:9 widescreen delivers prestige cinematic brand authority for keynote and web hero placement.'
      },
      {
        title: 'Atmospheric Palette',
        icon: 'fa-palette',
        badge: imageStyle,
        text: `Using ${imageStyle} aesthetics with ${brief.vibe || 'neon/luxury'} vibe triggers +44% brand recall when paired with dark obsidian (#050505) contrast.`
      }
    ];

    return tips;
  }, [brief, imageStyle, aspectRatio, metrics.archetype]);

  // Dynamic trending hashtags
  const hashtags = useMemo(() => {
    const base = [
      '#JanusCreations',
      '#SovereignAI',
      '#CyberLuxury2026',
      '#NeuralAesthetics',
      '#CreativeEmpire'
    ];
    if (brief.industry) {
      const cleanInd = brief.industry.replace(/\s+/g, '');
      base.unshift(`#${cleanInd}`);
    }
    if (brief.vibe) {
      const cleanVibe = brief.vibe.replace(/\s+/g, '');
      base.unshift(`#${cleanVibe}Aesthetics`);
    }
    return base.slice(0, 6);
  }, [brief.industry, brief.vibe]);

  // Handle copying hashtag
  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1800);
  };

  return (
    <>
      {/* Relocated AI Strategy Insight Floating Trigger (Bottom-Right corner with consistent z-index) */}
      {!isOpen && (
        <div 
          id="ai-strategy-insight-floating-container"
          className="AI-Co-Pilot-Floating-Component fixed bottom-6 right-6 z-30 pointer-events-auto select-none"
        >
          <button
            id="ai-strategy-insight-floating-btn"
            onClick={onToggle}
            className={`px-4 py-2.5 rounded-full bg-zinc-950/95 backdrop-blur-xl border ${
              isTaskRunning 
                ? 'border-[#00F5D4] shadow-[0_0_30px_rgba(0,245,212,0.6)] animate-pulse' 
                : 'border-[#00F5D4]/40 shadow-[0_0_25px_rgba(0,245,212,0.3)]'
            } text-white hover:shadow-[0_0_35px_rgba(0,245,212,0.5)] hover:border-[#00F5D4] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 group cursor-pointer`}
            title={isTaskRunning ? "AI Task Running... Click to view Strategy Insights" : "Open AI Strategy Insights"}
          >
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-[#00F5D4] ${isTaskRunning ? 'animate-ping opacity-100' : 'animate-ping opacity-75'}`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F5D4]"></span>
            </span>
            <div className={`w-6 h-6 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] group-hover:scale-110 transition-all ${
              isTaskRunning ? 'animate-pulse shadow-[0_0_12px_#00F5D4] text-[#00F5D4]' : ''
            }`}>
              <i className={`fa-solid ${isTaskRunning ? 'fa-brain-circuit animate-pulse' : 'fa-chart-line'} text-xs`}></i>
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              AI Strategy Insight
              {isTaskRunning && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-ping"></span>
              )}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/30 text-[10px] font-mono font-bold text-[#00F5D4]">
              {isTaskRunning ? 'ANALYZING...' : `${metrics.score}%`}
            </span>
          </button>
        </div>
      )}

      {/* Main Strategy Insight Sidebar Container */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#070709]/95 backdrop-blur-2xl border-l border-white/10 z-50 transform transition-transform duration-300 ease-out flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.8)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between relative bg-gradient-to-r from-white/[0.03] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00F5D4]/20 via-[#C084FC]/20 to-[#FF007F]/20 border border-[#00F5D4]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,212,0.2)]">
              <i className="fa-solid fa-brain-circuit text-[#00F5D4] text-sm"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                  Strategy Insights
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00F5D4]/15 text-[#00F5D4] border border-[#00F5D4]/30">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] font-mono text-gray-400">Contextual Branding & Trends</p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            title="Close Strategy Sidebar"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Dynamic Brand Score Card */}
        <div className="p-5 border-b border-white/5 bg-black/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Manifest Resonance Index
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#00F5D4]">{metrics.score}/100</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10 relative">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] transition-all duration-500 shadow-[0_0_12px_rgba(0,245,212,0.5)]"
              style={{ width: `${metrics.score}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-gray-400">
            <span>Archetype: <strong className="text-white">{metrics.archetype}</strong></span>
            <span>Ratio: <strong className="text-[#C084FC]">{aspectRatio}</strong></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 p-2 gap-1.5">
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'branding'
                ? 'bg-[#FF007F]/15 border border-[#FF007F]/40 text-white shadow-[0_0_12px_rgba(255,0,127,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-crown text-[10px] text-[#FF007F]"></i>
            Branding
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'trends'
                ? 'bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-white shadow-[0_0_12px_rgba(0,245,212,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-bolt text-[10px] text-[#00F5D4]"></i>
            Trends 2026
          </button>
          <button
            onClick={() => setActiveTab('hooks')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'hooks'
                ? 'bg-[#C084FC]/15 border border-[#C084FC]/40 text-white shadow-[0_0_12px_rgba(192,132,252,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-sparkles text-[10px] text-[#C084FC]"></i>
            Quick Inject
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* TAB 1: BRANDING STRATEGY */}
          {activeTab === 'branding' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Archetype Showcase */}
              <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: metrics.vibeColor }}></span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-300">
                    Detected Voice Archetype
                  </span>
                </div>
                <h4 className="text-base font-serif font-black italic text-white mb-1.5">
                  {metrics.archetype}
                </h4>
                <p className="text-xs text-gray-400 font-light leading-relaxed">
                  Engineered to evoke authority and distinct cultural weight for <span className="text-white font-medium">{brief.name || 'your brand'}</span> in the <span className="text-white font-medium">{brief.industry || 'creator'}</span> space.
                </p>
              </div>

              {/* Contextual Advice Cards */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">
                  Contextual Recommendations
                </span>
                {contextualTips.map((tip, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-white/20 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <i className={`fa-solid ${tip.icon} text-xs text-[#00F5D4]`}></i>
                        <h5 className="text-xs font-mono font-bold">{tip.title}</h5>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {tip.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-light leading-relaxed">
                      {tip.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Color Psychology Bar */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">
                  Color Frequency & Psychology
                </span>
                <div className="flex h-6 rounded-lg overflow-hidden border border-white/10">
                  <div className="w-1/3 bg-[#FF007F] flex items-center justify-center text-[9px] font-mono font-bold text-black" title="Magenta / Sovereign Passion">#FF007F</div>
                  <div className="w-1/3 bg-[#C084FC] flex items-center justify-center text-[9px] font-mono font-bold text-black" title="Purple / Royal Innovation">#C084FC</div>
                  <div className="w-1/3 bg-[#00F5D4] flex items-center justify-center text-[9px] font-mono font-bold text-black" title="Teal / Futuristic Clarity">#00F5D4</div>
                </div>
                <p className="text-[10px] font-mono text-gray-400">
                  Tri-neon chromatic spectrum optimized for high OLED contrast and luxury perceived value.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TRENDS & VIRALITY */}
          {activeTab === 'trends' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Real-time Trend Velocity Radar */}
              <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-[#00F5D4]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00F5D4] flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-trend-up"></i> Velocity Signals 2026
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">Global Pulse</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                    <span className="text-gray-300 font-sans">Neo-Baroque Cyber Aesthetics</span>
                    <span className="text-[10px] font-mono font-bold text-[#00F5D4]">+48% Surge</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                    <span className="text-gray-300 font-sans">Micro-Drop Exclusivity Video</span>
                    <span className="text-[10px] font-mono font-bold text-[#C084FC]">+62% Engagement</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                    <span className="text-gray-300 font-sans">Binaural 8D Audio Intro Hooks</span>
                    <span className="text-[10px] font-mono font-bold text-[#FF007F]">+74% Retention</span>
                  </div>
                </div>
              </div>

              {/* Retention Blueprint */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white">
                  <i className="fa-solid fa-stopwatch text-xs text-[#FF007F]"></i>
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider">3-Second Hook Rule</h5>
                </div>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  {metrics.retentionAdvice}
                </p>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span>Target Drop-off: &lt;12%</span>
                  <span>Audio Sync: Immediate</span>
                </div>
              </div>

              {/* Dynamic Hashtag Cloud */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    High-Converting Tags
                  </span>
                  <span className="text-[9px] font-mono text-[#00F5D4]">Tap to copy</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopyTag(tag)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all border ${
                        copiedTag === tag
                          ? 'bg-[#00F5D4] text-black border-[#00F5D4] font-bold'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:border-[#00F5D4]/40 hover:text-white'
                      }`}
                    >
                      {copiedTag === tag ? '✓ Copied!' : tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUICK INJECT DIRECTIVES */}
          {activeTab === 'hooks' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-1">
                  1-Click Strategy Directives
                </span>
                <p className="text-xs text-gray-500 font-light">
                  Tap to inject high-performing vocabulary and target archetypes directly into your brief.
                </p>
              </div>

              {/* Vibe Enhancers */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF007F]">
                  Enhance Atmosphere / Vibe
                </span>
                <div className="grid gap-2">
                  {[
                    'Cyber Elegance & High-Frequency Haute Couture',
                    'Sovereign Neo-Royal Minimalist Obsidian',
                    'Atmospheric Synthwave & Ethereal Gospel Resonance',
                    'Hyper-Futuristic Digital Atelier & Raw 35mm Grain'
                  ].map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => onApplyVibeSuggestion && onApplyVibeSuggestion(sugg)}
                      className="text-left p-3 rounded-xl bg-black/60 border border-white/10 hover:border-[#FF007F]/40 hover:bg-[#FF007F]/10 text-xs text-gray-300 hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">{sugg}</span>
                      <i className="fa-solid fa-plus text-[10px] text-[#FF007F] opacity-60 group-hover:opacity-100 shrink-0 ml-2"></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience Enhancers */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00F5D4]">
                  Sharpen Target Audience
                </span>
                <div className="grid gap-2">
                  {[
                    'Global luxury fashion collectors, autonomous AI creators, and forward-thinking venture leaders seeking unapologetic prestige.',
                    'Gen-Z digital nomads, music producers, and underground creative visionaries shaping sovereign media.',
                    'High-net-worth connoisseurs of bespoke visual design, bespoke audio mastering, and sovereign digital assets.'
                  ].map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => onApplyAudienceSuggestion && onApplyAudienceSuggestion(sugg)}
                      className="text-left p-3 rounded-xl bg-black/60 border border-white/10 hover:border-[#00F5D4]/40 hover:bg-[#00F5D4]/10 text-xs text-gray-300 hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="line-clamp-2">{sugg}</span>
                      <i className="fa-solid fa-plus text-[10px] text-[#00F5D4] opacity-60 group-hover:opacity-100 shrink-0 ml-2"></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Action */}
        <div className="p-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-ping"></span>
            <span>Syncing with Neural Oracle</span>
          </div>
          <button
            onClick={onToggle}
            className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[10px] font-mono uppercase tracking-wider transition-colors"
          >
            Dock Panel
          </button>
        </div>
      </aside>
    </>
  );
};

export default StrategyInsightSidebar;
