import React, { useState } from 'react';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    sendPasswordReset,
    clearError
  } = useFirebaseAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearError();
    try {
      bossAudio.playLevelUp();
      const res = await signInWithGoogle();
      if (res) {
        triggerNeonExplosion({
          particleCount: 50,
          origin: { x: 0.5, y: 0.5 },
          intensity: 'high'
        });
        setSuccessMessage(`Welcome, ${res.displayName || res.email}! Session connected via Google.`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      bossAudio.playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearError();

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res) {
          bossAudio.playLaserBeep();
          triggerNeonExplosion({
            particleCount: 40,
            origin: { x: 0.5, y: 0.5 },
            intensity: 'medium'
          });
          setSuccessMessage(`Welcome back, ${res.displayName || res.email}!`);
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else if (mode === 'signup') {
        const res = await signUpWithEmail(email, password, displayName || undefined);
        if (res) {
          bossAudio.playLevelUp();
          triggerNeonExplosion({
            particleCount: 60,
            origin: { x: 0.5, y: 0.5 },
            intensity: 'high'
          });
          setSuccessMessage(`Account created successfully! Logged in as ${res.email}.`);
          setTimeout(() => {
            onClose();
          }, 1400);
        }
      } else if (mode === 'reset') {
        await sendPasswordReset(email);
        bossAudio.playCashChime();
        setSuccessMessage(`Password reset link dispatched to ${email}. Check your inbox!`);
      }
    } catch (err: any) {
      bossAudio.playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      bossAudio.playLaserBeep();
      await logout();
      setSuccessMessage('Logged out securely.');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#0A0A10] border border-white/15 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Glow Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F5D4]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C084FC]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F5D4] to-[#C084FC] text-black flex items-center justify-center font-black text-lg shadow-[0_0_20px_rgba(0,245,212,0.4)]">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-black italic text-white tracking-tight">
                  Firebase Authentication
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-[9px] font-mono font-bold">
                  LIVE SESSION
                </span>
              </div>
              <p className="text-xs font-mono text-gray-400 font-light mt-0.5">
                Managed authentication with Google & Email/Password
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 relative z-10 custom-scrollbar">
          {/* Active User Session Card (if logged in) */}
          {isAuthenticated && user ? (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-14 h-14 rounded-2xl object-cover border border-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.3)]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00F5D4] to-[#C084FC] text-black font-black text-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,245,212,0.3)]">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00F5D4] border-2 border-[#0A0A10]" title="Authenticated" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-serif font-black italic text-white truncate">
                      {user.displayName || userProfile?.name || 'Janu Creator'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-[#00F5D4]/15 border border-[#00F5D4]/30 text-[#00F5D4] text-[9px] font-mono font-bold">
                      {user.providerData[0]?.providerId === 'google.com' ? 'GOOGLE' : 'PASSWORD'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-300 truncate mt-0.5">
                    {user.email || 'No email attached'}
                  </p>
                  <p className="text-[10px] font-mono text-gray-500 truncate mt-1">
                    UID: <span className="font-mono text-gray-400">{user.uid}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-gray-400 block text-[10px] uppercase">Email Verification</span>
                  <span className={`font-bold ${user.emailVerified ? 'text-[#00F5D4]' : 'text-[#FCD34D]'}`}>
                    {user.emailVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-gray-400 block text-[10px] uppercase">Auth Provider</span>
                  <span className="font-bold text-white">
                    {user.providerData[0]?.providerId || 'firebase'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isSubmitting || loading}
                  className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-400 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <span>{isSubmitting ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Google Fast Sign-In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting || loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-100 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 text-xs font-mono text-gray-500 uppercase">
                <div className="flex-1 h-[1px] bg-white/10"></div>
                <span>or email & password</span>
                <div className="flex-1 h-[1px] bg-white/10"></div>
              </div>

              {/* Auth Mode Toggle Tabs */}
              <div className="flex rounded-xl bg-black/60 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); clearError(); setSuccessMessage(null); }}
                  className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); clearError(); setSuccessMessage(null); }}
                  className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('reset'); clearError(); setSuccessMessage(null); }}
                  className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                    mode === 'reset'
                      ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Reset
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-gray-400 font-bold block">
                      Creator Display Name
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. January Rebl"
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono placeholder:text-gray-600 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-gray-400 font-bold block">
                    Email Address
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="creator@januscreations.ai"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono placeholder:text-gray-600 transition-colors"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-gray-400 font-bold block">
                      Password
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#00F5D4] focus:outline-none text-white text-xs font-mono placeholder:text-gray-600 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:opacity-95 active:scale-[0.99] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <i className={`fa-solid ${mode === 'signin' ? 'fa-arrow-right-to-bracket' : mode === 'signup' ? 'fa-user-plus' : 'fa-paper-plane'}`}></i>
                      <span>
                        {mode === 'signin' ? 'Sign In to Studio' : mode === 'signup' ? 'Create Creator Account' : 'Send Reset Link'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono space-y-3">
              <div className="flex items-start gap-2.5">
                <i className="fa-solid fa-triangle-exclamation mt-0.5 text-red-400 text-sm shrink-0"></i>
                <span className="flex-1 leading-relaxed text-red-300">
                  {error.includes('auth/operation-not-allowed')
                    ? 'Email/Password sign-in is not enabled in your Firebase project (janu-s-creations-11bb3).'
                    : error}
                </span>
              </div>

              {(error.includes('operation-not-allowed') || error.includes('not enabled')) && (
                <div className="pt-2 border-t border-red-500/20 space-y-2">
                  <p className="text-[11px] text-gray-300 leading-normal">
                    <strong>Quick Fix:</strong> Click below to sign in instantly using your Google account (<span className="text-white">janujanuscreations@gmail.com</span>), or enable Email/Password in your Firebase Console.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={isSubmitting || loading}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-[11px] tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Sign In with Google Instead</span>
                    </button>
                    <a
                      href="https://console.firebase.google.com/project/janu-s-creations-11bb3/authentication/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] tracking-wider uppercase transition-all flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-gear text-xs"></i>
                      <span>Firebase Console</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-xs font-mono flex items-start gap-2.5">
              <i className="fa-solid fa-circle-check mt-0.5 text-sm shrink-0"></i>
              <span className="flex-1 leading-relaxed">{successMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-black/50 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-500">
          <span>Project: <strong className="text-gray-400">janu-s-creations-11bb3</strong></span>
          <span className="flex items-center gap-1.5 text-[#00F5D4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse"></span>
            Firestore Secured
          </span>
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuthModal;
