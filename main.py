#!/usr/bin/env python3
"""
神经认知专注引擎 (Neuro-Focus & Cognitive Engine)
主入口 — CLI 启动器

脑科学支撑:
  · 超日节律 (Ultradian Rhythm): 90min 前额叶高负荷上限
  · 注意力残留阻断 (Attention Residue): 任务切换 → 15-20min 重建工作记忆
  · 多巴胺回路保护: 攻坚痛点时阻断娱乐逃避代偿
  · NSDR (副交感神经充能): 强制视觉与认知卸载

用法:
    python main.py
"""
import os
import sys
import json
import time
import signal
import logging
import threading
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.layout import Layout
from rich.live import Live
from rich.progress import Progress, BarColumn, TextColumn, TimeRemainingColumn
from rich.prompt import Prompt, Confirm
from rich.rule import Rule
from rich.align import Align
from rich import box
from rich.columns import Columns

load_dotenv()

# ─── 全局 Console ─────────────────────────────────────────────────────────────
console = Console()

# ─── 模块导入（延迟，确保 env 已加载）─────────────────────────────────────────
def _import_engine():
    from engine.screen       import capture_screen_bytes, estimate_size_kb
    from engine.analyzer     import GeminiAnalyzer, CycleRecommendation
    from engine.state_machine import NeurofocusStateMachine, CycleConfig
    return capture_screen_bytes, estimate_size_kb, GeminiAnalyzer, CycleRecommendation, NeurofocusStateMachine, CycleConfig


# ─── 常量 ─────────────────────────────────────────────────────────────────────
SAMPLE_INTERVAL_SEC  = 30    # 屏幕采样间隔
FOCUS_REMINDER_MIN   = 15    # 每隔多少分钟触发一次专注提醒
APP_VERSION          = "1.0.0"
HISTORY_PATH         = Path("logs/recent_tasks.json")  # 历史任务存储
MAX_HISTORY          = 5     # 最多保存多少条历史

# ─── 历史任务辅助函数 ──────────────────────────────────────────────────────────

def load_task_history() -> list:
    """读取历史任务列表，返回最新 MAX_HISTORY 条"""
    if not HISTORY_PATH.exists():
        return []
    try:
        data = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def save_task_history(entry: dict):
    """将任务配置写入历史（最新的在最前）"""
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    history = load_task_history()
    history = [h for h in history if h.get("task_goal") != entry["task_goal"]]
    history.insert(0, entry)
    history = history[:MAX_HISTORY]
    try:
        HISTORY_PATH.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


# ─── UI 辅助函数 ──────────────────────────────────────────────────────────────

def clear():
    console.clear()


def print_banner():
    import datetime
    clear()
    hour = datetime.datetime.now().hour

    # CBT 体温节律时段 (Huberman Core Body Temperature Rhythm)
    if 5 <= hour < 10:
        cbt_phase  = "Morning ↑"
        cbt_color  = "#44ffaa"
        cbt_detail = "CBT rising · Peak norepinephrine · Optimal for deep 90-min blocks"
    elif 10 <= hour < 14:
        cbt_phase  = "Late Morning ↑↑"
        cbt_color  = "#44ff88"
        cbt_detail = "CBT near peak · Serotonin + dopamine active · Best for creative focus"
    elif 14 <= hour < 17:
        cbt_phase  = "Afternoon →"
        cbt_color  = "#ffaa44"
        cbt_detail = "CBT declining · Post-lunch dip risk · Use 52/17 protocol"
    elif 17 <= hour < 20:
        cbt_phase  = "Evening ↓"
        cbt_color  = "#ff8844"
        cbt_detail = "CBT declining · Parasympathetic rising · Review/consolidation tasks only"
    else:
        cbt_phase  = "Night ↓↓"
        cbt_color  = "#aa4488"
        cbt_detail = "CBT low · Melatonin rising · Sleep > all — use 25/5 if must work"

    banner_text = Text()
    banner_text.append(
        "\n  NEURO-FOCUS ENGINE\n",
        style="bold #4488ff"
    )
    banner_text.append(
        f"  Huberman Neuroscience Edition  v{APP_VERSION}  |  Prefrontal Cortex Augmentation\n",
        style="dim #8899cc"
    )

    science_lines = [
        "  ◈  Ultradian Rhythm (90min) · PFC 高负荷上限，强制匹配 5min Parasympathetic Reset",
        "  ◈  Attention Residue Blocking · DMN 侵入初现即施加摩擦力",
        "  ◈  Dopamine Baseline Defense · 严禁娱乐逃避代偿，保护 LC-NE 节律",
        "  ◈  NSDR 副交感充能 · Yoga Nidra / Panoramic Vision 强制卸载视觉皮层",
        "  ◈  Physiological Sigh (L2) · 双吸气+长呼气，最快副交感激活协议",
    ]
    science_text = "\n".join(science_lines)

    console.print(
        Panel(
            banner_text,
            border_style="#2244aa",
            padding=(0, 2),
        )
    )
    console.print(
        Panel(
            Text(science_text, style="dim #6677aa"),
            title="[dim]Huberman Neuroscience Protocols[/dim]",
            border_style="#1a2244",
            padding=(0, 1),
        )
    )
    # CBT 当前时间段提示
    console.print(
        Panel(
            f"  [{cbt_color}]●  {cbt_phase}  ·  {cbt_detail}[/{cbt_color}]",
            title=f"[dim {cbt_color}]Core Body Temperature (CBT) Circadian Phase[/dim {cbt_color}]",
            border_style="#1a2233",
            padding=(0, 1),
        )
    )
    console.print()



def choose_cognitive_type() -> str:
    """认知类型选择菜单"""
    types_menu = {
        "1": ("底层系统开发", "C / Rust / 汇编 · 42 School 项目"),
        "2": ("Python / 脚本开发", "Python · Shell · 自动化"),
        "3": ("学术文献研读", "论文 · Transformer / LLM 研究"),
        "4": ("数学逻辑推导", "算法 · 数学证明 · 架构设计"),
        "5": ("产品规划 / 创业决策", "PRD · 策略思考 · 选择分析"),
        "6": ("行政事务处理", "签证 / 申请 / 文件 · 琐事清单"),
        "7": ("写作 / 文档撰写", "技术文档 · 报告 · 邮件"),
        "0": ("自定义", "手动输入"),
    }

    console.print(Rule("[dim]认知类型[/dim]", style="#334466"))
    table = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
    table.add_column("编号", style="bold #4488ff", width=4)
    table.add_column("类型", style="bold white")
    table.add_column("说明", style="dim")

    for key, (name, desc) in types_menu.items():
        table.add_row(f"[{key}]", name, desc)

    console.print(table)

    choice = Prompt.ask(
        "  选择认知类型",
        choices=list(types_menu.keys()),
        default="1",
    )

    if choice == "0":
        return Prompt.ask("  输入自定义认知类型")

    name, _ = types_menu[choice]
    return name


def get_cycle_recommendation(analyzer, state_desc: str) -> "CycleRecommendation":
    """调用 Gemini 根据状态描述 + CBT 体温节律时间段推荐周期"""
    import datetime
    hour = datetime.datetime.now().hour
    with console.status("[bold #4488ff]🧠  Analyzing CBT circadian phase + neural state — recommending optimal protocol...[/bold #4488ff]"):
        rec = analyzer.recommend_cycle(state_desc, hour_of_day=hour)
    return rec


def configure_custom_cycle(default_work: int = 45, default_rest: int = 15) -> "CycleConfig":
    """让用户自由自定义工作和休息时间"""
    from engine.state_machine import CycleConfig
    
    console.print()
    console.print("  [dim #44ffaa]⚙ 自定义专注与休息节奏[/dim #44ffaa]")
    
    while True:
        w_str = Prompt.ask("  ⏱  [bold]专注工作时长 (分钟)[/bold]", default=str(default_work)).strip()
        try:
            w = int(w_str)
            if w > 0:
                break
            console.print("  [#ffaa00]⚠️ 工作时长需大于 0 分钟[/]")
        except ValueError:
            console.print("  [#ffaa00]⚠️ 请输入有效数字[/]")
            
    while True:
        r_str = Prompt.ask("  💤  [bold]休息放松时长 (分钟)[/bold]", default=str(default_rest)).strip()
        try:
            r = int(r_str)
            if r >= 0:
                break
            console.print("  [#ffaa00]⚠️ 休息时长不能为负数[/]")
        except ValueError:
            console.print("  [#ffaa00]⚠️ 请输入有效数字[/]")
            
    name = f"自定义 {w}/{r}"
    return CycleConfig(work_minutes=w, rest_minutes=r, name=name)


def display_cycle_recommendation(rec: "CycleRecommendation") -> "CycleConfig":
    """展示推荐周期，让用户确认或选择手动覆盖"""
    from engine.state_machine import CycleConfig

    console.print()
    console.print(
        Panel(
            f"[bold #44ffaa]  {rec.cycle_name}[/bold #44ffaa]\n\n"
            f"  ⏱  工作段: [bold]{rec.work_minutes}[/bold] 分钟   "
            f"  💤  休息段: [bold]{rec.rest_minutes}[/bold] 分钟\n\n"
            f"  [dim]推荐理由:[/dim] {rec.reasoning}\n"
            f"  [dim]神经科学依据:[/dim] {rec.neuroscience_basis}",
            title="[bold]🔬  Gemini 专注周期推荐[/bold]",
            border_style="#44ffaa",
            padding=(1, 2),
        )
    )
    console.print()

    use_rec = Confirm.ask(
        f"  使用此方案 ({rec.work_minutes}/{rec.rest_minutes})?",
        default=True,
    )

    if use_rec:
        return CycleConfig(
            work_minutes=rec.work_minutes,
            rest_minutes=rec.rest_minutes,
            name=rec.cycle_name,
        )

    # 手动选择
    presets = {
        "1": CycleConfig(90,  5, "标准超日节律 90/5"),
        "2": CycleConfig(52, 17, "DeskTime峰值 52/17"),
        "3": CycleConfig(45, 15, "平衡型 45/15"),
        "4": CycleConfig(25,  5, "番茄钟 25/5"),
        "5": CycleConfig(20,  5, "轻量恢复 20/5"),
        "c": "自定义时长 (自由输入工作与休息分钟数)",
    }
    console.print()
    console.print("[dim]  手动选择周期方案:[/dim]")
    for k, c in presets.items():
        if isinstance(c, CycleConfig):
            console.print(f"    [{k}] {c.name}")
        else:
            console.print(f"    [{k}] {c}")

    sel = Prompt.ask("  选择", choices=list(presets.keys()), default="1")
    if sel == "c":
        return configure_custom_cycle(default_work=rec.work_minutes, default_rest=rec.rest_minutes)
    return presets[sel]


# ─── 实时看板 ─────────────────────────────────────────────────────────────────

MENTAL_STATE_ICONS = {
    "Deep_Flow":        ("🌊", "#44ff88"),    # DMN suppressed, TPN dominant
    "Active_Struggle":  ("⚔️",  "#ffaa44"),    # PFC load high, LC-NE active
    "Passive_Escapism": ("🎮", "#ff4444"),    # DMN dominant, dopamine seeking
    "Brain_Fog":        ("🌫️",  "#8888aa"),    # LC-NE underactivated, adenosine buildup
    None:               ("—",  "#666688"),
}

INTERVENTION_ICONS = {
    "OK":         "[dim green]✓ PFC Aligned[/dim green]",
    "L0":         "[dim yellow]L0 DMN Flicker[/dim yellow]",
    "L1":         "[bold yellow]⚠ L1 DMN Intrusion[/bold yellow]",
    "L2":         "[bold red]🫑 L2 Physiological Sigh[/bold red]",
    "BRAIN_FOG":  "[bold magenta]🧠 Dopamine Reset + NSDR[/bold magenta]",
    "REST_OK":    "[dim cyan]👁️ Panoramic Vision[/dim cyan]",
    "FAKE_REST":  "[bold orange1]❌ Visual Cortex Loaded[/bold orange1]",
    "API_ERROR":  "[dim red]API Error[/dim red]",
    "—":          "[dim]—[/dim]",
}

# Bug Fix 4: singleton instances to avoid re-reading disk every 1s in make_dashboard
_dashboard_daily_tracker = None
_dashboard_player_profile = None

def _get_dashboard_singletons():
    """Lazy-init cached data readers (avoids per-second disk I/O in dashboard)"""
    global _dashboard_daily_tracker, _dashboard_player_profile
    if _dashboard_daily_tracker is None:
        try:
            from engine.daily_tracker import DailyTracker
            from engine.reward_engine import PlayerProfile
            _dashboard_daily_tracker = DailyTracker()
            _dashboard_player_profile = PlayerProfile()
        except Exception:
            pass
    return _dashboard_daily_tracker, _dashboard_player_profile

def make_dashboard(sm, cycle: "CycleConfig") -> Panel:
    """生成实时看板 Panel"""
    from engine.analyzer import MentalState

    s = sm.stats
    elapsed_min  = sm.phase_elapsed_min()
    remaining_min = sm.phase_remaining_min()
    target_min   = cycle.work_minutes if s.phase == "WORK" else cycle.rest_minutes

    # ── 顶部状态行 ─────────────────────────────────────────────
    phase_badge = (
        "[bold #44ff88]▶ WORK 专注[/bold #44ff88]"
        if s.phase == "WORK"
        else "[bold #44aaff]⏸ REST 充能[/bold #44aaff]"
    )

    header = Text()
    header.append(f"  第 {s.cycle_index + 1} 轮  ", style="bold #4488ff")
    header.append("·  ", style="dim")
    header.append_text(Text.from_markup(phase_badge))
    header.append(f"  ·  {cycle.name}", style="dim #6688aa")

    # ── 进度条 ─────────────────────────────────────────────────
    filled = int((elapsed_min / target_min) * 30) if target_min > 0 else 0
    filled = min(filled, 30)
    bar_color = "#44ff88" if s.phase == "WORK" else "#44aaff"
    bar = f"[{bar_color}]{'█' * filled}[/{bar_color}][dim]{'░' * (30 - filled)}[/dim]"
    rem_m = int(remaining_min)
    rem_s = int((remaining_min - rem_m) * 60)
    time_str = f"{rem_m:02d}:{rem_s:02d} 剩余"

    # ── 当前状态 ────────────────────────────────────────────────
    analysis = s.last_analysis
    if analysis:
        ms_key   = analysis.mental_state.value if analysis.mental_state else None
        icon, color = MENTAL_STATE_ICONS.get(ms_key, ("—", "#666688"))
        state_text = f"[{color}]{icon} {ms_key or '—'}[/{color}]"
        aligned_badge = "[green]✅ 对齐[/green]" if analysis.is_aligned else "[red]❌ 偏离[/red]"
        fatigue_bar_n = min(10, analysis.fatigue_score)
        fatigue_bar = (
            f"[{'red' if fatigue_bar_n >= 7 else 'yellow' if fatigue_bar_n >= 4 else 'green'}]"
            f"{'█' * fatigue_bar_n}[/]"
            f"[dim]{'░' * (10 - fatigue_bar_n)}[/dim]"
            f" {fatigue_bar_n}/10"
        )
        app_str      = analysis.app_or_site[:50]
        progress_str = analysis.current_progress[:60]
        activity_str = analysis.activity_detail[:40]
    else:
        state_text = "[dim]等待首次采样...[/dim]"
        aligned_badge = fatigue_bar = app_str = progress_str = activity_str = "[dim]—[/dim]"

    intervention_str = INTERVENTION_ICONS.get(
        s.last_intervention, s.last_intervention
    )

    # ── 统计面板 ────────────────────────────────────────────────
    focus_rate = sm.focus_rate()
    focus_color = "#44ff88" if focus_rate >= 80 else "#ffaa44" if focus_rate >= 60 else "#ff6644"

    # ── 构建 Layout ─────────────────────────────────────────────
    grid = Table.grid(padding=(0, 2))
    grid.add_column(ratio=1)
    grid.add_column(ratio=1)

    # 左列：状态详情
    left = Table(box=None, show_header=False, padding=(0, 1))
    left.add_column("key",   style="dim #8899aa", width=14)
    left.add_column("value", style="white")
    left.add_row("Cognitive State",  state_text)
    left.add_row("Focus App",        app_str)
    left.add_row("Progress",         progress_str)
    left.add_row("Activity",         activity_str)
    left.add_row("Task Aligned",     aligned_badge)
    left.add_row("PFC Load (1-10)",  fatigue_bar)
    left.add_row("Last Protocol",    intervention_str)

    # 右列：会话统计
    right = Table(box=None, show_header=False, padding=(0, 1))
    right.add_column("key",   style="dim #8899aa", width=14)
    right.add_column("value", style="white")
    right.add_row("PFC Align Rate",  f"[{focus_color}]{focus_rate:.1f}%[/{focus_color}]")
    right.add_row("Deep Flow",       f"[#44ff88]{s.flow_samples}[/]  🌊")
    right.add_row("Active Struggle", f"[#ffaa44]{s.struggle_samples}[/]  ⚔️")
    right.add_row("DMN Escapism",    f"[#ff6644]{s.escapism_samples}[/]  🎮")
    right.add_row("Brain Fog",       f"[#8888aa]{s.fog_samples}[/]  🌫️")
    right.add_row("L1 (DMN warn)",   str(s.l1_count))
    right.add_row("L2 (Phys.Sigh)",  str(s.l2_count))
    right.add_row("NSDR Alerts",     str(s.fog_alert_count))

    grid.add_row(left, right)

    # ── Daily Progress 区域 ─────────────────────────────────────────────
    try:
        dt, pp = _get_dashboard_singletons()  # Bug Fix 4: no disk I/O per second
        if dt and pp:
            dt.load()   # refresh from disk (lightweight JSON re-read)
            pp.load()
            dp = dt.get_today_profile()
            goal = dp.daily_goal_min
            actual = dp.actual_focus_min
            gap = goal - actual
            pct = (actual / goal) * 100 if goal > 0 else 0
            filled_bars = int(pct / 10)
            filled_bars = min(10, max(0, filled_bars))
            bar_str = f"[#44ff88]{'█' * filled_bars}[/][dim]{'░' * (10 - filled_bars)}[/]"
            daily_panel = Panel(
                f"  Daily Goal  {bar_str}  {actual:.1f}/{goal}min ({pct:.1f}%)\n"
                f"  Gap         {gap:.1f}min remaining\n"
                f"  XP Today    +{dp.xp_today} XP  ·  Total: {pp.total_xp} XP\n"
                f"  Level       Lv.{pp.level} {pp.level_title}\n",
                title=f"[bold #44ff88]🎮 TODAY · Day {pp.streak_days} of Focus Streak 🔥[/bold #44ff88]",
                border_style="#44ffaa",
                padding=(0, 2)
            )
        else:
            daily_panel = Panel("[dim]Loading...[/dim]", border_style="#44ffaa")
    except Exception as e:
        daily_panel = Panel(f"Error loading daily stats: {e}")

    # 次采样倒计时
    now = time.time()
    since_last = now - s.last_sample_time if s.last_sample_time > 0 else 0
    next_in = max(0, SAMPLE_INTERVAL_SEC - since_last)

    body = (
        f"{header}\n\n"
        f"  {bar}  [dim]{time_str}[/dim]\n\n"
    )

    full_panel = Panel(
        body,
        title=f"[dim]⏱ 下次采样: {int(next_in)}s  |  会话时长: {sm.session_elapsed_min():.0f}min[/dim]",
        border_style="#2244aa" if s.phase == "WORK" else "#2244ff",
        padding=(0, 1),
    )

    # 组合输出
    from rich.console import Group
    return Group(daily_panel, full_panel, grid)


# ─── 主采样工作线程 ────────────────────────────────────────────────────────────

class SamplerThread(threading.Thread):
    """后台采样线程：每 30 秒抓图分析，触发干预，写日志"""

    def __init__(self, sm, analyzer, capture_fn, estimate_fn, daily_tracker=None, task_manager=None, subtask_id=None):
        super().__init__(daemon=True)
        self.sm          = sm
        self.analyzer    = analyzer
        self.capture     = capture_fn
        self.estimate_kb = estimate_fn
        self.daily_tracker = daily_tracker
        self.task_manager = task_manager
        self.subtask_id = subtask_id
        self._stop_event = threading.Event()

    def stop(self):
        self._stop_event.set()

    def run(self):
        # 启动后等待 3 秒让 UI 稳定
        time.sleep(3)

        while not self._stop_event.is_set():
            try:
                self._sample_once()
            except Exception as e:
                logging.getLogger(__name__).error(f"[Sampler] 未预期错误: {e}")

            # 等待下次采样（可中断）
            self._stop_event.wait(timeout=SAMPLE_INTERVAL_SEC)

    def _sample_once(self):
        sm = self.sm
        s  = sm.stats

        # ── 相位切换检测 ──
        if sm.should_transition():
            sm.transition_phase()

        # ── 截图 + 分析 ──
        try:
            img_bytes = self.capture()
            size_kb   = self.estimate_kb(img_bytes)
            logging.debug(f"[Sampler] Screenshot: {size_kb:.1f} KB")

            analysis = self.analyzer.analyze_screen(
                image_bytes       = img_bytes,
                task_goal         = sm.task_goal,
                cognitive_type    = sm.cognitive_type,
                phase             = s.phase,
                cycle_elapsed_min = sm.phase_elapsed_min(),
            )
            del img_bytes   # 显式销毁截图字节

        except Exception as e:
            logging.getLogger(__name__).warning(f"[Sampler] 截图/分析失败: {e}")
            return

        # ── 处理分析结果 ──
        intervention = sm.process_analysis(analysis)
        s.last_intervention = intervention
        sm.log_sample(analysis, intervention)

        if s.phase == "WORK" and getattr(self, "daily_tracker", None):
            added_min = SAMPLE_INTERVAL_SEC / 60.0
            self.daily_tracker.add_focus_min(added_min)
            if getattr(self, "task_manager", None) and getattr(self, "subtask_id", None):
                self.task_manager.update_subtask_progress(self.subtask_id, added_min)


# ─── 专注提醒线程 ─────────────────────────────────────────────────────────────

class FocusReminderThread(threading.Thread):
    """
    每隔 FOCUS_REMINDER_MIN 分钟在 WORK 阶段弹出任务提醒。
    防止大脑迷失在工具里忘记目标。
    """
    def __init__(self, sm, stop_event: threading.Event):
        super().__init__(daemon=True)
        self.sm        = sm
        self._stop     = stop_event
        self._interval = FOCUS_REMINDER_MIN * 60

    def run(self):
        import subprocess
        elapsed = 0
        while not self._stop.is_set():
            self._stop.wait(timeout=60)   # 每分钟检查一次
            elapsed += 60
            if self._stop.is_set():
                break
            s = self.sm.stats
            if s.phase != "WORK":
                elapsed = 0
                continue
            if elapsed >= self._interval:
                elapsed = 0
                # 静默：15 分钟提醒只写日志，不打扰工作流
                # 出错干预通知由 intervention.py 的 L1/L2/BRAIN_FOG 负责
                pass


# ─── 主函数 ───────────────────────────────────────────────────────────────────

def main():

    # ── 环境检查 ──────────────────────────────────────────────────────────────
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        console.print(
            Panel(
                "[bold red]未找到 GEMINI_API_KEY[/bold red]\n\n"
                "请在项目目录下创建 [bold].env[/bold] 文件：\n"
                "  [cyan]echo 'GEMINI_API_KEY=你的Key' > .env[/cyan]\n\n"
                "获取 Key: [link=https://aistudio.google.com/app/apikey]https://aistudio.google.com/app/apikey[/link]",
                border_style="red",
                padding=(1, 2),
            )
        )
        sys.exit(1)

    # ── 延迟导入引擎模块 ──────────────────────────────────────────────────────
    capture_screen_bytes, estimate_size_kb, GeminiAnalyzer, CycleRecommendation, NeurofocusStateMachine, CycleConfig = _import_engine()

    # ── 初始化激励系统 ────────────────────────────────────────────────────────
    from engine.daily_tracker import DailyTracker
    from engine.task_manager import TaskManager
    from engine.reward_engine import PlayerProfile

    daily_tracker = DailyTracker()
    task_manager = TaskManager()
    player_profile = PlayerProfile()

    # ── 横幅 ──────────────────────────────────────────────────────────────────
    print_banner()

    # ── 每日目标 ─────────────────────────────────────────────────────────────
    console.print(Rule("[dim]🎮 今日目标设定[/dim]", style="#334466"))
    console.print()
    dp = daily_tracker.get_today_profile()
    console.print(f"  [bold #44ff88]TODAY[/bold #44ff88]  ·  Streak 🔥 {player_profile.streak_days} days  ·  Lv.{player_profile.level} {player_profile.level_title if hasattr(player_profile, 'level_title') else ''}")
    console.print(f"  [dim]当前进度: {dp.actual_focus_min:.1f} / {dp.daily_goal_min} min  (完成度: {0 if dp.daily_goal_min==0 else dp.actual_focus_min/dp.daily_goal_min*100:.1f}%)[/dim]")
    
    suggested_task_goal = None
    if dp.daily_goal_min == 0 or Confirm.ask("  [?] 是否要调整今日计划专注时长(分钟)？", default=False):
        import datetime
        import re
        hour = datetime.datetime.now().hour
        rec_goal = 180 if hour < 14 else (120 if hour < 18 else 60)
        
        while True:
            new_goal_str = Prompt.ask(
                f"  [?] 今日计划专注总时长 (分钟数，基于 CBT 推荐 {rec_goal}min)",
                default=str(rec_goal),
            ).strip()

            m_num = re.match(r"^(\d+)\s*(?:min|m|分钟)?$", new_goal_str, re.IGNORECASE)
            m_hour = re.match(r"^(\d+(?:\.\d+)?)\s*(?:h|hr|hour|小时)$", new_goal_str, re.IGNORECASE)

            if m_num:
                goal_val = int(m_num.group(1))
                if goal_val > 0:
                    daily_tracker.set_daily_goal(goal_val)
                    console.print(f"  [dim #44ffaa]✔ 今日专注目标时长已设为: {goal_val} 分钟[/dim #44ffaa]")
                    break
                else:
                    console.print("  [#ffaa00]⚠️ 专注时长需大于 0 分钟，请重新输入[/]")
            elif m_hour:
                goal_val = int(float(m_hour.group(1)) * 60)
                if goal_val > 0:
                    daily_tracker.set_daily_goal(goal_val)
                    console.print(f"  [dim #44ffaa]✔ 今日专注目标时长已设为: {goal_val} 分钟[/dim #44ffaa]")
                    break
                else:
                    console.print("  [#ffaa00]⚠️ 专注时长需大于 0 分钟，请重新输入[/]")
            else:
                # 用户可能误输入了任务名称（例如："完成lstmap"）
                console.print(f"  [#44ffaa]💡 收到目标任务「{new_goal_str}」！[/]")
                console.print(f"  [dim]提示：此处设置的是每日累计专注时长（分钟数，如 180）。[/dim]")
                console.print(f"  [dim]✔ 今日专注时长已采用 CBT 推荐的 {rec_goal} 分钟。[/dim]")
                console.print(f"  [dim]✔「{new_goal_str}」已自动暂存为下一步的核心任务目标！[/dim]")
                suggested_task_goal = new_goal_str
                daily_tracker.set_daily_goal(rec_goal)
                break
    
    console.print()

    # ── Step 1: 任务目标输入（支持历史快选 / Subtask）───────────────────────────────────────
    console.print(Rule("[dim]会话初始化[/dim]", style="#334466"))
    console.print()

    history = load_task_history()
    task_goal = None
    cognitive_type = None
    preset_cycle = None

    if history:
        console.print("  [dim #6688aa]✔ 发现历史任务，可直接继续或新建[/dim #6688aa]")
        hist_table = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        hist_table.add_column("编号", style="bold #4488ff", width=4)
        hist_table.add_column("任务", style="bold white")
        hist_table.add_column("类型", style="dim")
        hist_table.add_column("周期", style="dim #aabbcc")
        for i, h in enumerate(history, 1):
            cycle_label = h.get("cycle_name", "—")
            hist_table.add_row(
                f"[{i}]",
                h.get("task_goal", "—")[:50],
                h.get("cognitive_type", "—"),
                cycle_label,
            )
        hist_table.add_row("[0]", "[新建任务]", "", "")
        console.print(hist_table)

        choices = [str(i) for i in range(len(history) + 1)]
        sel = Prompt.ask(
            "  选择历史任务或新建 (0)",
            choices=choices,
            default="0" if suggested_task_goal else "1",
        )
        if sel != "0":
            chosen = history[int(sel) - 1]
            task_goal      = chosen.get("task_goal")
            cognitive_type = chosen.get("cognitive_type")
            cycle_name     = chosen.get("cycle_name", "历史周期")
            cycle_work     = chosen.get("cycle_work", 45)
            cycle_rest     = chosen.get("cycle_rest", 15)
            console.print(
                f"  [dim]已选择：[/dim] [bold #44ffaa]{task_goal}[/bold #44ffaa]"
            )
            from engine.state_machine import CycleConfig
            console.print(f"  [dim]历史周期: {cycle_name} ({cycle_work}min 工作 / {cycle_rest}min 休息)[/dim]")
            if Confirm.ask("  是否要调整本次工作与休息时间？", default=False):
                preset_cycle = configure_custom_cycle(default_work=cycle_work, default_rest=cycle_rest)
            else:
                preset_cycle = CycleConfig(
                    work_minutes=cycle_work,
                    rest_minutes=cycle_rest,
                    name=cycle_name or f"{cycle_work}/{cycle_rest}",
                )

    if task_goal is None:
        if suggested_task_goal:
            task_goal = Prompt.ask("  🎯 [bold]核心任务目标[/bold]", default=suggested_task_goal)
        else:
            console.print("  [dim]示例: 重写 libft 的 ft_split 内存分配 | 阅读 Transformer 论文 §3[/dim]")
            task_goal = Prompt.ask("  🎯 [bold]核心任务目标[/bold]")
        if not task_goal.strip():
            task_goal = suggested_task_goal or "通用专注任务"

    # ── Step 2: 认知类型（历史复用时已确定）────────────────────────────────
    if cognitive_type is None:
        console.print()
        cognitive_type = choose_cognitive_type()

    # ── Step 3: 周期选择（历史复用则跳过 AI 推荐）───────────────────────────
    if preset_cycle is not None:
        cycle = preset_cycle
        analyzer = GeminiAnalyzer(api_key=api_key)
    else:
        console.print()
        console.print(Rule("[dim]神经状态评估[/dim]", style="#334466"))
        console.print()
        console.print(
            "  [dim]描述你现在的状态（精力、睡眠、今日已专注多久等）[/dim]\n"
            "  [dim]例如: 睡了7小时精力充沛，今天刚开始 | 下午了有点困，已专注2小时[/dim]"
        )
        state_desc = Prompt.ask("  🧬 [bold]当前状态描述[/bold]")
        analyzer = GeminiAnalyzer(api_key=api_key)
        rec = get_cycle_recommendation(analyzer, state_desc)
        cycle = display_cycle_recommendation(rec)

    # ── Step 4: 确认并启动 ────────────────────────────────────────────────────
    while True:
        console.print()
        console.print(
            Panel(
                f"  [bold]任务:[/bold] {task_goal}\n"
                f"  [bold]类型:[/bold] {cognitive_type}\n"
                f"  [bold]周期:[/bold] {cycle.name}  ({cycle.work_minutes}min 专注 / {cycle.rest_minutes}min 休息)\n"
                f"  [bold]日志:[/bold] logs/cognitive_telemetry.jsonl",
                title="[bold]📋  会话配置确认[/bold]",
                border_style="#4488ff",
                padding=(0, 2),
            )
        )
        console.print()

        ready_choice = Prompt.ask(
            "  [bold]准备就绪？[/bold] [y: 开始专注 / a: 调整工作休息时间 / n: 取消会话]",
            choices=["y", "a", "n"],
            default="y"
        )
        if ready_choice == "y":
            break
        elif ready_choice == "a":
            cycle = configure_custom_cycle(default_work=cycle.work_minutes, default_rest=cycle.rest_minutes)
            continue
        else:
            console.print("  [dim]会话已取消。[/dim]")
            return

    # ── 保存本次任务到历史 ──────────────────────────────────────────────────
    save_task_history({
        "task_goal":      task_goal,
        "cognitive_type": cognitive_type,
        "cycle_name":     cycle.name,
        "cycle_work":     cycle.work_minutes,
        "cycle_rest":     cycle.rest_minutes,
    })

    # ── 初始化状态机 ──────────────────────────────────────────────────────────
    sm = NeurofocusStateMachine(
        task_goal     = task_goal,
        cognitive_type = cognitive_type,
        cycle         = cycle,
    )

    # ── 启动采样线程 + 专注提醒线程 ──────────────────────────────────────────
    # Bug Fix 3: pass daily_tracker so SamplerThread accumulates focus_min correctly
    sampler = SamplerThread(sm, analyzer, capture_screen_bytes, estimate_size_kb,
                            daily_tracker=daily_tracker, task_manager=task_manager)
    sampler.start()

    # ── 信号处理（优雅退出）──────────────────────────────────────────────────
    stop_flag = threading.Event()
    reminder = FocusReminderThread(sm, stop_flag)
    reminder.start()

    def handle_exit(sig, frame):
        stop_flag.set()

    signal.signal(signal.SIGINT,  handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    # ── 主显示循环（Live Dashboard）──────────────────────────────────────────
    console.print()
    console.print(
        "[dim]  按 [bold]Ctrl+C[/bold] 结束会话并生成复盘报告[/dim]"
    )
    console.print()

    with Live(
        make_dashboard(sm, cycle),
        console=console,
        refresh_per_second=1,
        screen=False,
    ) as live:
        while not stop_flag.is_set():
            live.update(make_dashboard(sm, cycle))
            time.sleep(1)

    # ── 结束会话 ──────────────────────────────────────────────────────────────
    sampler.stop()
    sampler.join(timeout=5)
    sm.log_session_end()

    s = sm.stats
    console.print()
    console.print(Rule("[bold #44ff88]会话结束[/bold #44ff88]", style="#44ff88"))
    console.print()

    summary_table = Table(box=box.ROUNDED, border_style="#2244aa", show_header=False)
    summary_table.add_column("指标", style="dim")
    summary_table.add_column("数值", style="bold white")
    summary_table.add_row("会话时长",   f"{sm.session_elapsed_min():.1f} 分钟")
    summary_table.add_row("完成轮次",   f"{s.cycle_index} 轮")
    summary_table.add_row("心流专注率", f"{sm.focus_rate():.1f}%")
    summary_table.add_row("心流采样",   str(s.flow_samples))
    summary_table.add_row("逃避次数",   str(s.escapism_samples))
    summary_table.add_row("L1 预警",    str(s.l1_count))
    summary_table.add_row("L2 遮罩",    str(s.l2_count))
    summary_table.add_row("脑雾干预",   str(s.fog_alert_count))
    console.print(Align.center(summary_table))
    console.print()

    # ── Task Completion & Reward (Phase 3) ──────────────────────────────────
    if Confirm.ask("  [bold #44ff88]你是否完成了刚才专注的任务 (Subtask)？[/bold #44ff88]", default=True):
        actual_min = sm.session_elapsed_min()
        focus_rate = sm.focus_rate()
        xp_earned = 0
        is_pr_broken = False

        # 1. 核心数值与等级结算 (本地确定性逻辑，绝对不崩溃)
        try:
            from engine.reward_engine import calculate_xp, PlayerProfile
            from engine.daily_tracker import DailyTracker

            pp = PlayerProfile()
            dt = DailyTracker()

            xp_earned = calculate_xp(
                actual_focus_min=actual_min,
                estimated_focus_min=actual_min,
                l1_count=s.l1_count,
                l2_count=s.l2_count,
                focus_rate=focus_rate,
                streak_days=pp.streak_days,
            )

            is_pr_broken = pp.personal_records.check_and_update_session_xp(xp_earned)
            leveled_up = pp.add_xp(xp_earned)
            dt.add_xp(xp_earned)
            dt.increment_tasks_completed()

            console.print(f"  [bold yellow]🎉 获得 {xp_earned} XP![/bold yellow]")
            if leveled_up:
                console.print(f"  [bold #aa44ff]🆙 Level Up! 当前等级: Lv.{pp.level} {pp.level_title if hasattr(pp, 'level_title') else ''}[/bold #aa44ff]")
        except Exception as e:
            console.print(f"  [red]XP 奖励结算异常: {e}[/red]")

        # 2. 神经教练夸夸 (独立调用，保证已有经验不丢失)
        try:
            console.print("  [dim]正在请求 Kua-Kua AI 神经教练...[/dim]")
            from engine.kua_kua import KuaKuaMachine
            kua = KuaKuaMachine(api_key=api_key)
            praise = kua.generate_task_completion_praise(
                task_name=task_goal,
                actual_min=actual_min,
                focus_rate=focus_rate,
                xp_earned=xp_earned,
                is_pr_broken=is_pr_broken,
            )
            console.print(Panel(praise, title="[bold #44ff88]🤖 神经教练 夸夸[/bold #44ff88]", border_style="#44ff88"))
        except Exception as e:
            console.print(f"  [dim red]神经教练暂离线: {e}[/dim red]")
            
    console.print()
    console.print(
        "  [dim]日志已保存至[/dim] [cyan]logs/cognitive_telemetry.jsonl[/cyan]\n"
        "  [dim]生成复盘报告:[/dim] [bold cyan]python report_generator.py[/bold cyan]"
    )
    console.print()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.WARNING,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    main()
