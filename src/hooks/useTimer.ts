import { useState, useEffect, useRef } from 'react';
import { BreakRecord, BreakType } from '../types';
import { soundFx } from '../lib/audio';

export type TimerMode = 'interval' | 'flow';
export type TimerStatus = 'idle' | 'focusing' | 'paused' | 'on_break';

export function useTimer() {
  const [mode, setMode] = useState<TimerMode>('interval');
  const [status, setStatus] = useState<TimerStatus>('idle');
  
  // Durations in minutes
  const [targetFocusMinutes, setTargetFocusMinutes] = useState(25);
  const [targetBreakMinutes, setTargetBreakMinutes] = useState(5);
  
  // Elapsed time in seconds
  const [focusSecondsElapsed, setFocusSecondsElapsed] = useState(0);
  const [breakSecondsElapsed, setBreakSecondsElapsed] = useState(0);
  
  // Breaks history during current session
  const [currentBreaks, setCurrentBreaks] = useState<BreakRecord[]>([]);
  const [activeBreak, setActiveBreak] = useState<BreakRecord | null>(null);
  
  // Task Goal input by user
  const [taskGoal, setTaskGoal] = useState('Deep Work & High Priority Execution');

  const sessionStartTimeRef = useRef<number>(0);

  // Focus Timer Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (status === 'focusing') {
      interval = setInterval(() => {
        setFocusSecondsElapsed(prev => {
          const next = prev + 1;
          // In interval mode, check if we hit the target
          if (mode === 'interval' && next >= targetFocusMinutes * 60) {
            soundFx.playBreakChime();
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, mode, targetFocusMinutes]);

  // Break Timer Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (status === 'on_break') {
      interval = setInterval(() => {
        setBreakSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Actions
  const startFocus = () => {
    if (status === 'idle') {
      sessionStartTimeRef.current = Date.now();
      setFocusSecondsElapsed(0);
      setBreakSecondsElapsed(0);
      setCurrentBreaks([]);
    }
    setStatus('focusing');
    soundFx.playFocusStart();
  };

  const pauseFocus = () => {
    if (status === 'focusing') {
      setStatus('paused');
    }
  };

  const resumeFocus = () => {
    if (status === 'paused') {
      setStatus('focusing');
    }
  };

  const startBreak = (type: BreakType, label: string, plannedMinutes: number) => {
    const newBreak: BreakRecord = {
      id: 'brk_' + Date.now(),
      type,
      label,
      startTime: Date.now(),
      durationMinutes: plannedMinutes
    };
    setActiveBreak(newBreak);
    setTargetBreakMinutes(plannedMinutes);
    setStatus('on_break');
    soundFx.playBreakChime();
  };

  const endBreak = () => {
    if (activeBreak) {
      const completedBreak: BreakRecord = {
        ...activeBreak,
        endTime: Date.now(),
        durationMinutes: Math.max(1, Math.round(breakSecondsElapsed / 60))
      };
      setCurrentBreaks(prev => [...prev, completedBreak]);
    }
    setActiveBreak(null);
    setStatus('focusing');
    soundFx.playFocusStart();
  };

  const resetTimer = () => {
    setStatus('idle');
    setFocusSecondsElapsed(0);
    setBreakSecondsElapsed(0);
    setActiveBreak(null);
    setCurrentBreaks([]);
    sessionStartTimeRef.current = 0;
  };

  // Remaining seconds for display in interval mode
  const remainingFocusSeconds = Math.max(0, targetFocusMinutes * 60 - focusSecondsElapsed);
  const remainingBreakSeconds = Math.max(0, targetBreakMinutes * 60 - breakSecondsElapsed);

  return {
    mode,
    setMode,
    status,
    taskGoal,
    setTaskGoal,
    targetFocusMinutes,
    setTargetFocusMinutes,
    targetBreakMinutes,
    setTargetBreakMinutes,
    focusSecondsElapsed,
    breakSecondsElapsed,
    remainingFocusSeconds,
    remainingBreakSeconds,
    currentBreaks,
    activeBreak,
    sessionStartTime: sessionStartTimeRef.current,
    startFocus,
    pauseFocus,
    resumeFocus,
    startBreak,
    endBreak,
    resetTimer
  };
}
