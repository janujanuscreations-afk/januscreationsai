import React, { useState, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import BossVaultSecurityModal from './BossVaultSecurityModal';

interface BossVaultFloatingButtonProps {
  bossLedgerTotal?: number;
  onOpenFounderDashboard: () => void;
  onAuthenticateStateChange?: (isAuthenticated: boolean) => void;
  className?: string;
}

export const BossVaultFloatingButton: React.FC<BossVaultFloatingButtonProps> = ({
  bossLedgerTotal = 14580.00,
  onOpenFounderDashboard,
  onAuthenticateStateChange,
  className = ''
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Global Keyboard Shortcut: Cmd/Ctrl + B to toggle Boss Vault
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setShowSecurityModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSuccessfulAuth = () => {
    setIsAuthenticated(true);
    setShowSecurityModal(false);
    onAuthenticateStateChange?.(true);
    bossAudio.playVaultUnlock();
    triggerNeonExplosion({
      particleCount: 45,
      origin: { x: 0.15, y: 0.85 },
      intensity: 'medium'
    });
    showToast('✓ Boss Vault Authenticated (January Rebl)');
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated) {
      setIsAuthenticated(false);
      onAuthenticateStateChange?.(false);
      bossAudio.playSubtlePing();
      showToast('🔒 Boss Vault re-locked');
    } else {
      setShowSecurityModal(true);
    }
  };

  const handleQuickOneClickUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAuthenticated(true);
    onAuthenticateStateChange?.(true);
    bossAudio.playVaultUnlock();
    triggerNeonExplosion({
      particleCount: 30,
      origin: { x: 0.15, y: 0.85 },
      intensity: 'subtle'
    });
    showToast('⚡ Quick-Verified via Sovereign Identity');
  };

  return (
    <>
      {/* Floating Action Button (FAB) Container - Ergonomically positioned at bottom-left */}
      <div 
        id="boss-vault-fab-container"
        className={`fixed bottom-6 left-6 sm:bottom-8 sm:left-8 z-[280] group select-none ${className}`}
      >
        {/* Floating Mini Toast Alert */}
        {toastMsg && (
          <div className="absolute bottom-20 left-0 whitespace-nowrap bg-black/95 border border-[#00F5D4] text-[#00F5D4] px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(0,245,212,0.4)] flex items-center gap-2 text-xs font-mono font-bold animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Flyout Control Drawer when Hovered/Expanded */}
        {isExpanded && (
          <div className="absolute bottom-20 left-0 w-72 p-4 rounded-[2rem] bg-zinc-950/95 backdrop-blur-2xl border border-white/20 shadow-[0_0_50px_rgba(0,245,212,0.25)] animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-3">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isAuthenticated ? 'bg-[#00F5D4] shadow-[0_0_10px_#00F5D4]' : 'bg-[#FF007F] shadow-[0_0_10px_#ff007f]'}`}></div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-white">
                  Boss Vault Control
                </span>
              </div>
              <span className="text-[9px] font-mono text-gray-400 bg-white/10 px-2 py-0.5 rounded-md">
                ⌘B
              </span>
            </div>

            {/* Treasury Balance Summary */}
            <div className="p-3 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase text-gray-400 block font-bold">Treasury Pool</span>
                <span className="text-base font-mono font-black text-white">
                  ${bossLedgerTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono uppercase text-[#00F5D4] font-bold block">15% Cut</span>
                <span className="text-[10px] font-mono text-gray-300">Auto-Settled</span>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFounderDashboard();
                  setIsExpanded(false);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition-all flex items-center justify-between shadow-lg cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-crown text-xs"></i>
                  <span>Founder Dashboard</span>
                </span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>

              <button
                type="button"
                onClick={handleToggleLock}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  isAuthenticated
                    ? 'bg-white/5 border-red-500/30 text-red-400 hover:bg-red-500/10'
                    : 'bg-[#00F5D4]/10 border-[#00F5D4]/40 text-[#00F5D4] hover:bg-[#00F5D4]/20'
                }`}
              >
                <span className="flex items-center gap-2">
                  <i className={`fa-solid ${isAuthenticated ? 'fa-lock' : 'fa-fingerprint'}`}></i>
                  <span>{isAuthenticated ? 'Lock Vault (Exit Session)' : 'Biometric Verification'}</span>
                </span>
                <i className="fa-solid fa-chevron-right text-[9px] opacity-70"></i>
              </button>

              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={handleQuickOneClickUnlock}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-bolt text-[#00F5D4] text-[9px]"></i>
                  <span>Quick-Verify (January Rebl)</span>
                </button>
              )}
            </div>

            {/* Security Protocol Footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-gray-500">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-shield-halved text-[#00F5D4]"></i>
                <span>256-Bit Escrow Gate</span>
              </span>
              <button 
                type="button" 
                onClick={() => setIsExpanded(false)}
                className="hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Ergonomic Floating Capsule Pill Button */}
        <div className="flex items-center gap-2">
          
          {/* Main FAB Orb / Pill */}
          <button
            type="button"
            id="boss-vault-fab-trigger"
            onClick={() => setIsExpanded(!isExpanded)}
            onDoubleClick={() => setShowSecurityModal(true)}
            className={`relative p-0.5 rounded-full transition-all duration-300 cursor-pointer shadow-2xl hover:scale-105 active:scale-95 flex items-center ${
              isAuthenticated
                ? 'bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] shadow-[0_0_30px_rgba(0,245,212,0.4)]'
                : 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] shadow-[0_0_25px_rgba(255,0,127,0.35)]'
            }`}
            title="Boss Vault Authentication FAB (Click to open menu, Double-click for Biometric Gate)"
          >
            <div className="h-14 px-4 sm:px-5 rounded-full bg-zinc-950 flex items-center gap-3 relative overflow-hidden">
              
              {/* Internal Ambient Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
              <div className={`absolute -inset-1 blur-sm animate-pulse opacity-40 ${isAuthenticated ? 'bg-[#00F5D4]' : 'bg-[#FF007F]'}`}></div>

              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm relative z-10 transition-transform duration-300 group-hover:scale-110 ${
                isAuthenticated 
                  ? 'bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/50 shadow-[0_0_10px_#00F5D4]' 
                  : 'bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/50 shadow-[0_0_10px_#ff007f]'
              }`}>
                <i className={`fa-solid ${isAuthenticated ? 'fa-unlock-keyhole' : 'fa-lock'}`}></i>
              </div>

              {/* Label & Status Text */}
              <div className="text-left relative z-10 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider text-white">
                    Boss Vault
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? 'bg-[#00F5D4] animate-ping' : 'bg-[#FF007F]'}`}></span>
                </div>
                <p className="text-[9px] font-mono text-gray-400 -mt-0.5">
                  {isAuthenticated ? 'Authenticated' : 'Locked • Tap FAB'}
                </p>
              </div>

              {/* Expand Chevron Icon */}
              <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-gray-400 relative z-10 ml-1 text-[10px] group-hover:text-white transition-colors">
                <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'up'}`}></i>
              </div>
            </div>
          </button>

          {/* Quick Direct Launch Shortcut Icon for Founder Dashboard */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFounderDashboard();
            }}
            className="w-11 h-11 rounded-full bg-black/80 hover:bg-black border border-white/20 hover:border-[#00F5D4] text-white hover:text-[#00F5D4] flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
            title="Direct Open Founder Treasury & PayPal Config"
          >
            <i className="fa-solid fa-crown text-xs text-[#FCD34D]"></i>
          </button>
        </div>
      </div>

      {/* Full Biometric / PIN Security Gate Modal */}
      {showSecurityModal && (
        <BossVaultSecurityModal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          onSuccess={handleSuccessfulAuth}
          actionTitle="Boss Vault Authentication & Payout Authorization"
          actionAmount={bossLedgerTotal}
          creatorHandle="@JanuaryRebl"
          requiredRole="Founder & Sovereign Boss"
        />
      )}
    </>
  );
};

export default BossVaultFloatingButton;
