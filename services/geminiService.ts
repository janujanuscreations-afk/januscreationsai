import { BrandBrief } from "../types";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  groundingSources?: Array<{ title?: string; uri?: string }>;
}

export interface ChatRolePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemInstruction: string;
  defaultModel: 'gemini-3.8-flash' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
}

export const CHAT_ROLE_PRESETS: ChatRolePreset[] = [
  {
    id: 'executive-copilot',
    name: 'Executive Creative Director',
    icon: 'fa-crown',
    description: 'High-level brand strategy, viral positioning, and executive production counsel.',
    systemInstruction: `You are the Executive Creative Director & AI Co-Pilot at Janu's Creations.
You provide sophisticated, high-energy, actionable strategic guidance for content creators, artists, and founders.
Speak with confidence, creative authority, and precision. Provide bold ideas, structure, and revenue-generating advice.`,
    defaultModel: 'gemini-3.8-flash'
  },
  {
    id: 'music-lyricist',
    name: 'Hit Songwriter & Sonic Alchemist',
    icon: 'fa-music',
    description: 'Lyric writing, chord progressions, song arrangements, and master audio engineering.',
    systemInstruction: `You are the Master Songwriter and Sonic Producer at Janu's Creations.
You specialize in writing infectious hooks, emotive lyrics across all genres (Rap, Gospel, Pop, Metal, Synthwave, Country),
suggesting BPM/Key architectures, and acoustic stem separation directives.`,
    defaultModel: 'gemini-3.8-flash'
  },
  {
    id: 'reel-strategist',
    name: 'Viral Video Architect',
    icon: 'fa-video',
    description: '3-second hooks, pacing algorithms, visual storytelling, and thumbnail CTR mastery.',
    systemInstruction: `You are the Viral Retention Scientist at Janu's Creations.
You craft frame-by-frame script breakdowns, pattern-interrupt hooks, visual effects prompts, and pacing guidelines
designed to maximize retention and algorithm velocity on Reels, Shorts, and TikTok.`,
    defaultModel: 'gemini-3.8-flash'
  },
  {
    id: 'monetization-advisor',
    name: 'Creator Wealth & Monetization Agent',
    icon: 'fa-sack-dollar',
    description: 'Pricing models, sponsor pitch kits, 85/15 royalty splits, and digital product launches.',
    systemInstruction: `You are the Chief Monetization Strategist at Janu's Creations.
You guide creators on building six-figure creator businesses, optimizing tips, memberships, master audio licensing,
and private community monetization. Provide numerical clarity and sharp pitch frameworks.`,
    defaultModel: 'gemini-3.8-flash'
  },
  {
    id: 'rapid-assistant',
    name: 'Rapid Idea Spark (Flash Lite)',
    icon: 'fa-bolt',
    description: 'Ultra-fast brainstorming, headline generation, and immediate creative punchlines.',
    systemInstruction: `You are the Rapid Creative Spark at Janu's Creations. Deliver ultra-fast, crisp, high-impact ideas, captions, and brainstorm lists instantly.`,
    defaultModel: 'gemini-3.1-flash-lite'
  }
];

// -------------------------------------------------------------
// 1. Multi-turn Chat API
// -------------------------------------------------------------
export async function sendChatMessage(
  messages: Array<{ role: string; content: string }>,
  systemInstruction?: string,
  model: 'gemini-3.8-flash' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview' | 'gemini-3.7-flash' = 'gemini-3.8-flash',
  temperature: number = 0.7
): Promise<{ text: string; model: string }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      systemInstruction,
      model,
      temperature,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server chat request failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    text: data.text || '',
    model: data.model || model,
  };
}

// -------------------------------------------------------------
// 2. Music Generation with Lyria
// -------------------------------------------------------------
export async function generateLyriaMusic(
  prompt: string,
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' = 'lyria-3-clip-preview',
  imageBase64?: string
): Promise<{ audioUrl: string; audioBase64: string; lyrics: string; model: string }> {
  const res = await fetch('/api/ai/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model,
      imageBase64,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Music generation failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.audioBase64) {
    throw new Error("No audio stream received from Lyria model");
  }

  // Convert base64 into a playable Blob URL
  const binary = atob(data.audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);

  return {
    audioUrl,
    audioBase64: data.audioBase64,
    lyrics: data.lyrics || '',
    model: data.model || model,
  };
}

// -------------------------------------------------------------
// 3. Image Generation with gemini-3.1-flash-image
// -------------------------------------------------------------
export async function generateImageAI(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '16:9',
  imageSize: '512px' | '1K' | '2K' | '4K' = '1K',
  style: string = 'editorial',
  model: 'gemini-3.1-flash-image' | 'gemini-3.1-flash-lite-image' = 'gemini-3.1-flash-image'
): Promise<{ imageUrl: string; description: string; model: string }> {
  const res = await fetch('/api/ai/image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      aspectRatio,
      imageSize,
      style,
      model,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Image generation failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    imageUrl: data.imageUrl,
    description: data.description || '',
    model: data.model || model,
  };
}

// -------------------------------------------------------------
// 4. Image Editing with gemini-3.1-flash-image
// -------------------------------------------------------------
export async function editImageAI(
  prompt: string,
  imageBase64: string,
  mimeType: string = 'image/png',
  model: 'gemini-3.1-flash-image' | 'gemini-3.1-flash-lite-image' = 'gemini-3.1-flash-image'
): Promise<{ imageUrl: string; description: string; model: string }> {
  const res = await fetch('/api/ai/image/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      imageBase64,
      mimeType,
      model,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Image editing failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    imageUrl: data.imageUrl,
    description: data.description || '',
    model: data.model || model,
  };
}

// -------------------------------------------------------------
// 5. Video Generation with Veo (Text-to-Video & Image-to-Video)
// -------------------------------------------------------------
export async function generateVeoVideo(
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  resolution: '720p' | '1080p' = '720p',
  imageBase64?: string,
  model: string = 'veo-3.1-lite-generate-preview'
): Promise<{ operationName: string; model: string; aspectRatio: string }> {
  const res = await fetch('/api/ai/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      aspectRatio,
      resolution,
      imageBase64,
      model,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Video generation start failed: ${res.status}`);
  }

  return await res.json();
}

export async function checkVeoStatus(
  operationName: string
): Promise<{ done: boolean; hasVideo: boolean; error?: any }> {
  const res = await fetch('/api/ai/video/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });

  if (!res.ok) {
    throw new Error(`Failed to check video status: ${res.status}`);
  }

  return await res.json();
}

export async function downloadVeoVideoBlob(operationName: string): Promise<string> {
  const res = await fetch('/api/ai/video/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });

  if (!res.ok) {
    throw new Error(`Failed to download video stream: ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// -------------------------------------------------------------
// 6. Google Search Grounding with gemini-3.5-flash
// -------------------------------------------------------------
export async function searchGroundingAI(prompt: string): Promise<{
  text: string;
  groundingChunks: any[];
  webSearchQueries: string[];
}> {
  const res = await fetch('/api/ai/search-grounding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Search grounding failed: ${res.status}`);
  }

  return await res.json();
}

// -------------------------------------------------------------
// 7. Google Maps Grounding with gemini-3.5-flash
// -------------------------------------------------------------
export async function mapsGroundingAI(prompt: string): Promise<{
  text: string;
  groundingChunks: any[];
}> {
  const res = await fetch('/api/ai/maps-grounding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Maps grounding failed: ${res.status}`);
  }

  return await res.json();
}

// -------------------------------------------------------------
// 8. Audio Transcription with gemini-3.5-transcribe
// -------------------------------------------------------------
export async function transcribeAudioAI(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  prompt?: string
): Promise<string> {
  const res = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      mimeType,
      prompt,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Audio transcription failed: ${res.status}`);
  }

  const data = await res.json();
  return data.transcript || '';
}

// -------------------------------------------------------------
// 9. Backwards Compatible Studio Methods
// -------------------------------------------------------------
export const generateBrandIdentity = async (brief: BrandBrief) => {
  const prompt = `Act as a senior creative director at Janus Creations. 
Create a comprehensive brand identity proposal for:
Name: ${brief.name}
Industry: ${brief.industry}
Vibe: ${brief.vibe}
Target Audience: ${brief.targetAudience}

Provide:
1. A creative core concept inspired by the duality of Janus (looking at the heritage of the industry while innovating for the future).
2. Tone of voice guidelines.
3. Visual mood board description.
4. Suggested color palette with hex codes.
5. A 3-month strategy for market entry.`;

  const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.5-flash');
  return res.text;
};

export const generateBrandVoice = async (brief: BrandBrief) => {
  const prompt = `Act as the Janus Linguistic Oracle. 
Manifest a detailed Brand Voice & Tone Guideline for:
Brand Name: ${brief.name}
Vibe: ${brief.vibe}
Target Audience: ${brief.targetAudience}

Include:
1. Core Voice Archetype (e.g., The Sage, The Rebel, The Visionary).
2. Tone Characteristics: 3-4 defining traits with "Do" and "Don't" examples.
3. Vocabulary Manifest: Essential keywords that evoke the brand essence.
4. Rhythm & Structure: How sentences should feel (e.g., short/punchy vs long/luxurious).
5. Sample Phrases: Examples of how the brand speaks in a high-stakes scenario.

Style: Sophisticated, futuristic, and premium.`;

  const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.5-flash');
  return res.text;
};

export const generateSonicManifest = async (prompt: string) => {
  const systemPrompt = `You are the Janus Sonic Alchemist. Your goal is to manifest a detailed musical roadmap for creators.
The genre could be anything from Country, Comedy sounds, Heavy Metal, Rap, Gospel, to modern electronic styles.

Provide:
1. SONIC ARCHITECTURE: BPM, Key, and Time Signature.
2. INSTRUMENTATION: Specific sounds or gear to use (e.g., "Steel guitar with fluorescent reverb" or "808s that shake the soul").
3. ARRANGEMENT: A structural map (Intro, Hook, Verse, Bridge, Outro).
4. ATMOSPHERE: The emotional frequency of the track.

Format the output clearly with bold headers. Use sophisticated, high-end language.`;

  const res = await sendChatMessage([{ role: 'user', content: prompt }], systemPrompt, 'gemini-3.5-flash');
  return res.text;
};

export const generateConceptImage = async (
  prompt: string,
  aspectRatio: "1:1" | "16:9" | "9:16" = "16:9",
  style: string = "editorial"
) => {
  try {
    const res = await generateImageAI(prompt, aspectRatio, '1K', style, 'gemini-3.1-flash-image');
    return res.imageUrl;
  } catch (e) {
    console.warn('Primary image generation fallback:', e);
    const res = await generateImageAI(prompt, aspectRatio, '1K', style, 'gemini-3.1-flash-lite-image');
    return res.imageUrl;
  }
};

export const generateManifestationSummary = async (title: string, description: string) => {
  const prompt = `Act as the Janus AI Oracle. Provide a short, cryptic, yet inspiring 1-sentence "Oracle's Insight" summary for this content:
Title: ${title}
Description: ${description}

Keep it under 15 words. Make it sound high-end, mystical, and sophisticated.`;

  try {
    const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.1-flash-lite');
    return res.text.trim() || "A soul fragment of infinite potential.";
  } catch (error) {
    return "Wisdom obscured by cosmic interference.";
  }
};

export const generateViralReelScript = async (topic: string, style: string, targetDuration: string = "30s") => {
  const prompt = `Act as the executive content director at Janu's Creations.
Generate a complete, viral Short/Reel script for:
Topic: ${topic}
Style: ${style}
Target Duration: ${targetDuration}

Provide:
1. ⚡ THE 3-SECOND VIRAL HOOK (Visual text overlay + spoken audio hook).
2. 🎬 SCENE-BY-SCENE BREAKDOWN (0-5s, 5-15s, 15-25s, 25-30s) with Visual Directions, Camera Angles, and Spoken Script.
3. 🎵 AUDIO & BASS DROP CUE (Suggested music genre and exact cut timing).
4. 💰 MONETIZATION & CALL-TO-ACTION (How to convert views to tips/subscribers on Janu's Creations).
5. 🏷️ 5 HIGH-VELOCITY HASHTAGS.

Format with bold headers and crisp, actionable phrasing.`;

  const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.5-flash');
  return res.text;
};

export const generateMusicVideoStoryboard = async (trackTitle: string, genre: string, concept: string) => {
  const prompt = `Act as the Master Music Video Director at Janu's Creations.
Design a high-end cinematic music video visual blueprint for:
Track Title: "${trackTitle}"
Genre: ${genre}
Creative Concept: ${concept}

Include:
1. 🌌 COLOR PALETTE & LIGHTING ARCHITECTURE (e.g. Anamorphic lens flare, deep obsidian shadows, fluorescent neon purple #C084FC & cyan #00F5D4 highlights).
2. 🎬 4 CINEMATIC SCENE ACTS:
   - Act I (The Awakening / Verse 1)
   - Act II (The Build / Chorus Drop)
   - Act III (The Climax / Solo)
   - Act IV (The Grand Outro)
3. ⚡ VISUAL EFFECTS & SHADER LAYERS (Particle systems, time-reversal, hologram splits).
4. 💎 THUMBNAIL HOOK SPECIFICATION (Exact 9:16 & 16:9 thumbnail description to maximize CTR).`;

  const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.5-flash');
  return res.text;
};

export const generateLyricsAndHook = async (trackTitle: string, genre: string, concept: string, mood?: string) => {
  const prompt = `Act as the Master Hit Songwriter & Lyricist at Janu's Creations Studio.
Compose complete lyrics, viral catchy hooks, and vocal delivery cues for:
Track Title: "${trackTitle}"
Genre: ${genre}
Concept/Theme: ${concept}
Mood/Energy: ${mood || 'Energetic, anthemic, and emotive'}

Provide:
1. 🎯 HOOK / CHORUS (Catchy, viral 4-line hook with rhyme scheme & rhythm meter)
2. 🎙️ VERSE 1 (Atmosphere setup, lyrical storytelling)
3. ⚡ PRE-CHORUS & BUILDUP (Rising tension & vocal acceleration)
4. 💎 DROP / CHORUS (Maximum energetic or soulful peak)
5. 🎙️ VERSE 2 / BRIDGE (Harmonic contrast & emotional depth)
6. 🌌 OUTRO / FADE (Iconic lingering vocal tag)
7. 🎚️ VOCAL DIRECTIVES & AUTO-TUNE/REVERB NOTES (Formant pitch, delay tails, layering instructions).`;

  const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.5-flash');
  return res.text;
};

export interface AICoPilotRequest {
  actionType: 'seo' | 'caption' | 'audio' | 'visual' | 'hook' | 'prompt';
  context: {
    activeTab: string;
    title?: string;
    description?: string;
    genreOrStyle?: string;
    topic?: string;
  };
}

export const generateAICoPilotAction = async (request: AICoPilotRequest) => {
  const { actionType, context } = request;
  let prompt = '';

  if (actionType === 'seo') {
    prompt = `Act as the Master Growth Strategist at Janu's Creations Studio.
Optimize SEO, hashtags, search keyword graph, and discoverability for this creative session:
Active Studio: ${context.activeTab}
Title/Topic: ${context.title || context.topic || 'Master AI Creative'}
Style: ${context.genreOrStyle || 'Cyberpunk Luxury'}

Provide:
1. 🎯 PRIMARY TARGET KEYWORDS (High intent & viral velocity)
2. 🏷️ 10 OPTIMIZED HASHTAGS (Segmented into: 3 Broad viral, 4 Niche creator, 3 Studio branded like #JanusCreations #CreatorAI)
3. 📈 SEARCH INTENT HOOK: 1-sentence SEO title optimized for high CTR on YouTube Shorts, TikTok, and Instagram Reels.
4. 💎 ALGORITHM DISCOVERY SCORE (0-100% with rationale)`;
  } else if (actionType === 'caption') {
    prompt = `Act as the Elite Social Copywriter at Janu's Creations.
Generate 3 distinct high-converting social caption options for:
Active Studio: ${context.activeTab}
Title/Topic: ${context.title || context.topic || 'Creator Digital Art & Motion'}
Style/Vibe: ${context.genreOrStyle || 'Futuristic luxury'}

Generate:
OPTION A: 🔥 "THE SCROLL-STOPPER" (Punchy, bold hook in first 5 words, curiosity gap, emoji accents).
OPTION B: 💎 "THE MONETIZATION MAGNET" (High-end creator statement with direct CTA inviting tips / community support).
OPTION C: 🌌 "THE AESTHETIC ORACLE" (Poetic, deep, cyberpunk/luxury vibe for digital artists).

Include 4 high-performing hashtags for each.`;
  } else if (actionType === 'audio') {
    prompt = `Act as the Senior Audio Mastering Engineer & Acoustic Alchemist at Janu's Creations.
Generate an instant audio diagnosis, LUFS normalization profile, and stem frequency balance guide for:
Studio Context: ${context.activeTab}
Audio / Track Title: ${context.title || 'Dynamic Reel Soundtrack'}
Genre / Mood: ${context.genreOrStyle || 'Electronic Synthwave & Bass'}

Provide:
1. 🎚️ RECOMMENDED MASTERING SPECS:
   - Target Integrated Loudness: (e.g. -14.0 LUFS for streaming or -9.0 LUFS for bass drop reels)
   - True Peak Ceiling: -1.0 dBFS (anti-clipping prevention)
   - Dynamic Range: PLR (Peak to Loudness Ratio) target
2. 🎛️ 4-BAND EQ ACTION PLAN:
   - Sub-Bass (20-60Hz): Clean low-end rumble
   - Low-Mids (200-500Hz): De-mud dialogue frequency
   - High-Mids (2kHz-5kHz): Presence & Vocal Clarity boost
   - Air / Shimmer (10kHz+): Harmonic silk
3. ⚡ INSTANT FIX DIRECTIVE: 1 immediate tweak to make it sound punchy on phone speakers.`;
  } else if (actionType === 'hook') {
    prompt = `Act as the Viral Retention Scientist at Janu's Creations.
Analyze the title/concept and generate 4 ultra-high retention 3-second visual and verbal opening hooks:
Title/Topic: ${context.title || context.topic || 'AI Art & Music Synthesis'}
Format: ${context.activeTab}

Provide:
1. ⚡ Hook 1: "The Negative Contrast / Pattern Interrupt"
2. ⚡ Hook 2: "The High-Stakes Transformation"
3. ⚡ Hook 3: "The Unbelievable Result / Proof First"
4. ⚡ Hook 4: "The Direct Callout to Creator Tribe"
Each with an estimated retention boost score (+35% to +85%).`;
  } else {
    prompt = `Act as the Master Prompt Engineer at Janu's Creations.
Enhance and elevate this raw creator concept into a pristine cinematic multi-modal prompt:
Input: ${context.title || context.topic || 'Cyberpunk luxury portrait'}
Context: ${context.activeTab}

Provide:
1. 🌟 ENHANCED GEMINI 8K PROMPT (Lens choice, volumetric lighting, color palette, surface texture, render engine directives).
2. 🎨 NEGATIVE FILTER DIRECTIVES (What to avoid).
3. 📐 OPTIMAL CAMERA MOVEMENT & FRAME DYNAMICS.`;
  }

  const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.5-flash');
  return res.text;
};

export interface AIVoiceoverGenerationParams {
  text: string;
  voiceProfile: string;
  emotionalResonance: string;
  pitchShift?: number;
  cadenceSpeed?: number;
  reverbSpace?: string;
  genreVibe?: string;
  targetUse?: 'music_vocal' | 'dj_drop' | 'narration' | 'podcast' | 'hook_chant';
}

export const generateAIVoiceoverScript = async (params: AIVoiceoverGenerationParams) => {
  const prompt = `Act as the Master Vocal Producer & AI Voice Director at Janu's Creations Studio.
Generate an elevated vocal performance script with phonetic cues, dynamic delivery tags, and prosody markings.

Voice Profile: ${params.voiceProfile}
Emotional Resonance: ${params.emotionalResonance}
Genre / Context: ${params.genreVibe || 'Cinematic Electronic & Urban'}
Target Application: ${params.targetUse || 'music_vocal'}
Pitch & Speed Direction: ${params.pitchShift || 0} st, ${params.cadenceSpeed || 1.0}x speed
Reverb Acoustic: ${params.reverbSpace || 'Studio Chamber'}

Original Text Input:
"${params.text}"

Generate:
1. 🎙️ MASTER SPOKEN / SUNG VOCAL SCRIPT (With rhythmic pause markers like [pause 0.5s], inflection indicators [↑pitch] [↓drop], breath intake cues [breath], and emotion emphasis *words*).
2. 🎚️ VOCAL CHAIN PRESET (Formant shift, harmonic saturation, dynamic compression attack/release, delay time in ms, reverb wet/dry mix).
3. ⚡ PHONETIC DELIVERY ADVICE (Guidance on diction, vibrato rate, transient punch, and vocal fry vs angelic resonance).
4. 💎 3 VIRAL VARIATIONS (Alternative phrasing optimized for TikTok hook, cinematic trailer, and anthemic club drop).`;

  const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.5-flash');
  return res.text;
};

export const enhanceVoiceoverText = async (text: string, style: string, emotion: string) => {
  const prompt = `Act as an Elite Voiceover Director. Polish and format this voiceover text for synthetic AI speech synthesis.
Style: ${style}
Emotion: ${emotion}

Original Text:
"${text}"

Provide ONLY the clean, polished script text optimized for smooth, punchy vocal delivery (natural pauses with commas and ellipses, clean syllable flow, no markdown codeblocks or intro commentary).`;

  const res = await sendChatMessage([{ role: 'user', content: prompt }], undefined, 'gemini-3.1-flash-lite');
  return res.text.trim();
};
