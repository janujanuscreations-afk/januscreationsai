import React, { useState } from 'react';
import { bossAudio } from '../utils/soundEffects';
import { triggerNeonExplosion } from '../utils/confetti';

interface SintraEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SintraEmbedModal: React.FC<SintraEmbedModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'iframe' | 'floating' | 'button' | 'dns' | 'famous'>('iframe');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const DEV_URL = 'https://ais-dev-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app';
  const PRE_URL = 'https://ais-pre-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app';
  const [selectedUrlType, setSelectedUrlType] = useState<'dev' | 'pre' | 'current'>('dev');

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : DEV_URL;

  const appUrl = selectedUrlType === 'dev' ? DEV_URL : selectedUrlType === 'pre' ? PRE_URL : currentOrigin;
  const targetSite = 'januscreations.sintra.site';

  const fullPageIframeCode = `<!-- ============================================================ -->
<!-- Janu's Creations AI Studio — Embed for ${targetSite} & Famous.ai -->
<!-- Paste this code inside a 'Custom Code' or 'HTML' block -->
<!-- ============================================================ -->
<div class="jc-ai-studio-container" style="position: relative; width: 100%; min-height: 900px; height: 100vh; border-radius: 24px; overflow: hidden; background: #000; border: 1px solid rgba(0, 245, 212, 0.35); box-shadow: 0 25px 60px rgba(0, 245, 212, 0.18);">
  <iframe
    src="${appUrl}"
    title="Janu's Creations AI Studio"
    width="100%"
    height="100%"
    style="border: none; width: 100%; height: 100%; display: block;"
    allow="camera *; microphone *; geolocation *; clipboard-read; clipboard-write; autoplay; fullscreen; display-capture"
    sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
    loading="lazy"
  ></iframe>
</div>`;

  const floatingWidgetCode = `<!-- ============================================================ -->
<!-- Janu's Creations Floating AI Launcher for ${targetSite} & Famous.ai -->
<!-- Paste this into your Site Settings > Custom Code (Footer/Body) -->
<!-- ============================================================ -->
<div id="jc-floating-launcher-root">
  <button id="jc-launcher-btn" onclick="toggleJCDrawer()" style="position: fixed; bottom: 24px; right: 24px; z-index: 999999; padding: 14px 22px; border-radius: 50px; background: linear-gradient(135deg, #FF007F, #E056FD, #00FFE0); border: none; color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; box-shadow: 0 10px 30px rgba(0, 245, 212, 0.4); display: flex; align-items: center; gap: 8px; transition: transform 0.2s ease;">
    <span>⚡ Open AI Studio</span>
  </button>

  <div id="jc-drawer-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 1000000; justify-content: center; align-items: center; padding: 20px;">
    <div style="position: relative; width: 100%; max-width: 1200px; height: 90vh; background: #000; border-radius: 28px; border: 1px solid rgba(0,245,212,0.4); overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.9);">
      <button onclick="toggleJCDrawer()" style="position: absolute; top: 16px; right: 16px; z-index: 10; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
      <iframe src="${appUrl}" style="width: 100%; height: 100%; border: none;" allow="camera *; microphone *; geolocation *; clipboard-read; clipboard-write; autoplay; fullscreen; display-capture" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
    </div>
  </div>
</div>

<script>
  function toggleJCDrawer() {
    var modal = document.getElementById('jc-drawer-modal');
    if (!modal) return;
    modal.style.display = (modal.style.display === 'none' || !modal.style.display) ? 'flex' : 'none';
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('jc-drawer-modal');
      if (modal && modal.style.display === 'flex') modal.style.display = 'none';
    }
  });
</script>`;

  const directButtonCode = `<!-- ============================================================ -->
<!-- Janu's Creations Neon CTA Button for ${targetSite} -->
<!-- ============================================================ -->
<a 
  href="${appUrl}" 
  target="_blank" 
  rel="noopener noreferrer"
  style="display: inline-flex; align-items: center; gap: 10px; padding: 16px 36px; border-radius: 50px; background: linear-gradient(135deg, #00F5D4, #38BDF8, #C084FC); color: #000; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none; box-shadow: 0 15px 35px rgba(0, 245, 212, 0.4); transition: transform 0.2s, box-shadow 0.2s;"
  onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 20px 45px rgba(0, 245, 212, 0.6)';"
  onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 15px 35px rgba(0, 245, 212, 0.4)';"
>
  <span>Launch Janu's Creations AI Studio</span>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
</a>`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    bossAudio.playTipChime(150);
    triggerNeonExplosion({ particleCount: 50, intensity: 'medium' });
    setTimeout(() => setCopiedKey(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] bg-zinc-950 border border-[#00F5D4]/40 p-6 sm:p-10 shadow-[0_0_80px_rgba(0,245,212,0.2)] text-white space-y-8 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-base"></i>
        </button>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-xs font-mono font-bold uppercase tracking-widest">
            <i className="fa-solid fa-globe animate-pulse"></i>
            <span>Sintra Website Integration</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white tracking-tight">
            Add to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC]">{targetSite}</span>
          </h2>
          <p className="text-sm text-gray-300 font-light leading-relaxed max-w-2xl">
            Choose your preferred embed method below to seamlessly integrate your live AI Studio application into <span className="font-mono text-[#00F5D4]">{targetSite}</span> with full camera, voice, PayPal payouts, and AI capabilities.
          </p>
        </div>

        {/* Live URL Pill Bar & Selector */}
        <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold block">Selected Embed Target URL</span>
                <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/30 text-[#00F5D4] text-[9px] font-mono font-bold uppercase">
                  {selectedUrlType === 'dev' ? 'Development Instance' : selectedUrlType === 'pre' ? 'Shared / Preview Instance' : 'Active Origin'}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#00F5D4] break-all">{appUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(appUrl, 'url')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <i className={`fa-solid ${copiedKey === 'url' ? 'fa-check text-[#00F5D4]' : 'fa-copy'}`}></i>
                <span>{copiedKey === 'url' ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-[#00F5D4] hover:bg-[#00F5D4]/90 text-black text-xs font-mono font-black flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Open Live</span>
              </a>
            </div>
          </div>

          {/* Quick Switch Buttons between Dev & Shared App URLs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mr-1">Switch Instance:</span>
            <button
              onClick={() => setSelectedUrlType('dev')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedUrlType === 'dev'
                  ? 'bg-gradient-to-r from-[#FF007F] to-[#E056FD] text-white shadow-[0_0_12px_rgba(255,0,127,0.4)]'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Dev URL (Run.app)
            </button>
            <button
              onClick={() => setSelectedUrlType('pre')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedUrlType === 'pre'
                  ? 'bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black shadow-[0_0_12px_rgba(0,245,212,0.4)]'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Shared / Pre URL
            </button>
            {currentOrigin !== DEV_URL && currentOrigin !== PRE_URL && (
              <button
                onClick={() => setSelectedUrlType('current')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedUrlType === 'current'
                    ? 'bg-white text-black font-black'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                Current Browser Origin
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          {[
            { id: 'iframe', label: '1. Responsive Full Iframe', icon: 'fa-window-maximize' },
            { id: 'floating', label: '2. Floating AI Widget', icon: 'fa-comment-dots' },
            { id: 'button', label: '3. Neon CTA Button', icon: 'fa-square-arrow-up-right' },
            { id: 'dns', label: '4. Sintra Steps & DNS', icon: 'fa-list-check' },
            { id: 'famous', label: '5. Famous.ai & Button Diagnostics', icon: 'fa-wand-magic-sparkles' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black font-black shadow-lg shadow-[#00F5D4]/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'iframe' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Full Page Responsive Embed
                </h4>
                <p className="text-xs text-gray-400">
                  Best for embedding the entire studio as a dedicated page or full-width section on Sintra.
                </p>
              </div>
              <button
                onClick={() => handleCopy(fullPageIframeCode, 'iframe')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black text-xs font-mono font-black uppercase tracking-wider hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              >
                <i className={`fa-solid ${copiedKey === 'iframe' ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copiedKey === 'iframe' ? 'Copied Embed Code!' : 'Copy Iframe Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-black border border-white/15 text-[#00F5D4] font-mono text-xs max-h-64 overflow-auto custom-scrollbar leading-relaxed">
              {fullPageIframeCode}
            </pre>
          </div>
        )}

        {activeTab === 'floating' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Floating AI Studio Launcher
                </h4>
                <p className="text-xs text-gray-400">
                  Adds a floating bottom-right neon trigger button on your Sintra site that opens the studio in a popup overlay.
                </p>
              </div>
              <button
                onClick={() => handleCopy(floatingWidgetCode, 'floating')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black text-xs font-mono font-black uppercase tracking-wider hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              >
                <i className={`fa-solid ${copiedKey === 'floating' ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copiedKey === 'floating' ? 'Copied Widget Code!' : 'Copy Widget Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-black border border-white/15 text-[#C084FC] font-mono text-xs max-h-64 overflow-auto custom-scrollbar leading-relaxed">
              {floatingWidgetCode}
            </pre>
          </div>
        )}

        {activeTab === 'button' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Neon CTA Button Embed
                </h4>
                <p className="text-xs text-gray-400">
                  Adds a stylish neon launch button that links directly to your application in a new tab.
                </p>
              </div>
              <button
                onClick={() => handleCopy(directButtonCode, 'button')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black text-xs font-mono font-black uppercase tracking-wider hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              >
                <i className={`fa-solid ${copiedKey === 'button' ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copiedKey === 'button' ? 'Copied Button Code!' : 'Copy Button Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-black border border-white/15 text-[#38BDF8] font-mono text-xs max-h-64 overflow-auto custom-scrollbar leading-relaxed">
              {directButtonCode}
            </pre>
          </div>
        )}

        {activeTab === 'dns' && (
          <div className="space-y-6">
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Step-by-Step Sintra Implementation Guide
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                <span className="w-7 h-7 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] flex items-center justify-center font-mono font-bold text-xs">1</span>
                <h5 className="font-bold text-sm text-white">Open Sintra Editor</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Log in to your Sintra dashboard and navigate to the page editor for <span className="text-[#00F5D4] font-mono">januscreations.sintra.site</span>.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                <span className="w-7 h-7 rounded-full bg-[#C084FC]/20 border border-[#C084FC] text-[#C084FC] flex items-center justify-center font-mono font-bold text-xs">2</span>
                <h5 className="font-bold text-sm text-white">Add Custom HTML / Embed</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Click <strong>+ Add Block</strong>, select <strong>Embed / Custom Code</strong>, and paste the <strong>Iframe</strong> or <strong>Widget</strong> code from above.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                <span className="w-7 h-7 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8] flex items-center justify-center font-mono font-bold text-xs">3</span>
                <h5 className="font-bold text-sm text-white">Publish to Sintra</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Click <strong>Publish / Save</strong> on Sintra. The full interactive AI Studio and Creator Treasury will now be live on <span className="text-[#38BDF8] font-mono">januscreations.sintra.site</span>!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'famous' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 space-y-2">
              <div className="flex items-center gap-2 text-[#00F5D4] font-mono font-bold text-xs uppercase tracking-wider">
                <i className="fa-solid fa-circle-check"></i>
                Famous.ai / Website Builder Integration & Button Execution Guide
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                When embedding into site builders like <strong>Famous.ai</strong>, <strong>Sintra</strong>, or <strong>Webflow</strong>, buttons can fail or be blocked by restrictive container sandbox policies or missing permission delegates. Follow these exact fixes to ensure 100% button functionality:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] flex items-center justify-center text-xs">1</span>
                  Iframe Sandbox Permissions
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  If PayPal checkout, download buttons, or popups do not open, your builder's iframe must include the full sandbox directive:
                </p>
                <code className="block p-2.5 rounded-xl bg-black border border-white/10 font-mono text-[11px] text-[#00F5D4] break-all">
                  sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
                </code>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#C084FC]/20 border border-[#C084FC] text-[#C084FC] flex items-center justify-center text-xs">2</span>
                  Camera, Mic & Clipboard Permissions
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  To ensure the Face-Swap Camera, Audio Record, and Share/Copy buttons function without browser permission blocks:
                </p>
                <code className="block p-2.5 rounded-xl bg-black border border-white/10 font-mono text-[11px] text-[#C084FC] break-all">
                  allow="camera *; microphone *; geolocation *; clipboard-read; clipboard-write; autoplay; fullscreen; display-capture"
                </code>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#FF007F]/20 border border-[#FF007F] text-[#FF007F] flex items-center justify-center text-xs">3</span>
                  PayPal Live Cashout & Payouts
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  The Founder Dashboard "Execute Live Cashout" button triggers PayPal REST Batch Payouts. In live mode, your PayPal account must have a funded balance and the Payouts feature enabled in your PayPal Developer Dashboard.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8] flex items-center justify-center text-xs">4</span>
                  Direct Link Button Alternative
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  If your website builder restricts iframes completely, use the <strong>Neon CTA Button</strong> tab to add a high-converting standalone button that opens the full studio in a new tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-gray-400 font-mono">
            <i className="fa-solid fa-lock text-[#00F5D4] mr-2"></i>
            Frame security & CORS headers configured for <strong className="text-white">januscreations.sintra.site</strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SintraEmbedModal;
