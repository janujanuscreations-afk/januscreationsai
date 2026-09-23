
export enum ServiceCategory {
  BRANDING = 'Branding',
  DIGITAL = 'Digital Design',
  AI_STRATEGY = 'AI Strategy',
  PRODUCTION = 'Creative Production'
}

export interface Project {
  id: string;
  title: string;
  category: ServiceCategory;
  imageUrl: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface BrandBrief {
  name: string;
  industry: string;
  vibe: string;
  targetAudience: string;
}

export type BossNotificationType = 'tip' | 'rank_up' | 'contest_win' | 'boss_dividend' | 'revenue_milestone' | 'system';

export interface BossNotification {
  id: string;
  type: BossNotificationType;
  title: string;
  subtitle?: string;
  message: string;
  amount?: number;
  platformCut?: number;
  creator?: {
    name: string;
    handle?: string;
    avatar?: string;
  };
  sender?: string;
  rankInfo?: {
    oldRank: number;
    newRank: number;
    tier: string;
  };
  contestInfo?: {
    contestTitle: string;
    prize: number;
    rank: number;
  };
  milestoneInfo?: {
    threshold: number;
    totalAggregated: number;
    milestoneName?: string;
    tier?: string;
    gateway?: string;
  };
  timestamp: Date;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface AutoPayoutLog {
  id: string;
  timestamp: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  threshold: number;
  paypalEmail: string;
  batchId: string;
  txId: string;
  status: 'SUCCESS' | 'FAILED';
  note?: string;
}

export interface AutoPayoutSetting {
  id: string;
  userId?: string;
  enabled: boolean;
  thresholdAmount: number;
  paypalEmail: string;
  payoutMode: 'full_balance' | 'threshold_amount' | 'custom_reserve';
  minimumReserve: number;
  autoApprove: boolean;
  lastTriggeredAt?: string;
  lastTriggeredAmount?: number;
  lastBatchId?: string;
  lastTxId?: string;
  totalAutoDisbursed: number;
  autoPayoutCount: number;
  history: AutoPayoutLog[];
  updatedAt?: string;
}

export type TransactionStatus = 'completed' | 'settled' | 'pending' | 'processing' | 'refunded' | 'failed' | 'reversed';

export interface WalletTransaction {
  id: string;
  userId?: string;
  type: 'inflow' | 'payout' | 'refund' | 'tip' | 'royalty' | 'bounty' | 'gateway';
  amount: number;
  netAmount: number;
  platformCut: number;
  currency: string;
  source: string;
  category: 'tips' | 'royalties' | 'contests' | 'gateway' | 'subscriptions' | 'payouts';
  description: string;
  payerName?: string;
  payerEmail?: string;
  payerHandle?: string;
  recipientName?: string;
  recipientEmail?: string;
  status: TransactionStatus;
  timestamp: string;
  date: string;
  clientRef?: string;
  method?: string;
  invoiceId?: string;
  ipnTrackId?: string;
}

export interface RevenueRecord {
  id: string;
  userId?: string;
  amount: number;
  netAmount: number;
  source: string;
  category: 'tips' | 'royalties' | 'contests' | 'gateway' | 'subscriptions' | 'payouts';
  description: string;
  creatorName?: string;
  creatorHandle?: string;
  payerName?: string;
  payerEmail?: string;
  payerHandle?: string;
  status: TransactionStatus;
  currency: string;
  platformCut: number;
  timestamp: string;
  date: string;
  clientRef?: string;
  method?: string;
  refundReason?: string;
}

export interface DailyRevenuePoint {
  date: string;
  label: string;
  amount: number;
  count: number;
  tips: number;
  royalties: number;
  contests: number;
  gateway: number;
}

export interface UploadedSong {
  id: string;
  userId?: string;
  creatorHandle?: string;
  title: string;
  artist: string;
  genre: string;
  genreCategory: string;
  bpm: number;
  key: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "3:15"
  audioUrl: string; // audio Firebase Storage download URL, object URL, or remote URL
  audioStoragePath?: string; // Firebase Storage ref path e.g. "creators/{uid}/audio/{id}.mp3"
  storageBucket?: string;
  audioBase64?: string;
  fileName?: string;
  fileSize?: string;
  fileFormat?: string;
  contentType?: string;
  coverArtUrl?: string;
  coverArtStoragePath?: string;
  coverGradient?: string;
  lyrics?: string;
  vocalType?: 'full_vocals' | 'instrumental' | 'acapella' | 'stem_mixed';
  plays: number | string;
  likes: number;
  uploadedBy: string;
  isCustomUpload: boolean;
  isFirebaseStorage?: boolean;
  royaltySplitCreator?: number; // default 85%
  royaltySplitJanu?: number; // default 15%
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Last30DaysRevenueSummary {
  totalRevenue: number;
  netCreatorEarnings: number;
  platformCutTotal: number;
  totalTransactions: number;
  prior30DaysRevenue: number;
  growthPercentage: number;
  averageDailyRevenue: number;
  highestDayRevenue: number;
  highestDayDate: string;
  dailyBreakdown: DailyRevenuePoint[];
  categoryTotals: {
    tips: number;
    royalties: number;
    contests: number;
    gateway: number;
    subscriptions: number;
  };
  recentTransactions: RevenueRecord[];
  isLiveSynced: boolean;
  lastUpdated: string;
}

export type AIAssetType = 'image' | 'audio_stem' | 'reel_draft' | 'video';

export interface AIAsset {
  id: string;
  userId?: string;
  creatorName?: string;
  type: AIAssetType;
  title: string;
  description?: string;
  prompt?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  storagePath?: string;
  fileSize?: string;
  aspectRatio?: string;
  duration?: number;
  durationFormatted?: string;
  bpm?: number;
  key?: string;
  genre?: string;
  modelUsed?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  isFavorite?: boolean;
  folder?: string;
  createdAt: string;
  updatedAt?: string;
}
