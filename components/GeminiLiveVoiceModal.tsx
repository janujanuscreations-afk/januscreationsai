import React, { useState, useEffect, useRef } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';

interface GeminiLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiLiveVoiceModal: React.FC<GeminiLiveVoiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connecting to Live voice stream...');
  const [speakerState, setSpeakerState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [conversationLogs, setConversationLogs] = useState<Array<{ sender: 'user' | 'gemini'; text: string; time: string }>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (isOpen) {
      startLiveSession();
    } else {
      stopLiveSession();
    }
    return () => {
      stopLiveSession();
    };
  }, [isOpen]);

  // Convert Float32Array PCM to 16-bit little-endian base64 string
  const pcmFloatToBase64 = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  // Convert base64 PCM 24kHz chunk into audio buffer and schedule playback
  const play24kHzAudioChunk = (base64Audio: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;

    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startTime = Math.max(now, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      setSpeakerState('speaking');
      source.onended = () => {
        if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
          setSpeakerState('idle');
        }
      };
    } catch (e) {
      console.error('Audio chunk decode error:', e);
    }
  };

  const startLiveSession = async () => {
    setStatusMessage('Requesting microphone permissions...');
    try {
      // 1. Setup AudioContexts: 16kHz for input, 24kHz for output
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Connect WebSocket to backend Live route
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusMessage('Live Voice Link Active • Speak naturally');
        triggerNeonExplosion({ particleCount: 25, origin: { x: 0.5, y: 0.5 }, intensity: 'subtle' });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            play24kHzAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            // User spoke over the model - stop current playback
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setSpeakerState('listening');
          }
          if (msg.error) {
            setStatusMessage(`⚠️ ${msg.error}`);
          }
        } catch (e) {
          console.error('WS message error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WS error:', err);
        setStatusMessage('Voice link connection failed. Retrying...');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusMessage('Voice link closed');
      };

      // 3. Audio input stream processor
      const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
      const processor = inputAudioCtxRef.current.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Simple volume threshold to detect user speaking
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        const rms = Math.sqrt(sum / inputData.length);
        if (rms > 0.02) {
          setSpeakerState('listening');
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64Audio = pcmFloatToBase64(inputData);
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      source.connect(processor);
      processor.connect(inputAudioCtxRef.current.destination);

    } catch (err: any) {
      console.error('Live voice init failed:', err);
      setStatusMessage(`Microphone error: ${err?.message || 'Permission denied'}`);
    }
  };

  const stopLiveSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setSpeakerState('idle');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0A0A0E] border border-white/10 rounded-3xl p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col items-center text-center overflow-hidden">
        {/* Background Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-[#00F5D4]/15 via-[#C084FC]/20 to-[#38BDF8]/15 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all hover:bg-white/10 z-10"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[10px] font-mono font-bold uppercase text-[#00F5D4] tracking-widest">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00F5D4] animate-ping' : 'bg-rose-500'}`}></span>
          <span>Gemini 3.1 Flash Live API</span>
        </div>

        {/* Visual Pulse Orb */}
        <div className="relative my-8 flex items-center justify-center">
          {/* Ripple rings */}
          <div
            className={`absolute w-44 h-44 rounded-full border border-[#00F5D4]/30 transition-all duration-700 ${
              speakerState === 'speaking'
                ? 'scale-125 border-[#C084FC]/60 animate-pulse'
                : speakerState === 'listening'
                ? 'scale-110 border-[#00F5D4]/50'
                : 'scale-95 opacity-20'
            }`}
          ></div>
          <div
            className={`absolute w-36 h-36 rounded-full border border-[#C084FC]/40 transition-all duration-500 ${
              speakerState === 'speaking' ? 'scale-115' : 'scale-90 opacity-30'
            }`}
          ></div>

          {/* Central Sphere */}
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(0,245,212,0.4)] transition-all duration-500 ${
              speakerState === 'speaking'
                ? 'bg-gradient-to-tr from-[#C084FC] via-[#00F5D4] to-[#38BDF8] text-black scale-110 shadow-[0_0_60px_rgba(192,132,252,0.6)]'
                : speakerState === 'listening'
                ? 'bg-gradient-to-tr from-[#00F5D4] to-[#38BDF8] text-black shadow-[0_0_50px_rgba(0,245,212,0.5)]'
                : 'bg-[#181822] text-[#00F5D4] border border-[#00F5D4]/40'
            }`}
          >
            <i
              className={`fa-solid ${
                speakerState === 'speaking'
                  ? 'fa-waveform-lines animate-bounce'
                  : speakerState === 'listening'
                  ? 'fa-microphone text-2xl'
                  : 'fa-sparkles'
              }`}
            ></i>
          </div>
        </div>

        {/* State Label */}
        <h3 className="text-xl font-serif font-black italic text-white mb-2">
          {speakerState === 'speaking'
            ? "Gemini is Speaking..."
            : speakerState === 'listening'
            ? "Listening to You..."
            : "Voice Link Ready"}
        </h3>

        <p className="text-xs font-mono text-gray-400 max-w-sm mb-8 leading-relaxed">
          {statusMessage}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-4 z-10">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base transition-all border ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all"
          >
            <i className="fa-solid fa-phone-slash"></i>
            <span>End Call</span>
          </button>
        </div>

        {/* Live Audio Specs Footer */}
        <div className="mt-8 pt-4 border-t border-white/5 w-full flex items-center justify-center gap-4 text-[10px] font-mono text-gray-500">
          <span>Mic Input: 16kHz PCM</span>
          <span>•</span>
          <span>Model Voice: 24kHz Zephyr</span>
          <span>•</span>
          <span>Zero-Latency Stream</span>
        </div>
      </div>
    </div>
  );
};

export default GeminiLiveVoiceModal;
