import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  Sliders, 
  Zap, 
  Sparkles,
  Edit2
} from 'lucide-react';
import { TimerMode, TimerStatus } from '../../hooks/useTimer';
import { BreakRecord } from '../../types';

interface FocusTimerProps {
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  status: TimerStatus;
  taskGoal: string;
  setTaskGoal: (goal: string) => void;
  targetFocusMinutes: number;
  setTargetFocusMinutes: (min: number) => void;
  focusSecondsElapsed: number;
  remainingFocusSeconds: number;
  currentBreaks: BreakRecord[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onOpenBreakModal: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  mode,
  setMode,
  status,
  taskGoal,
  setTaskGoal,
  targetFocusMinutes,
  setTargetFocusMinutes,
  focusSecondsElapsed,
  remainingFocusSeconds,
  currentBreaks,
  onStart,
  onPause,
  onResume,
  onStop,
  onOpenBreakModal
}) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Time calculations
  let displayMinutes = 0;
  let displaySeconds = 0;
  let progressPercent = 0;

  if (mode === 'interval') {
    displayMinutes = Math.floor(remainingFocusSeconds / 60);
    displaySeconds = remainingFocusSeconds % 60;
    const totalSec = targetFocusMinutes * 60;
    progressPercent = totalSec > 0 ? Math.min(100, (focusSecondsElapsed / totalSec) * 100) : 0;
  } else {
    // Flow state counts up
    displayMinutes = Math.floor(focusSecondsElapsed / 60);
    displaySeconds = focusSecondsElapsed % 60;
    // visual rotation
    progressPercent = (focusSecondsElapsed % 3600) / 36;
  }

  const timeString = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  // SVG circular dimensions
  const size = 280;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const intervalPresets = [15, 25, 45, 60, 90];

  return (
    <div className="glass-panel" style={{
      padding: '30px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      {/* Mode Toggle Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Mode Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            className="btn"
            disabled={status !== 'idle'}
            onClick={() => setMode('interval')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              background: mode === 'interval' ? 'var(--accent-purple)' : 'transparent',
              color: mode === 'interval' ? '#ffffff' : 'var(--text-muted)',
              cursor: status === 'idle' ? 'pointer' : 'not-allowed'
            }}
          >
            <Sliders size={14} /> Custom Interval
          </button>
          <button
            type="button"
            className="btn"
            disabled={status !== 'idle'}
            onClick={() => setMode('flow')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              background: mode === 'flow' ? 'var(--accent-cyan)' : 'transparent',
              color: mode === 'flow' ? '#ffffff' : 'var(--text-muted)',
              cursor: status === 'idle' ? 'pointer' : 'not-allowed'
            }}
          >
            <Zap size={14} /> Flow State
          </button>
        </div>

        {/* Status Badge */}
        <div className={`badge ${
          status === 'focusing' ? 'badge-emerald' : 
          status === 'paused' ? 'badge-rose' : 'badge-flow'
        }`}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: status === 'focusing' ? '#10b981' : status === 'paused' ? '#f43f5e' : '#8b5cf6',
            boxShadow: '0 0 6px currentColor'
          }} />
          {status === 'focusing' ? 'FOCUSED • ACTIVE' : 
           status === 'paused' ? 'PAUSED' : 'READY TO ENGAGE'}
        </div>
      </div>

      {/* Task Goal Title Input */}
      <div style={{
        width: '100%',
        marginBottom: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Sparkles size={16} color="var(--accent-purple)" />
        {isEditingGoal || status === 'idle' ? (
          <input
            type="text"
            value={taskGoal}
            onChange={e => setTaskGoal(e.target.value)}
            onBlur={() => setIsEditingGoal(false)}
            placeholder="What is your mission this session?"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontFamily: 'var(--font-display)',
              outline: 'none'
            }}
          />
        ) : (
          <div 
            style={{ flex: 1, fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', cursor: 'pointer' }}
            onClick={() => setIsEditingGoal(true)}
          >
            {taskGoal}
          </div>
        )}
        {status !== 'idle' && (
          <Edit2 
            size={14} 
            color="var(--text-dim)" 
            style={{ cursor: 'pointer' }} 
            onClick={() => setIsEditingGoal(true)} 
          />
        )}
      </div>

      {/* Circular Glowing Timer Ring */}
      <div style={{ position: 'relative', width: size, height: size, margin: '10px 0' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#timerGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: status === 'focusing' ? 'stroke-dashoffset 1s linear' : 'none',
              filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))'
            }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Countdown Display */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '3.4rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            textShadow: '0 0 30px rgba(139, 92, 246, 0.4)'
          }}>
            {timeString}
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: '2px'
          }}>
            {mode === 'interval' ? `${targetFocusMinutes} MIN TARGET` : 'FLOW STATE ELAPSED'}
          </div>
        </div>
      </div>

      {/* Interval Presets (Only in interval mode when idle) */}
      {mode === 'interval' && status === 'idle' && (
        <div style={{
          display: 'flex',
          gap: '8px',
          margin: '14px 0 20px 0',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {intervalPresets.map(min => (
            <button
              key={min}
              type="button"
              className="btn btn-secondary"
              onClick={() => setTargetFocusMinutes(min)}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-full)',
                background: targetFocusMinutes === min ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: targetFocusMinutes === min ? 'var(--accent-purple)' : 'var(--border-subtle)',
                color: targetFocusMinutes === min ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              {min}m
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px', flexWrap: 'wrap' }}>
        {status === 'idle' && (
          <button
            className="btn btn-primary"
            onClick={onStart}
            style={{ padding: '12px 32px', fontSize: '1.05rem', minWidth: '160px' }}
          >
            <Play size={18} fill="currentColor" /> Enter Focus
          </button>
        )}

        {status === 'focusing' && (
          <>
            <button
              className="btn btn-secondary"
              onClick={onPause}
              style={{ padding: '12px 22px' }}
            >
              <Pause size={18} /> Pause
            </button>

            <button
              className="btn btn-secondary"
              onClick={onOpenBreakModal}
              style={{
                padding: '12px 20px',
                borderColor: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#6ee7b7'
              }}
            >
              <Coffee size={18} /> Take Break
            </button>

            <button
              className="btn btn-danger"
              onClick={onStop}
              style={{ padding: '12px 20px' }}
            >
              <Square size={18} /> Complete & Evaluate
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              className="btn btn-primary"
              onClick={onResume}
              style={{ padding: '12px 26px' }}
            >
              <Play size={18} fill="currentColor" /> Resume
            </button>

            <button
              className="btn btn-secondary"
              onClick={onOpenBreakModal}
              style={{ padding: '12px 18px' }}
            >
              <Coffee size={18} /> Take Break
            </button>

            <button
              className="btn btn-danger"
              onClick={onStop}
              style={{ padding: '12px 18px' }}
            >
              <Square size={18} /> Complete Session
            </button>
          </>
        )}
      </div>

      {/* Break records indicator in current session */}
      {currentBreaks.length > 0 && (
        <div style={{
          marginTop: '20px',
          width: '100%',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Breaks logged ({currentBreaks.length}):
          </span>
          {currentBreaks.map(b => (
            <span key={b.id} className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              {b.label} ({b.durationMinutes}m)
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
