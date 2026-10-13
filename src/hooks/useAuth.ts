import { useState, useEffect } from 'react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  subscribeToAuth, 
  getUserProfile, 
  saveUserProfile, 
  isUsingRealFirebase 
} from '../lib/firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        const p = await getUserProfile(user.uid);
        if (p) {
          setProfile(p);
        } else {
          // Initialize profile if not found
          const initial: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.email.split('@')[0],
            level: 1,
            xp: 0,
            streakDays: 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
            dailyGoalMinutes: 180,
            totalFocusMinutes: 0,
            unlockedBadgeIds: ['first_step']
          };
          await saveUserProfile(initial);
          setProfile(initial);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const user = await loginWithEmail(email, pass);
    setCurrentUser(user);
    const p = await getUserProfile(user.uid);
    setProfile(p);
    return user;
  };

  const register = async (email: string, pass: string, name: string) => {
    const user = await registerWithEmail(email, pass, name);
    setCurrentUser(user);
    const p = await getUserProfile(user.uid);
    setProfile(p);
    return user;
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setProfile(null);
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!profile) return;
    const next = { ...profile, ...updated };
    setProfile(next);
    await saveUserProfile(next);
  };

  return {
    currentUser,
    profile,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isRealFirebase: isUsingRealFirebase()
  };
}
