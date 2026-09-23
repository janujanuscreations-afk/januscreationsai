import React, { useState } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
  type?: 'reel' | 'photo' | 'music' | 'live' | 'contest';
  author?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  url = window.location.href,
  type = 'reel',
  author = "Janu's Sovereign Creator"
}) => {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [customCaption, setCustomCaption] = useState(
    `Check out "${title}" by ${author} on Janu's Creations! ⚡ The sovereign AI creator platform. ${url}`
  );

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    triggerNeonExplosion({
      particleCount: 30,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const platforms = [
    { name: 'X / Twitter', icon: 'fa-brands fa-x-twitter', color: 'hover:border-white hover:text-white', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(customCaption)}`, '_blank') },
    { name: 'TikTok', icon: 'fa-brands fa-tiktok', color: 'hover:border-[#00F5D4] hover:text-[#00F5D4]', action: handleCopy },
    { name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: 'hover:border-[#25D366] hover:text-[#25D366]', action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(customCaption)}`, '_blank') },
    { name: 'Telegram', icon: 'fa-brands fa-telegram', color: 'hover:border-[#229ED9] hover:text-[#229ED9]', action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank') },
    { name: 'Reddit', icon: 'fa-brands fa-reddit-alien', color: 'hover:border-[#FF4500] hover:text-[#FF4500]', action: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank') },
    { name: 'Copy Embed', icon: 'fa-solid fa-code', color: 'hover:border-[#C084FC] hover:text-[#C084FC]', action: () => {
      const embedCode = `<iframe src="${url}?embed=true" width="100%" height="600" frameborder="0" allow="autoplay; fullscreen"></iframe>`;
      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }}
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-[#00F5D4]/40 bg-zinc-950 max-w-lg w-full space-y-6 shadow-[0_0_60px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center text-[#00F5D4]">
              <i className="fa-solid fa-share-nodes text-lg"></i>
            </div>
            <div>
              <h3 className="text-lg font-serif font-black italic text-white tracking-tight">
                Share Sovereign Content
              </h3>
              <p className="text-[10px] font-mono text-gray-400">
                Type: <span className="text-[#00F5D4] uppercase font-bold">{type}</span> • {author}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Preview Mini Card */}
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5D4] to-[#C084FC] flex items-center justify-center text-black font-black text-xs shrink-0">
            {type === 'live' ? <i className="fa-solid fa-tower-broadcast animate-pulse"></i> : <i className="fa-solid fa-sparkles"></i>}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-mono font-bold text-white truncate">{title}</h4>
            <p className="text-[10px] font-mono text-gray-400 truncate">Janu's Creations • Distributed Network</p>
          </div>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30">
            Ready
          </span>
        </div>

        {/* 1-Click Copy Link Box */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
            Direct Sovereign Link
          </label>
          <div className="flex items-center gap-2 bg-black/80 border border-white/15 rounded-2xl p-1.5 pl-3">
            <i className="fa-solid fa-link text-xs text-[#00F5D4]"></i>
            <input 
              type="text" 
              readOnly 
              value={url}
              className="flex-1 bg-transparent text-xs font-mono text-gray-300 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                copied 
                  ? 'bg-[#00F5D4] text-black shadow-[0_0_15px_rgba(0,245,212,0.4)]' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Social Platforms Grid */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
            Instant Social Distribution
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {platforms.map((p, i) => (
              <button
                key={i}
                onClick={p.action}
                className={`p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1.5 text-xs font-mono transition-all cursor-pointer hover:scale-105 ${p.color}`}
              >
                <i className={`${p.icon} text-lg`}></i>
                <span className="text-[10px] font-bold">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Caption Box */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
            Share Caption (AI Optimized)
          </label>
          <textarea
            value={customCaption}
            onChange={(e) => setCustomCaption(e.target.value)}
            rows={2}
            className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-gray-200 outline-none focus:border-[#00F5D4] resize-none"
          />
        </div>

        {/* Footer note */}
        <div className="text-center pt-2 border-t border-white/10">
          <p className="text-[9px] font-mono text-gray-500">
            Every share tracks referral virality. Platform fees (15%) automatically routed to January Rebl.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
