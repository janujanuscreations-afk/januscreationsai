import React, { useState, useRef, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { updateUserFaceAvatar, saveUserProfile, getSavedUserProfile, USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';

interface ChangeFaceAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onAvatarUpdated: (newAvatarUrl: string) => void;
}

export const ChangeFaceAvatarModal: React.FC<ChangeFaceAvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onAvatarUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets'>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'none' | 'cyber' | 'warm' | 'noir' | 'vivid'>('none');
  const [isSaving, setIsSaving] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggested high quality aesthetic avatar presets
  const presetAvatars = [
    USER_OFFICIAL_FACE_AVATAR,
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80'
  ];

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.warn('Camera stream play prevented:', err));
      }
      bossAudio.playSubtlePing();
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. You can upload a photo from your files or select a preset below.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Capture Snapshot from Camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          executeSnap();
          return null;
        }
        return prev - 1;
      });
    }, 800);
  };

  const executeSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const rawSize = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    const targetSize = Math.min(rawSize, 400); // 400x400 is ideal avatar size (<60KB)
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Center crop square and downscale
      const sx = ((video.videoWidth || rawSize) - rawSize) / 2;
      const sy = ((video.videoHeight || rawSize) - rawSize) / 2;
      ctx.drawImage(video, sx, sy, rawSize, rawSize, 0, 0, targetSize, targetSize);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setCapturedImage(dataUrl);
      bossAudio.playTipChime(100);
      triggerNeonExplosion({
        particleCount: 40,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'medium'
      });
    }
  };

  // Handle File Upload with automatic downscaling to compact avatar size (<60KB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (rawResult) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const minDim = Math.min(img.width, img.height);
          const targetDim = Math.min(minDim, 400);
          canvas.width = targetDim;
          canvas.height = targetDim;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetDim, targetDim);
            const optimized = canvas.toDataURL('image/jpeg', 0.82);
            setCapturedImage(optimized);
          } else {
            setCapturedImage(rawResult);
          }
        };
        img.src = rawResult;
        bossAudio.playSubtlePing();
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Face Avatar
  const handleApplyFaceAvatar = async () => {
    const finalImage = capturedImage || currentAvatar;
    if (!finalImage) return;

    setIsSaving(true);
    try {
      updateUserFaceAvatar(finalImage);
      onAvatarUpdated(finalImage);
    } catch (e) {
      console.warn('Avatar apply warning:', e);
    }

    bossAudio.playTipChime(150);
    triggerNeonExplosion({
      particleCount: 75,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });

    setTimeout(() => {
      setIsSaving(false);
      stopCamera();
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass max-w-xl w-full rounded-[2.5rem] border border-[#00F5D4]/40 bg-zinc-950 p-6 sm:p-8 space-y-6 shadow-[0_0_80px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] animate-ping"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#00F5D4]">
                Creator Face & Bio Avatar
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black italic text-white">
              Set Your Face On Your Bio
            </h2>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-black/70 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              setActiveTab('camera');
              setCapturedImage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-[#00F5D4] text-black font-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-camera"></i>
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#C084FC] text-black font-black shadow-[0_0_15px_rgba(192,132,252,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-upload"></i>
            <span>Upload Photo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('presets');
              stopCamera();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-gradient-to-r from-[#FF007F] to-[#00F5D4] text-black font-black shadow-[0_0_15px_rgba(255,0,127,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Presets</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Mode */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative aspect-square max-w-[340px] mx-auto rounded-[2rem] overflow-hidden border-2 border-[#00F5D4]/40 bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
              
              {!capturedImage ? (
                <>
                  {isCameraActive && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onError={(e) => console.warn('Avatar camera feed notice:', e)}
                      className={`w-full h-full object-cover -scale-x-100 ${
                        previewFilter === 'cyber' ? 'hue-rotate-90 saturate-200' :
                        previewFilter === 'warm' ? 'sepia contrast-125' :
                        previewFilter === 'noir' ? 'grayscale contrast-150' :
                        previewFilter === 'vivid' ? 'saturate-150 contrast-110' : ''
                      }`}
                    />
                  )}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                      <span className="text-8xl font-serif font-black italic text-[#00F5D4] animate-ping">
                        {countdown}
                      </span>
                    </div>
                  )}

                  {cameraError && (
                    <div className="p-6 text-center space-y-3 relative z-20">
                      <i className="fa-solid fa-video-slash text-4xl text-[#FF007F]"></i>
                      <p className="text-xs font-mono text-gray-300">{cameraError}</p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase cursor-pointer"
                      >
                        Switch to Upload
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={capturedImage}
                    alt="Captured Selfie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#00F5D4]/50 text-[#00F5D4] text-[10px] font-mono font-bold">
                    ✓ Snapshot Ready
                  </div>
                </div>
              )}

              {/* Viewfinder Overlay Frame */}
              <div className="absolute inset-4 border border-white/20 rounded-[1.5rem] pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-[10px] font-mono text-white/50">
                  <span>[ BIO FACE SCAN ]</span>
                  <span>9:16 SQ</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-white/50">
                  <span>JANU AI</span>
                  <span>SOVEREIGN</span>
                </div>
              </div>
            </div>

            {/* Hidden capture canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Controls */}
            <div className="flex items-center justify-center gap-3">
              {!capturedImage ? (
                <button
                  onClick={handleCaptureSnapshot}
                  disabled={!isCameraActive}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_25px_rgba(0,245,212,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <i className="fa-solid fa-circle-dot text-sm animate-pulse"></i>
                  <span>Take Selfie Snapshot</span>
                </button>
              ) : (
                <button
                  onClick={() => setCapturedImage(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>Retake</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Upload Photo File */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-[#C084FC] rounded-[2rem] p-8 text-center transition-all bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer group space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {capturedImage ? (
                <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border-2 border-[#C084FC] shadow-lg">
                  <img src={capturedImage} alt="Uploaded Face" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-mono font-bold text-white">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#C084FC]/15 text-[#C084FC] border border-[#C084FC]/30 mx-auto flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-mono font-bold text-white">Click or drag & drop your face photo</h4>
                    <p className="text-xs font-mono text-gray-400 mt-1">Supports JPG, PNG, WEBP, or HEIC format</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Presets Selector */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <p className="text-xs font-mono text-gray-400 text-center">
              Choose an executive sovereign portrait style for your profile & bio
            </p>
            <div className="grid grid-cols-3 gap-3">
              {presetAvatars.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCapturedImage(url);
                    bossAudio.playSubtlePing();
                  }}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    capturedImage === url
                      ? 'border-[#00F5D4] scale-105 shadow-[0_0_20px_rgba(0,245,212,0.5)]'
                      : 'border-white/10 hover:border-white/40'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  {capturedImage === url && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#00F5D4] text-black flex items-center justify-center text-[10px] font-black shadow-md">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyFaceAvatar}
            disabled={!capturedImage || isSaving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_25px_rgba(0,245,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Applying To Bio...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-check"></i>
                <span>Save Face On Bio & Profile</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChangeFaceAvatarModal;
