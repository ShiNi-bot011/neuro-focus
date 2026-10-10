"""
Gemini 多模态认知分析引擎 — Huberman Neuroscience Edition
使用 gemini-3.5-flash 进行屏幕视觉理解 + 结构化输出
备用模型: gemini-3.1-flash-lite

神经科学框架:
  · Prefrontal Cortex (PFC) 负荷追踪
  · Default Mode Network (DMN) 激活检测
  · LC-NE (Locus Coeruleus-Norepinephrine) 系统激活评估
  · 体温节律 (Core Body Temperature Rhythm) 感知周期推荐
"""
import datetime
import os
import time
import logging
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


# ─── Pydantic 数据模型 ────────────────────────────────────────────────────────

class MentalState(str, Enum):
    DEEP_FLOW        = "Deep_Flow"         # 心流：高度沉浸
    ACTIVE_STRUGGLE  = "Active_Struggle"   # 攻坚：遇到阻力但在努力
    PASSIVE_ESCAPISM = "Passive_Escapism"  # 摸鱼：多巴胺逃避
    BRAIN_FOG        = "Brain_Fog"         # 脑雾：思维呆滞/疲劳卡死


class CognitiveAnalysis(BaseModel):
    is_aligned:           bool       = Field(description="是否对齐当前目标。查相关文档/讨论思路=True；无关闲聊/刷视频=False")
    app_or_site:          str        = Field(description="当前前台焦点应用或网页标题（简短）")
    current_progress:     str        = Field(description="识别具体推进内容（函数名、报错、文章章节等）")
    activity_detail:      str        = Field(description="细粒度动作描述，20字以内")
    mental_state:         MentalState
    fatigue_score:        int        = Field(ge=1, le=10, description="疲劳程度 1(精神焕发) 到 10(极度耗竭)")
    intervention_required: bool      = Field(description="是否建议系统立刻介入干预")


class CycleRecommendation(BaseModel):
    work_minutes:       int   = Field(description="工作时长（分钟）")
    rest_minutes:       int   = Field(description="休息时长（分钟）")
    cycle_name:         str   = Field(description="周期方案名称")
    reasoning:          str   = Field(description="推荐理由，50字内，中文")
    neuroscience_basis: str   = Field(description="神经科学依据，60字内，中文")


# ─── 分析引擎 ────────────────────────────────────────────────────────────────

class GeminiAnalyzer:
    MODEL          = "gemini-3.5-flash"       # 主模型（已验证可用）
    FALLBACK_MODEL  = "gemini-3.1-flash-lite"  # 备用模型（主模型 503 时切换）
    MAX_RETRIES = 3
    RETRY_DELAY = 2.0  # seconds

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    def analyze_screen(
        self,
        image_bytes: bytes,
        task_goal: str,
        cognitive_type: str,
        phase: str,
        cycle_elapsed_min: float = 0,
    ) -> CognitiveAnalysis:
        """
        分析屏幕截图，返回结构化认知状态评估。
        内置重试机制，网络波动不崩溃。
        """
        prompt = f"""You are a neuroscience-informed AI observer, trained in the frameworks of Andrew Huberman's Huberman Lab, with expertise in:
- Prefrontal Cortex (PFC) load & Executive Function
- Default Mode Network (DMN) activation patterns
- LC-NE (Locus Coeruleus-Norepinephrine) arousal signals
- Dopamine circuit dynamics (exploitation vs exploration)

【会话上下文 / Session Context】
- 核心任务 / Task Goal: {task_goal}
- 认知负荷类型 / Cognitive Load Type: {cognitive_type}
- 当前阶段 / Phase: {"WORK — PFC high-demand engagement" if phase == "WORK" else "REST — Parasympathetic recovery window"}
- 已专注 / Elapsed: {cycle_elapsed_min:.1f} min

【认知状态分类标准 / Mental State Classification】

Deep_Flow
  → PFC fully engaged, DMN suppressed
  → 信号: 快速连续打字、代码/文档稳步推进、无窗口切换
  → LC-NE system: optimal arousal

Active_Struggle
  → PFC load high, working memory under strain
  → 信号: 卡在报错/频繁查文档/思考停顿但仍在努力
  → 这是正常学习摩擦，NOT 失败信号

Passive_Escapism
  → DMN activated, dopamine seeking behavior
  → 信号: 切换到社交/视频/游戏/无关内容
  → Dopamine spike → task re-entry friction increases

Brain_Fog
  → PFC executive function compromised, LC-NE underactivated
  → 信号: 长时间静止、呆滞、反复滚动、屏幕无实质变化
  → 继续强撑将破坏 memory consolidation

【疲劳指数 / Fatigue Score 1-10】
结合屏幕内容密度、窗口切换频率、会话时长综合评估。
1-3: PFC fresh, LC-NE optimal
4-6: Working memory load accumulating
7-8: Cognitive depletion warning
9-10: Mandatory rest — memory consolidation at risk

请严格按 JSON Schema 返回结构化数据。"""

        for attempt in range(self.MAX_RETRIES):
            # 第 2 次以后自动切换备用模型（应对 503 高需求）
            model = self.MODEL if attempt == 0 else self.FALLBACK_MODEL
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        prompt,
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=CognitiveAnalysis,
                        temperature=0.1,
                    ),
                )
                return CognitiveAnalysis.model_validate_json(response.text)

            except Exception as e:
                logger.warning(f"[Analyzer] 第 {attempt + 1} 次尝试失败 (model={model}): {e}")
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_DELAY * (attempt + 1))
                else:
                    # 最终失败：返回保守的中性评估，不影响主循环
                    logger.error(f"[Analyzer] API 调用彻底失败，返回默认状态: {e}")
                    return CognitiveAnalysis(
                        is_aligned=True,
                        app_or_site="Unknown (API Error)",
                        current_progress="API timeout - skipping sample",
                        activity_detail="API 调用失败",
                        mental_state=MentalState.ACTIVE_STRUGGLE,
                        fatigue_score=5,
                        intervention_required=False,
                    )

    def recommend_cycle(self, state_description: str, hour_of_day: int = -1) -> CycleRecommendation:
        """
        根据用户描述的当前状态 + 体温节律时间段，推荐最优工作周期。
        纯文本调用，无视觉输入。
        基于 Huberman 的 Core Body Temperature (CBT) 节律模型。
        """
        # 体温节律时间段分类
        if hour_of_day < 0:
            hour_of_day = datetime.datetime.now().hour

        if 5 <= hour_of_day < 10:
            cbt_phase = "Morning Phase (CBT rising) — Peak norepinephrine window. PFC primed for high-demand cognitive work. Optimal for 90-min deep focus blocks."
        elif 10 <= hour_of_day < 14:
            cbt_phase = "Late Morning Phase (CBT near peak) — Serotonin + dopamine system most active. Best window for creative problem-solving and learning."
        elif 14 <= hour_of_day < 17:
            cbt_phase = "Afternoon Phase (CBT peak → declining) — 下午2-3点体温峰值后开始下降，容易出现 post-lunch dip。建议 52/17 或 45/15 周期。"
        elif 17 <= hour_of_day < 20:
            cbt_phase = "Early Evening Phase (CBT declining) — 体温下降触发副交感神经主导，注意力窗口收窄。适合复习/整理型任务，避免高难度新学习。"
        else:
            cbt_phase = "Night Phase (CBT low) — Melatonin rising, PFC load capacity severely reduced. 强烈建议 25/5 轻量周期，优先考虑睡眠。"

        prompt = f"""You are a neuroscience-informed performance coach, applying frameworks from Andrew Huberman's research on ultradian rhythms, core body temperature cycles, and PFC load capacity.

【用户状态描述 / User State】
"{state_description}"

【体温节律时间段 / Circadian Phase (Core Body Temperature)】
{cbt_phase}

【可选周期方案 / Available Protocols】
1. 90min work / 5min rest — 标准 Ultradian Rhythm: PFC full-load, requires peak LC-NE arousal
2. 52min work / 17min rest — DeskTime研究实测最高产出节律，适合中等能量
3. 45min work / 15min rest — 平衡型，轻度疲惫可持续
4. 25min work / 5min rest — Pomodoro，疲劳或高碎片化任务
5. 20min work / 5min rest — 轻量恢复，严重脑雾/睡眠债

【选择原则 / Decision Framework (Huberman)】
1. CBT circadian phase (time-of-day temperature rhythm) — PRIMARY
2. 用户描述的能量水平和睡眠质量
3. Default Mode Network suppression capacity (疲劳=DMN更容易抢占)
4. Dopamine baseline (睡前高刺激→次日dopamine低=专注力受损)

推荐最合适的方案，reasoning 和 neuroscience_basis 用中英双语。"""

        for attempt in range(self.MAX_RETRIES):
            model = self.MODEL if attempt == 0 else self.FALLBACK_MODEL
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=CycleRecommendation,
                        temperature=0.3,
                    ),
                )
                return CycleRecommendation.model_validate_json(response.text)
            except Exception as e:
                logger.warning(f"[Analyzer] 周期推荐失败 (第 {attempt + 1} 次, model={model}): {e}")
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_DELAY)

        # 回退默认
        return CycleRecommendation(
            work_minutes=52,
            rest_minutes=17,
            cycle_name="DeskTime研究峰值 52/17",
            reasoning="API 调用失败，使用研究支持的默认方案",
            neuroscience_basis="52分钟是前额叶维持高效工作记忆的实测上限",
        )

    def generate_report_narrative(self, stats_summary: str, log_sample: str) -> str:
        """基于日志统计生成 Huberman-style 深度诊断报告（Markdown，中英双语）"""
        prompt = f"""You are a neuroscience performance coach in the style of Andrew Huberman — data-driven, mechanistic, actionable. Generate a deep-dive cognitive session report.

【会话统计 / Session Stats】
{stats_summary}

【日志样本 / Log Sample】
{log_sample}

生成完整 Markdown 报告，包含以下章节：

## 一、专注质量总评 / Session Quality Assessment
整体评级 S/A/B/C/D + 一句话核心诊断。
包含: PFC engagement rate, DMN intrusion frequency, LC-NE arousal pattern。

## 二、心流窗口分析 / Deep Flow Windows
何时进入 Deep Flow，持续多久，触发条件。
神经科学解读: DMN suppression + Task-Positive Network activation 的时间窗口。

## 三、多巴胺逃避模式 / Dopamine Escape Pattern
几点触发 Passive_Escapism，高危情境，dopamine spike 的规律。
提供: "Your brain's dopamine circuit was seeking" 式的具体分析。

## 四、疲劳拐点与记忆固化风险 / Fatigue Inflection & Memory Consolidation Risk
fatigue_score 曲线，PFC 负荷超载时间点。
指出: 哪些时段如果继续强撑会破坏 memory consolidation。

## 五、三条可立即执行的 Huberman Protocols
（基于今日数据的个性化建议，非泛泛空话）
每条建议必须: 有神经机制解释 + 具体操作步骤 + 时间量化。

## 六、明日神经优化方案 / Tomorrow's Neuro Protocol
根据今日表现，给出明天的:
- 最佳启动时间窗口 (based on CBT rhythm)
- 推荐周期方案 + 理由
- 早晨阳光/冷暴露建议 (if fatigue was high)
- Dopamine baseline 管理要点

语气: 专业、机制性、尊重数据，像 Huberman 播客风格。中英双语核心术语。避免模糊建议。"""

        try:
            response = self.client.models.generate_content(
                model=self.MODEL,
                contents=prompt,
            )
            return response.text
        except Exception as e:
            return f"## 报告生成失败\n\n{e}\n\n请检查 API Key 和网络连接。"
