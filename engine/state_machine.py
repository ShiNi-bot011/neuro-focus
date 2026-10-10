"""
90/5 超日节律状态机 + 会话核心逻辑
负责：周期时序控制、违规计数、疲劳检测、日志记录
"""
import json
import logging
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Optional

from .analyzer import CognitiveAnalysis, MentalState
from .intervention import (
    brain_fog_alert,
    fake_rest_warn,
    level0_silent,
    level1_warn,
    level2_block,
    rest_end_alert,
    rest_start_alert,
)

logger = logging.getLogger(__name__)

LOG_PATH = Path("logs/cognitive_telemetry.jsonl")

# ─────────────────────────────────────────────────────────────────────────────
# 配置与数据类
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class CycleConfig:
    work_minutes: int   = 90
    rest_minutes: int   = 5
    name: str           = "标准超日节律 90/5"

    # ⚠️ DEMO-ONLY: 生产环境挑战窗口为 72 小时；此处为演示缩短值
    # demo_challenge_window_min: int = 1  # 未使用，预留


@dataclass
class SessionStats:
    """会话实时统计数据（线程共享，主循环更新）"""
    cycle_index:            int   = 0
    phase:                  str   = "WORK"       # "WORK" | "REST"
    phase_start:            float = field(default_factory=time.time)
    session_start:          float = field(default_factory=time.time)

    # 违规与疲劳计数
    consecutive_violations: int   = 0
    consecutive_fog:        int   = 0

    # 聚合统计
    total_samples:          int   = 0
    aligned_samples:        int   = 0
    flow_samples:           int   = 0
    escapism_samples:       int   = 0
    struggle_samples:       int   = 0
    fog_samples:            int   = 0
    l1_count:               int   = 0
    l2_count:               int   = 0
    fog_alert_count:        int   = 0

    last_analysis:          Optional[CognitiveAnalysis] = None
    last_sample_time:       float = 0.0
    last_intervention:      str   = "—"
    api_error_count:        int   = 0

    # REST 阶段伪休息追踪
    fake_rest_count:        int   = 0

    # ── 当前周期粒度统计（每轮 WORK 开始时重置）────────────────────────────────
    cycle_samples:          int   = 0
    cycle_aligned:          int   = 0
    cycle_flow:             int   = 0
    cycle_struggle:         int   = 0
    cycle_escapism:         int   = 0
    cycle_fog:              int   = 0
    cycle_l1:               int   = 0
    cycle_l2:               int   = 0
    cycle_fog_alerts:       int   = 0
    cycle_fatigue_sum:      float = 0.0
    cycle_fatigue_n:        int   = 0


# ─────────────────────────────────────────────────────────────────────────────
# 状态机主体
# ─────────────────────────────────────────────────────────────────────────────

class NeurofocusStateMachine:
    """
    核心状态机：协调周期切换、样本处理、干预触发。
    设计原则：
    - 纯状态管理，无 UI 逻辑
    - 干预通过 intervention 模块解耦
    - 日志 append-only，隐私安全
    """

    # 阈值常量（脑科学依据）
    L1_THRESHOLD   = 2   # 连续违规次数 → L1 警告
    L2_THRESHOLD   = 3   # 连续违规次数 → L2 遮罩
    FOG_THRESHOLD  = 3   # 连续脑雾次数 → 疲劳干预
    FOG_SCORE_MIN  = 8   # fatigue_score 超过此值算作脑雾信号

    def __init__(
        self,
        task_goal: str,
        cognitive_type: str,
        cycle: CycleConfig,
        on_phase_change: Optional[Callable[[str, int], None]] = None,
    ):
        self.task_goal     = task_goal
        self.cognitive_type = cognitive_type
        self.cycle         = cycle
        self.on_phase_change = on_phase_change
        self.stats         = SessionStats()
        self._running      = False

        # 确保日志目录存在
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    # ── 时间工具 ──────────────────────────────────────────────────────────────

    def phase_elapsed_min(self) -> float:
        """当前阶段已过时间（分钟）"""
        return (time.time() - self.stats.phase_start) / 60

    def phase_remaining_min(self) -> float:
        """当前阶段剩余时间（分钟）"""
        target = (
            self.cycle.work_minutes
            if self.stats.phase == "WORK"
            else self.cycle.rest_minutes
        )
        return max(0.0, target - self.phase_elapsed_min())

    def session_elapsed_min(self) -> float:
        """整个会话已过时间（分钟）"""
        return (time.time() - self.stats.session_start) / 60

    def focus_rate(self) -> float:
        """心流专注率（%）"""
        if self.stats.total_samples == 0:
            return 0.0
        return self.stats.aligned_samples / self.stats.total_samples * 100

    # ── 阶段切换 ──────────────────────────────────────────────────────────────

    def should_transition(self) -> bool:
        """是否应该切换 WORK/REST 阶段"""
        return self.phase_remaining_min() <= 0

    def transition_phase(self):
        """执行阶段切换，触发对应通知"""
        if self.stats.phase == "WORK":
            # WORK → REST：先写周期复盘日志，再切换
            self.log_cycle_end()
            self._play_ding()
            self.stats.phase = "REST"
            self.stats.consecutive_violations = 0
            self.stats.consecutive_fog = 0
            self.stats.fake_rest_count = 0
            rest_start_alert(self.stats.cycle_index + 1, self.cycle.work_minutes)
            logger.info(f"[FSM] Phase → REST (cycle {self.stats.cycle_index + 1})")
        else:
            # REST → WORK：重置当前周期计数器
            self.stats.cycle_index += 1
            self.stats.phase = "WORK"
            self._reset_cycle_stats()
            rest_end_alert(self.stats.cycle_index)
            logger.info(f"[FSM] Phase → WORK (cycle {self.stats.cycle_index})")

        self.stats.phase_start = time.time()

        if self.on_phase_change:
            self.on_phase_change(self.stats.phase, self.stats.cycle_index)

    def _reset_cycle_stats(self):
        """每轮 WORK 开始时重置周期粒度统计"""
        s = self.stats
        s.cycle_samples = 0
        s.cycle_aligned = 0
        s.cycle_flow = 0
        s.cycle_struggle = 0
        s.cycle_escapism = 0
        s.cycle_fog = 0
        s.cycle_l1 = 0
        s.cycle_l2 = 0
        s.cycle_fog_alerts = 0
        s.cycle_fatigue_sum = 0.0
        s.cycle_fatigue_n = 0

    @staticmethod
    def _play_ding():
        """播放周期完成提示音（macOS afplay，静默失败）"""
        try:
            subprocess.Popen(
                ["afplay", "/System/Library/Sounds/Glass.aiff"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass  # 非 macOS 或 afplay 不可用时静默跳过

    # ── 样本处理 ──────────────────────────────────────────────────────────────

    def process_analysis(self, analysis: CognitiveAnalysis) -> str:
        """
        处理一次 Gemini 分析结果。
        更新内部计数器，触发相应干预。
        返回干预等级字符串: "L0" | "L1" | "L2" | "BRAIN_FOG" | "REST_OK" | "FAKE_REST"
        """
        s = self.stats
        s.total_samples += 1
        s.last_analysis = analysis
        s.last_sample_time = time.time()

        # 错误样本跳过深度处理
        if "API Error" in analysis.app_or_site:
            s.api_error_count += 1
            return "API_ERROR"

        # ── 聚合统计 ──
        if analysis.is_aligned:
            s.aligned_samples += 1

        state_map = {
            MentalState.DEEP_FLOW:        "flow",
            MentalState.ACTIVE_STRUGGLE:  "struggle",
            MentalState.PASSIVE_ESCAPISM: "escapism",
            MentalState.BRAIN_FOG:        "fog",
        }
        counter_attr = state_map.get(analysis.mental_state)
        if counter_attr:
            setattr(s, f"{counter_attr}_samples", getattr(s, f"{counter_attr}_samples") + 1)

        # ── REST 阶段专用逻辑 ──
        if s.phase == "REST":
            return self._handle_rest_phase(analysis)

        # ── WORK 阶段: 违规 & 疲劳检测 ──
        return self._handle_work_phase(analysis)

    def _handle_rest_phase(self, analysis: CognitiveAnalysis) -> str:
        """
        REST 阶段：监测是否在伪休息（仍盯着屏幕工作/娱乐）。
        真正的休息 = 屏幕无活动 / 活动非常低。
        """
        s = self.stats
        # 如果 fatigue_score 高，说明还在盯着屏幕
        is_fake_rest = analysis.fatigue_score >= 4 or analysis.is_aligned

        if is_fake_rest:
            s.fake_rest_count += 1
            if s.fake_rest_count >= 2:
                fake_rest_warn()
                s.fake_rest_count = 0
                return "FAKE_REST"
        else:
            s.fake_rest_count = 0

        return "REST_OK"

    def _handle_work_phase(self, analysis: CognitiveAnalysis) -> str:
        """WORK 阶段：违规计数 + 疲劳检测 + 干预触发"""
        s = self.stats

        # ── 脑雾 / 疲劳检测（优先级高于违规）
        is_fog_signal = (
            analysis.mental_state == MentalState.BRAIN_FOG
            or analysis.fatigue_score >= self.FOG_SCORE_MIN
        )
        if is_fog_signal:
            s.consecutive_fog += 1
        else:
            s.consecutive_fog = 0

        if s.consecutive_fog >= self.FOG_THRESHOLD:
            s.fog_alert_count += 1
            s.consecutive_fog = 0
            brain_fog_alert(self.task_goal)
            return "BRAIN_FOG"

        # ── 违规计数
        if not analysis.is_aligned:
            s.consecutive_violations += 1
        else:
            s.consecutive_violations = 0  # 对齐时重置

        # ── 选择干预等级
        if s.consecutive_violations >= self.L2_THRESHOLD:
            s.l2_count += 1
            s.consecutive_violations = 0   # 干预后重置
            level2_block(self.task_goal, duration_secs=5)
            return "L2"
        elif s.consecutive_violations >= self.L1_THRESHOLD:
            s.l1_count += 1
            level1_warn()
            return "L1"
        elif s.consecutive_violations == 1:
            level0_silent(analysis.activity_detail)
            return "L0"
        else:
            # 完全对齐，无干预
            return "OK"

    # ── 日志 ─────────────────────────────────────────────────────────────────

    def log_sample(self, analysis: CognitiveAnalysis, intervention: str):
        """
        将分析结果追加到 JSONL 日志（英文键值，易于机器解析）。
        隐私保证：不记录任何像素/截图数据。
        同时更新当前周期粒度统计。
        """
        # ── 更新周期粒度统计 ──
        s = self.stats
        if s.phase == "WORK":
            s.cycle_samples += 1
            if analysis.is_aligned:
                s.cycle_aligned += 1
            ms = analysis.mental_state
            if ms:
                if ms.value == "Deep_Flow":        s.cycle_flow += 1
                elif ms.value == "Active_Struggle": s.cycle_struggle += 1
                elif ms.value == "Passive_Escapism": s.cycle_escapism += 1
                elif ms.value == "Brain_Fog":       s.cycle_fog += 1
            s.cycle_fatigue_sum += analysis.fatigue_score
            s.cycle_fatigue_n += 1
            if intervention == "L1": s.cycle_l1 += 1
            elif intervention == "L2": s.cycle_l2 += 1
            elif intervention == "BRAIN_FOG": s.cycle_fog_alerts += 1

        record = {
            "timestamp":            datetime.now(tz=timezone.utc).isoformat(),
            "cycle_index":          self.stats.cycle_index + 1,
            "phase":                self.stats.phase,
            "elapsed_min":          round(self.phase_elapsed_min(), 2),
            "session_elapsed_min":  round(self.session_elapsed_min(), 2),
            "is_aligned":           analysis.is_aligned,
            "app_or_site":          analysis.app_or_site,
            "current_progress":     analysis.current_progress,
            "activity_detail":      analysis.activity_detail,
            "mental_state":         analysis.mental_state.value,
            "fatigue_score":        analysis.fatigue_score,
            "intervention_required": analysis.intervention_required,
            "intervention_applied": intervention,
            "task_goal":            self.task_goal,
            "cognitive_type":       self.cognitive_type,
            "cycle_name":           self.cycle.name,
        }
        try:
            with open(LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"[Log] 写入失败: {e}")

    def log_cycle_end(self):
        """WORK 阶段结束时写入周期复盘摘要（CYCLE_END 类型记录）"""
        s = self.stats
        n = s.cycle_samples
        focus_rate = round(s.cycle_aligned / n * 100, 1) if n > 0 else 0.0
        avg_fatigue = round(s.cycle_fatigue_sum / s.cycle_fatigue_n, 1) if s.cycle_fatigue_n > 0 else 0.0

        # 主导认知状态（本轮占比最高的 mental_state）
        state_counts = {
            "Deep_Flow": s.cycle_flow,
            "Active_Struggle": s.cycle_struggle,
            "Passive_Escapism": s.cycle_escapism,
            "Brain_Fog": s.cycle_fog,
        }
        dominant_state = max(state_counts, key=state_counts.get) if n > 0 else "—"

        summary = {
            "type":                 "CYCLE_END",
            "timestamp":            datetime.now(tz=timezone.utc).isoformat(),
            "cycle_index":          s.cycle_index + 1,
            "cycle_name":           self.cycle.name,
            "work_duration_min":    self.cycle.work_minutes,
            "task_goal":            self.task_goal,
            "cognitive_type":       self.cognitive_type,
            # 专注质量
            "cycle_focus_rate_pct": focus_rate,
            "dominant_mental_state": dominant_state,
            "avg_fatigue_score":    avg_fatigue,
            # 行为计数
            "cycle_samples":        n,
            "cycle_flow":           s.cycle_flow,
            "cycle_struggle":       s.cycle_struggle,
            "cycle_escapism":       s.cycle_escapism,
            "cycle_fog":            s.cycle_fog,
            # 干预计数
            "cycle_l1":             s.cycle_l1,
            "cycle_l2":             s.cycle_l2,
            "cycle_fog_alerts":     s.cycle_fog_alerts,
            # 会话累计
            "session_elapsed_min":  round(self.session_elapsed_min(), 1),
        }
        try:
            with open(LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(summary, ensure_ascii=False) + "\n")
            logger.info(f"[Log] 周期 {s.cycle_index + 1} 复盘已写入")
        except Exception as e:
            logger.error(f"[Log] 周期复盘写入失败: {e}")

    def log_session_end(self):
        """记录会话结束摘要"""
        s = self.stats
        summary = {
            "type":               "SESSION_END",
            "timestamp":          datetime.now(tz=timezone.utc).isoformat(),
            "session_duration_min": round(self.session_elapsed_min(), 1),
            "total_cycles":       s.cycle_index,
            "total_samples":      s.total_samples,
            "focus_rate_pct":     round(self.focus_rate(), 1),
            "flow_samples":       s.flow_samples,
            "escapism_samples":   s.escapism_samples,
            "fog_samples":        s.fog_samples,
            "l1_interventions":   s.l1_count,
            "l2_interventions":   s.l2_count,
            "fog_alerts":         s.fog_alert_count,
            "api_errors":         s.api_error_count,
            "task_goal":          self.task_goal,
        }
        try:
            with open(LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(summary, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"[Log] 会话摘要写入失败: {e}")
