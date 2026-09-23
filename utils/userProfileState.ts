import { firestoreService, auth, ensureAuth, uploadUserAvatar, compressBase64Image } from '../services/firebase';
import { safeStringify } from './safeJson';

// Centralized User Profile & Face Avatar Management with LocalStorage and Firebase Firestore synchronization

export interface UserProfileState {
  name: string;
  handle: string;
  role: string;
  tagline: string;
  bio: string;
  manifesto: string;
  avatar: string;
  coverImage: string;
  location: string;
  timezone: string;
  rank: string;
  email: string;
  paypalUrl?: string;
  paypalPaymentUrl?: string;
  collabStatus: 'accepting' | 'busy' | 'selective';
}

export const USER_OFFICIAL_FACE_AVATAR = '/january_profile_face.jpg';

const DEFAULT_PROFILE: UserProfileState = {
  name: 'January Rebl',
  handle: '@januaryrebl',
  role: 'Founder & Lead AI Creative Director',
  tagline: 'Pioneering autonomous multi-modal creative production & creator monetization.',
  bio: 'Multi-disciplinary artist, sound alchemist, and architect of Janu’s Creations. Directing neural cinematic reels, mastering dynamic gospel and cyber synthwave stems, and expanding digital creative expressions.',
  manifesto: 'I believe the future of creator independence lies in owning 100% of your production pipelines and monetization vaults. Every artwork in this showcase was synthesized, edited, mastered, and monetized directly inside Janu’s Creations ecosystem.',
  avatar: USER_OFFICIAL_FACE_AVATAR,
  coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
  location: 'Los Angeles & Metaverse',
  timezone: 'PST (UTC-8) • Active Now',
  rank: '#1 Master Pioneer',
  email: 'janujanuscreations@gmail.com',
  paypalUrl: 'https://www.paypal.biz/januscreations',
  paypalPaymentUrl: 'https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG',
  collabStatus: 'accepting'
};

const STORAGE_KEY = 'janu_custom_user_profile_v3';
const listeners: Array<(profile: UserProfileState) => void> = [];

// Initialize background cloud sync on app start
if (typeof window !== 'undefined') {
  ensureAuth().then(async (user) => {
    if (user) {
      const cloudProfile = await firestoreService.getUserProfile(user.uid);
      if (cloudProfile) {
        // If cloud profile still has the old unsplash stock photo, update it to real user photo
        if (cloudProfile.avatar && cloudProfile.avatar.includes('photo-1534528741775-53994a69daeb')) {
          cloudProfile.avatar = USER_OFFICIAL_FACE_AVATAR;
        }
        const merged = { ...getSavedUserProfile(), ...cloudProfile };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        listeners.forEach(cb => cb(merged));
      }
    }
  }).catch((err) => {
    console.warn('Firebase initial profile sync skipped:', err);
  });
}

export function getSavedUserProfile(): UserProfileState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('janu_custom_user_profile_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Automatically sanitize and replace the old placeholder unsplash face
      if (!parsed.avatar || parsed.avatar.includes('photo-1534528741775-53994a69daeb')) {
        parsed.avatar = USER_OFFICIAL_FACE_AVATAR;
      }
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load user profile from storage', e);
  }
  return DEFAULT_PROFILE;
}

export function saveUserProfile(updated: Partial<UserProfileState>): UserProfileState {
  const current = getSavedUserProfile();
  const nextProfile = { ...current, ...updated };
  try {
    localStorage.setItem(STORAGE_KEY, safeStringify(nextProfile));
  } catch (e) {
    console.error('Failed to save profile to storage', e);
  }
  listeners.forEach(cb => cb(nextProfile));

  // Sync to Firebase Storage and Firestore in background
  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    // If the avatar was updated with a base64 data URL, upload to Firebase Storage
    if (updated.avatar && updated.avatar.startsWith('data:image/')) {
      uploadUserAvatar(uid, updated.avatar)
        .then(({ downloadUrl }) => {
          if (downloadUrl && downloadUrl.startsWith('http')) {
            nextProfile.avatar = downloadUrl;
            try {
              localStorage.setItem(STORAGE_KEY, safeStringify(nextProfile));
            } catch {}
            listeners.forEach(cb => cb(nextProfile));
            return firestoreService.saveUserProfile(uid, nextProfile);
          }
          return firestoreService.saveUserProfile(uid, nextProfile);
        })
        .catch((err) => {
          console.warn('Background avatar storage upload fallback, syncing directly:', err);
          firestoreService.saveUserProfile(uid, nextProfile).catch(() => {});
        });
    } else {
      firestoreService.saveUserProfile(uid, nextProfile).catch((err) => {
        console.warn('Background Firestore profile sync error:', err);
      });
    }
  }

  return nextProfile;
}

export function updateUserFaceAvatar(avatarDataUrl: string): UserProfileState {
  return saveUserProfile({ avatar: avatarDataUrl });
}

export function subscribeUserProfile(callback: (profile: UserProfileState) => void): () => void {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}
