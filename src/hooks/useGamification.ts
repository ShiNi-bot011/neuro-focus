import confetti from 'canvas-confetti';
import { soundFx } from '../lib/audio';
import { Badge, UserProfile } from '../types';

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_step',
    title: 'Synaptic Ignition',
    description: 'Began your neuro-focused journey.',
    icon: '⚡',
    requirement: 'Complete your first session',
    category: 'session'
  },
  {
    id: 'deep_flow_30',
    title: 'Prefrontal Surge',
    description: 'Maintained 30+ continuous minutes in deep flow.',
    icon: '🧠',
    requirement: 'Focus 30 mins in single session',
    category: 'session'
  },
  {
    id: 'iron_will_60',
    title: 'Cognitive Fortress',
    description: 'Locked in for a massive 60-minute session without derailment.',
    icon: '🛡️',
    requirement: 'Focus 60 mins in single session',
    category: 'session'
  },
  {
    id: 'streak_3',
    title: 'Neural Rhythm',
    description: 'Achieved a consecutive 3-day focus streak.',
    icon: '🔥',
    requirement: '3-day streak',
    category: 'streak'
  },
  {
    id: 'streak_7',
    title: 'Hyperfocus Orbit',
    description: 'Maintained an unbroken 7-day focus streak.',
    icon: '🌟',
    requirement: '7-day streak',
    category: 'streak'
  },
  {
    id: 'daily_goal_hit',
    title: 'Mission Accomplished',
    description: 'Crushed your daily focus goal target.',
    icon: '🎯',
    requirement: 'Reach 100% daily goal',
    category: 'mastery'
  },
  {
    id: 'mindful_break',
    title: 'NSDR Restorer',
    description: 'Utilized deliberate break periods to recharge dopamine receptors.',
    icon: '🧘',
    requirement: 'Take an intentional break',
    category: 'break'
  },
  {
    id: 'neuro_sage',
    title: 'Neuro Sovereign',
    description: 'Accumulated over 1,000 total minutes of disciplined focus.',
    icon: '👑',
    requirement: '1000+ total focus minutes',
    category: 'mastery'
  }
];

export const LEVEL_RANKS = [
  { level: 1, title: 'Neural Novice', minXp: 0 },
  { level: 2, title: 'Focus Initiate', minXp: 300 },
  { level: 3, title: 'Synapse Adept', minXp: 800 },
  { level: 4, title: 'PFC Commander', minXp: 1600 },
  { level: 5, title: 'Flow Alchemist', minXp: 3000 },
  { level: 6, title: 'Cognitive Sovereign', minXp: 5000 },
  { level: 7, title: 'Neuro Grandmaster', minXp: 8000 },
];

export function getRankForLevel(level: number): string {
  const match = [...LEVEL_RANKS].reverse().find(r => level >= r.level);
  return match ? match.title : 'Transcendent Mind';
}

export function getNextLevelXp(level: number): { currentLevelBase: number; nextLevelTarget: number } {
  const current = LEVEL_RANKS.find(r => r.level === level) || { minXp: 0 };
  const next = LEVEL_RANKS.find(r => r.level === level + 1);
  return {
    currentLevelBase: current.minXp,
    nextLevelTarget: next ? next.minXp : current.minXp + 3000
  };
}

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
    });
  } catch {
    // Confetti canvas error
  }
}

export function calculateNewStats(
  profile: UserProfile, 
  focusedMinutes: number, 
  isCompleted: boolean, 
  tookBreak: boolean
): { updatedProfile: UserProfile; newlyUnlockedBadges: Badge[]; xpGained: number } {
  const baseMinutes = Math.max(1, Math.round(focusedMinutes));
  let xpGained = baseMinutes * 10;
  
  if (isCompleted) xpGained += 50;
  if (tookBreak) xpGained += 25;

  const totalMinutes = profile.totalFocusMinutes + baseMinutes;
  const newXp = profile.xp + xpGained;

  // Calculate new level
  let newLevel = profile.level;
  for (const rank of LEVEL_RANKS) {
    if (newXp >= rank.minXp) {
      newLevel = rank.level;
    }
  }

  const leveledUp = newLevel > profile.level;

  // Check badges
  const currentBadges = new Set(profile.unlockedBadgeIds || []);
  const newlyUnlocked: Badge[] = [];

  const checkBadge = (id: string, condition: boolean) => {
    if (condition && !currentBadges.has(id)) {
      currentBadges.add(id);
      const b = ALL_BADGES.find(item => item.id === id);
      if (b) newlyUnlocked.push(b);
    }
  };

  checkBadge('first_step', true);
  checkBadge('deep_flow_30', baseMinutes >= 30);
  checkBadge('iron_will_60', baseMinutes >= 60);
  checkBadge('mindful_break', tookBreak);
  checkBadge('neuro_sage', totalMinutes >= 1000);
  checkBadge('streak_3', profile.streakDays >= 3);
  checkBadge('streak_7', profile.streakDays >= 7);

  if (leveledUp || newlyUnlocked.length > 0) {
    soundFx.playLevelUp();
    triggerConfetti();
  }

  const updatedProfile: UserProfile = {
    ...profile,
    level: newLevel,
    xp: newXp,
    totalFocusMinutes: totalMinutes,
    unlockedBadgeIds: Array.from(currentBadges)
  };

  return { updatedProfile, newlyUnlockedBadges: newlyUnlocked, xpGained };
}
