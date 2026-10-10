"""
阶梯式行为干预子系统 — Huberman Neuroscience Edition
L0: 静默记录
L1: 系统通知 + 蜂鸣音  (DMN intrusion warning)
L2: Physiological Sigh 全屏引导（双吸气+长呼气，最快激活副交感神经）
BRAIN_FOG: Dopamine Reset 警报 + TTS + NSDR 提示

Huberman 科学依据:
  · Physiological Sigh: 双吸气（鼻吸+鼻吸）+ 长呀气力呼出
    → 肺泡 (alveoli) 重新充气 → 血液 CO₂ 迅速下降 → 副交感神经入主导
    → 比普通深呼吸快 5-10 倍降低皮质醇
    Ref: Huberman Lab, "Tools for Managing Stress & Anxiety"

  · Panoramic Vision: 放松双眼焦点、浏览周围视野（非聚焦）
    → 激活 parasympathetic nervous system
    → 抑制 amygdala 高警觉状态，促进 DMN rest mode
    Ref: Huberman Lab, "Focus Toolkit"

  · NSDR (Non-Sleep Deep Rest): Yoga Nidra 类放松
    → 迅速恢复 dopamine 基线（研究: 65% dopamine 基线恢复）
    → 巩固 working memory → long-term potentiation
    Ref: Huberman Lab, "NSDR Protocol"

  · LC-NE (Locus Coeruleus-Norepinephrine): 大脑觉醒/专注调控轴
    → 冷水刺激 → norepinephrine 瞬间提升 → PFC 重新激活
"""
import os
import sys
import subprocess
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# overlay.py 脚本路径（与本文件同目录）
OVERLAY_SCRIPT = Path(__file__).parent / "overlay.py"


# ─── 基础工具 ─────────────────────────────────────────────────────────────────

def _beep(count: int = 2):
    """系统蜂鸣音"""
    for _ in range(count):
        print("\a", end="", flush=True)


def _notify_macos(title: str, message: str, subtitle: str = "Neuro-Focus Engine"):
    """发送 macOS 系统通知（使用 osascript）"""
    # 转义引号防止注入
    title    = title.replace('"', '\\"')
    message  = message.replace('"', '\\"')
    subtitle = subtitle.replace('"', '\\"')
    script = (
        f'display notification "{message}" '
        f'with title "{title}" '
        f'subtitle "{subtitle}"'
    )
    try:
        subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            timeout=5,
        )
    except Exception as e:
        logger.debug(f"[Notification] osascript failed: {e}")


def _say(text: str, voice: str = "Tingting"):
    """macOS TTS 语音（非阻塞）"""
    try:
        subprocess.Popen(["say", "-v", voice, text])
    except Exception as e:
        logger.debug(f"[TTS] say failed: {e}")


def _show_overlay(message: str, duration_secs: int = 5):
    """
    启动全屏遮罩（阻塞直到倒计时结束）。
    作为独立子进程运行，不干扰主进程。
    """
    try:
        subprocess.run(
            [sys.executable, str(OVERLAY_SCRIPT), message, str(duration_secs)],
            timeout=duration_secs + 15,   # 宽松超时
        )
    except subprocess.TimeoutExpired:
        logger.warning("[Overlay] 遮罩超时，强制关闭")
    except Exception as e:
        logger.error(f"[Overlay] 子进程启动失败: {e}")
        # 降级：终端警告
        print(f"\n\n{'═'*60}\n⚠️  {message}\n{'═'*60}\n")


# ─── 干预等级 ─────────────────────────────────────────────────────────────────

def level0_silent(analysis_detail: str):
    """
    L0 - 静默容错
    单次偏离目标（< 30 秒），不打扰用户，仅记录日志。
    Huberman: 单次 DMN 闯入不需要干预，大脑自然会 re-engage。
    """
    logger.debug(f"[L0] Off-task: {analysis_detail}")
    # 不输出任何可见提示


def level1_warn(custom_message: Optional[str] = None):
    """
    L1 - LC-NE Arousal Warning
    连续 2 次偏离（≥ 60 秒），蜂鸣 + 系统通知。
    Huberman: DMN 开始抢占 Task-Positive Network — 立即施加摩擦力。
    """
    msg = custom_message or "DMN intrusion detected — redirect attention to task goal now"
    _beep(2)
    _notify_macos(
        title="⚠️ Attention Drift — PFC Redirect",
        message=msg,
        subtitle="Neuro-Focus Engine · L1 · DMN Interruption"
    )
    logger.info(f"[L1] Warning triggered: {msg}")


def level2_block(task_goal: str, duration_secs: int = 7):
    """
    L2 - Physiological Sigh Protocol（全屏引导）
    连续 3 次违规，启动 Huberman Physiological Sigh 全屏展示。

    神经科学机制:
    Physiological Sigh = 双吸气（鼻吸+鼻吸）+ 长呀气力呼出
    → 肺泡重新充气 → 血液 CO₂ 迅速清除
    → 副交感神经主导 → 皮质醇下降 → PFC 执行功能复位
    比普通深呼吸快 5-10 倍激活副交感神经系统
    Ref: Huberman Lab Podcast, "Tools for Managing Stress & Anxiety"
    """
    short_goal = task_goal[:40] + "..." if len(task_goal) > 40 else task_goal
    message = (
        f"🫁 Physiological Sigh Protocol — PFC Reset\n\n"
        f"Step 1: 用鼻子吸气（充满肺）\n"
        f"Step 2: 再用鼻子快速补吸一口气\n"
        f"Step 3: 用嘴缓慢长呼气，直到肺排空\n\n"
        f"Return to: [ {short_goal} ]"
    )
    _beep(3)
    _notify_macos(
        title="🫁 Physiological Sigh — PFC Reset",
        message="Double inhale (nose) + long exhale · Fastest parasympathetic activation",
        subtitle="Neuro-Focus Engine · L2 · Huberman Protocol"
    )
    _show_overlay(message, duration_secs=duration_secs)
    logger.warning(f"[L2] Physiological Sigh protocol triggered for: {task_goal[:60]}")


def brain_fog_alert(task_goal: str):
    """
    Dopamine Baseline Reset + NSDR Protocol 警报
    连续 3 次 fatigue_score ≥ 8 或 Brain_Fog 状态。

    神经科学机制:
    Brain Fog = LC-NE 系统严重下调 + Adenosine 堆积 + Dopamine 基线崩塌
    此时强撑：
      · 无法有效利用 working memory
      · 占据 memory consolidation 窗口（记忆固化在大脑空转时发生！）
    NSDR/Yoga Nidra 20min:
      · 研究显示恢复 ~65% dopamine 基线
      · 巩固已学知识进入 long-term potentiation
    Ref: Huberman Lab, "NSDR Protocol"; Stickgold et al., Sleep & Memory
    """
    tts_text = (
        "检测到前额叶皮层算力严重耗尽，多巴胺基线崩塌。"
        "此时强撑将占领记忆固化窗口。"
        "请立即起立走动，或进行二十分钟 NSDR 闭眼放空。"
    )
    message = (
        "🧠 Dopamine Baseline Reset Required\n\n"
        "PFC executive function compromised · LC-NE system underactivated\n"
        "备醒素堆积 → 记忆固化窗口展开中\n\n"
        "✅ NSDR Protocol: 闭眼 · 放空 · 20min Yoga Nidra\n"
        "✅ Cold water on face/wrists — instant norepinephrine boost\n"
        "✅ Brief walk outside — Panoramic Vision 激活副交感\n"
        "❌ Avoid: 手机 / 视频 / 信息流 — dopamine spike 将正常化此耗尽状态"
    )
    _say(tts_text)
    _notify_macos(
        title="🧠 Dopamine Reset Required — NSDR Now",
        message="PFC depleted. LC-NE underactivated. NSDR or cold exposure recommended.",
        subtitle="Neuro-Focus Engine · Critical Intervention"
    )
    _show_overlay(message, duration_secs=10)
    logger.warning("[BRAIN_FOG] Dopamine reset + NSDR intervention triggered")


def rest_start_alert(cycle_index: int, work_minutes: int):
    """工作阶段结束 — Panoramic Vision + NSDR 选项提示"""
    _beep(3)
    _notify_macos(
        title=f"✅ Cycle {cycle_index} Complete — {work_minutes}min PFC Load Done",
        message=(
            "REST PROTOCOL — Panoramic Vision Mode:\n"
            "双眼放松 · 远眺或闭眼放空 — 激活 Default Mode Network\n"
            "可选: NSDR 20min — 迅速恢复 dopamine 基线"
        ),
        subtitle="Neuro-Focus Engine · Ultradian Rest"
    )


def rest_end_alert(cycle_index: int):
    """休息结束 — Dopamine baseline recharged，返回 deep work"""
    _beep(1)
    _notify_macos(
        title=f"🚀 Cycle {cycle_index + 1} — PFC Online",
        message="Dopamine baseline recharged · LC-NE arousal reset · Return to deep work",
        subtitle="Neuro-Focus Engine · Ultradian Rhythm"
    )


def fake_rest_warn():
    """休息阶段检测到用户仍在盯屏幕 — Panoramic Vision Reminder"""
    _beep(1)
    _notify_macos(
        title="👁️ Visual Cortex NOT Unloaded — Fake Rest Detected",
        message=(
            "Panoramic Vision Protocol:\n"
            "小窗/远眺/闭眼 — 放松双眼焦点\n"
            "屏幕盯视 = Visual Cortex 未卸载 = Parasympathetic 未激活"
        ),
        subtitle="Neuro-Focus Engine · Panoramic Vision"
    )
