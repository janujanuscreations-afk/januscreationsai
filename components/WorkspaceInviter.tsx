import React, { useState, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { CreatorTabType } from './CreatorPortal';
import { USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';

export interface CollaboratorPresence {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: 'co-editor' | 'audio-engineer' | 'art-director' | 'spectator';
  color: string;
  status: 'active' | 'idle' | 'syncing';
  currentFocus: string;
  latencyMs: number;
  joinedAt: string;
  isHost?: boolean;
}

export type AccessRole = 'co-editor' | 'audio-engineer' | 'art-director' | 'spectator';
export type LinkExpiry = '1h' | '6h' | '24h' | '7d' | 'burner';

interface WorkspaceInviterProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeStudioTab?: CreatorTabType;
  currentProjectTitle?: string;
  className?: string;
  mode?: 'modal' | 'embedded' | 'drawer';
}

const INITIAL_COLLABORATORS: CollaboratorPresence[] = [
  {
    id: 'collab-host',
    name: 'January Rebl (You)',
    handle: '@januaryrebl',
    avatar: USER_OFFICIAL_FACE_AVATAR,
    role: 'co-editor',
    color: '#00F5D4',
    status: 'active',
    currentFocus: 'Master AI Prompt & Safe-Zone Framing',
    latencyMs: 8,
    joinedAt: 'Host (Active Session)',
    isHost: true
  },
  {
    id: 'collab-1',
    name: 'Elena Rostova',
    handle: '@elena_synth',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    role: 'art-director',
    color: '#C084FC',
    status: 'active',
    currentFocus: 'Volumetric Shader & Cyberpunk LUT Tuning',
    latencyMs: 24,
    joinedAt: '14m ago'
  },
  {
    id: 'collab-2',
    name: 'Marcus Vance',
    handle: '@vance_audio',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    role: 'audio-engineer',
    color: '#FF007F',
    status: 'syncing',
    currentFocus: 'Stem Mastering (-14 LUFS Limiter)',
    latencyMs: 38,
    joinedAt: '6m ago'
  }
];

export const WorkspaceInviter: React.FC<WorkspaceInviterProps> = ({
  isOpen = true,
  onClose,
  activeStudioTab = 'reel-studio',
  currentProjectTitle = 'Cyberpunk Neon Drift 2026: Sovereign Motion',
  className = '',
  mode = 'modal'
}) => {
  // Session Configuration State
  const [selectedRole, setSelectedRole] = useState<AccessRole>('co-editor');
  const [selectedExpiry, setSelectedExpiry] = useState<LinkExpiry>('24h');
  const [requireHostApproval, setRequireHostApproval] = useState(true);
  const [enableEndToEndEncryption, setEnableEndToEndEncryption] = useState(true);
  const [enableWatermarkForGuests, setEnableWatermarkForGuests] = useState(false);
  const [masterHostLock, setMasterHostLock] = useState(false);

  // Dynamic Session Tokens & Link
  const [roomId, setRoomId] = useState('janu-room-' + Math.random().toString(36).substring(2, 8));
  const [sessionToken, setSessionToken] = useState('sec_' + Math.random().toString(36).substring(2, 10));
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Direct Invite Inputs
  const [inviteEmailOrHandle, setInviteEmailOrHandle] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Active Presence List
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>(INITIAL_COLLABORATORS);
  const [activeTab, setActiveTab] = useState<'create-link' | 'active-presence' | 'security'>('create-link');

  const generatedInviteUrl = `https://januscreations.ai/collab/session?room=${roomId}&token=${sessionToken}&role=${selectedRole}&exp=${selectedExpiry}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRegenerateToken = () => {
    const newToken = 'sec_' + Math.random().toString(36).substring(2, 10);
    setSessionToken(newToken);
    bossAudio.playInviteGenerated();
    triggerNeonExplosion({
      particleCount: 25,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
    showToast('Generated fresh secure session token! Previous links revoked.');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopiedLink(true);
    bossAudio.playTipChime(100);
    triggerNeonExplosion({
      particleCount: 35,
      origin: { x: 0.5, y: 0.6 },
      intensity: 'medium'
    });
    showToast('Copied secure workspace collaboration link! 🔗');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendDirectInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmailOrHandle.trim()) return;

    setIsSendingInvite(true);
    bossAudio.playSubtlePing();

    setTimeout(() => {
      setIsSendingInvite(false);
      const recipient = inviteEmailOrHandle;
      setInviteEmailOrHandle('');
      bossAudio.playInviteGenerated();
      triggerNeonExplosion({
        particleCount: 40,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'medium'
      });
      showToast(`Encrypted invite dispatched to ${recipient}! ✨`);
    }, 600);
  };

  const handleSimulateNewCollaborator = () => {
    const mockNames = [
      { name: 'Kira Sterling', handle: '@kira_vfx', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop', role: 'art-director' as AccessRole, color: '#FFB800' },
      { name: 'Dante Thorne', handle: '@dantethorne', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', role: 'co-editor' as AccessRole, color: '#00F5D4' },
      { name: 'Maya Lin', handle: '@maya_sound', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop', role: 'audio-engineer' as AccessRole, color: '#C084FC' }
    ];

    const pick = mockNames[Math.floor(Math.random() * mockNames.length)];
    const newCollab: CollaboratorPresence = {
      id: 'collab-' + Date.now(),
      name: pick.name,
      handle: pick.handle,
      avatar: pick.avatar,
      role: pick.role,
      color: pick.color,
      status: 'active',
      currentFocus: 'Connected to live editing canvas',
      latencyMs: Math.floor(Math.random() * 30) + 12,
      joinedAt: 'Just now'
    };

    setCollaborators(prev => [...prev, newCollab]);
    bossAudio.playCollaboratorJoined();
    triggerNeonExplosion({
      particleCount: 45,
      origin: { x: 0.7, y: 0.5 },
      intensity: 'grand'
    });
    showToast(`${pick.name} joined the live collaboration workspace! 🚀`);
  };

  const handleRemoveCollaborator = (id: string, name: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    bossAudio.playSubtlePing();
    showToast(`Revoked session token for ${name}.`);
  };

  if (!isOpen && mode === 'modal') return null;

  const content = (
    <div className={`relative rounded-[2.5rem] bg-zinc-950/95 backdrop-blur-2xl border border-white/20 shadow-[0_0_80px_rgba(0,245,212,0.25)] flex flex-col overflow-hidden ${className}`}>
      
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-black/95 border border-[#00F5D4] text-[#00F5D4] px-5 py-2 rounded-full text-xs font-mono font-bold shadow-[0_0_25px_rgba(0,245,212,0.5)] flex items-center gap-2 animate-in slide-in-from-top-3">
          <i className="fa-solid fa-sparkles text-xs animate-spin"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00F5D4]/20 via-[#C084FC]/20 to-[#FF007F]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.3)]">
            <i className="fa-solid fa-user-group text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-black italic text-white tracking-tight">
                Workspace Inviter & Co-Editing Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-wider">
                Live Mesh
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              Target Project: <strong className="text-white">{currentProjectTitle}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Presence Avatar Stack */}
          <div className="hidden sm:flex items-center -space-x-2 mr-2">
            {collaborators.slice(0, 4).map((c) => (
              <img
                key={c.id}
                src={c.avatar}
                alt={c.name}
                className="w-7 h-7 rounded-full border-2 border-black object-cover shadow-sm"
                title={`${c.name} (${c.role})`}
              />
            ))}
            {collaborators.length > 4 && (
              <span className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-black text-white text-[10px] font-mono flex items-center justify-center font-bold">
                +{collaborators.length - 4}
              </span>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-6 pt-4 border-b border-white/10 flex items-center gap-4 text-xs font-mono">
        <button
          onClick={() => setActiveTab('create-link')}
          className={`pb-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'create-link'
              ? 'border-[#00F5D4] text-[#00F5D4]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-link"></i>
          <span>Generate Invite Link</span>
        </button>

        <button
          onClick={() => setActiveTab('active-presence')}
          className={`pb-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'active-presence'
              ? 'border-[#C084FC] text-[#C084FC]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-users"></i>
          <span>Active Co-Editors ({collaborators.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'security'
              ? 'border-[#FF007F] text-[#FF007F]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-shield-halved"></i>
          <span>Security & Permissions</span>
        </button>
      </div>

      {/* Body Content Area */}
      <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6 custom-scrollbar">
        
        {/* TAB 1: CREATE INVITE LINK */}
        {activeTab === 'create-link' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Role & Expiry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Role Selection */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#00F5D4] font-bold block">
                  1. Assign Collaborator Role
                </label>
                
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('co-editor')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                      selectedRole === 'co-editor'
                        ? 'bg-[#00F5D4]/10 border-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.25)]'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-pen-nib text-[#00F5D4] text-xs"></i>
                        <span className="text-xs font-mono font-bold text-white">Full Co-Editor</span>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                        Real-time timeline cuts, AI prompt generation & layer controls.
                      </p>
                    </div>
                    {selectedRole === 'co-editor' && (
                      <i className="fa-solid fa-circle-check text-[#00F5D4] text-sm"></i>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('audio-engineer')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                      selectedRole === 'audio-engineer'
                        ? 'bg-[#FF007F]/10 border-[#FF007F] shadow-[0_0_15px_rgba(255,0,127,0.25)]'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-sliders text-[#FF007F] text-xs"></i>
                        <span className="text-xs font-mono font-bold text-white">Audio & Sound Alchemist</span>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                        Restricted to audio tracks, stem EQ, LUFS limiter & sound mastering.
                      </p>
                    </div>
                    {selectedRole === 'audio-engineer' && (
                      <i className="fa-solid fa-circle-check text-[#FF007F] text-sm"></i>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('art-director')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                      selectedRole === 'art-director'
                        ? 'bg-[#C084FC]/10 border-[#C084FC] shadow-[0_0_15px_rgba(192,132,252,0.25)]'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-wand-magic-sparkles text-[#C084FC] text-xs"></i>
                        <span className="text-xs font-mono font-bold text-white">Art Director / Colorist</span>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                        Can adjust LUTs, color grade, shaders, and leave canvas pin notes.
                      </p>
                    </div>
                    {selectedRole === 'art-director' && (
                      <i className="fa-solid fa-circle-check text-[#C084FC] text-sm"></i>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('spectator')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                      selectedRole === 'spectator'
                        ? 'bg-[#FFB800]/10 border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.25)]'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-eye text-[#FFB800] text-xs"></i>
                        <span className="text-xs font-mono font-bold text-white">VIP Client / Spectator</span>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                        Read-only live stream draft monitor with audio-visual preview.
                      </p>
                    </div>
                    {selectedRole === 'spectator' && (
                      <i className="fa-solid fa-circle-check text-[#FFB800] text-sm"></i>
                    )}
                  </button>
                </div>
              </div>

              {/* Expiry Selection & Settings */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#C084FC] font-bold block mb-2">
                    2. Link Expiration Lifespan
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1h', label: '1 Hour', sub: 'Fast Sprint' },
                      { id: '6h', label: '6 Hours', sub: 'Studio Shift' },
                      { id: '24h', label: '24 Hours', sub: 'Standard Day' },
                      { id: '7d', label: '7 Days', sub: 'Project Arc' },
                      { id: 'burner', label: 'Burner 1-Use', sub: 'Auto-Revoke' },
                    ].map((exp) => (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => setSelectedExpiry(exp.id as LinkExpiry)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedExpiry === exp.id
                            ? 'bg-[#C084FC] text-black font-bold shadow-[0_0_15px_rgba(192,132,252,0.4)]'
                            : 'bg-zinc-900 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-mono block">{exp.label}</span>
                        <span className={`text-[9px] font-mono block ${selectedExpiry === exp.id ? 'text-black/80' : 'text-gray-500'}`}>
                          {exp.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Security Rules */}
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">
                    Link Access Policies
                  </span>
                  
                  <label className="flex items-center justify-between text-xs font-mono text-gray-300 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <i className="fa-solid fa-door-closed text-[#00F5D4] text-[10px]"></i>
                      Host Approval Knock Gate
                    </span>
                    <input
                      type="checkbox"
                      checked={requireHostApproval}
                      onChange={(e) => setRequireHostApproval(e.target.checked)}
                      className="accent-[#00F5D4] w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-mono text-gray-300 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <i className="fa-solid fa-lock text-[#C084FC] text-[10px]"></i>
                      End-to-End State Encryption
                    </span>
                    <input
                      type="checkbox"
                      checked={enableEndToEndEncryption}
                      onChange={(e) => setEnableEndToEndEncryption(e.target.checked)}
                      className="accent-[#C084FC] w-4 h-4 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* SECURE LINK OUTPUT & ACTIONS CONTAINER */}
            <div className="p-4 rounded-3xl bg-zinc-900/90 border border-[#00F5D4]/40 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#00F5D4] uppercase flex items-center gap-1.5">
                  <i className="fa-solid fa-key"></i>
                  Encrypted Session Invite Link
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-qrcode text-[#00F5D4]"></i>
                    <span>{showQrCode ? 'Hide QR' : 'Scan QR'}</span>
                  </button>

                  <button
                    onClick={handleRegenerateToken}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer"
                    title="Revoke and Generate New Token"
                  >
                    <i className="fa-solid fa-rotate text-[#C084FC]"></i>
                    <span>Revoke & Refresh</span>
                  </button>
                </div>
              </div>

              {/* URL Display Bar */}
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/80 border border-white/15">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteUrl}
                  className="bg-transparent text-xs font-mono text-gray-300 w-full focus:outline-none truncate selection:bg-[#00F5D4] selection:text-black"
                />
                
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    copiedLink
                      ? 'bg-[#00F5D4] text-black shadow-[0_0_20px_rgba(0,245,212,0.6)] scale-105'
                      : 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black shadow-[0_0_15px_rgba(0,245,212,0.3)] hover:scale-105'
                  }`}
                >
                  <i className={`fa-solid ${copiedLink ? 'fa-check' : 'fa-copy'}`}></i>
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              {/* QR Code Quick View (when toggled) */}
              {showQrCode && (
                <div className="p-4 rounded-2xl bg-black border border-[#00F5D4]/30 flex flex-col items-center justify-center space-y-2 animate-in fade-in">
                  <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                    {/* Simulated Clean Vector QR Code */}
                    <div className="w-full h-full border-4 border-black p-1 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 bg-black"></div>
                        <div className="w-6 h-6 bg-black"></div>
                      </div>
                      <div className="flex justify-center items-center">
                        <i className="fa-solid fa-fingerprint text-xl text-black"></i>
                      </div>
                      <div className="flex justify-between">
                        <div className="w-6 h-6 bg-black"></div>
                        <div className="w-4 h-4 bg-black"></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    Scan with iPad or smartphone for dual-screen live co-editing
                  </span>
                </div>
              )}

              {/* Direct Invite Dispatch Bar */}
              <form onSubmit={handleSendDirectInvite} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Invite via email or @creator handle..."
                  value={inviteEmailOrHandle}
                  onChange={(e) => setInviteEmailOrHandle(e.target.value)}
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-paper-plane text-[#00F5D4]"></i>
                  <span>{isSendingInvite ? 'Sending...' : 'Dispatch'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE PRESENCE LIST */}
        {activeTab === 'active-presence' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-serif font-black italic text-white">
                  Connected Live Collaborators
                </h3>
                <p className="text-[10px] font-mono text-gray-400">
                  WebSocket real-time presence mesh with sub-50ms latency.
                </p>
              </div>

              {/* Add Demo Collaborator Button */}
              <button
                onClick={handleSimulateNewCollaborator}
                className="px-3 py-1.5 rounded-xl bg-[#00F5D4]/10 hover:bg-[#00F5D4] border border-[#00F5D4]/40 text-[#00F5D4] hover:text-black text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <i className="fa-solid fa-user-plus"></i>
                <span>Simulate Co-Editor Join</span>
              </button>
            </div>

            {/* Collaborator Rows */}
            <div className="space-y-2.5">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="p-3.5 rounded-2xl bg-black/60 border border-white/10 hover:border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Status Pulse */}
                    <div className="relative">
                      <img
                        src={collab.avatar}
                        alt={collab.name}
                        className="w-10 h-10 rounded-2xl object-cover border"
                        style={{ borderColor: collab.color }}
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black"
                        style={{ backgroundColor: collab.color }}
                        title={collab.status}
                      ></span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-serif font-bold text-white">
                          {collab.name}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {collab.handle}
                        </span>
                        {collab.isHost && (
                          <span className="px-2 py-0.2 rounded-full bg-[#00F5D4]/20 text-[#00F5D4] text-[9px] font-mono font-bold uppercase">
                            Host
                          </span>
                        )}
                        <span
                          className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase border"
                          style={{
                            borderColor: `${collab.color}40`,
                            color: collab.color,
                            backgroundColor: `${collab.color}15`
                          }}
                        >
                          {collab.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-1">
                        <span className="text-gray-200 flex items-center gap-1">
                          <i className="fa-solid fa-crosshairs text-[9px]" style={{ color: collab.color }}></i>
                          {collab.currentFocus}
                        </span>
                        <span>•</span>
                        <span className="text-[#00F5D4]">{collab.latencyMs}ms</span>
                        <span>•</span>
                        <span>{collab.joinedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!collab.isHost && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          showToast(`Sent real-time ping to ${collab.name}!`);
                          bossAudio.playSubtlePing();
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono transition-all"
                        title="Ping collaborator cursor"
                      >
                        <i className="fa-solid fa-bell text-[#00F5D4] mr-1"></i>
                        Ping
                      </button>

                      <button
                        onClick={() => handleRemoveCollaborator(collab.id, collab.name)}
                        className="px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white text-[10px] font-mono transition-all"
                        title="Revoke session access"
                      >
                        <i className="fa-solid fa-user-xmark mr-1"></i>
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & PERMISSION POLICIES */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-3xl bg-black/60 border border-white/10 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF007F] flex items-center gap-2">
                <i className="fa-solid fa-shield-cat"></i>
                Sovereign Host Governance & Safe-Zones
              </h3>

              <div className="space-y-3">
                {/* Master Host Lock */}
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Master Host Edit Lock
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      When enabled, all co-editors become read-only spectators until released.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMasterHostLock(!masterHostLock);
                      bossAudio.playSubtlePing();
                      showToast(masterHostLock ? 'Master Edit Lock Released.' : 'Master Edit Lock Engaged! 🔒');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
                      masterHostLock
                        ? 'bg-[#FF007F] text-white shadow-[0_0_15px_rgba(255,0,127,0.5)]'
                        : 'bg-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {masterHostLock ? 'Engaged' : 'Unlocked'}
                  </button>
                </div>

                {/* Watermark Guests */}
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Draft Watermark on Remote Viewports
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      Displays a diagonal translucent security watermark on guest monitors.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableWatermarkForGuests}
                    onChange={(e) => setEnableWatermarkForGuests(e.target.checked)}
                    className="accent-[#FF007F] w-4 h-4 rounded"
                  />
                </div>

                {/* Active Encryption Cipher */}
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-bold text-white block">Encryption Protocol</span>
                    <span className="text-[10px] text-[#00F5D4]">AES-256 GCM Live WebSocket Pipeline</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#00F5D4]/10 text-[#00F5D4] text-[10px] font-bold">
                    Active & Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Bar */}
      <div className="p-4 border-t border-white/10 bg-black/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-2 text-gray-400 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
          <span>Room: <strong className="text-white">{roomId}</strong></span>
          <span>•</span>
          <span>Token: <strong className="text-gray-300 font-mono">{sessionToken.substring(0, 10)}...</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-all cursor-pointer"
            >
              Done
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-share-nodes"></i>
            <span>Share Invite Link</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (mode === 'embedded') {
    return content;
  }

  // Modal Wrapper
  return (
    <div className="fixed inset-0 z-[340] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="max-w-3xl w-full animate-in fade-in zoom-in-95 duration-200">
        {content}
      </div>
    </div>
  );
};

export default WorkspaceInviter;
