import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth, db } from '../config/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { INITIAL_COACHES, INITIAL_SKATERS } from '../services/mockDataService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  quickSwitchRole: (role: UserRole, targetId?: string) => void;
  claimInitialAdmin: () => Promise<{ success: boolean; message: string }>;
  isMockUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'synchro9_mock_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_COACHES[0]; // Default to Coach Cheng Wei for immediate dev/test accessibility
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isMockUser, setIsMockUser] = useState<boolean>(true);

  // Sync Firebase Auth state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsMockUser(false);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // New user registration defaults to pending and cannot self-elevate
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'New User',
              role: 'athlete',
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            try {
              await setDoc(userRef, newProfile);
              setProfile(newProfile);
            } catch (err) {
              console.warn('[AuthContext] Could not write user profile to firestore:', err);
              setProfile(newProfile);
            }
          }
        });
      } else {
        // If not signed into Firebase, keep selected test profile or null
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setProfile(JSON.parse(saved));
          setIsMockUser(true);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('[AuthContext] Google Login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('[AuthContext] Email login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const userRef = doc(db, 'users', res.user.uid);
      const newProfile: UserProfile = {
        uid: res.user.uid,
        email,
        displayName: name,
        role: role === 'coach' ? 'athlete' : role, // Prevent self-elevation to coach/admin
        status: 'pending', // Registration does NOT grant access without approval
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    } catch (err: any) {
      console.error('[AuthContext] Registration failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out:', err);
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setLoading(false);
  };

  /**
   * Fast Persona switcher for testing and demonstration across all 5 roles:
   * Admin / Session Lead / Coach / Parent / Athlete
   */
  const quickSwitchRole = (role: UserRole, targetId?: string) => {
    let newProfile: UserProfile;

    if (role === 'admin') {
      newProfile = INITIAL_COACHES[0]; // Coach Cheng Wei (Admin/Publisher)
    } else if (role === 'coach') {
      newProfile = INITIAL_COACHES[1]; // Coach Shazfinas
    } else if (role === 'parent') {
      // Parent with 2 linked skaters (e.g. Low family: Gabriella & Giovanna)
      newProfile = {
        uid: 'parent_low_family',
        email: 'low.family@example.com',
        displayName: 'Mrs. Low (Parent)',
        role: 'parent',
        status: 'approved',
        skaterIds: ['skater_1', 'skater_5'],
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z'
      };
    } else {
      // Athlete (e.g. Gabriella Low)
      const skater = INITIAL_SKATERS.find(s => s.id === (targetId || 'skater_1')) || INITIAL_SKATERS[0];
      newProfile = {
        uid: `athlete_${skater.id}`,
        email: `${skater.nickname?.toLowerCase() || 'skater'}@example.com`,
        displayName: `${skater.fullName} (Athlete)`,
        role: 'athlete',
        status: 'approved',
        skaterIds: [skater.id],
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z'
      };
    }

    setProfile(newProfile);
    setIsMockUser(true);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProfile));
  };

  /**
   * Local Administrative Bootstrap for Coach Cheng Wei:
   * Elevates current user to Admin if their email matches chiachengwei@gmail.com
   */
  const claimInitialAdmin = async (): Promise<{ success: boolean; message: string }> => {
    if (!profile) {
      return { success: false, message: 'No active profile found. Please log in first.' };
    }
    
    // Check email identity
    if (profile.email.toLowerCase() !== 'chiachengwei@gmail.com') {
      return {
        success: false,
        message: 'Administrative privileges are restricted to Coach Cheng Wei (chiachengwei@gmail.com).'
      };
    }

    const updatedProfile: UserProfile = {
      ...profile,
      role: 'admin',
      status: 'approved',
      displayName: 'Coach Cheng Wei',
      approvedBy: 'SYSTEM_BOOTSTRAP',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      }
    } catch (err) {
      console.warn('[AuthContext] Local bootstrap save to Firestore:', err);
    }

    setProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
    return {
      success: true,
      message: 'Coach Cheng Wei successfully confirmed as Admin & Publisher.'
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        quickSwitchRole,
        claimInitialAdmin,
        isMockUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
