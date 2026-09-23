import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BossNotification, BossNotificationType } from '../types';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface BossNotificationContextType {
  notifications: BossNotification[];
  notifyBoss: (notification: Omit<BossNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  simulateAlert: (type: BossNotificationType) => void;
}

const BossNotificationContext = createContext<BossNotificationContextType | undefined>(undefined);

export const BossNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<BossNotification[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState(true);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    bossAudio.setSoundEnabled(enabled);
  };

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notifyBoss = useCallback((data: Omit<BossNotification, 'id' | 'timestamp'>) => {
    const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newNotification: BossNotification = {
      ...data,
      id,
      timestamp: new Date(),
      duration: data.duration || 5500
    };

    // Play corresponding synthesizer audio cue
    if (data.type === 'tip') {
      bossAudio.playTipChime(data.amount || 50);
      triggerNeonExplosion({
        particleCount: 30,
        origin: { x: 0.85, y: 0.15 },
        intensity: 'subtle'
      });
    } else if (data.type === 'rank_up') {
      bossAudio.playRankUpSound();
      triggerNeonExplosion({
        particleCount: 45,
        origin: { x: 0.85, y: 0.15 },
        intensity: 'medium'
      });
    } else if (data.type === 'contest_win') {
      bossAudio.playContestWinSound();
      triggerNeonExplosion({
        particleCount: 60,
        origin: { x: 0.85, y: 0.15 },
        intensity: 'grand'
      });
    } else if (data.type === 'revenue_milestone') {
      bossAudio.playRevenueMilestoneSound();
      triggerNeonExplosion({
        particleCount: 80,
        origin: { x: 0.85, y: 0.15 },
        intensity: 'grand'
      });
    } else {
      bossAudio.playSubtlePing();
    }

    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]); // Keep max 5 visible

    // Auto dismiss
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, [removeNotification]);

  // Global window event listener so any nested script can dispatch
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Omit<BossNotification, 'id' | 'timestamp'>>;
      if (customEvent.detail) {
        notifyBoss(customEvent.detail);
      }
    };

    window.addEventListener('boss-notification' as any, handleCustomEvent);
    return () => {
      window.removeEventListener('boss-notification' as any, handleCustomEvent);
    };
  }, [notifyBoss]);

  // Simulation generator
  const simulateAlert = (type: BossNotificationType) => {
    if (type === 'tip') {
      const tipAmounts = [25, 50, 100, 250, 500];
      const selectedAmount = tipAmounts[Math.floor(Math.random() * tipAmounts.length)];
      const senders = ['VentureQueen', 'CyberPatron_99', 'AudioCollector', 'HoloInvestor', 'PrimeCollector'];
      const sender = senders[Math.floor(Math.random() * senders.length)];
      const creators = ['January Rebl', 'Elena Vance', 'Marcus Kincaid', 'Aria Thorne'];
      const creator = creators[Math.floor(Math.random() * creators.length)];
      const cut = selectedAmount * 0.15;

      notifyBoss({
        type: 'tip',
        title: 'New Creator Tip Inflow!',
        subtitle: `+ $${selectedAmount.toFixed(2)} USD`,
        message: `${sender} sent a $${selectedAmount.toFixed(2)} tip to ${creator}. $${cut.toFixed(2)} (15%) auto-routed to Boss Vault.`,
        amount: selectedAmount,
        platformCut: cut,
        sender,
        creator: { name: creator, handle: `@${creator.replace(/\s+/g, '')}` },
        actionLabel: 'View Boss Ledger'
      });
    } else if (type === 'rank_up') {
      const ranks = [
        { oldR: 4, newR: 2, name: 'Elena Vance', tier: 'Diamond Master' },
        { oldR: 3, newR: 1, name: 'January Rebl', tier: 'Grand Master' },
        { oldR: 5, newR: 3, name: 'Marcus Kincaid', tier: 'Diamond Master' },
        { oldR: 6, newR: 4, name: 'Aria Thorne', tier: 'Platinum Alchemist' }
      ];
      const chosen = ranks[Math.floor(Math.random() * ranks.length)];

      notifyBoss({
        type: 'rank_up',
        title: 'Leaderboard Rank Surged!',
        subtitle: `Rank #${chosen.newR} Achieved`,
        message: `${chosen.name} climbed from #${chosen.oldR} to #${chosen.newR} on the Live Creator Leaderboard (${chosen.tier})!`,
        rankInfo: { oldRank: chosen.oldR, newRank: chosen.newR, tier: chosen.tier },
        creator: { name: chosen.name, handle: `@${chosen.name.replace(/\s+/g, '')}` },
        actionLabel: 'Open Leaderboard'
      });
    } else if (type === 'contest_win') {
      const contests = [
        { title: 'Viral 9:16 Cyber Reel Battle', prize: 5000, rank: 1, winner: 'January Rebl' },
        { title: 'AI Gospel & Soul Beat Championship', prize: 3500, rank: 1, winner: 'Marcus Kincaid' },
        { title: 'Janu Master 8K Art Quest', prize: 2500, rank: 1, winner: 'Elena Vance' }
      ];
      const win = contests[Math.floor(Math.random() * contests.length)];

      notifyBoss({
        type: 'contest_win',
        title: 'Contest Entry Victory! 🏆',
        subtitle: `Prize Pool: $${win.prize.toLocaleString()} USD`,
        message: `${win.winner} won 1st Place in "${win.title}" with a 98.6/100 AI Neural Score!`,
        contestInfo: { contestTitle: win.title, prize: win.prize, rank: win.rank },
        amount: win.prize,
        creator: { name: win.winner, handle: `@${win.winner.replace(/\s+/g, '')}` },
        actionLabel: 'Claim & View Arena'
      });
    }
  };

  const clearAll = () => setNotifications([]);

  return (
    <BossNotificationContext.Provider
      value={{
        notifications,
        notifyBoss,
        removeNotification,
        clearAll,
        soundEnabled,
        setSoundEnabled,
        simulateAlert
      }}
    >
      {children}
    </BossNotificationContext.Provider>
  );
};

export const useBossNotifications = () => {
  const context = useContext(BossNotificationContext);
  if (!context) {
    throw new Error('useBossNotifications must be used within a BossNotificationProvider');
  }
  return context;
};

// Helper to trigger globally without hook
export const triggerBossNotification = (data: Omit<BossNotification, 'id' | 'timestamp'>) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boss-notification', { detail: data }));
  }
};
