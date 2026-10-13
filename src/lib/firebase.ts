import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  Firestore 
} from 'firebase/firestore';
import { UserProfile, FocusSession, GoalItem } from '../types';

// Load credentials from environment if available
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

const isRealFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'your_api_key'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isRealFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Real Firebase initialized successfully');
  } catch (err) {
    console.warn('⚠️ Firebase initialization failed, falling back to simulated cloud store:', err);
  }
}

// ============================================================================
// SIMULATED MULTI-DEVICE CLOUD STORE (Instant zero-setup fallback)
// ============================================================================
const STORAGE_PREFIX = 'neuro_focus_cloud_';

interface MockAccount {
  uid: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  sessions: FocusSession[];
  goals: GoalItem[];
}

function getStoredAccounts(): Record<string, MockAccount> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}accounts`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredAccounts(accounts: Record<string, MockAccount>) {
  localStorage.setItem(`${STORAGE_PREFIX}accounts`, JSON.stringify(accounts));
}

// Current logged in session
let currentMockUser: { uid: string; email: string } | null = null;
try {
  const session = localStorage.getItem(`${STORAGE_PREFIX}active_session`);
  if (session) {
    currentMockUser = JSON.parse(session);
  }
} catch {
  currentMockUser = null;
}

// ============================================================================
// UNIFIED AUTH & DATA API (Supports both Real Firebase and Zero-Config Fallback)
// ============================================================================

export const isUsingRealFirebase = () => Boolean(auth && db);

export async function loginWithEmail(email: string, pass: string): Promise<{ uid: string; email: string }> {
  if (auth) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return { uid: cred.user.uid, email: cred.user.email || email };
  }

  // Fallback simulated cross-device login
  const accounts = getStoredAccounts();
  const acc = Object.values(accounts).find(a => a.email.toLowerCase() === email.toLowerCase());

  if (!acc || acc.passwordHash !== pass) {
    throw new Error('Invalid email or password. Please verify your credentials.');
  }

  currentMockUser = { uid: acc.uid, email: acc.email };
  localStorage.setItem(`${STORAGE_PREFIX}active_session`, JSON.stringify(currentMockUser));
  return currentMockUser;
}

export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<{ uid: string; email: string }> {
  if (auth && db) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const initialProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: displayName || email.split('@')[0],
      level: 1,
      xp: 0,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      dailyGoalMinutes: 180,
      totalFocusMinutes: 0,
      unlockedBadgeIds: ['first_step']
    };
    await setDoc(doc(db, 'users', cred.user.uid), initialProfile);
    return { uid: cred.user.uid, email: cred.user.email || email };
  }

  // Fallback simulated registration
  const accounts = getStoredAccounts();
  const exists = Object.values(accounts).some(a => a.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error('An account with this email already exists.');
  }

  const uid = 'usr_' + Math.random().toString(36).substring(2, 10);
  const initialProfile: UserProfile = {
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    level: 1,
    xp: 0,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    dailyGoalMinutes: 180,
    totalFocusMinutes: 0,
    unlockedBadgeIds: ['first_step']
  };

  accounts[uid] = {
    uid,
    email,
    passwordHash: pass,
    profile: initialProfile,
    sessions: [],
    goals: []
  };

  saveStoredAccounts(accounts);
  currentMockUser = { uid, email };
  localStorage.setItem(`${STORAGE_PREFIX}active_session`, JSON.stringify(currentMockUser));
  return currentMockUser;
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
  currentMockUser = null;
  localStorage.removeItem(`${STORAGE_PREFIX}active_session`);
}

export function subscribeToAuth(callback: (user: { uid: string; email: string } | null) => void) {
  if (auth) {
    return onAuthStateChanged(auth, (fbUser: User | null) => {
      if (fbUser) {
        callback({ uid: fbUser.uid, email: fbUser.email || '' });
      } else {
        callback(null);
      }
    });
  }

  // Mock listener
  callback(currentMockUser);
  return () => {};
}

// ============================================================================
// PROFILE & SESSIONS DATABASE
// ============================================================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (db) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data() as UserProfile;
  }

  const accounts = getStoredAccounts();
  return accounts[uid]?.profile || null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (db) {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    return;
  }

  const accounts = getStoredAccounts();
  if (accounts[profile.uid]) {
    accounts[profile.uid].profile = profile;
    saveStoredAccounts(accounts);
  }
}

export async function saveSession(session: FocusSession): Promise<void> {
  if (db) {
    await addDoc(collection(db, `users/${session.userId}/sessions`), session);
    return;
  }

  const accounts = getStoredAccounts();
  if (accounts[session.userId]) {
    accounts[session.userId].sessions.push(session);
    saveStoredAccounts(accounts);
  }
}

export async function getUserSessions(uid: string): Promise<FocusSession[]> {
  if (db) {
    const q = collection(db, `users/${uid}/sessions`);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FocusSession));
  }

  const accounts = getStoredAccounts();
  return accounts[uid]?.sessions || [];
}

export async function saveGoal(uid: string, goal: GoalItem): Promise<void> {
  if (db) {
    await setDoc(doc(db, `users/${uid}/goals`, goal.id), goal);
    return;
  }

  const accounts = getStoredAccounts();
  if (accounts[uid]) {
    const existingIdx = accounts[uid].goals.findIndex(g => g.id === goal.id);
    if (existingIdx >= 0) {
      accounts[uid].goals[existingIdx] = goal;
    } else {
      accounts[uid].goals.push(goal);
    }
    saveStoredAccounts(accounts);
  }
}

export async function getUserGoals(uid: string): Promise<GoalItem[]> {
  if (db) {
    const snap = await getDocs(collection(db, `users/${uid}/goals`));
    return snap.docs.map(d => d.data() as GoalItem);
  }

  const accounts = getStoredAccounts();
  return accounts[uid]?.goals || [];
}
