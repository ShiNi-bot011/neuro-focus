import React from 'react';
import { Award, Flame, Target, Zap, Shield, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { UserProfile, Badge, SkillNode } from '../../types';
import { ALL_BADGES, LEVEL_RANKS, getRankForLevel, getNextLevelXp } from '../../hooks/useGamification';
import { SkillTreeGraph } from '../SkillTree/SkillTreeGraph';

interface GamificationPanelProps {
  profile: UserProfile | null;
  todayMinutes: number;
  skillNodes?: Record<string, SkillNode>;
  totalSkillXp?: number;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({
  profile,
  todayMinutes,
  skillNodes,
  totalSkillXp
}) => {
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const streak = profile?.streakDays || 1;
  const rank = getRankForLevel(level);
  const { currentLevelBase, nextLevelTarget } = getNextLevelXp(level);

  const xpInLevel = Math.max(0, xp - currentLevelBase);
  const xpNeeded = Math.max(1, nextLevelTarget - currentLevelBase);
  const xpPercent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  const dailyGoal = profile?.dailyGoalMinutes || 180;
  const dailyPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));
  const unlockedBadges = new Set(profile?.unlockedBadgeIds || ['first_step']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Level & Rank Hero Banner */}
      <div className="glass-panel-glow" style={{
        padding: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Level Avatar & Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            background: 'var(--gradient-neuro)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.45)',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '0.72rem', color: '#ffffff', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>LVL</span>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{level}</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-flow" style={{ fontSize: '0.72rem' }}>PFC NEURO-TIER</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {streak} DAY STREAK 🔥
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', color: '#ffffff', marginTop: '4px' }}>
              {rank}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Total Disciplined Investment: <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{profile?.totalFocusMinutes || 0} Minutes</span>
            </p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div style={{ minWidth: '260px', flex: 1, maxWidth: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Experience Points:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
              {xp} XP Total
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            padding: '1px'
          }}>
            <div style={{
              width: `${xpPercent}%`,
              height: '100%',
              background: 'var(--gradient-neuro)',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.6)'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <span>Level {level}</span>
            <span>{xpInLevel} / {xpNeeded} XP to Next Tier</span>
            <span>Level {level + 1}</span>
          </div>
        </div>
      </div>

      {/* Daily 3-Hour Target Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <Target size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>
              Daily Focus Target: {dailyGoal / 60} Hours ({dailyGoal} mins)
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Neuroscience consensus for peak sustainable high-cognition output per day.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {todayMinutes} / {dailyGoal}m
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              {dailyPercent}% Complete
            </div>
          </div>

          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: `conic-gradient(var(--accent-cyan) ${dailyPercent * 3.6}deg, rgba(255, 255, 255, 0.08) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#0c1024',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}>
              {dailyPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Radial Skill Constellation Explorer */}
      {skillNodes && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Prefrontal Radial Skill Tree</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Your cognitive constellation expands with every focused hour. Hover over nodes to inspect levels, XP progress, and unlock pathways.
            </p>
          </div>
          <SkillTreeGraph nodes={skillNodes} totalSkillXp={totalSkillXp || 0} />
        </div>
      )}

      {/* Badges Gallery */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>Achievements & Neuro-Badges</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Locked neural pathways are unlocked through consistent focus sessions and breaks.
            </p>
          </div>
          <div className="badge badge-flow">
            {unlockedBadges.size} / {ALL_BADGES.length} UNLOCKED
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px'
        }}>
          {ALL_BADGES.map(b => {
            const isUnlocked = unlockedBadges.has(b.id);
            return (
              <div
                key={b.id}
                style={{
                  background: isUnlocked ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isUnlocked ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.05)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  opacity: isUnlocked ? 1 : 0.6,
                  transition: 'var(--transition)'
                }}
              >
                <div style={{
                  fontSize: '1.8rem',
                  filter: isUnlocked ? 'none' : 'grayscale(100%)',
                  marginTop: '2px'
                }}>
                  {b.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isUnlocked ? '#ffffff' : 'var(--text-dim)' }}>
                      {b.title}
                    </div>
                    {isUnlocked ? (
                      <CheckCircle2 size={14} color="var(--accent-emerald)" />
                    ) : (
                      <Lock size={13} color="var(--text-dim)" />
                    )}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {b.description}
                  </div>

                  <div style={{
                    fontSize: '0.68rem',
                    color: isUnlocked ? 'var(--accent-purple)' : 'var(--text-dim)',
                    marginTop: '8px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Requirement: {b.requirement}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
