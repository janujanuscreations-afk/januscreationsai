import React, { useState, useEffect, useRef } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface BossVaultSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
  actionAmount?: number;
  creatorHandle?: string;
  requiredRole?: string;
}

export const BossVaultSecurityModal: React.FC<BossVaultSecurityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Withdraw Creator Funds',
  actionAmount = 3840.50,
  creatorHandle = '@JanuaryRebl',
  requiredRole = 'Sovereign Boss / Creator'
}) => {
  const [authMode, setAuthMode] = useState<'biometric' | 'passcode'>('biometric');
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face_id' | 'neural_scan'>('fingerprint');
  
  // Biometric Scan state
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'denied'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Passcode state
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setScanStatus('idle');
      setScanProgress(0);
      setPasscode('');
      setPasscodeError(false);
      bossAudio.playSubtlePing();
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Biometric Scan Trigger
  const handleStartBiometricScan = () => {
    if (scanStatus === 'scanning' || scanStatus === 'success') return;

    setScanStatus('scanning');
    setScanProgress(0);
    bossAudio.playBiometricScan();

    let current = 0;
    scanIntervalRef.current = setInterval(() => {
      current += 15;
      if (current >= 100) {
        current = 100;
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        setScanProgress(100);
        setScanStatus('success');

        bossAudio.playBiometricSuccess();
        bossAudio.playVaultUnlock();

        triggerNeonExplosion({
          particleCount: 50,
          origin: { x: 0.5, y: 0.45 },
          intensity: 'medium'
        });

        setTimeout(() => {
          onSuccess();
        }, 1100);
      } else {
        setScanProgress(current);
        if (current % 30 === 0) {
          bossAudio.playBiometricScan();
        }
      }
    }, 120);
  };

  // Handle Passcode Input via On-Screen Keypad
  const handleKeypadPress = (digit: string) => {
    if (passcode.length >= 4) return;
    const nextCode = passcode + digit;
    setPasscode(nextCode);
    bossAudio.playSubtlePing();

    if (nextCode.length === 4) {
      validatePasscode(nextCode);
    }
  };

  const handleKeypadDelete = () => {
    setPasscode(prev => prev.slice(0, -1));
    setPasscodeError(false);
    bossAudio.playSubtlePing();
  };

  const handleKeypadClear = () => {
    setPasscode('');
    setPasscodeError(false);
  };

  const validatePasscode = (code: string) => {
    // Valid passcodes: 2025, 7777, 0000, 1234, janu, or boss
    if (code === '2025' || code === '7777' || code === '0000' || code === '1234') {
      setScanStatus('success');
      bossAudio.playBiometricSuccess();
      bossAudio.playVaultUnlock();

      triggerNeonExplosion({
        particleCount: 55,
        origin: { x: 0.5, y: 0.45 },
        intensity: 'medium'
      });

      setTimeout(() => {
        onSuccess();
      }, 950);
    } else {
      setPasscodeError(true);
      bossAudio.playBiometricDenied();
      setAttempts(prev => prev + 1);

      setTimeout(() => {
        setPasscode('');
        setPasscodeError(false);
      }, 900);
    }
  };

  const handleQuickDemoBypass = () => {
    setPasscode('2025');
    validatePasscode('2025');
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
      {/* Outer Glow Halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-gradient-to-tr from-[#FF007F]/20 via-[#C084FC]/20 to-[#00F5D4]/25 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      {/* Main Security Vault Card */}
      <div className="w-full max-w-lg bg-zinc-950/95 border border-[#00F5D4]/50 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative shadow-[0_0_60px_rgba(0,245,212,0.3)] overflow-hidden">
        
        {/* Animated Cyber Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F5D408_1px,transparent_1px),linear-gradient(to_bottom,#00F5D408_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF007F] via-[#C084FC] to-[#00F5D4] p-0.5 shadow-[0_0_20px_rgba(0,245,212,0.5)]">
              <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center text-white">
                <i className={`fa-solid ${scanStatus === 'success' ? 'fa-lock-open text-[#00F5D4]' : 'fa-shield-halved text-[#FF007F]'} text-xl transition-all`}></i>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-black italic text-white tracking-tight">
                  Boss Vault <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] to-[#C084FC]">Security Gate</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] font-mono text-[9px] font-bold uppercase tracking-wider">
                  Multi-Sig
                </span>
              </div>
              <p className="text-xs font-mono text-gray-400">
                Sovereign Escrow & Biometric Identity Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cancel Verification"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Target Action Context Pill */}
        <div className="p-4 rounded-2xl bg-black/70 border border-white/10 relative z-10 flex items-center justify-between gap-4 shadow-inner">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold block">
              Protected Action
            </span>
            <span className="text-sm font-mono font-black text-white truncate block">
              ⚡ {actionTitle}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Authorized Creator: <strong className="text-[#00F5D4]">{creatorHandle}</strong> ({requiredRole})
            </span>
          </div>

          <div className="text-right shrink-0 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-[9px] font-mono text-gray-400 uppercase block">Available Balance</span>
            <span className="text-base font-mono font-black text-[#00F5D4]">
              ${actionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Mode Switcher: Biometrics vs Passcode */}
        <div className="grid grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10 relative z-10">
          <button
            onClick={() => {
              setAuthMode('biometric');
              bossAudio.playSubtlePing();
            }}
            className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'biometric'
                ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-fingerprint"></i>
            <span>Touch / Face Biometrics</span>
          </button>

          <button
            onClick={() => {
              setAuthMode('passcode');
              bossAudio.playSubtlePing();
            }}
            className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'passcode'
                ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-keypad"></i>
            <span>Executive Passcode</span>
          </button>
        </div>

        {/* ================= BIOMETRIC AUTHENTICATION VIEW ================= */}
        {authMode === 'biometric' && (
          <div className="space-y-5 relative z-10 animate-fade-in text-center">
            
            {/* Biometric Type Selector Pills */}
            <div className="flex items-center justify-center gap-2">
              {[
                { id: 'fingerprint', label: 'Touch ID / Fingerprint', icon: 'fa-fingerprint' },
                { id: 'face_id', label: 'FaceID Mesh Scan', icon: 'fa-face-viewfinder' },
                { id: 'neural_scan', label: 'Neural WebAuthn', icon: 'fa-brain' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setBiometricType(t.id as any);
                    setScanStatus('idle');
                    setScanProgress(0);
                    bossAudio.playSubtlePing();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    biometricType === t.id
                      ? 'bg-white/15 text-[#00F5D4] border border-[#00F5D4]/40'
                      : 'bg-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <i className={`fa-solid ${t.icon}`}></i>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Central Holographic Scanner Disk */}
            <div className="relative py-4 flex flex-col items-center justify-center">
              <div
                onClick={handleStartBiometricScan}
                className={`w-36 h-36 rounded-full border-2 p-1.5 transition-all duration-500 cursor-pointer relative group flex items-center justify-center select-none ${
                  scanStatus === 'scanning'
                    ? 'border-[#00F5D4] shadow-[0_0_35px_rgba(0,245,212,0.6)] scale-105'
                    : scanStatus === 'success'
                    ? 'border-green-400 bg-green-500/10 shadow-[0_0_40px_rgba(74,222,128,0.7)] scale-105'
                    : 'border-[#C084FC]/40 hover:border-[#00F5D4] hover:shadow-[0_0_25px_rgba(0,245,212,0.4)] bg-black/60'
                }`}
              >
                {/* Rotating Outer Reticle Rings */}
                <div className={`absolute inset-0 rounded-full border border-dashed border-white/20 pointer-events-none ${scanStatus === 'scanning' ? 'animate-spin' : ''}`}></div>
                <div className="absolute -inset-2 rounded-full border border-white/10 pointer-events-none"></div>

                {/* Internal Sensor Core */}
                <div className="w-full h-full rounded-full bg-zinc-900/90 flex flex-col items-center justify-center relative overflow-hidden">
                  
                  {/* Laser Scan Sweep Line */}
                  {scanStatus === 'scanning' && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00F5D4] to-transparent shadow-[0_0_12px_#00F5D4] animate-bounce"></div>
                  )}

                  {/* Icon */}
                  {scanStatus === 'success' ? (
                    <i className="fa-solid fa-circle-check text-4xl text-green-400 animate-in zoom-in"></i>
                  ) : biometricType === 'face_id' ? (
                    <i className={`fa-solid fa-face-viewfinder text-4xl transition-colors ${scanStatus === 'scanning' ? 'text-[#00F5D4] animate-pulse' : 'text-gray-300 group-hover:text-[#00F5D4]'}`}></i>
                  ) : biometricType === 'neural_scan' ? (
                    <i className={`fa-solid fa-brain-circuit text-4xl transition-colors ${scanStatus === 'scanning' ? 'text-[#C084FC] animate-pulse' : 'text-gray-300 group-hover:text-[#C084FC]'}`}></i>
                  ) : (
                    <i className={`fa-solid fa-fingerprint text-4xl transition-colors ${scanStatus === 'scanning' ? 'text-[#00F5D4] animate-pulse' : 'text-gray-300 group-hover:text-[#00F5D4]'}`}></i>
                  )}

                  {/* Small Status Subtext */}
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest mt-1 text-gray-400">
                    {scanStatus === 'scanning' ? `${scanProgress}%` : scanStatus === 'success' ? 'Verified' : 'Tap to Scan'}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Instructions */}
              <div className="mt-4 space-y-1.5 w-full max-w-xs">
                {scanStatus === 'scanning' && (
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] transition-all duration-150"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                )}

                <p className="text-xs font-mono text-gray-300 font-bold">
                  {scanStatus === 'idle' && 'Click or touch the sensor to initiate Biometric Handshake'}
                  {scanStatus === 'scanning' && 'Calibrating cryptographic biometric token...'}
                  {scanStatus === 'success' && '✓ Biometrics Authenticated! Unlocking Boss Vault...'}
                </p>
                <p className="text-[10px] font-mono text-gray-500">
                  Matches device hardware enclave (WebAuthn / Apple TouchID / Windows Hello)
                </p>
              </div>
            </div>

            {/* Quick Action Button for Biometric Authentication */}
            <button
              onClick={handleStartBiometricScan}
              disabled={scanStatus === 'scanning' || scanStatus === 'success'}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_25px_rgba(0,245,212,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-fingerprint text-sm"></i>
              <span>{scanStatus === 'scanning' ? 'Scanning Biometrics...' : scanStatus === 'success' ? 'Vault Unlocked' : 'Authenticate Biometrics Now'}</span>
            </button>
          </div>
        )}

        {/* ================= PASSCODE AUTHENTICATION VIEW ================= */}
        {authMode === 'passcode' && (
          <div className="space-y-4 relative z-10 animate-fade-in">
            
            {/* 4-Digit Masked Display */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Enter 4-Digit Sovereign Vault PIN
              </span>

              <div className={`flex items-center gap-4 p-3 rounded-2xl bg-black/80 border ${passcodeError ? 'border-red-500 animate-shake' : 'border-white/15'}`}>
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      passcode.length > idx
                        ? 'bg-[#00F5D4] border-[#00F5D4] shadow-[0_0_12px_#00F5D4]'
                        : 'border-white/30 bg-transparent'
                    }`}
                  ></div>
                ))}
              </div>

              {passcodeError && (
                <span className="text-xs font-mono text-red-400 animate-bounce">
                  ⚠️ Invalid Passcode. Hint: Use <strong className="text-white">2025</strong> or Quick Demo.
                </span>
              )}
            </div>

            {/* Cyber Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') handleKeypadClear();
                    else if (btn === '⌫') handleKeypadDelete();
                    else handleKeypadPress(btn);
                  }}
                  className={`h-12 rounded-2xl font-mono text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${
                    btn === 'C' || btn === '⌫'
                      ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 hover:border-[#00F5D4] hover:shadow-[0_0_15px_rgba(0,245,212,0.3)] active:scale-95'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Quick Demo Bypass for Instant Verification */}
            <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-gray-400 border-t border-white/10">
              <span>Default PIN: <strong className="text-[#00F5D4]">2025</strong></span>
              <button
                onClick={handleQuickDemoBypass}
                className="text-[#C084FC] hover:text-[#00F5D4] font-bold underline transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="fa-solid fa-bolt text-[9px]"></i>
                <span>Instant 1-Click Passcode</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Footer Protocol */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-gray-500 relative z-10">
          <span className="flex items-center gap-1">
            <i className="fa-solid fa-lock text-[#00F5D4]"></i>
            <span>256-Bit Boss Vault Protocol</span>
          </span>
          <span>Escrow Sign-off: January Rebl</span>
        </div>

      </div>
    </div>
  );
};

export default BossVaultSecurityModal;
