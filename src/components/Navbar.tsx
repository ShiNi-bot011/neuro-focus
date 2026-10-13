import React, { useState } from 'react';
import { 
  Brain, 
  Flame, 
  Target, 
  Calendar, 
  Sparkles, 
  Award, 
  LogIn, 
  LogOut, 
  Volume2, 
  VolumeX, 
  User as UserIcon,
  Clock
} from 'lucide-react';
import { UserProfile } from '../types';
import { getRankForLevel, getNextLevelXp } from '../hooks/useGamification';
import { soundFx } from '../lib/audio';

interface NavbarProps {
  activeTab: 'timer' | 'calendar' | 'vision' | 'gamification';
  setActiveTab: (tab: 'timer' | 'calendar' | 'vision' | 'gamification') => void;
  profile: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  todayMinutes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  onOpenAuth,
  onLogout,
  todayMinutes
}) => {
  const [binauralActive, setBinauralActive] = useState(false);

  const toggleSound = () => {
    const next = !binauralActive;
    setBinauralActive(next);
    soundFx.toggleBinauralAlpha(next);
  };

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

  return (
    <header className="glass-panel" style={{
      margin: '12px 18px',
      padding: '12px 22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      borderColor: 'rgba(139, 92, 246, 0.25)'
    }}>
      {/* Brand Identity */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => setActiveTab('timer')}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--gradient-neuro)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)'
        }}>
          <Brain size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 800, 
            fontSize: '1.15rem', 
            letterSpacing: '0.04em',
            background: 'linear-gradient(90deg, #ffffff, #c4b5fd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            NEURO FOCUS
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            PREFRONTAL ENGINE v2.0
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          className={`btn ${activeTab === 'timer' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('timer')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Clock size={16} /> Focus Room
        </button>

        <button
          className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('calendar')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Calendar size={16} /> Heatmap
        </button>

        <button
          className={`btn ${activeTab === 'vision' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('vision')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Sparkles size={16} /> Vision Board
        </button>

        <button
          className={`btn ${activeTab === 'gamification' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('gamification')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Award size={16} /> Stats & Badges
        </button>
      </nav>

      {/* Stats HUD & Quick Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Daily Goal Widget */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Target size={16} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              TODAY: {todayMinutes}/{dailyGoal}m ({dailyPercent}%)
            </div>
            <div style={{
              width: '80px',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '99px',
              overflow: 'hidden',
              marginTop: '3px'
            }}>
              <div style={{
                width: `${dailyPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                borderRadius: '99px'
              }} />
            </div>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="badge badge-flow" title={`${streak} consecutive days focused`}>
          <Flame size={14} color="#f59e0b" />
          <span>{streak} DAY STREAK</span>
        </div>

        {/* Level & XP HUD */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '2px'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-accent)' }}>
            LVL {level} • <span style={{ color: 'var(--text-main)' }}>{rank}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {xpInLevel}/{xpNeeded} XP
            </span>
            <div style={{
              width: '60px',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '99px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${xpPercent}%`,
                height: '100%',
                background: 'var(--gradient-neuro)',
                borderRadius: '99px'
              }} />
            </div>
          </div>
        </div>

        {/* Alpha Beats Meditative Sound Toggle */}
        <button
          className="btn btn-secondary"
          onClick={toggleSound}
          title={binauralActive ? 'Stop 10Hz Alpha Waves' : 'Start 10Hz Alpha Focus Binaural Waves'}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-full)',
            background: binauralActive ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: binauralActive ? 'var(--accent-purple)' : 'var(--border-subtle)'
          }}
        >
          {binauralActive ? <Volume2 size={16} color="var(--accent-purple)" /> : <VolumeX size={16} color="var(--text-dim)" />}
        </button>

        {/* User Account / Cross-Device Login */}
        {profile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <UserIcon size={14} color="var(--accent-emerald)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{profile.displayName}</span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={onLogout}
              title="Sign Out"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
            >
              <LogOut size={16} color="var(--accent-rose)" />
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onOpenAuth}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <LogIn size={15} /> Sign In / Sync
          </button>
        )}
      </div>
    </header>
  );
};
