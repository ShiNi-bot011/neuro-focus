export type SkillCategory = 'hard' | 'soft';

export interface SkillNode {
  id: string;
  name: string;
  nameZh?: string;
  category: SkillCategory;
  branch: string; // e.g. "Systems", "Frontend", "Cognitive", "Resilience"
  level: number;
  xp: number;
  xpToNextLevel: number;
  unlocked: boolean;
  parentId?: string;
  icon?: string;
  description: string;
  unlockedAt?: number;
  lastTrainedAt?: number;
}

export interface SkillBranch {
  id: string;
  name: string;
  category: SkillCategory;
  color: string;
  icon: string;
}

export interface SkillTreeState {
  nodes: Record<string, SkillNode>;
  totalSkillXp: number;
  lastUpdated: number;
}

export interface KuaKuaData {
  id: string;
  headline: string;
  praiseQuote: string;
  praiseQuoteZh: string;
  timelineObservations: Array<{
    minute: number;
    activity: string;
    state: string;
  }>;
  hardSkillsGained: Array<{ skill: string; xp: number }>;
  softSkillsGained: Array<{ skill: string; xp: number }>;
  coachingTip: string;
  isDailyGoalChampion?: boolean;
}
