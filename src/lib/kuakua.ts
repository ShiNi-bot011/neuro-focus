import { GoogleGenerativeAI } from '@google/generative-ai';
import { KuaKuaData } from '../types/skills';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
  } catch (e) {
    console.warn('Failed to initialize Google Generative AI in kuakua:', e);
  }
}

export interface KuaKuaAnalysisInput {
  snapshots: { timestamp: number; base64: string }[];
  taskGoal: string;
  focusMinutes: number;
  qualityScore: number;
  breakCount: number;
  isDailyGoalChampion?: boolean;
}

/**
 * Generate Kua Kua (AI Hype & Praise) and Skill classification by analyzing
 * all session snapshots and task description with Gemini Vision.
 */
export async function analyzeSessionForKuaKua(input: KuaKuaAnalysisInput): Promise<KuaKuaData> {
  const { snapshots, taskGoal, focusMinutes, qualityScore, breakCount, isDailyGoalChampion } = input;

  if (genAI && API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Pick up to 5 evenly distributed snapshots to avoid payload limits
      const sampleSnapshots: string[] = [];
      if (snapshots.length > 0) {
        const step = Math.max(1, Math.floor(snapshots.length / 5));
        for (let i = 0; i < snapshots.length; i += step) {
          if (sampleSnapshots.length < 5) {
            sampleSnapshots.push(snapshots[i].base64);
          }
        }
      }

      const prompt = `You are the ultimate high-energy, warm, dopamine-igniting AI Neuro-Hype Coach (夸夸大仙 / Prefrontal Flow Master).
The user just completed a high-stakes focus session:
- Goal: "${taskGoal || 'Deep Work Session'}"
- Focus Duration: ${focusMinutes} minutes
- Neural Quality Score: ${qualityScore}/100
- Rest Breaks Taken: ${breakCount}
${isDailyGoalChampion ? '- MILESTONE: User just hit 100% of their 3-HOUR DAILY FOCUS GOAL!' : ''}
${sampleSnapshots.length > 0 ? `I have attached ${sampleSnapshots.length} webcam snapshots taken at intervals during their session.` : 'No webcam images attached (rely on task and metrics).'}

TASK:
1. Praise them with genuine, specific, intellectual admiration (Kua Kua 夸夸 style). Notice what they were working on and their determination.
2. Formulate 2 to 3 timestamped timeline observations of their session progress.
3. Automatically identify 1-2 HARD SKILLS they exercised (e.g. "C Programming & Memory", "Fullstack Architecture", "Algorithmic Logic", "UI Design", "Analytical Research", etc.) with 25-50 XP each.
4. Automatically identify 1-2 SOFT SKILLS they demonstrated (e.g. "Deep Focus Endurance", "Distraction Immunity", "Metacognitive Grit", "Flow Calibration", etc.) with 20-40 XP each.
5. Provide a 1-sentence neuro-recovery coaching tip.

Return ONLY valid JSON (no markdown formatting, no code block backticks):
{
  "headline": "Short punchy electrifying headline (English + Chinese emoji)",
  "praiseQuote": "Deeply perceptive English praise highlighting their actual grit, intellect, and focus (2-3 sentences)",
  "praiseQuoteZh": "暖心极致夸夸中文 (2-3句话，夸到心坎里，充满正反馈与自豪感)",
  "timelineObservations": [
    { "minute": 5, "activity": "Laser focus locked into problem setup", "state": "Flow" },
    { "minute": ${Math.round(focusMinutes * 0.6)}, "activity": "Deep problem solving with unwavering gaze", "state": "Peak Cognition" }
  ],
  "hardSkillsGained": [
    { "skill": "Hard Skill Name", "xp": 40 }
  ],
  "softSkillsGained": [
    { "skill": "Deep Focus Endurance", "xp": 35 }
  ],
  "coachingTip": "One crisp science-backed recovery tip"
}`;

      const contents: (string | { inlineData: { data: string; mimeType: string } })[] = [prompt];

      for (const snap of sampleSnapshots) {
        const clean = snap.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
        contents.push({
          inlineData: {
            data: clean,
            mimeType: 'image/jpeg'
          }
        });
      }

      const result = await model.generateContent(contents);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        id: 'kua_' + Date.now(),
        headline: parsed.headline || '🔥 神经元全频共振！心流超载！',
        praiseQuote: parsed.praiseQuote || `Unbelievable discipline! You spent ${focusMinutes} minutes pushing your limits on "${taskGoal}". That is world-class neural stamina.`,
        praiseQuoteZh: parsed.praiseQuoteZh || `太耀眼了！整整 ${focusMinutes} 分钟全情投入，面对难题没有一丝退缩。这种专注度直接把前额叶潜能拉满，这就是极致的强者姿态！`,
        timelineObservations: Array.isArray(parsed.timelineObservations) && parsed.timelineObservations.length > 0
          ? parsed.timelineObservations
          : generateTimelineFallback(focusMinutes, taskGoal),
        hardSkillsGained: Array.isArray(parsed.hardSkillsGained) && parsed.hardSkillsGained.length > 0
          ? parsed.hardSkillsGained
          : inferHardSkills(taskGoal, focusMinutes),
        softSkillsGained: Array.isArray(parsed.softSkillsGained) && parsed.softSkillsGained.length > 0
          ? parsed.softSkillsGained
          : inferSoftSkills(focusMinutes, qualityScore),
        coachingTip: parsed.coachingTip || 'Rest your eyes with 20-20-20 rule and let working memory consolidate.',
        isDailyGoalChampion: Boolean(isDailyGoalChampion)
      };
    } catch (err) {
      console.warn('Gemini Kua Kua vision analysis error, falling back to neural heuristic:', err);
    }
  }

  // Fallback heuristic praise generation
  return generateHeuristicKuaKua(input);
}

function generateTimelineFallback(focusMinutes: number, goal: string) {
  const m1 = Math.max(2, Math.round(focusMinutes * 0.15));
  const m2 = Math.max(5, Math.round(focusMinutes * 0.55));
  const m3 = Math.max(8, Math.round(focusMinutes * 0.85));

  return [
    { minute: m1, activity: `Locked into workspace with zero delay for "${goal || 'task'}"`, state: 'Initial Flow' },
    { minute: m2, activity: 'Dopamine stabilization: overcome resistance point and entered deep focus', state: 'Peak Flow' },
    { minute: m3, activity: 'Sustained cognitive endurance, wrapping up core milestones', state: 'Execution' }
  ];
}

function inferHardSkills(goal: string, minutes: number): Array<{ skill: string; xp: number }> {
  const text = (goal || '').toLowerCase();
  const xp = Math.min(80, Math.round(minutes * 0.8 + 20));

  if (text.includes('c') || text.includes('pointer') || text.includes('memory') || text.includes('libft') || text.includes('printf')) {
    return [
      { skill: 'C Systems & Pointers', xp },
      { skill: 'Memory Architecture', xp: Math.round(xp * 0.75) }
    ];
  }
  if (text.includes('react') || text.includes('frontend') || text.includes('css') || text.includes('ui') || text.includes('web')) {
    return [
      { skill: 'Frontend & UI Craft', xp },
      { skill: 'Reactive Architecture', xp: Math.round(xp * 0.75) }
    ];
  }
  if (text.includes('algo') || text.includes('leetcode') || text.includes('math') || text.includes('logic')) {
    return [
      { skill: 'Algorithmic Problem Solving', xp },
      { skill: 'Computational Logic', xp: Math.round(xp * 0.75) }
    ];
  }
  if (text.includes('design') || text.includes('art') || text.includes('write') || text.includes('story')) {
    return [
      { skill: 'Creative Synthesis', xp },
      { skill: 'Visual Architecture', xp: Math.round(xp * 0.75) }
    ];
  }

  return [
    { skill: 'Cognitive Engineering', xp },
    { skill: 'Systematic Execution', xp: Math.round(xp * 0.7) }
  ];
}

function inferSoftSkills(minutes: number, score: number): Array<{ skill: string; xp: number }> {
  const enduranceXp = Math.min(60, Math.round(minutes * 0.6 + 15));
  const gritXp = Math.min(50, Math.round(score * 0.4 + 10));

  return [
    { skill: 'Deep Focus Endurance', xp: enduranceXp },
    { skill: 'Metacognitive Grit', xp: gritXp }
  ];
}

function generateHeuristicKuaKua(input: KuaKuaAnalysisInput): KuaKuaData {
  const { taskGoal, focusMinutes, qualityScore, breakCount, isDailyGoalChampion } = input;
  const hardSkills = inferHardSkills(taskGoal, focusMinutes);
  const softSkills = inferSoftSkills(focusMinutes, qualityScore);
  const timeline = generateTimelineFallback(focusMinutes, taskGoal);

  const headlineOptions = [
    '🔥 神经元全频共振！绝对专注力爆发',
    '⚡️ PREFRONTAL TITAN: UNSTOPPABLE FLOW',
    '🌟 极致心流！认知耐力直接封神',
    '💎 专注力天花板！深度思考的艺术'
  ];
  const headline = isDailyGoalChampion
    ? '🏆 每日3小时巅峰达成！终极认知冠军！'
    : headlineOptions[Math.floor(Math.random() * headlineOptions.length)];

  const praiseZhPool = [
    `太强了！整整 ${focusMinutes} 分钟毫无杂念，精准击穿 "${taskGoal || '核心目标'}" 的技术壁垒！你专注时的沉静与爆发力，就是顶尖开发者的专属气质！`,
    `这就是顶峰状态！${focusMinutes} 分钟的高强度心流，前额叶多巴胺通路被你驯服得明明白白。每一次击退分心的瞬间，都是思维肌肉在疯长！`,
    `简直是行走的效率机器！在 ${focusMinutes} 分钟里展现出令人惊叹的认知自律。无论多晦涩的逻辑，在你这种聚焦火力面前都只能缴械投降！`
  ];

  const praiseEnPool = [
    `Astounding performance! You dedicated ${focusMinutes} minutes of razor-sharp focus to "${taskGoal || 'your craft'}". Your working memory is operating at peak human capacity.`,
    `A masterclass in deep focus! ${focusMinutes} minutes of undistracted cognitive velocity. You faced mental friction and pushed right through it with supreme composure.`,
    `Elite flow achieved! Navigating complex challenges without surrendering to dopamine traps is a superpower. Your prefrontal endurance is leveling up at exponential speed.`
  ];

  const pickIdx = Math.floor(Math.random() * praiseZhPool.length);

  return {
    id: 'kua_' + Date.now(),
    headline,
    praiseQuote: praiseEnPool[pickIdx],
    praiseQuoteZh: praiseZhPool[pickIdx],
    timelineObservations: timeline,
    hardSkillsGained: hardSkills,
    softSkillsGained: softSkills,
    coachingTip: breakCount === 0 && focusMinutes > 40
      ? 'Outstanding marathon! Remember to do a 3-minute physiological sigh or distant horizon gaze to reset visual strain.'
      : 'Hydrate, take 5 deep slow diaphragmatic breaths, and let the neural wiring consolidate.',
    isDailyGoalChampion: Boolean(isDailyGoalChampion)
  };
}
