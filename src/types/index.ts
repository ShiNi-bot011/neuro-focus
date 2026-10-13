export type MentalState = 'Deep_Flow' | 'Focused' | 'Distracted' | 'Away' | 'Drowsy';

export type BreakType = 'toilet' | 'snack' | 'eye_rest' | 'stretch' | 'custom';

export interface BreakRecord {
  id: string;
  type: BreakType;
  label: string;
  startTime: number;
  endTime?: number;
  durationMinutes: number;
}

export interface SessionEvaluation {
  score: number; // 0 - 100
  focusPercent: number;
  distractionCount: number;
  awayCount: number;
  aiFeedback: string;
  keyStrengths: string[];
  suggestions: string[];
}

export interface FocusSession {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  focusMinutes: number;
  breakMinutes: number;
  mode: 'interval' | 'flow';
  targetMinutes: number;
  breaks: BreakRecord[];
  evaluation: SessionEvaluation;
  taskGoal: string;
  date: string; // YYYY-MM-DD
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  level: number;
  xp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyGoalMinutes: number; // default 180 (3 hours)
  totalFocusMinutes: number;
  unlockedBadgeIds: string[];
}

export interface GoalItem {
  id: string;
  text: string;
  category: 'Career' | 'Health' | 'Mindset' | 'Creativity' | 'Wealth' | 'General';
  targetDate?: string;
  imageUrl?: string;
  motivationalQuote?: string;
  completed: boolean;
  createdAt: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: string;
  category: 'streak' | 'session' | 'mastery' | 'break';
}

export interface AttentionSnapshot {
  timestamp: number;
  isPresent: boolean;
  attentionState: MentalState;
  expression: string;
  confidence: number;
  feedback: string;
}

export interface DayFocusSummary {
  date: string; // YYYY-MM-DD
  minutes: number;
  sessionsCount: number;
  averageScore: number;
}
