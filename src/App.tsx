import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { FocusTimer } from './components/Timer/FocusTimer';
import { BreakSelector } from './components/Timer/BreakSelector';
import { BreakActiveView } from './components/Timer/BreakActiveView';
import { CameraFeed } from './components/Camera/CameraFeed';
import { SessionSummaryModal } from './components/Evaluation/SessionSummaryModal';
import { FocusHeatmap } from './components/Calendar/FocusHeatmap';
import { VisionBoardView } from './components/VisionBoard/VisionBoardView';
import { GamificationPanel } from './components/Gamification/GamificationPanel';
import { KuaKuaModal } from './components/KuaKua/KuaKuaModal';

import { useAuth } from './hooks/useAuth';
import { useTimer } from './hooks/useTimer';
import { useCamera } from './hooks/useCamera';
import { useSkillTree } from './hooks/useSkillTree';
import { calculateNewStats } from './hooks/useGamification';
import { getUserSessions, saveSession, getUserGoals, saveGoal } from './lib/firebase';
import { analyzeSessionForKuaKua } from './lib/kuakua';
import { FocusSession, GoalItem, Badge, SessionEvaluation, KuaKuaData } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'calendar' | 'vision' | 'gamification'>('timer');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  
  // Kua Kua modal state
  const [kuaKuaData, setKuaKuaData] = useState<KuaKuaData | null>(null);
  const [kuaKuaModalOpen, setKuaKuaModalOpen] = useState(false);

  // Completed session evaluation modal state
  const [summarySession, setSummarySession] = useState<FocusSession | null>(null);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [recentXp, setRecentXp] = useState(0);

  // Auth Hook
  const { currentUser, profile, login, register, logout, updateProfile } = useAuth();

  // Timer Hook
  const timer = useTimer();

  // Camera Hook
  const camera = useCamera(timer.status === 'focusing');

  // Skill Tree Hook
  const skillTree = useSkillTree(currentUser?.uid);

  // Sessions and Goals state
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);

  // Load User Data when currentUser changes
  useEffect(() => {
    async function loadData() {
      const uid = currentUser?.uid || 'guest_user';
      try {
        const fetchedSessions = await getUserSessions(uid);
        const fetchedGoals = await getUserGoals(uid);

        if (fetchedSessions.length > 0) {
          setSessions(fetchedSessions);
        } else {
          // Provide default starter sessions so heatmap is rich immediately
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const starterSessions: FocusSession[] = [
            {
              id: 'starter_1',
              userId: uid,
              startTime: Date.now() - 3600000,
              endTime: Date.now() - 600000,
              durationMinutes: 50,
              focusMinutes: 45,
              breakMinutes: 5,
              mode: 'interval',
              targetMinutes: 45,
              breaks: [{ id: 'b1', type: 'toilet', label: 'Bathroom Break', startTime: Date.now() - 1800000, durationMinutes: 5 }],
              evaluation: {
                score: 92,
                focusPercent: 94,
                distractionCount: 1,
                awayCount: 0,
                aiFeedback: 'Exceptional neural alignment. Sustained high cognitive velocity throughout.',
                keyStrengths: ['Unwavering gaze anchor', 'Mindful restorative break taken'],
                suggestions: ['Maintain room ventilation for afternoon sessions']
              },
              taskGoal: 'System Architecture Blueprint',
              date: today
            },
            {
              id: 'starter_2',
              userId: uid,
              startTime: Date.now() - 86400000 - 5000000,
              endTime: Date.now() - 86400000 - 1400000,
              durationMinutes: 60,
              focusMinutes: 60,
              breakMinutes: 0,
              mode: 'interval',
              targetMinutes: 60,
              breaks: [],
              evaluation: {
                score: 88,
                focusPercent: 89,
                distractionCount: 2,
                awayCount: 0,
                aiFeedback: 'Deep work completed with high precision.',
                keyStrengths: ['Completed full 60min target'],
                suggestions: ['Remember to insert 5min NSDR breaks']
              },
              taskGoal: 'Algorithm Optimization',
              date: yesterday
            }
          ];
          setSessions(starterSessions);
        }

        if (fetchedGoals.length > 0) {
          setGoals(fetchedGoals);
        } else {
          // Default visionary goals
          const defaultGoals: GoalItem[] = [
            {
              id: 'g1',
              text: 'Build & Scale High-Impact AI Software',
              category: 'Career',
              imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
              motivationalQuote: 'Deep neural focus transforms complex ideas into scalable reality.',
              completed: false,
              createdAt: Date.now() - 86400000 * 3
            },
            {
              id: 'g2',
              text: 'Achieve Peak Physical Endurance & Energy',
              category: 'Health',
              imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
              motivationalQuote: 'The body powers the mind. Physical discipline fuels cognitive stamina.',
              completed: false,
              createdAt: Date.now() - 86400000 * 5
            },
            {
              id: 'g3',
              text: 'Master Prefrontal Dopamine Regulation',
              category: 'Mindset',
              imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
              motivationalQuote: 'Where attention goes, neural circuits wire together.',
              completed: true,
              createdAt: Date.now() - 86400000 * 8
            }
          ];
          setGoals(defaultGoals);
        }
      } catch (err) {
        console.warn('Error loading data:', err);
      }
    }
    loadData();
  }, [currentUser]);

  // Calculate today's total focus minutes
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayMinutes = useMemo(() => {
    return sessions
      .filter(s => (s.date || new Date(s.startTime).toISOString().split('T')[0]) === todayDateStr)
      .reduce((acc, s) => acc + s.focusMinutes, 0);
  }, [sessions, todayDateStr]);

  // Session Completion Handler
  const handleStopAndEvaluate = useCallback(async () => {
    const elapsedSec = timer.focusSecondsElapsed;
    const focusMinutes = Math.max(1, Math.round(elapsedSec / 60));
    const breakMinutes = Math.round(timer.breakSecondsElapsed / 60);
    const snapshots = camera.snapshotsHistory;

    // Evaluate Attention from Camera
    let focusPercent = 88;
    let distractions = 0;
    let aways = 0;

    if (snapshots.length > 0) {
      const focusedCount = snapshots.filter(s => s.attentionState === 'Deep_Flow' || s.attentionState === 'Focused').length;
      focusPercent = Math.round((focusedCount / snapshots.length) * 100);
      distractions = snapshots.filter(s => s.attentionState === 'Distracted').length;
      aways = snapshots.filter(s => s.attentionState === 'Away' || !s.isPresent).length;
    }

    // Compute Overall Score (0 - 100)
    let score = Math.round((focusPercent * 0.7) + (Math.min(100, (focusMinutes / 25) * 30)));
    score = Math.max(20, Math.min(99, score - (distractions * 4) - (aways * 8)));

    const evaluation: SessionEvaluation = {
      score,
      focusPercent,
      distractionCount: distractions,
      awayCount: aways,
      aiFeedback: score >= 80 
        ? 'Superb prefrontal retention. High dopamine stability maintained with minimal task-switching friction.'
        : 'Good effort. Recommendation: reduce peripheral desktop notifications and schedule a 5m eye rest.',
      keyStrengths: [
        `${focusMinutes} minutes dedicated focus`,
        timer.currentBreaks.length > 0 ? `${timer.currentBreaks.length} restorative break(s) observed` : 'Continuous engagement',
        camera.cameraActive ? 'Optical sensor verified desk presence' : 'Manual verification'
      ],
      suggestions: [
        'Practice NSDR (Non-Sleep Deep Rest) breathing between intense sprints',
        'Hydrate with water and electrolytes'
      ]
    };

    const newSession: FocusSession = {
      id: 'sess_' + Date.now(),
      userId: currentUser?.uid || 'guest_user',
      startTime: timer.sessionStartTime || Date.now() - (elapsedSec * 1000),
      endTime: Date.now(),
      durationMinutes: focusMinutes + breakMinutes,
      focusMinutes,
      breakMinutes,
      mode: timer.mode,
      targetMinutes: timer.targetFocusMinutes,
      breaks: timer.currentBreaks,
      evaluation,
      taskGoal: timer.taskGoal,
      date: new Date().toISOString().split('T')[0]
    };

    // Calculate Gamification stats
    if (profile) {
      const { updatedProfile, newlyUnlockedBadges, xpGained } = calculateNewStats(
        profile,
        focusMinutes,
        focusMinutes >= timer.targetFocusMinutes,
        timer.currentBreaks.length > 0
      );

      await updateProfile(updatedProfile);
      setNewBadges(newlyUnlockedBadges);
      setRecentXp(xpGained);
    } else {
      setRecentXp(focusMinutes * 10 + 50);
      setNewBadges([]);
    }

    // Save session to cloud
    await saveSession(newSession);
    setSessions(prev => [newSession, ...prev]);

    // Analyze session with Gemini Vision snapshots for Kua Kua & Skill Classification
    const dailyGoal = profile?.dailyGoalMinutes || 180;
    const isDailyGoalChampion = (todayMinutes + focusMinutes) >= dailyGoal;

    try {
      const kuaKuaResult = await analyzeSessionForKuaKua({
        snapshots: camera.capturedFrames,
        taskGoal: timer.taskGoal,
        focusMinutes,
        qualityScore: score,
        breakCount: timer.currentBreaks.length,
        isDailyGoalChampion
      });

      // Allocate skill XP to the Radial Skill Tree
      skillTree.addSessionSkills(
        kuaKuaResult.hardSkillsGained,
        kuaKuaResult.softSkillsGained
      );

      newSession.kuaKua = kuaKuaResult;
      setKuaKuaData(kuaKuaResult);
      setKuaKuaModalOpen(true);
    } catch (kuaErr) {
      console.warn('Kua Kua analysis error:', kuaErr);
    }

    // Show summary modal
    setSummarySession(newSession);

    // Reset timer & camera state
    timer.resetTimer();
    camera.clearSessionSnapshots();
  }, [timer, camera, currentUser, profile, updateProfile, todayMinutes, skillTree]);

  // Goal actions
  const handleAddGoal = async (newGoal: GoalItem) => {
    const uid = currentUser?.uid || 'guest_user';
    await saveGoal(uid, newGoal);
    setGoals(prev => [newGoal, ...prev]);
  };

  const handleToggleGoal = async (id: string) => {
    const uid = currentUser?.uid || 'guest_user';
    const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    setGoals(updated);
    const target = updated.find(g => g.id === id);
    if (target) {
      await saveGoal(uid, target);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
  };

  // Keyboard shortcut (Space to pause/resume)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && activeTab === 'timer') {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          if (timer.status === 'focusing') {
            timer.pauseFocus();
          } else if (timer.status === 'paused') {
            timer.resumeFocus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, timer]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HUD Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={logout}
        todayMinutes={todayMinutes}
      />

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '10px 20px 40px 20px' }}>
        {/* TAB 1: FOCUS ROOM */}
        {activeTab === 'timer' && (
          <div>
            {timer.status === 'on_break' ? (
              <BreakActiveView
                activeBreak={timer.activeBreak}
                breakSecondsElapsed={timer.breakSecondsElapsed}
                onEndBreak={timer.endBreak}
              />
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '20px',
                alignItems: 'start'
              }}>
                {/* Left Column: Focus Timer & Controls */}
                <FocusTimer
                  mode={timer.mode}
                  setMode={timer.setMode}
                  status={timer.status}
                  taskGoal={timer.taskGoal}
                  setTaskGoal={timer.setTaskGoal}
                  targetFocusMinutes={timer.targetFocusMinutes}
                  setTargetFocusMinutes={timer.setTargetFocusMinutes}
                  focusSecondsElapsed={timer.focusSecondsElapsed}
                  remainingFocusSeconds={timer.remainingFocusSeconds}
                  currentBreaks={timer.currentBreaks}
                  onStart={timer.startFocus}
                  onPause={timer.pauseFocus}
                  onResume={timer.resumeFocus}
                  onStop={handleStopAndEvaluate}
                  onOpenBreakModal={() => setBreakModalOpen(true)}
                />

                {/* Right Column: Neural Camera Feed & AI Attention Analysis */}
                <CameraFeed
                  videoRef={camera.videoRef}
                  cameraActive={camera.cameraActive}
                  cameraError={camera.cameraError}
                  onStartCamera={camera.startCamera}
                  onStopCamera={camera.stopCamera}
                  lastSnapshot={camera.lastSnapshot}
                  isAnalyzing={camera.isAnalyzing}
                  onEvaluateNow={camera.evaluateNow}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HEATMAP CALENDAR */}
        {activeTab === 'calendar' && (
          <FocusHeatmap sessions={sessions} />
        )}

        {/* TAB 3: VISION BOARD */}
        {activeTab === 'vision' && (
          <VisionBoardView
            goals={goals}
            onAddGoal={handleAddGoal}
            onToggleGoal={handleToggleGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {/* TAB 4: GAMIFICATION & BADGES */}
        {activeTab === 'gamification' && (
          <GamificationPanel
            profile={profile}
            todayMinutes={todayMinutes}
            skillNodes={skillTree.skillNodes}
            totalSkillXp={skillTree.totalSkillXp}
          />
        )}
      </main>

      {/* Break Selection Modal */}
      <BreakSelector
        isOpen={breakModalOpen}
        onClose={() => setBreakModalOpen(false)}
        onStartBreak={timer.startBreak}
      />

      {/* Auth / Account Sync Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={login}
        onRegister={register}
      />

      {/* Session Progress Auto-Evaluation Summary Modal */}
      <SessionSummaryModal
        session={summarySession}
        newBadges={newBadges}
        xpEarned={recentXp}
        skillNodes={skillTree.skillNodes}
        totalSkillXp={skillTree.totalSkillXp}
        onOpenKuaKua={() => setKuaKuaModalOpen(true)}
        onClose={() => setSummarySession(null)}
      />

      {/* Kua Kua Fullscreen Dopamine Praise Modal */}
      <KuaKuaModal
        isOpen={kuaKuaModalOpen}
        data={kuaKuaData}
        onClose={() => setKuaKuaModalOpen(false)}
        onOpenSkillTree={() => {
          setKuaKuaModalOpen(false);
          setActiveTab('gamification');
        }}
      />
    </div>
  );
};
