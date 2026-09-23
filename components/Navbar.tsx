
import React, { useState, useEffect } from 'react';
import JCLogo from './Logo';
import AmbientSoundscapePill from './AmbientSoundscapePill';
import { getSavedUserProfile, subscribeUserProfile } from '../utils/userProfileState';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import FirebaseAuthModal from './FirebaseAuthModal';

export type AppViewType = 'home' | 'creator' | 'profile';

interface NavbarProps {
  onNavigate: (view: AppViewType, tab?: string) => void;
  currentView: AppViewType;
  onOpenSettings?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSintraEmbed?: () => void;
  onScrollToStudio?: (e?: React.MouseEvent) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onNavigate, 
  currentView, 
  onOpenSettings, 
  onOpenCommandPalette, 
  onOpenSintraEmbed,
  onScrollToStudio
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState(() => getSavedUserProfile());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated, isAnonymous } = useFirebaseAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    const unsubscribe = subscribeUserProfile((updated) => {
      setUserProfile(updated);
    });
    const handleOpenAuthModal = () => {
      setShowAuthModal(true);
    };
    window.addEventListener('open-auth-modal', handleOpenAuthModal);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-auth-modal', handleOpenAuthModal);
      unsubscribe();
    };
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-700 ${isScrolled || currentView !== 'home' ? 'py-4 bg-black/90 backdrop-blur-3xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' : 'py-8 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Executive JC Logo with "Janu's Creations" in background */}
        <div className="flex items-center gap-4">
          <JCLogo 
            size="md"
            onClick={() => onNavigate('home')} 
          />

          {/* Embedded Ambient Soundscape Focus Pill */}
          {onOpenSettings && (
            <div className="hidden xl:block">
              <AmbientSoundscapePill onOpenSettings={onOpenSettings} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-5 md:gap-8">
          <button 
            onClick={() => onNavigate('home')}
            className={`text-xs font-mono font-bold uppercase tracking-[0.3em] transition-all hover:text-white relative py-2 ${currentView === 'home' ? 'text-white drop-shadow-[0_0_8px_rgba(0,255,224,0.6)]' : 'text-gray-400'}`}
          >
            Home
            {currentView === 'home' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] shadow-[0_0_10px_#00FFE0]"></span>
            )}
          </button>
          
          <button 
            onClick={() => onNavigate('creator', 'feed')}
            className={`text-xs font-mono font-bold uppercase tracking-[0.3em] transition-all hover:text-white relative py-2 flex items-center gap-1.5 ${currentView === 'creator' ? 'text-[#00FFE0] drop-shadow-[0_0_8px_#00FFE0]' : 'text-gray-400'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] animate-ping shadow-[0_0_8px_#FF007F]"></span>
            <span>Live Feed</span>
          </button>

          <button 
            onClick={() => onNavigate('creator')}
            className={`text-xs font-mono font-bold uppercase tracking-[0.3em] transition-all hover:text-white relative py-2 ${currentView === 'creator' ? 'text-[#00FFE0] drop-shadow-[0_0_8px_#00FFE0]' : 'text-gray-400'}`}
          >
            Creators Hub
            {currentView === 'creator' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F] shadow-[0_0_10px_#00FFE0]"></span>
            )}
          </button>

          <button 
            onClick={() => onNavigate('profile')}
            className={`text-xs font-mono font-bold uppercase tracking-[0.3em] transition-all hover:text-white relative py-2 flex items-center gap-2 ${currentView === 'profile' ? 'text-[#E056FD] drop-shadow-[0_0_8px_#E056FD]' : 'text-gray-400'}`}
          >
            {userProfile?.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt="My Face" 
                className="w-5 h-5 rounded-full object-cover border border-[#E056FD] shadow-[0_0_10px_rgba(224,86,253,0.8)]" 
              />
            ) : null}
            <span>Creator Profile</span>
            {currentView === 'profile' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#E056FD] via-[#FF007F] to-[#00FFE0] shadow-[0_0_10px_#E056FD]"></span>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (currentView === 'home') {
                if (onScrollToStudio) {
                  onScrollToStudio(e);
                } else {
                  document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
                }
              } else {
                onNavigate('creator', 'ai-studio');
              }
            }}
            className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-[#00FFE0] hover:drop-shadow-[0_0_8px_#00FFE0] transition-all py-2 cursor-pointer flex items-center gap-1.5"
            title="AI Multi-Modal Super-Studio (Veo 3, Lyria Music, Gemini Chat, Image Alchemist)"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[10px] text-[#00FFE0] animate-pulse"></i>
            <span className="hidden sm:inline">AI Studio</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Firebase Authentication Status & Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border ${
              isAuthenticated && user
                ? 'bg-[#00F5D4]/10 hover:bg-[#00F5D4]/20 border-[#00F5D4]/40 text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.2)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
            }`}
            title={isAuthenticated && user ? `Logged in as ${user.email || user.displayName}` : 'Firebase Authentication (Google & Email/Password)'}
          >
            {isAuthenticated && user ? (
              <>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-4 h-4 rounded-full object-cover border border-[#00F5D4]"
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse"></span>
                )}
                <span className="max-w-[85px] sm:max-w-[120px] truncate">
                  {user.displayName || (user.email ? user.email.split('@')[0] : 'Account')}
                </span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-shield-halved text-[#00F5D4] text-xs"></i>
                <span className="hidden sm:inline">Sign In</span>
              </>
            )}
          </button>

          {/* Quick Switcher Command Palette Trigger (Cmd+K) */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00FFE0]/50 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-mono group hover:shadow-[0_0_15px_rgba(0,255,224,0.25)]"
              title="Global Command Palette (⌘K / Ctrl+K)"
            >
              <i className="fa-solid fa-magnifying-glass text-xs text-[#00FFE0] group-hover:scale-110 transition-transform"></i>
              <span className="hidden sm:inline text-[11px] text-gray-400 group-hover:text-white font-medium">Tools</span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-[#00FFE0] rounded border border-white/10">⌘K</kbd>
            </button>
          )}

          {/* Embed on Sintra Website Trigger */}
          {onOpenSintraEmbed && (
            <button
              onClick={onOpenSintraEmbed}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4]/15 to-[#C084FC]/15 hover:from-[#00F5D4]/25 hover:to-[#C084FC]/25 border border-[#00F5D4]/40 text-[#00F5D4] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono group hover:shadow-[0_0_15px_rgba(0,245,212,0.3)]"
              title="Embed App on januscreations.sintra.site"
            >
              <i className="fa-solid fa-code text-xs text-[#00F5D4] group-hover:scale-110 transition-transform"></i>
              <span className="hidden md:inline text-[11px] font-bold">Embed Site</span>
            </button>
          )}

          {/* Studio Settings Gear Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#00FFE0]/50 text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm group hover:shadow-[0_0_15px_rgba(0,255,224,0.3)]"
              title="Studio Settings & Ambient Soundscape (⌘, / Focus Audio)"
            >
              <i className="fa-solid fa-sliders text-sm text-[#00FFE0] group-hover:rotate-45 transition-transform drop-shadow-[0_0_6px_#00FFE0]"></i>
            </button>
          )}

          <button 
            type="button"
            onClick={() => onNavigate('creator', 'live')}
            className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] p-[1px] rounded-full transition-all duration-300 hover:scale-105 active:scale-95 group shadow-[0_0_25px_rgba(255,0,127,0.5)] cursor-pointer"
          >
            <div className="px-3 py-1.5 sm:px-5 sm:py-2 bg-black rounded-full transition-colors group-hover:bg-transparent">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-white group-hover:text-black transition-colors flex items-center gap-2">
                Go Live <i className="fa-solid fa-bolt text-[#00FFE0] group-hover:text-black text-xs"></i>
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Global Firebase Auth Modal */}
      <FirebaseAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </nav>
  );
};

export default Navbar;
