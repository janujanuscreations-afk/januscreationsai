import React, { useState, useRef, useEffect } from 'react';
import { transcribeAudioAI } from '../services/geminiService';
import { triggerNeonExplosion } from '../utils/confetti';

interface AudioTranscribeStudioProps {
  onLyricsExported?: (lyrics: string) => void;
}

export const AudioTranscribeStudio: React.FC<AudioTranscribeStudioProps> = ({ onLyricsExported }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStartRecord = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1];
          setAudioBase64(base64);
          setAudioMimeType('audio/webm');
          setSelectedFile(null);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Recording failed:', err);
      setErrorMsg(`Microphone permission error: ${err?.message || 'Could not start recording'}`);
    }
  };

  const handleStopRecord = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1];
      setAudioBase64(base64);
      setAudioMimeType(file.type || 'audio/mp3');
    };
    reader.readAsDataURL(file);
  };

  const handleTranscribe = async () => {
    if (!audioBase64 || isTranscribing) return;

    setIsTranscribing(true);
    setErrorMsg(null);
    setTranscription(null);

    try {
      const text = await transcribeAudioAI(
        audioBase64,
        audioMimeType,
        'Please provide an exact, accurate, line-by-line transcription with speaker or lyrical timestamps where discernible.'
      );

      setTranscription(text);
      triggerNeonExplosion({ particleCount: 40, origin: { x: 0.5, y: 0.5 }, intensity: 'subtle' });
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMsg(err?.message || 'Failed to transcribe audio stream');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopyText = async () => {
    if (!transcription) return;
    await navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0A0A0E] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5D4]/20 via-[#C084FC]/20 to-[#38BDF8]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.2)]">
            <i className="fa-solid fa-file-audio text-xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-black italic text-white tracking-wide">
                Gemini Audio Transcriber
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[9px] font-mono font-bold uppercase text-[#00F5D4]">
                gemini-3.5-transcribe
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              High-accuracy speech-to-text, song lyrics extraction, and podcast transcription
            </p>
          </div>
        </div>
      </div>

      {/* Input Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Record Mic Option */}
        <div className="p-5 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center space-y-3">
          <div className="text-xs font-mono uppercase text-gray-400">Live Voice / Vocal Capture</div>
          
          {isRecording ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="text-2xl font-mono font-bold text-rose-400 animate-pulse">
                {formatSeconds(recordingSeconds)}
              </div>
              <button
                type="button"
                onClick={handleStopRecord}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all"
              >
                <i className="fa-solid fa-stop"></i>
                <span>Stop Recording</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartRecord}
              className="px-5 py-2.5 rounded-xl bg-[#00F5D4]/10 border border-[#00F5D4]/40 hover:bg-[#00F5D4]/20 text-[#00F5D4] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,245,212,0.15)]"
            >
              <i className="fa-solid fa-microphone"></i>
              <span>Start Microphone</span>
            </button>
          )}

          <p className="text-[11px] font-mono text-gray-500">Record spoken ideas, rap verses, or voice notes</p>
        </div>

        {/* Upload Audio File Option */}
        <div className="p-5 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center space-y-3">
          <div className="text-xs font-mono uppercase text-gray-400">Audio File Upload</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <i className="fa-solid fa-cloud-arrow-up text-[#C084FC]"></i>
            <span>{selectedFile ? selectedFile.name : 'Select Audio File'}</span>
          </button>

          <p className="text-[11px] font-mono text-gray-500">Supports MP3, WAV, M4A, FLAC, OGG, WebM</p>
        </div>
      </div>

      {/* Action Trigger */}
      {audioBase64 && (
        <div className="p-4 rounded-xl bg-[#12121A] border border-[#00F5D4]/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in mb-6">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-[#00F5D4] text-lg"></i>
            <div>
              <p className="text-xs font-mono text-white font-bold">
                {selectedFile ? selectedFile.name : 'Microphone Recording Ready'}
              </p>
              <p className="text-[10px] font-mono text-gray-400">Ready for neural transcription</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTranscribe}
            disabled={isTranscribing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)]"
          >
            {isTranscribing ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Transcribing Audio...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Execute Transcription</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          <i className="fa-solid fa-triangle-exclamation mr-2"></i>
          {errorMsg}
        </div>
      )}

      {/* Transcription Results */}
      {transcription && (
        <div className="mt-6 p-5 rounded-xl bg-[#12121A] border border-[#00F5D4]/30 shadow-[0_0_30px_rgba(0,245,212,0.15)] animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-serif font-black italic text-white flex items-center gap-2">
              <i className="fa-solid fa-align-left text-[#00F5D4]"></i>
              <span>Transcribed Speech & Lyrics</span>
            </h4>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <i className={`fa-solid ${copied ? 'fa-check text-[#00F5D4]' : 'fa-copy'}`}></i>
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              {onLyricsExported && (
                <button
                  type="button"
                  onClick={() => {
                    onLyricsExported(transcription);
                    triggerNeonExplosion({ particleCount: 25, origin: { x: 0.5, y: 0.5 }, intensity: 'subtle' });
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                >
                  <i className="fa-solid fa-music"></i>
                  <span>Send to Music Lyrics</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
            {transcription}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTranscribeStudio;
