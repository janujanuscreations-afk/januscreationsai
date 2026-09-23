import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, CHAT_ROLE_PRESETS, ChatMessage, ChatRolePreset } from '../services/geminiService';
import { triggerNeonExplosion } from '../utils/confetti';

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
}

const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'executive-copilot',
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatRolePreset>(() => {
    return CHAT_ROLE_PRESETS.find(r => r.id === initialRole) || CHAT_ROLE_PRESETS[0];
  });
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.8-flash');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Welcome to the Janu's Creations Executive AI Hub. I am configured as your **${selectedRole.name}**. How can we push your creative empire forward today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customSystemPrompt, setCustomSystemPrompt] = useState(selectedRole.systemInstruction);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCustomSystemPrompt(selectedRole.systemInstruction);
    setSelectedModel(selectedRole.defaultModel);
  }, [selectedRole]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation payload for the server
      const payloadMessages = newHistory
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage(
        payloadMessages,
        customSystemPrompt,
        selectedModel
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: res.model,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error generating response: ${err?.message || 'Connection interrupted'}. Please retry or check your model settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Thread cleared. Connected as **${selectedRole.name}** with **${selectedModel}**. What shall we create?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
      }
    ]);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      triggerNeonExplosion({ particleCount: 15, origin: { x: 0.5, y: 0.5 }, intensity: 'subtle' });
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[850px] bg-[#0A0A0E] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 md:px-6 border-b border-white/10 bg-black/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5D4]/20 via-[#C084FC]/20 to-[#38BDF8]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.2)]">
              <i className={`fa-solid ${selectedRole.icon} text-lg`}></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-black italic text-white tracking-wide">
                  Gemini Creator Co-Pilot
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[9px] font-mono font-bold uppercase text-[#00F5D4]">
                  Multi-Turn
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                {selectedRole.name} • Active Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${showPromptEditor ? 'bg-[#C084FC]/20 border-[#C084FC] text-[#C084FC]' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'}`}
              title="Edit System Instructions"
            >
              <i className="fa-solid fa-sliders text-xs"></i>
              <span className="hidden sm:inline">Role Prompt</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-rose-400 text-xs font-mono transition-all flex items-center gap-1.5"
              title="Clear Thread"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all hover:bg-white/10"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Sub-bar: Role Presets & Model Selector */}
        <div className="px-4 py-2.5 bg-black/70 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Role selector buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CHAT_ROLE_PRESETS.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedRole.id === role.id
                    ? 'bg-[#00F5D4]/20 border border-[#00F5D4]/60 text-[#00F5D4] font-bold shadow-[0_0_10px_rgba(0,245,212,0.2)]'
                    : 'bg-white/5 border border-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <i className={`fa-solid ${role.icon} text-[10px]`}></i>
                <span>{role.name}</span>
              </button>
            ))}
          </div>

          {/* Model Selector dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] font-mono uppercase text-gray-400">Model:</span>
            <select
              value={selectedModel}
              onChange={(e: any) => setSelectedModel(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-black border border-white/20 text-[#00F5D4] text-xs font-mono focus:outline-none focus:border-[#00F5D4]"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
              <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Paid Tier)</option>
            </select>
          </div>
        </div>

        {/* System Prompt Customizer Drawer */}
        {showPromptEditor && (
          <div className="p-4 bg-[#12121A] border-b border-white/10 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold uppercase text-[#C084FC] flex items-center gap-1.5">
                <i className="fa-solid fa-code"></i>
                <span>System Role Instructions</span>
              </label>
              <button
                onClick={() => setCustomSystemPrompt(selectedRole.systemInstruction)}
                className="text-[10px] font-mono text-gray-400 hover:text-white underline"
              >
                Reset to Preset Default
              </button>
            </div>
            <textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-gray-200 text-xs font-mono focus:outline-none focus:border-[#C084FC] resize-none"
            />
          </div>
        )}

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isUser
                      ? 'bg-gradient-to-tr from-[#C084FC] to-[#00F5D4] text-black shadow-[0_0_10px_rgba(192,132,252,0.4)]'
                      : 'bg-black border border-[#00F5D4]/40 text-[#00F5D4] shadow-[0_0_10px_rgba(0,245,212,0.2)]'
                  }`}
                >
                  {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-sparkles"></i>}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative p-4 rounded-2xl text-sm leading-relaxed border transition-all ${
                    isUser
                      ? 'bg-[#181822] border-[#C084FC]/30 text-white rounded-tr-none'
                      : 'bg-[#0E0E14] border-white/10 text-gray-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5 text-[10px] font-mono text-gray-400">
                    <span className="font-bold uppercase tracking-wider text-gray-400">
                      {isUser ? 'You' : selectedRole.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.model && (
                        <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[8px] text-[#00F5D4]">
                          {msg.model}
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyMessage(msg.content)}
                        className="opacity-0 group-hover:opacity-100 hover:text-[#00F5D4] transition-opacity p-0.5"
                        title="Copy message"
                      >
                        <i className="fa-regular fa-copy"></i>
                      </button>
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed selection:bg-[#00F5D4] selection:text-black">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-black border border-[#00F5D4]/40 text-[#00F5D4] flex items-center justify-center text-xs animate-pulse">
                <i className="fa-solid fa-sparkles"></i>
              </div>
              <div className="p-4 rounded-2xl bg-[#0E0E14] border border-[#00F5D4]/30 rounded-tl-none flex items-center gap-2 text-xs font-mono text-[#00F5D4]">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
                <span>Thinking with {selectedModel}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/60">
          <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedRole.name}... (Enter to send, Shift+Enter for newline)`}
              rows={2}
              className="flex-1 px-4 py-3 rounded-xl bg-[#12121A] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4] resize-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="h-12 px-5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(0,245,212,0.3)] flex-shrink-0"
            >
              <span>Send</span>
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default GeminiChatbotModal;
