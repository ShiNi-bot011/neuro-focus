import { useState, useEffect, useCallback } from 'react';
import { SkillNode, SkillTreeState, SkillCategory } from '../types/skills';

const SKILL_TREE_STORAGE_KEY = 'neuro_focus_skill_tree_v1';

export const INITIAL_SKILL_NODES: Record<string, SkillNode> = {
  // === BRANCH 1: SYSTEMS & COMPUTING (Hard) ===
  'systems_root': {
    id: 'systems_root',
    name: 'Systems & Computing',
    nameZh: '底层系统与计算',
    category: 'hard',
    branch: 'systems',
    level: 2,
    xp: 140,
    xpToNextLevel: 200,
    unlocked: true,
    icon: '💻',
    description: 'Mastery of computer architecture, systems programming, and low-level constructs.'
  },
  'c_pointers': {
    id: 'c_pointers',
    name: 'C & Pointer Mechanics',
    nameZh: 'C语言与指针算术',
    category: 'hard',
    branch: 'systems',
    level: 1,
    xp: 85,
    xpToNextLevel: 100,
    unlocked: true,
    parentId: 'systems_root',
    icon: '⚡',
    description: 'Pointer arithmetic, byte-level memory addressing, and reference mechanics.'
  },
  'memory_alloc': {
    id: 'memory_alloc',
    name: 'Memory Management',
    nameZh: '内存分配与管理',
    category: 'hard',
    branch: 'systems',
    level: 1,
    xp: 30,
    xpToNextLevel: 100,
    unlocked: true,
    parentId: 'c_pointers',
    icon: '🧠',
    description: 'Dynamic allocation, heap/stack boundaries, buffer overflow safety.'
  },
  'data_structures': {
    id: 'data_structures',
    name: 'Data Structures & Algo',
    nameZh: '核心数据结构与算法',
    category: 'hard',
    branch: 'systems',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    unlocked: false,
    parentId: 'memory_alloc',
    icon: '🌲',
    description: 'Linked lists, trees, graphs, and algorithmic complexity.'
  },

  // === BRANCH 2: SOFTWARE & WEB (Hard) ===
  'software_root': {
    id: 'software_root',
    name: 'Software Architecture',
    nameZh: '软件架构与工程',
    category: 'hard',
    branch: 'software',
    level: 1,
    xp: 90,
    xpToNextLevel: 100,
    unlocked: true,
    icon: '🏗️',
    description: 'Component architecture, modular design, and robust system building.'
  },
  'frontend_ui': {
    id: 'frontend_ui',
    name: 'Frontend & Reactive UI',
    nameZh: '前端与响应式交互',
    category: 'hard',
    branch: 'software',
    level: 1,
    xp: 70,
    xpToNextLevel: 100,
    unlocked: true,
    parentId: 'software_root',
    icon: '🎨',
    description: 'React, TypeScript, CSS motion aesthetics, and interactive components.'
  },
  'state_management': {
    id: 'state_management',
    name: 'State & Concurrency',
    nameZh: '状态流与并发模型',
    category: 'hard',
    branch: 'software',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    unlocked: false,
    parentId: 'frontend_ui',
    icon: '🔄',
    description: 'Deterministic state transitions, asynchronous pipelines, and caching.'
  },

  // === BRANCH 3: LOGIC & PROBLEM SOLVING (Hard) ===
  'logic_root': {
    id: 'logic_root',
    name: 'Analytical Logic',
    nameZh: '计算逻辑与推理',
    category: 'hard',
    branch: 'logic',
    level: 1,
    xp: 60,
    xpToNextLevel: 100,
    unlocked: true,
    icon: '📐',
    description: 'Rigorous formal thinking, proof strategies, and edge-case dissection.'
  },
  'debugging_mastery': {
    id: 'debugging_mastery',
    name: 'Root Cause Debugging',
    nameZh: '根因排查与逆向溯源',
    category: 'hard',
    branch: 'logic',
    level: 1,
    xp: 45,
    xpToNextLevel: 100,
    unlocked: true,
    parentId: 'logic_root',
    icon: '🔍',
    description: 'Scientific hypothesis generation, logging dissection, and fault isolation.'
  },
  'optimization': {
    id: 'optimization',
    name: 'Performance Optimization',
    nameZh: '性能极限调优',
    category: 'hard',
    branch: 'logic',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    unlocked: false,
    parentId: 'debugging_mastery',
    icon: '🚀',
    description: 'Bottleneck elimination, algorithmic time-space tradeoff perfection.'
  },

  // === BRANCH 4: COGNITIVE DISCIPLINE (Soft) ===
  'cognitive_root': {
    id: 'cognitive_root',
    name: 'Cognitive Stamina',
    nameZh: '认知耐力与前额叶控制',
    category: 'soft',
    branch: 'cognitive',
    level: 2,
    xp: 180,
    xpToNextLevel: 200,
    unlocked: true,
    icon: '🧘',
    description: 'Maintaining sustained working-memory activation during high difficulty tasks.'
  },
  'deep_focus_endurance': {
    id: 'deep_focus_endurance',
    name: 'Deep Focus Endurance',
    nameZh: '45分钟+ 深度心流续航',
    category: 'soft',
    branch: 'cognitive',
    level: 2,
    xp: 120,
    xpToNextLevel: 200,
    unlocked: true,
    parentId: 'cognitive_root',
    icon: '⏱️',
    description: 'Ability to stay in continuous uninterrupted flow without micro-breaks.'
  },
  'distraction_immunity': {
    id: 'distraction_immunity',
    name: 'Distraction Immunity',
    nameZh: '外界干扰免疫盾',
    category: 'soft',
    branch: 'cognitive',
    level: 1,
    xp: 90,
    xpToNextLevel: 100,
    unlocked: true,
    parentId: 'deep_focus_endurance',
    icon: '🛡️',
    description: 'Resisting notifications, phone cravings, and wandering thoughts.'
  },
  'flow_velocity': {
    id: 'flow_velocity',
    name: 'Instant Flow Initiation',
    nameZh: '秒级进入心流开关',
    category: 'soft',
    branch: 'cognitive',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    unlocked: false,
    parentId: 'distraction_immunity',
    icon: '⚡',
    description: 'Transitioning from rest to deep immersion in under 2 minutes.'
  },

  // === BRANCH 5: MENTAL FORTITUDE (Soft) ===
  'fortitude_root': {
    id: 'fortitude_root',
    name: 'Mental Fortitude',
    nameZh: '坚韧心智与挫折耐受',
    category: 'soft',
    branch: 'fortitude',
    level: 1,
    xp: 95,
    xpToNextLevel: 100,
    unlocked: true,
    icon: '🏔️',
    description: 'Emotional composure when facing confusing compiler errors or friction.'
  },
  'metacognitive_grit': {
    id: 'metacognitive_grit',
    name: 'Metacognitive Grit',
    nameZh: '元认知不放弃意志',
    category: 'soft',
    branch: 'fortitude',
    level: 1,
    xp: 80,
    xpToNextLevel: 100,
    unlocked: true,
    parentId: 'fortitude_root',
    icon: '🔥',
    description: 'Self-awareness of cognitive fatigue and choosing deliberate perseverance.'
  },
  'rest_calibration': {
    id: 'rest_calibration',
    name: 'Rest & Restoration IQ',
    nameZh: '科学节律与精力恢复',
    category: 'soft',
    branch: 'fortitude',
    level: 1,
    xp: 50,
    xpToNextLevel: 100,
    unlocked: true,
    parentId: 'metacognitive_grit',
    icon: '🌱',
    description: 'Deliberate use of NSDR, hydration, and eye relaxation to sustain daily stamina.'
  }
};

export function useSkillTree(userId?: string) {
  const [treeState, setTreeState] = useState<SkillTreeState>(() => {
    try {
      const saved = localStorage.getItem(`${SKILL_TREE_STORAGE_KEY}_${userId || 'guest'}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    const totalXp = Object.values(INITIAL_SKILL_NODES).reduce((acc, n) => acc + n.xp, 0);
    return {
      nodes: INITIAL_SKILL_NODES,
      totalSkillXp: totalXp,
      lastUpdated: Date.now()
    };
  });

  // Save changes to localStorage
  useEffect(() => {
    const key = `${SKILL_TREE_STORAGE_KEY}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(treeState));
  }, [treeState, userId]);

  // Add XP to matched or nearest skills
  const addSessionSkills = useCallback((
    hardSkills: Array<{ skill: string; xp: number }>,
    softSkills: Array<{ skill: string; xp: number }>
  ): { newlyUnlocked: SkillNode[]; leveledUp: SkillNode[] } => {
    const newlyUnlocked: SkillNode[] = [];
    const leveledUp: SkillNode[] = [];

    setTreeState(prev => {
      const nextNodes = { ...prev.nodes };
      let totalAddedXp = 0;

      const processGain = (name: string, xpGain: number, category: SkillCategory) => {
        totalAddedXp += xpGain;
        const normalized = name.toLowerCase();

        // 1. Find best matching existing node
        let targetId = Object.keys(nextNodes).find(id => {
          const node = nextNodes[id];
          if (node.category !== category) return false;
          return (
            node.name.toLowerCase().includes(normalized) ||
            normalized.includes(node.name.toLowerCase()) ||
            node.id.includes(normalized.replace(/[^a-z0-9]/g, '_'))
          );
        });

        // Heuristic fallback for C / systems
        if (!targetId && category === 'hard') {
          if (normalized.includes('c') || normalized.includes('pointer') || normalized.includes('memory')) {
            targetId = 'c_pointers';
          } else if (normalized.includes('web') || normalized.includes('ui') || normalized.includes('react')) {
            targetId = 'frontend_ui';
          } else {
            targetId = 'systems_root';
          }
        } else if (!targetId && category === 'soft') {
          if (normalized.includes('grit') || normalized.includes('mental')) {
            targetId = 'metacognitive_grit';
          } else {
            targetId = 'deep_focus_endurance';
          }
        }

        if (targetId && nextNodes[targetId]) {
          const node = { ...nextNodes[targetId] };
          const oldLevel = node.level;
          node.xp += xpGain;
          node.lastTrainedAt = Date.now();

          // Calculate level
          const newLevel = Math.max(1, Math.floor(node.xp / 100) + 1);
          node.level = newLevel;
          node.xpToNextLevel = newLevel * 100;

          if (newLevel > oldLevel) {
            leveledUp.push(node);
          }

          nextNodes[targetId] = node;

          // Check if any child nodes unlock
          Object.keys(nextNodes).forEach(childId => {
            const child = nextNodes[childId];
            if (child.parentId === targetId && !child.unlocked) {
              if (node.level >= 1 && node.xp >= 60) {
                const unlockedChild = {
                  ...child,
                  unlocked: true,
                  unlockedAt: Date.now()
                };
                nextNodes[childId] = unlockedChild;
                newlyUnlocked.push(unlockedChild);
              }
            }
          });
        }
      };

      hardSkills.forEach(h => processGain(h.skill, h.xp, 'hard'));
      softSkills.forEach(s => processGain(s.skill, s.xp, 'soft'));

      return {
        nodes: nextNodes,
        totalSkillXp: prev.totalSkillXp + totalAddedXp,
        lastUpdated: Date.now()
      };
    });

    return { newlyUnlocked, leveledUp };
  }, []);

  return {
    skillNodes: treeState.nodes,
    totalSkillXp: treeState.totalSkillXp,
    addSessionSkills
  };
}
