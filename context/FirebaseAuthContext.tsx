import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle as fbSignInWithGoogle, 
  signInWithEmail as fbSignInWithEmail, 
  signUpWithEmail as fbSignUpWithEmail, 
  sendPasswordReset as fbSendPasswordReset,
  sendEmailVerificationToUser as fbSendEmailVerification,
  logoutUser as fbLogoutUser,
  testFirebaseConnection,
  firestoreService
} from '../services/firebase';

export interface FirebaseAuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User | null>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<User | null>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  clearError: () => void;
  refreshUserProfile: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProfile = useCallback(async (firebaseUser: User) => {
    try {
      const profile = await firestoreService.getUserProfile(firebaseUser.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        // Initialize basic user profile in Firestore
        const initialProfile = {
          userId: firebaseUser.uid,
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Janu Creator'),
          handle: `@${(firebaseUser.email ? firebaseUser.email.split('@')[0] : 'creator').toLowerCase()}`,
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
          role: 'Verified Creator',
          bio: 'AI-Native Digital Artist & Audio Alchemist on Janu’s Creations Studio.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await firestoreService.saveUserProfile(firebaseUser.uid, initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (err) {
      console.warn('Notice loading user profile from Firestore:', err);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Test initial connection as per Firebase best practices
    testFirebaseConnection().catch(() => {});

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    }, (authErr) => {
      console.error('Firebase Auth state change error:', authErr);
      setError(authErr.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);
      const resUser = await fbSignInWithGoogle();
      if (resUser) {
        await fetchProfile(resUser);
      }
      return resUser;
    } catch (err: any) {
      console.error('Google sign in error:', err);
      let userFriendlyMsg = err.message || 'Google sign-in failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMsg = 'Sign-in cancelled by user.';
      } else if (err.code === 'auth/popup-blocked') {
        userFriendlyMsg = 'Pop-up blocked by browser. Please allow pop-ups for authentication.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        userFriendlyMsg = 'Previous sign-in request cancelled.';
      }
      setError(userFriendlyMsg);
      throw new Error(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);
      const resUser = await fbSignInWithEmail(email, pass);
      if (resUser) {
        await fetchProfile(resUser);
      }
      return resUser;
    } catch (err: any) {
      console.error('Email sign in error:', err);
      let userFriendlyMsg = err.message || 'Email sign-in failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        userFriendlyMsg = 'Invalid email or password combination.';
      } else if (err.code === 'auth/operation-not-allowed') {
        userFriendlyMsg = 'Email/Password sign-in is not enabled in your Firebase Console. Please click "Continue with Google" above to sign in with your Google account, or enable Email/Password in Firebase Console (Authentication > Sign-in method).';
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/user-disabled') {
        userFriendlyMsg = 'This account has been disabled. Please contact support.';
      } else if (err.code === 'auth/too-many-requests') {
        userFriendlyMsg = 'Too many failed login attempts. Please try again later or reset password.';
      }
      setError(userFriendlyMsg);
      throw new Error(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);
      const resUser = await fbSignUpWithEmail(email, pass, displayName);
      if (resUser) {
        await fetchProfile(resUser);
      }
      return resUser;
    } catch (err: any) {
      console.error('Email sign up error:', err);
      let userFriendlyMsg = err.message || 'Account registration failed.';
      if (err.code === 'auth/email-already-in-use') {
        userFriendlyMsg = 'An account with this email already exists. Try signing in.';
      } else if (err.code === 'auth/operation-not-allowed') {
        userFriendlyMsg = 'Email/Password accounts are not enabled in your Firebase Console. Please use "Continue with Google" above, or enable Email/Password in Firebase Console (Authentication > Sign-in method).';
      } else if (err.code === 'auth/weak-password') {
        userFriendlyMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMsg = 'Please enter a valid email address.';
      }
      setError(userFriendlyMsg);
      throw new Error(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await fbLogoutUser();
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await fbSendPasswordReset(email);
    } catch (err: any) {
      console.error('Password reset email error:', err);
      let userFriendlyMsg = err.message || 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        userFriendlyMsg = 'No registered user found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMsg = 'Please enter a valid email address.';
      }
      setError(userFriendlyMsg);
      throw new Error(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async (): Promise<void> => {
    if (!user) {
      throw new Error('No authenticated user to send verification email to.');
    }
    try {
      setError(null);
      await fbSendEmailVerification(user);
    } catch (err: any) {
      console.error('Send verification email error:', err);
      setError(err.message || 'Failed to send verification email.');
      throw err;
    }
  };

  const value: FirebaseAuthContextType = {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user && !user.isAnonymous,
    isAnonymous: !!user?.isAnonymous,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    sendPasswordReset,
    sendVerificationEmail,
    clearError,
    refreshUserProfile
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = (): FirebaseAuthContextType => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

// Convenient alias
export const useAuth = useFirebaseAuth;
export default FirebaseAuthContext;
