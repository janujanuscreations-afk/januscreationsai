import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AIAsset, AIAssetType } from '../types';
import { firestoreService, auth, uploadCreatorAssetFile } from '../services/firebase';
import { triggerNeonExplosion } from '../utils/confetti';
import { safeStringify } from '../utils/safeJson';

interface AIAssetLibraryProps {
  onSelectAsset?: (asset: AIAsset) => void;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music') => void;
}

// Preset seed assets if empty initially so creator gets instant immediate access
const INITIAL_DEMO_ASSETS: AIAsset[] = [
  {
    id: 'asset-art-1',
    title: 'Cyberpunk Neo-Tokyo Goddess',
    type: 'image',
    prompt: 'Photorealistic editorial shot of a high fashion futuristic goddess with neon chromatic light rays in Tokyo alleyway, 8k resolution, cinematic atmosphere',
    mediaUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
    modelUsed: 'gemini-3.1-flash-image',
    aspectRatio: '16:9',
    fileSize: '3.4 MB',
    folder: 'Campaigns',
    tags: ['Cyberpunk', 'Editorial', 'High Fashion', 'Neon'],
    isFavorite: true,
    creatorName: 'January Rebl',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'asset-stem-1',
    title: 'Neon Midnight Synth Bassline',
    type: 'audio_stem',
    prompt: 'Analog synthesizer bassline with heavy 808 sub-harmonics and gated reverb, dark synthwave pulse 124 BPM in D Minor',
    mediaUrl: 'https://actions.google.com/sounds/v1/science_fiction/alien_spaceship_hum.ogg',
    modelUsed: 'lyria-3-clip-preview',
    duration: 30,
    durationFormatted: '0:30',
    bpm: 124,
    key: 'D Minor',
    genre: 'Synthwave / Bass',
    fileSize: '4.8 MB',
    folder: 'Master Stems',
    tags: ['Bass Stem', 'Synthwave', '124 BPM', 'Analog'],
    isFavorite: true,
    creatorName: 'January Rebl',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'asset-draft-1',
    title: 'Viral Dropship Reel Cut #4',
    type: 'reel_draft',
    prompt: 'Fast paced 9:16 vertical transition reel with neon title overlays, dynamic zoom cuts, and audio sync pulse',
    mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    modelUsed: 'Reel Editor v3',
    aspectRatio: '9:16',
    duration: 15,
    durationFormatted: '0:15',
    fileSize: '12.8 MB',
    folder: 'Drafts',
    tags: ['Reel Draft', '9:16', 'TikTok / Reels', 'Drop Ship'],
    metadata: {
      captionText: 'Unveiling the Sovereign Collection 2026 🔥',
      filter: 'cyberpunk-neon',
      speed: 1.0,
      beatSync: true
    },
    isFavorite: false,
    creatorName: 'January Rebl',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'asset-video-1',
    title: 'Holographic Liquid Gold Wave',
    type: 'video',
    prompt: 'Fluid 3D simulation of liquid molten gold swirling with iridescent rainbow specular highlights against black void, 60fps slow motion',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    modelUsed: 'veo-3.1-lite-generate-preview',
    aspectRatio: '16:9',
    duration: 6,
    durationFormatted: '0:06',
    fileSize: '8.1 MB',
    folder: 'Social Clips',
    tags: ['Veo 3', 'Liquid Gold', 'Motion VFX', '16:9'],
    isFavorite: true,
    creatorName: 'January Rebl',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'asset-art-2',
    title: 'Cyber-Boutique Architectural Keyframe',
    type: 'image',
    prompt: 'Ultra-wide angle architectural interior of a dark cyberpunk luxury boutique with floating translucent garment racks and volumetric ultraviolet fog',
    mediaUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
    modelUsed: 'gemini-3.1-flash-image',
    aspectRatio: '16:9',
    fileSize: '19.4 MB',
    folder: 'Campaigns',
    tags: ['Cyberpunk', 'Architecture', 'Key Visual', '4K Wallpaper'],
    isFavorite: false,
    creatorName: 'January Rebl',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'asset-stem-2',
    title: 'Sub-Zero 808 Trap Stutter',
    type: 'audio_stem',
    prompt: 'Distorted glide 808 sub bass with glitch stutter repeats, analog saturation and sidechain pump at 140 BPM',
    mediaUrl: 'https://actions.google.com/sounds/v1/science_fiction/alien_spaceship_hum.ogg',
    modelUsed: 'lyria-3-clip-preview',
    duration: 15,
    durationFormatted: '0:15',
    bpm: 140,
    key: 'F# Minor',
    genre: 'Trap / Drill',
    fileSize: '1.9 MB',
    folder: 'Master Stems',
    tags: ['Bass Stem', 'Trap', '140 BPM', 'Stems'],
    isFavorite: true,
    creatorName: 'January Rebl',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString()
  }
];

export const AIAssetLibrary: React.FC<AIAssetLibraryProps> = ({
  onSelectAsset,
  onNavigateToStudio
}) => {
  const [assets, setAssets] = useState<AIAsset[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AIAsset | null>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // Multi-Select & Workspace Folder State
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState<boolean>(false);
  const [targetMoveFolder, setTargetMoveFolder] = useState<string>('General');
  const [customNewFolder, setCustomNewFolder] = useState<string>('');
  const [targetMoveType, setTargetMoveType] = useState<AIAssetType | ''>('');
  const [isProcessingBulk, setIsProcessingBulk] = useState<boolean>(false);
  const [newAssetFolder, setNewAssetFolder] = useState<string>('General');

  // Sorting and Attribute Filtering State
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'title' | 'tags'>('date');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [selectedProjectTag, setSelectedProjectTag] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');

  // New Asset Form State
  const [newAssetType, setNewAssetType] = useState<AIAssetType>('image');
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetPrompt, setNewAssetPrompt] = useState('');
  const [newAssetMediaUrl, setNewAssetMediaUrl] = useState('');
  const [newAssetFile, setNewAssetFile] = useState<File | null>(null);
  const [newAssetTags, setNewAssetTags] = useState('');
  const [newAssetGenre, setNewAssetGenre] = useState('');
  const [newAssetBpm, setNewAssetBpm] = useState<number>(120);
  const [newAssetKey, setNewAssetKey] = useState('C Minor');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listen to Firestore real-time updates
  useEffect(() => {
    const unsubscribe = firestoreService.listenToAIAssets(
      filterType === 'all' ? undefined : filterType,
      (cloudAssets) => {
        if (cloudAssets && cloudAssets.length > 0) {
          setAssets(cloudAssets);
        } else {
          // If no cloud assets yet, check local storage or demo assets
          const cached = localStorage.getItem('janu_ai_asset_vault');
          if (cached) {
            try {
              setAssets(JSON.parse(cached));
            } catch {
              setAssets(INITIAL_DEMO_ASSETS);
            }
          } else {
            setAssets(INITIAL_DEMO_ASSETS);
            // Save seed assets to firestore for persistence
            INITIAL_DEMO_ASSETS.forEach((asset) => {
              firestoreService.saveAIAsset(asset);
            });
          }
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [filterType]);

  // Sync to local storage as fallback
  useEffect(() => {
    if (assets.length > 0) {
      localStorage.setItem('janu_ai_asset_vault', safeStringify(assets));
    }
  }, [assets]);

  // Workspace Folders List
  const standardFolders = ['General', 'Campaigns', 'Social Clips', 'Drafts', 'Master Stems', 'Archive'];
  const assetFolders = Array.from(new Set(assets.map(a => a.folder).filter(Boolean))) as string[];
  const availableFolders = Array.from(new Set([...standardFolders, ...assetFolders]));

  // Helper: Parse file size string into numeric bytes for precise sorting and filtering
  const parseFileSize = (sizeStr?: string): number => {
    if (!sizeStr) return 0;
    const match = sizeStr.trim().match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = (match[2] || 'MB').toUpperCase();
    if (unit === 'GB') return val * 1024 * 1024 * 1024;
    if (unit === 'MB') return val * 1024 * 1024;
    if (unit === 'KB') return val * 1024;
    return val;
  };

  // Helper: Format ISO date string into human-readable and relative presentation
  const formatGenerationDate = (dateStr?: string): { formatted: string; relative: string; full: string } => {
    if (!dateStr) return { formatted: 'Recently', relative: 'Recently', full: 'Unknown timestamp' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { formatted: 'Recently', relative: 'Recently', full: 'Unknown timestamp' };
      const formatted = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const full = d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const now = Date.now();
      const diffMs = now - d.getTime();
      let relative = 'Just now';
      if (diffMs > 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) {
          const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
          relative = `${diffMins}m ago`;
        } else if (diffHours < 24) {
          relative = `${diffHours}h ago`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          if (diffDays === 1) relative = 'Yesterday';
          else if (diffDays < 30) relative = `${diffDays}d ago`;
          else relative = formatted;
        }
      }
      return { formatted, relative, full };
    } catch {
      return { formatted: 'Recently', relative: 'Recently', full: 'Unknown timestamp' };
    }
  };

  // Extract all unique project tags with item counts across assets
  const allProjectTags = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((asset) => {
      asset.tags?.forEach((tag) => {
        const clean = tag.trim();
        if (clean) {
          counts[clean] = (counts[clean] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [assets]);

  // Filtered Assets list
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // 1. Asset Type Filter
      if (filterType !== 'all' && asset.type !== filterType) return false;

      // 2. Workspace Folder Filter
      if (activeFolder !== 'all' && (asset.folder || 'General') !== activeFolder) return false;

      // 3. Favorites Only
      if (onlyFavorites && !asset.isFavorite) return false;

      // 4. Project Tag Filter
      if (selectedProjectTag !== 'all') {
        if (!asset.tags || !asset.tags.includes(selectedProjectTag)) {
          return false;
        }
      }

      // 5. File Size Range Filter
      if (sizeFilter !== 'all') {
        const bytes = parseFileSize(asset.fileSize);
        const mb = bytes / (1024 * 1024);
        if (sizeFilter === 'small' && mb >= 5) return false;
        if (sizeFilter === 'medium' && (mb < 5 || mb > 15)) return false;
        if (sizeFilter === 'large' && mb <= 15) return false;
      }

      // 6. Generation Date Range Filter
      if (dateFilter !== 'all') {
        const now = Date.now();
        const createdTime = asset.createdAt ? new Date(asset.createdAt).getTime() : 0;
        const ageMs = now - createdTime;
        if (dateFilter === '24h' && ageMs > 24 * 3600 * 1000) return false;
        if (dateFilter === '7d' && ageMs > 7 * 24 * 3600 * 1000) return false;
        if (dateFilter === '30d' && ageMs > 30 * 24 * 3600 * 1000) return false;
      }

      // 7. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = asset.title.toLowerCase().includes(q);
        const matchPrompt = asset.prompt?.toLowerCase().includes(q);
        const matchGenre = asset.genre?.toLowerCase().includes(q);
        const matchFolder = asset.folder?.toLowerCase().includes(q);
        const matchModel = asset.modelUsed?.toLowerCase().includes(q);
        const matchTags = asset.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchPrompt && !matchGenre && !matchTags && !matchFolder && !matchModel) return false;
      }

      return true;
    });
  }, [assets, filterType, activeFolder, onlyFavorites, selectedProjectTag, sizeFilter, dateFilter, searchQuery]);

  // Sorted and Filtered Assets list
  const sortedAndFilteredAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        cmp = dateA - dateB;
      } else if (sortBy === 'size') {
        const sizeA = parseFileSize(a.fileSize);
        const sizeB = parseFileSize(b.fileSize);
        cmp = sizeA - sizeB;
      } else if (sortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === 'tags') {
        const tagsA = a.tags?.length || 0;
        const tagsB = b.tags?.length || 0;
        cmp = tagsA - tagsB;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  }, [filteredAssets, sortBy, sortDirection]);

  // Active filters tracker
  const hasActiveFilters =
    filterType !== 'all' ||
    activeFolder !== 'all' ||
    onlyFavorites ||
    selectedProjectTag !== 'all' ||
    sizeFilter !== 'all' ||
    dateFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const handleResetAllFilters = () => {
    setFilterType('all');
    setActiveFolder('all');
    setOnlyFavorites(false);
    setSelectedProjectTag('all');
    setSizeFilter('all');
    setDateFilter('all');
    setSearchQuery('');
  };

  // Multi-Select Handlers
  const toggleSelectAsset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const allVisibleIds = sortedAndFilteredAssets.map((a) => a.id);
    setSelectedAssetIds(new Set(allVisibleIds));
    setIsSelectMode(true);
  };

  const handleClearSelection = () => {
    setSelectedAssetIds(new Set());
  };

  // Bulk Delete Execution
  const handleConfirmBulkDelete = async () => {
    if (selectedAssetIds.size === 0) return;
    setIsProcessingBulk(true);
    const countToDelete = selectedAssetIds.size;
    const itemsToDelete = assets
      .filter(a => selectedAssetIds.has(a.id))
      .map(a => ({ id: a.id, storagePath: a.storagePath }));

    try {
      await firestoreService.bulkDeleteAIAssets(itemsToDelete);
      setAssets(prev => prev.filter(a => !selectedAssetIds.has(a.id)));
      if (selectedAsset && selectedAssetIds.has(selectedAsset.id)) {
        setSelectedAsset(null);
        setPreviewMediaUrl(null);
      }
      setSelectedAssetIds(new Set());
      setShowBulkDeleteModal(false);
      triggerNeonExplosion({ particleCount: 35, intensity: 'subtle' });
      showToast(`Permanently deleted ${countToDelete} asset${countToDelete > 1 ? 's' : ''} from Vault & Cloud`);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      showToast('Error deleting some assets. Please try again.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Bulk Move to Folder Execution
  const handleConfirmBulkMove = async () => {
    if (selectedAssetIds.size === 0) return;
    setIsProcessingBulk(true);
    const destinationFolder = (customNewFolder.trim() || targetMoveFolder).trim() || 'General';
    const idsArray: string[] = Array.from(selectedAssetIds);

    try {
      // 1. Update folder in Firestore
      await firestoreService.bulkMoveAIAssetsToFolder(idsArray, destinationFolder);

      // 2. If reclassifying type
      if (targetMoveType) {
        await firestoreService.bulkChangeAssetType(idsArray, targetMoveType);
      }

      setAssets(prev =>
        prev.map(a => {
          if (selectedAssetIds.has(a.id)) {
            return {
              ...a,
              folder: destinationFolder,
              type: targetMoveType ? targetMoveType : a.type,
              updatedAt: new Date().toISOString()
            };
          }
          return a;
        })
      );

      triggerNeonExplosion({ particleCount: 40, intensity: 'medium' });
      showToast(`Moved ${idsArray.length} asset${idsArray.length > 1 ? 's' : ''} to "${destinationFolder}"!`);
      setSelectedAssetIds(new Set<string>());
      setCustomNewFolder('');
      setTargetMoveType('');
      setShowBulkMoveModal(false);
    } catch (err) {
      console.error('Bulk move failed:', err);
      showToast('Failed to complete move operation');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Bulk Toggle Favorite
  const handleBulkToggleFavorites = async (favoriteState: boolean) => {
    if (selectedAssetIds.size === 0) return;
    const idsArray: string[] = Array.from(selectedAssetIds);
    setAssets(prev =>
      prev.map(a => selectedAssetIds.has(a.id) ? { ...a, isFavorite: favoriteState } : a)
    );
    await firestoreService.bulkToggleFavorites(idsArray, favoriteState);
    showToast(`${favoriteState ? 'Starred' : 'Unstarred'} ${idsArray.length} selected assets`);
  };

  const handleToggleFavorite = async (asset: AIAsset) => {
    const updatedFav = !asset.isFavorite;
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, isFavorite: updatedFav } : a));
    if (selectedAsset && selectedAsset.id === asset.id) {
      setSelectedAsset({ ...selectedAsset, isFavorite: updatedFav });
    }
    await firestoreService.toggleAIAssetFavorite(asset.id, !!asset.isFavorite);
    showToast(updatedFav ? 'Added to Saved Favorites' : 'Removed from Favorites');
  };

  const handleDeleteAsset = async (asset: AIAsset) => {
    if (confirm(`Delete "${asset.title}" from your Asset Library?`)) {
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null);
        setPreviewMediaUrl(null);
      }
      await firestoreService.deleteAIAsset(asset.id, asset.storagePath);
      showToast('Asset deleted from library');
    }
  };

  const handlePlayAudioStem = (url: string) => {
    if (audioRef.current) {
      if (isPlayingAudio && audioRef.current.src === url) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.src = url;
        audioRef.current.play().then(() => {
          setIsPlayingAudio(true);
        }).catch(err => {
          console.warn('Audio stem play error:', err);
          showToast('Playing preview stem');
        });
      }
    }
  };

  const handleSaveNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetTitle.trim()) {
      showToast('Please enter an asset title');
      return;
    }

    setIsUploading(true);
    let finalMediaUrl = newAssetMediaUrl.trim();
    let storagePath = '';
    let fileSizeStr = '1.8 MB';

    // If user uploaded a physical file
    if (newAssetFile) {
      try {
        const uploadRes = await uploadCreatorAssetFile(
          newAssetFile,
          newAssetType,
          newAssetFile.name
        );
        finalMediaUrl = uploadRes.downloadUrl;
        storagePath = uploadRes.storagePath;
        fileSizeStr = uploadRes.fileSize;
      } catch (err) {
        console.warn('Direct upload error, falling back to local object URL:', err);
        finalMediaUrl = URL.createObjectURL(newAssetFile);
      }
    }

    if (!finalMediaUrl) {
      // Provide high-aesthetic fallback according to type
      if (newAssetType === 'image') {
        finalMediaUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop';
      } else if (newAssetType === 'audio_stem') {
        finalMediaUrl = 'https://actions.google.com/sounds/v1/science_fiction/alien_spaceship_hum.ogg';
      } else {
        finalMediaUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop';
      }
    }

    const tagsArray = newAssetTags.split(',').map(t => t.trim()).filter(Boolean);

    const newAsset: AIAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: newAssetType,
      title: newAssetTitle.trim(),
      prompt: newAssetPrompt.trim(),
      mediaUrl: finalMediaUrl,
      thumbnailUrl: finalMediaUrl,
      storagePath,
      fileSize: fileSizeStr,
      aspectRatio: newAssetType === 'reel_draft' ? '9:16' : '16:9',
      duration: newAssetType === 'audio_stem' ? 30 : (newAssetType === 'reel_draft' ? 15 : undefined),
      durationFormatted: newAssetType === 'audio_stem' ? '0:30' : (newAssetType === 'reel_draft' ? '0:15' : undefined),
      bpm: newAssetType === 'audio_stem' ? newAssetBpm : undefined,
      key: newAssetType === 'audio_stem' ? newAssetKey : undefined,
      genre: newAssetType === 'audio_stem' ? (newAssetGenre || 'Stem Layer') : undefined,
      modelUsed: newAssetType === 'image' ? 'gemini-3.1-flash-image' : (newAssetType === 'audio_stem' ? 'lyria-3-clip-preview' : 'veo-3.1-lite-generate-preview'),
      tags: tagsArray.length > 0 ? tagsArray : ['Creator Vault', 'AI Studio'],
      isFavorite: true,
      folder: newAssetFolder || (activeFolder !== 'all' ? activeFolder : 'General'),
      creatorName: auth.currentUser?.displayName || 'January Rebl',
      createdAt: new Date().toISOString()
    };

    // Optimistic state update
    setAssets(prev => [newAsset, ...prev]);
    await firestoreService.saveAIAsset(newAsset);

    setIsUploading(false);
    setShowAddModal(false);
    setNewAssetTitle('');
    setNewAssetPrompt('');
    setNewAssetMediaUrl('');
    setNewAssetFile(null);
    setNewAssetTags('');
    triggerNeonExplosion({ particleCount: 45, intensity: 'grand' });
    showToast(`Saved "${newAsset.title}" to Cloud Asset Vault!`);
  };

  const getTypeBadge = (type: AIAssetType) => {
    switch (type) {
      case 'image':
        return { label: 'AI Art', icon: 'fa-wand-magic-sparkles', color: 'bg-[#FF007F]/20 text-[#FF007F] border-[#FF007F]/40' };
      case 'audio_stem':
        return { label: 'Audio Stem', icon: 'fa-music', color: 'bg-[#00F5D4]/20 text-[#00F5D4] border-[#00F5D4]/40' };
      case 'reel_draft':
        return { label: 'Reel Draft', icon: 'fa-scissors', color: 'bg-[#C084FC]/20 text-[#C084FC] border-[#C084FC]/40' };
      case 'video':
        return { label: 'Veo Video', icon: 'fa-video', color: 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hidden Audio Player for Previewing Audio Stems */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={(e) => console.warn('Stem playback notice:', e)}
        className="hidden"
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-black/90 border border-[#00F5D4] text-white text-xs font-mono shadow-[0_0_25px_rgba(0,245,212,0.4)] flex items-center gap-2.5 animate-bounce">
          <i className="fa-solid fa-cloud-check text-[#00F5D4]"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls Strip */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-black via-[#0D0D14] to-black border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C084FC]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#00F5D4]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C084FC]/10 border border-[#C084FC]/30 text-[10px] font-mono font-bold uppercase text-[#C084FC] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#C084FC] animate-ping"></span>
              <span>Cloud Firestore & Storage • Real-Time Vault</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-black italic text-white tracking-tight">
              AI Asset <span className="creations-script text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]">Library</span>
            </h2>
            <p className="text-xs sm:text-sm font-mono text-gray-400 mt-2 max-w-2xl font-light leading-relaxed">
              Instantly store, preview, organize, and load generated AI artwork, Lyria audio stems, Veo motion clips, and reel drafts across all creative studios.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Multi-Select Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isSelectMode) {
                  setIsSelectMode(false);
                  setSelectedAssetIds(new Set());
                } else {
                  setIsSelectMode(true);
                }
              }}
              className={`px-4 py-3 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                isSelectMode || selectedAssetIds.size > 0
                  ? 'bg-[#00F5D4]/20 border-[#00F5D4] text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <i className="fa-solid fa-square-check text-sm"></i>
              <span>{isSelectMode ? 'Exit Select Mode' : 'Multi-Select'}</span>
              {selectedAssetIds.size > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#00F5D4] text-black font-mono text-[10px] font-bold shadow-sm">
                  {selectedAssetIds.size}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] hover:opacity-95 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(0,245,212,0.3)] transition-all cursor-pointer"
            >
              <i className="fa-solid fa-plus text-sm"></i>
              <span>Save New Asset</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Asset Type Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
            {[
              { id: 'all', label: 'All Vault Assets', icon: 'fa-layer-group', count: assets.length },
              { id: 'image', label: 'AI Art', icon: 'fa-wand-magic-sparkles', count: assets.filter(a => a.type === 'image').length },
              { id: 'audio_stem', label: 'Audio Stems', icon: 'fa-music', count: assets.filter(a => a.type === 'audio_stem').length },
              { id: 'reel_draft', label: 'Reel Drafts', icon: 'fa-scissors', count: assets.filter(a => a.type === 'reel_draft').length },
              { id: 'video', label: 'Veo Videos', icon: 'fa-video', count: assets.filter(a => a.type === 'video').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-gradient-to-r from-[#00F5D4]/25 to-[#C084FC]/25 border border-[#00F5D4] text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.25)]'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-[11px]`}></i>
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[9px] text-gray-300 font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Favorites Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompt, title, tags, specs..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-[#00F5D4]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyFavorites
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
              title="Filter Starred Favorites"
            >
              <i className="fa-solid fa-star"></i>
              <span className="hidden sm:inline">Favorites</span>
            </button>
          </div>
        </div>

        {/* Sort and Attribute Filter Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
          {/* Left: Sort Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <i className="fa-solid fa-arrow-down-short-wide text-[#00F5D4] text-xs"></i>
              <span className="font-bold text-gray-300">Sort By:</span>
            </div>

            {/* Sort Attribute Dropdown / Selector */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
              {[
                { id: 'date', label: 'Date', icon: 'fa-regular fa-calendar' },
                { id: 'size', label: 'Size', icon: 'fa-solid fa-hard-drive' },
                { id: 'title', label: 'Title', icon: 'fa-solid fa-arrow-down-a-z' },
                { id: 'tags', label: 'Tags', icon: 'fa-solid fa-tags' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSortBy(item.id as 'date' | 'size' | 'title' | 'tags')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    sortBy === item.id
                      ? 'bg-[#00F5D4] text-black font-bold shadow-[0_0_10px_rgba(0,245,212,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <i className={`${item.icon} text-[10px]`}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Direction Toggle */}
            <button
              type="button"
              onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 rounded-xl bg-black/50 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              title={sortDirection === 'desc' ? 'Descending (Newest / Largest / Z-A)' : 'Ascending (Oldest / Smallest / A-Z)'}
            >
              <i className={`fa-solid ${sortDirection === 'desc' ? 'fa-arrow-down-wide-short text-[#00F5D4]' : 'fa-arrow-up-wide-short text-[#C084FC]'} text-xs`}></i>
              <span className="font-bold">{sortDirection === 'desc' ? 'Desc' : 'Asc'}</span>
            </button>
          </div>

          {/* Right: Attribute Range Filters (Size & Date) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* File Size Range Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-1">
                <i className="fa-solid fa-hard-drive text-[#00F5D4] text-[10px]"></i>
                <span className="hidden sm:inline">Size:</span>
              </span>
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'small', label: '< 5MB' },
                  { id: 'medium', label: '5-15MB' },
                  { id: 'large', label: '> 15MB' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeFilter(s.id as 'all' | 'small' | 'medium' | 'large')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      sizeFilter === s.id
                        ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-1">
                <i className="fa-regular fa-calendar text-[#C084FC] text-[10px]"></i>
                <span className="hidden sm:inline">Date:</span>
              </span>
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                {[
                  { id: 'all', label: 'All' },
                  { id: '24h', label: '24h' },
                  { id: '7d', label: '7d' },
                  { id: '30d', label: '30d' }
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDateFilter(d.id as 'all' | '24h' | '7d' | '30d')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      dateFilter === d.id
                        ? 'bg-[#C084FC]/20 border border-[#C084FC] text-[#C084FC] font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                title="Clear all active filters and search"
              >
                <i className="fa-solid fa-rotate-left text-[10px]"></i>
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Folder Filter Sub-Bar */}
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5 pl-1 pr-1 whitespace-nowrap">
              <i className="fa-solid fa-folder-tree text-[#C084FC]"></i>
              <span>Folder:</span>
            </span>

            <button
              type="button"
              onClick={() => setActiveFolder('all')}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeFolder === 'all'
                  ? 'bg-[#C084FC]/25 border border-[#C084FC] text-[#C084FC] font-bold shadow-[0_0_12px_rgba(192,132,252,0.25)]'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <span>All Workspaces</span>
              <span className="text-[9px] opacity-75 font-mono">({assets.length})</span>
            </button>

            {availableFolders.map((folderName) => {
              const count = assets.filter(a => (a.folder || 'General') === folderName).length;
              return (
                <button
                  key={folderName}
                  type="button"
                  onClick={() => setActiveFolder(folderName)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeFolder === folderName
                      ? 'bg-[#C084FC]/25 border border-[#C084FC] text-[#C084FC] font-bold shadow-[0_0_12px_rgba(192,132,252,0.25)]'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-folder text-[10px] text-[#C084FC]/70"></i>
                  <span>{folderName}</span>
                  <span className="text-[9px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {(isSelectMode || selectedAssetIds.size > 0) && (
            <div className="flex items-center gap-2 whitespace-nowrap self-end sm:self-auto">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#00F5D4]/20 border border-white/10 hover:border-[#00F5D4]/50 text-gray-300 hover:text-[#00F5D4] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-check-double text-[10px]"></i>
                <span>Select All ({sortedAndFilteredAssets.length})</span>
              </button>
              {selectedAssetIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs font-mono transition-all cursor-pointer"
                >
                  <span>Clear ({selectedAssetIds.size})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Associated Project Tags Filter Strip */}
        {allProjectTags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5 pl-1 pr-1 whitespace-nowrap">
              <i className="fa-solid fa-tags text-[#00F5D4]"></i>
              <span>Project Tags:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedProjectTag('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                selectedProjectTag === 'all'
                  ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] font-bold shadow-[0_0_10px_rgba(0,245,212,0.2)]'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <span>#All Tags</span>
            </button>

            {allProjectTags.map(({ tag, count }) => {
              const isSelected = selectedProjectTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedProjectTag(isSelected ? 'all' : tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#00F5D4]/25 to-[#C084FC]/25 border border-[#00F5D4] text-[#00F5D4] font-bold shadow-[0_0_12px_rgba(0,245,212,0.3)]'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                  title={`Filter by tag #${tag}`}
                >
                  <span className="text-[#00F5D4]">#</span>
                  <span>{tag}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/40 text-gray-400 font-mono">
                    {count}
                  </span>
                  {isSelected && (
                    <i className="fa-solid fa-xmark text-[10px] ml-0.5 text-gray-300 hover:text-white"></i>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Saved AI Assets */}
      {sortedAndFilteredAssets.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0D0D14] border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] flex items-center justify-center text-2xl mx-auto">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <h3 className="text-xl font-serif font-bold text-white">No Assets Found</h3>
          <p className="text-xs font-mono text-gray-400 max-w-md mx-auto">
            {hasActiveFilters
              ? 'No assets match the selected filters, size range, or project tags. Try resetting filters to explore the library.'
              : 'Save generated art from Gemini Alchemist, stems from Lyria Music, or drafts from Reel Editor.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="px-6 py-2.5 rounded-xl bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] text-xs font-mono font-bold hover:bg-[#00F5D4]/30 transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 rounded-xl bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] text-xs font-mono font-bold"
            >
              Add Your First Asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedAndFilteredAssets.map((asset) => {
            const badge = getTypeBadge(asset.type);
            const isAudio = asset.type === 'audio_stem';
            const isSelected = selectedAssetIds.has(asset.id);

            return (
              <div
                key={asset.id}
                onClick={(e) => {
                  if (isSelectMode || selectedAssetIds.size > 0) {
                    toggleSelectAsset(asset.id, e);
                  }
                }}
                className={`group p-4 rounded-3xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#00F5D4]/15 via-[#0D0D14] to-black border-2 border-[#00F5D4] shadow-[0_0_30px_rgba(0,245,212,0.35)] ring-1 ring-[#00F5D4]/50'
                    : 'bg-[#0D0D14] border border-white/10 hover:border-[#00F5D4]/50 shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
                }`}
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/80 mb-3 group/media">
                  {/* Multi-Select Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => toggleSelectAsset(asset.id, e)}
                    className={`absolute top-2.5 left-2.5 z-20 w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00F5D4] border-2 border-[#00F5D4] text-black shadow-[0_0_15px_rgba(0,245,212,0.8)] scale-105'
                        : isSelectMode || selectedAssetIds.size > 0
                          ? 'bg-black/80 border-2 border-white/40 text-transparent hover:border-[#00F5D4]'
                          : 'bg-black/60 border border-white/20 text-transparent opacity-0 group-hover:opacity-100 hover:border-[#00F5D4]'
                    }`}
                    title={isSelected ? 'Deselect Asset' : 'Select for Bulk Actions'}
                  >
                    <i className="fa-solid fa-check text-xs font-black"></i>
                  </button>

                  {isAudio ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#00F5D4]/10 via-black to-[#C084FC]/10 border border-white/5">
                      <div className="w-12 h-12 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] text-lg mb-2 shadow-[0_0_15px_rgba(0,245,212,0.3)]">
                        <i className={`fa-solid ${isPlayingAudio && audioRef.current?.src === asset.mediaUrl ? 'fa-pause' : 'fa-play'}`}></i>
                      </div>
                      <span className="text-[10px] font-mono text-gray-300 uppercase tracking-wider font-bold">
                        {asset.bpm ? `${asset.bpm} BPM • ` : ''}{asset.key || 'Audio Stem'}
                      </span>
                      <span className="text-[9px] font-mono text-[#00F5D4] mt-0.5">
                        {asset.durationFormatted || '0:30'}
                      </span>

                      {/* Direct Play overlay button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudioStem(asset.mediaUrl);
                        }}
                        className="absolute inset-0 w-full h-full bg-black/40 opacity-0 group-hover/media:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <span className="px-3 py-1.5 rounded-full bg-[#00F5D4] text-black text-xs font-mono font-bold shadow-lg">
                          {isPlayingAudio && audioRef.current?.src === asset.mediaUrl ? 'Pause Stem' : 'Preview Audio'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <img
                        src={asset.thumbnailUrl || asset.mediaUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity flex items-end p-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsset(asset);
                            setPreviewMediaUrl(asset.mediaUrl);
                          }}
                          className="w-full py-1.5 rounded-xl bg-black/80 border border-white/20 text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 backdrop-blur-sm cursor-pointer"
                        >
                          <i className="fa-solid fa-expand text-[#00F5D4]"></i>
                          <span>Inspect High-Res</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Badges on preview */}
                  <div
                    className={`absolute top-2.5 transition-all flex items-center gap-1.5 ${
                      isSelected || isSelectMode || selectedAssetIds.size > 0 ? 'left-11' : 'left-2.5 group-hover:left-11'
                    }`}
                  >
                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase backdrop-blur-md ${badge.color}`}>
                      <i className={`fa-solid ${badge.icon} mr-1`}></i>
                      {badge.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(asset);
                    }}
                    className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs backdrop-blur-md transition-all cursor-pointer ${
                      asset.isFavorite
                        ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-black/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-star"></i>
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-serif font-black italic text-white line-clamp-1 group-hover:text-[#00F5D4] transition-colors">
                      {asset.title}
                    </h4>
                  </div>

                  {asset.prompt && (
                    <p className="text-[11px] font-mono text-gray-400 line-clamp-2 leading-tight font-light">
                      &ldquo;{asset.prompt}&rdquo;
                    </p>
                  )}

                  {/* Primary Metadata Row: Generation Date & File Size */}
                  {(() => {
                    const dateInfo = formatGenerationDate(asset.createdAt);
                    return (
                      <div className="pt-2 flex items-center justify-between gap-2 text-[10px] font-mono border-t border-white/5">
                        {/* Generation Date */}
                        <div
                          className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5"
                          title={`Generated: ${dateInfo.full}`}
                        >
                          <i className="fa-regular fa-calendar text-[#C084FC] text-[9px]"></i>
                          <span className="font-medium text-gray-200">{dateInfo.relative}</span>
                          <span className="text-gray-500 text-[9px] hidden xl:inline">({dateInfo.formatted})</span>
                        </div>

                        {/* File Size */}
                        <div
                          className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5"
                          title={`Asset File Size: ${asset.fileSize || 'Standard Master'}`}
                        >
                          <i className="fa-solid fa-hard-drive text-[#00F5D4] text-[9px]"></i>
                          <span className="font-bold text-white">{asset.fileSize || '3.2 MB'}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Associated Project Tags */}
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-mono text-gray-500 uppercase flex items-center gap-1">
                        <i className="fa-solid fa-tag text-[8px] text-[#00F5D4]/70"></i>
                      </span>
                      {asset.tags.map((tag) => {
                        const isTagActive = selectedProjectTag === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectTag(isTagActive ? 'all' : tag);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-mono transition-all border cursor-pointer ${
                              isTagActive
                                ? 'bg-[#00F5D4]/25 border-[#00F5D4] text-[#00F5D4] font-bold shadow-[0_0_8px_rgba(0,245,212,0.3)]'
                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                            }`}
                            title={`Filter library by tag #${tag}`}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Secondary Metadata & Technical Specs */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {/* Folder Pill */}
                    <span className="px-2 py-0.5 rounded-md bg-[#C084FC]/15 border border-[#C084FC]/30 text-[9px] font-mono text-[#C084FC] flex items-center gap-1 font-bold">
                      <i className="fa-solid fa-folder text-[8px]"></i>
                      <span>{asset.folder || 'General'}</span>
                    </span>

                    {asset.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-300">
                        {asset.modelUsed}
                      </span>
                    )}
                    {asset.aspectRatio && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-300">
                        {asset.aspectRatio}
                      </span>
                    )}
                    {asset.durationFormatted && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-300 flex items-center gap-1">
                        <i className="fa-regular fa-clock text-[8px]"></i>
                        {asset.durationFormatted}
                      </span>
                    )}
                    {asset.bpm && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-300">
                        {asset.bpm} BPM
                      </span>
                    )}
                    {asset.key && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-300">
                        {asset.key}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectAsset) {
                        onSelectAsset(asset);
                      }
                      if (asset.type === 'reel_draft' && onNavigateToStudio) {
                        onNavigateToStudio('reel');
                      } else if (asset.type === 'audio_stem' && onNavigateToStudio) {
                        onNavigateToStudio('music');
                      } else if (asset.type === 'image' && onNavigateToStudio) {
                        onNavigateToStudio('photo');
                      }
                      showToast(`Loaded ${asset.title} into Studio!`);
                    }}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-[#00F5D4]/20 border border-white/10 hover:border-[#00F5D4]/40 text-gray-200 hover:text-[#00F5D4] text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    <span>Quick Load</span>
                  </button>

                  <a
                    href={asset.mediaUrl}
                    download={`${asset.title.replace(/\s+/g, '-').toLowerCase()}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs flex items-center justify-center transition-all cursor-pointer"
                    title="Direct Download"
                  >
                    <i className="fa-solid fa-download"></i>
                  </a>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAsset(asset);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-gray-400 hover:text-rose-400 text-xs flex items-center justify-center transition-all cursor-pointer"
                    title="Delete Asset"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Cyberpunk Bulk Action Bar */}
      {selectedAssetIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-black/90 backdrop-blur-2xl border border-[#00F5D4]/60 rounded-3xl p-3 sm:p-4 shadow-[0_15px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(0,245,212,0.3)] flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] flex items-center justify-center text-sm font-mono font-bold shadow-[0_0_15px_rgba(0,245,212,0.4)]">
              {selectedAssetIds.size}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-mono font-bold text-white leading-tight">
                {selectedAssetIds.size} {selectedAssetIds.size === 1 ? 'Asset' : 'Assets'} Selected
              </div>
              <div className="text-[10px] font-mono text-gray-400">
                Bulk workspace actions ready
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Bulk Move */}
            <button
              type="button"
              onClick={() => {
                setTargetMoveFolder(activeFolder !== 'all' ? activeFolder : 'General');
                setShowBulkMoveModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C084FC]/30 to-[#00F5D4]/30 hover:from-[#C084FC]/50 hover:to-[#00F5D4]/50 border border-[#C084FC] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(192,132,252,0.25)] cursor-pointer"
              title="Move selected assets to a folder"
            >
              <i className="fa-solid fa-folder-arrow-up text-[#00F5D4]"></i>
              <span>Move / Organize</span>
            </button>

            {/* Bulk Star */}
            <button
              type="button"
              onClick={() => handleBulkToggleFavorites(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-gray-300 hover:text-amber-400 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              title="Star All Selected"
            >
              <i className="fa-solid fa-star text-amber-400"></i>
              <span className="hidden md:inline">Star</span>
            </button>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500 text-rose-300 hover:text-rose-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
              title="Bulk delete selected assets"
            >
              <i className="fa-solid fa-trash-can text-rose-400"></i>
              <span>Bulk Delete</span>
            </button>

            {/* Cancel Selection */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer"
              title="Clear Selection"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Move Modal */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[#0D0D14] border border-[#C084FC]/50 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(192,132,252,0.25)] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#C084FC] flex items-center gap-1.5">
                  <i className="fa-solid fa-folder-tree"></i>
                  <span>Bulk Asset Management</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white mt-1">
                  Move {selectedAssetIds.size} Selected {selectedAssetIds.size === 1 ? 'Asset' : 'Assets'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkMoveModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Selected Assets Preview Thumbnails */}
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10">
              <span className="text-[10px] font-mono uppercase text-gray-400 block mb-2">Selected Assets Preview:</span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {assets
                  .filter((a) => selectedAssetIds.has(a.id))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="w-14 h-14 rounded-xl overflow-hidden bg-black/80 border border-white/15 flex-shrink-0 relative group"
                      title={item.title}
                    >
                      {item.type === 'audio_stem' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#00F5D4]/10 text-[#00F5D4] text-xs">
                          <i className="fa-solid fa-music"></i>
                        </div>
                      ) : (
                        <img
                          src={item.thumbnailUrl || item.mediaUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button
                          type="button"
                          onClick={() => toggleSelectAsset(item.id)}
                          className="text-rose-400 text-xs cursor-pointer"
                          title="Remove from selection"
                        >
                          <i className="fa-solid fa-circle-xmark"></i>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Target Folder Selection */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase text-gray-300 block font-bold">
                1. Select Target Folder / Collection
              </label>

              <div className="flex flex-wrap gap-2">
                {availableFolders.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setTargetMoveFolder(f);
                      setCustomNewFolder('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
                      targetMoveFolder === f && !customNewFolder
                        ? 'bg-[#00F5D4]/20 border-[#00F5D4] text-[#00F5D4] font-bold shadow-[0_0_12px_rgba(0,245,212,0.25)]'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className="fa-solid fa-folder text-[10px]"></i>
                    <span>{f}</span>
                  </button>
                ))}
              </div>

              {/* Or Create New Folder */}
              <div className="pt-2">
                <span className="text-[11px] font-mono text-gray-400 block mb-1">Or create a new folder:</span>
                <input
                  type="text"
                  value={customNewFolder}
                  onChange={(e) => setCustomNewFolder(e.target.value)}
                  placeholder="e.g. Summer Drop 2026, Client Showcase"
                  className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00F5D4]"
                />
              </div>
            </div>

            {/* Optional Type Reclassification */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-mono uppercase text-gray-400 block">
                2. Reclassify Category (Optional)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: '', label: 'Keep Current' },
                  { id: 'image', label: 'AI Art' },
                  { id: 'audio_stem', label: 'Audio Stem' },
                  { id: 'reel_draft', label: 'Reel Draft' },
                  { id: 'video', label: 'Veo Video' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetMoveType(t.id as AIAssetType | '')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-mono transition-all border text-center cursor-pointer ${
                      targetMoveType === t.id
                        ? 'bg-[#C084FC]/25 border-[#C084FC] text-[#C084FC] font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowBulkMoveModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={handleConfirmBulkMove}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,212,0.3)] hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {isProcessingBulk ? 'Moving Assets...' : `Move ${selectedAssetIds.size} Assets`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0D0D14] border border-rose-500/60 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(244,63,94,0.3)] space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500 flex items-center justify-center text-xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Permanent Deletion</span>
                <h3 className="text-xl font-serif font-black italic text-white">
                  Delete {selectedAssetIds.size} {selectedAssetIds.size === 1 ? 'Asset' : 'Assets'}?
                </h3>
              </div>
            </div>

            <p className="text-xs font-mono text-gray-300 leading-relaxed">
              This will permanently erase the selected items and their associated master media files from Cloud Firestore and Storage. This action cannot be undone.
            </p>

            {/* Mini preview list of items being removed */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar border-t border-b border-white/10 py-3">
              {assets
                .filter((a) => selectedAssetIds.has(a.id))
                .map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-white/5 text-xs font-mono">
                    <span className="text-white truncate flex-1">{a.title}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{a.type.replace('_', ' ')}</span>
                  </div>
                ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessingBulk ? 'Deleting...' : `Yes, Delete All`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Inspection Modal */}
      {selectedAsset && previewMediaUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-4xl w-full p-6 sm:p-8 rounded-3xl bg-[#0D0D14] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${getTypeBadge(selectedAsset.type).color}`}>
                  {getTypeBadge(selectedAsset.type).label}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white mt-1">
                  {selectedAsset.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAsset(null);
                  setPreviewMediaUrl(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[60vh]">
              {selectedAsset.type === 'audio_stem' ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] flex items-center justify-center text-3xl mx-auto">
                    <i className="fa-solid fa-music"></i>
                  </div>
                  <p className="text-sm font-mono text-gray-300">
                    {selectedAsset.bpm} BPM • {selectedAsset.key} • {selectedAsset.genre}
                  </p>
                  <button
                    type="button"
                    onClick={() => handlePlayAudioStem(selectedAsset.mediaUrl)}
                    className="px-6 py-2.5 rounded-full bg-[#00F5D4] text-black font-mono font-bold text-xs"
                  >
                    {isPlayingAudio ? 'Pause Stem' : 'Play Audio Stem'}
                  </button>
                </div>
              ) : selectedAsset.type === 'video' ? (
                <video
                  src={previewMediaUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-h-[60vh] w-auto object-contain rounded-2xl"
                />
              ) : (
                <img
                  src={previewMediaUrl}
                  alt={selectedAsset.title}
                  className="max-h-[60vh] w-auto object-contain rounded-2xl"
                />
              )}
            </div>

            {selectedAsset.prompt && (
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-gray-300">
                <span className="text-[#00F5D4] font-bold block mb-1">Prompt / Synthesis Notes:</span>
                <p className="leading-relaxed">&ldquo;{selectedAsset.prompt}&rdquo;</p>
              </div>
            )}

            {/* Comprehensive Metadata Grid */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                {/* Generation Date */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <i className="fa-regular fa-calendar text-[#C084FC]"></i>
                    <span>Generated</span>
                  </span>
                  <div className="font-bold text-white text-[11px]">
                    {formatGenerationDate(selectedAsset.createdAt).formatted}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatGenerationDate(selectedAsset.createdAt).relative}
                  </div>
                </div>

                {/* File Size */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <i className="fa-solid fa-hard-drive text-[#00F5D4]"></i>
                    <span>File Size</span>
                  </span>
                  <div className="font-bold text-[#00F5D4] text-[11px]">
                    {selectedAsset.fileSize || 'Standard Master'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Storage Ref Master
                  </div>
                </div>

                {/* Folder Collection */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <i className="fa-solid fa-folder text-[#C084FC]"></i>
                    <span>Folder</span>
                  </span>
                  <div className="font-bold text-white text-[11px]">
                    {selectedAsset.folder || 'General'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Workspace Collection
                  </div>
                </div>

                {/* Model Engine */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <i className="fa-solid fa-microchip text-[#00F5D4]"></i>
                    <span>Model Engine</span>
                  </span>
                  <div className="font-bold text-white text-[11px] truncate" title={selectedAsset.modelUsed || 'Janus Engine'}>
                    {selectedAsset.modelUsed || 'Janus Engine'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {selectedAsset.aspectRatio || (selectedAsset.bpm ? `${selectedAsset.bpm} BPM` : 'Standard 1:1')}
                  </div>
                </div>
              </div>

              {/* Associated Project Tags in Modal */}
              {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1">
                    <i className="fa-solid fa-tags text-[#00F5D4] text-[9px]"></i>
                    <span>Associated Tags:</span>
                  </span>
                  {selectedAsset.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedProjectTag(tag);
                        setSelectedAsset(null);
                      }}
                      className="px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-[10px] font-mono text-[#00F5D4] hover:border-[#00F5D4] transition-all cursor-pointer"
                      title={`Filter library by tag #${tag}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] font-mono text-gray-400">
                Created: {new Date(selectedAsset.createdAt).toLocaleString()}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={selectedAsset.mediaUrl}
                  download={selectedAsset.title}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-download text-[#00F5D4]"></i>
                  <span>Download Master</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectAsset) onSelectAsset(selectedAsset);
                    if (selectedAsset.type === 'reel_draft' && onNavigateToStudio) onNavigateToStudio('reel');
                    if (selectedAsset.type === 'audio_stem' && onNavigateToStudio) onNavigateToStudio('music');
                    if (selectedAsset.type === 'image' && onNavigateToStudio) onNavigateToStudio('photo');
                    setSelectedAsset(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-right"></i>
                  <span>Open in Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save New Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[#0D0D14] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#00F5D4]">Asset Library Intake</span>
                <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white mt-1">
                  Save AI Creation to Vault
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveNewAsset} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="text-xs font-mono uppercase text-gray-400 block mb-2">Asset Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'image', label: 'AI Art', icon: 'fa-wand-magic-sparkles' },
                    { id: 'audio_stem', label: 'Stem', icon: 'fa-music' },
                    { id: 'reel_draft', label: 'Reel', icon: 'fa-scissors' },
                    { id: 'video', label: 'Video', icon: 'fa-video' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewAssetType(t.id as AIAssetType)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center gap-1 border transition-all ${
                        newAssetType === t.id
                          ? 'bg-[#00F5D4]/20 border-[#00F5D4] text-[#00F5D4]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <i className={`fa-solid ${t.icon} text-xs`}></i>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-mono uppercase text-gray-400 block mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  value={newAssetTitle}
                  onChange={(e) => setNewAssetTitle(e.target.value)}
                  placeholder="e.g. Neon Horizon Synth Bassline"
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00F5D4]"
                />
              </div>

              {/* Folder Selection */}
              <div>
                <label className="text-xs font-mono uppercase text-gray-400 block mb-1">
                  Workspace Folder / Collection
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAssetFolder}
                    onChange={(e) => setNewAssetFolder(e.target.value)}
                    placeholder="General, Campaigns, Stems..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00F5D4]"
                  />
                  <div className="flex gap-1">
                    {['General', 'Drafts', 'Stems', 'Archive'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setNewAssetFolder(f)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                          newAssetFolder.toLowerCase() === f.toLowerCase()
                            ? 'bg-[#C084FC]/20 border-[#C084FC] text-[#C084FC]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prompt / Description */}
              <div>
                <label className="text-xs font-mono uppercase text-gray-400 block mb-1">Synthesis Prompt / Notes</label>
                <textarea
                  rows={2}
                  value={newAssetPrompt}
                  onChange={(e) => setNewAssetPrompt(e.target.value)}
                  placeholder="The AI prompt or creative instructions used..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00F5D4] resize-none"
                />
              </div>

              {/* Upload file or URL */}
              <div>
                <label className="text-xs font-mono uppercase text-gray-400 block mb-1">Media File or URL</label>
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-xl border border-dashed border-white/20 hover:border-[#00F5D4] text-center cursor-pointer transition-colors bg-white/5"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-xl text-[#00F5D4] mb-1"></i>
                    <p className="text-xs font-mono text-gray-300">
                      {newAssetFile ? newAssetFile.name : 'Click to select local file from computer'}
                    </p>
                    <span className="text-[10px] font-mono text-gray-500">Supports PNG, JPG, MP3, WAV, MP4</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setNewAssetFile(e.target.files[0]);
                        if (!newAssetTitle) {
                          setNewAssetTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                  />

                  <div className="text-center text-[10px] font-mono text-gray-500">- OR PASTE WEB URL -</div>
                  <input
                    type="url"
                    value={newAssetMediaUrl}
                    onChange={(e) => setNewAssetMediaUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00F5D4]"
                  />
                </div>
              </div>

              {/* Audio specific fields */}
              {newAssetType === 'audio_stem' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">BPM</label>
                    <input
                      type="number"
                      value={newAssetBpm}
                      onChange={(e) => setNewAssetBpm(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/15 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Key</label>
                    <input
                      type="text"
                      value={newAssetKey}
                      onChange={(e) => setNewAssetKey(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/15 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Genre</label>
                    <input
                      type="text"
                      value={newAssetGenre}
                      placeholder="e.g. Bass"
                      onChange={(e) => setNewAssetGenre(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/15 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="text-xs font-mono uppercase text-gray-400 block mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newAssetTags}
                  onChange={(e) => setNewAssetTags(e.target.value)}
                  placeholder="Synthwave, Drop, Visual FX"
                  className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00F5D4]"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,212,0.3)] hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isUploading ? `Uploading to Firebase Storage (${uploadProgress}%)...` : 'Save to Asset Library'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssetLibrary;
