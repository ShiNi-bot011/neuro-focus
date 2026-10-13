import React from 'react';
import { SkillTreeGraph } from './SkillTreeGraph';
import { SkillNode } from '../../types/skills';
import { Trophy, Zap, Shield, Sparkles } from 'lucide-react';

interface SkillTreePanelProps {
  nodes: Record<string, SkillNode>;
  totalSkillXp: number;
  recentlyTrainedSkillIds?: string[];
}

export const SkillTreePanel: React.FC<SkillTreePanelProps> = ({
  nodes,
  totalSkillXp,
  recentlyTrainedSkillIds = []
}) => {
  const unlockedCount = Object.values(nodes).filter(n => n.unlocked).length;
  const totalCount = Object.values(nodes).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
              Prefrontal Skill Tree & XP Allocator
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Every focus session automatically channels XP into Hard Skills (systems, code, design) and Cognitive Soft Skills.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '8px 16px',
            textAlign: 'center'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
              {unlockedCount} / {totalCount}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Nodes Mastered
            </div>
          </div>

          <div style={{
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '12px',
            padding: '8px 16px',
            textAlign: 'center'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {totalSkillXp}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Accumulated XP
            </div>
          </div>
        </div>
      </div>

      {/* Radial Graph */}
      <SkillTreeGraph
        nodes={nodes}
        totalSkillXp={totalSkillXp}
        highlightedSkillIds={recentlyTrainedSkillIds}
      />
    </div>
  );
};
