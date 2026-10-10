#!/usr/bin/env python3
"""
神经认知专注引擎 — 复盘报告生成器

读取 logs/cognitive_telemetry.jsonl，
调用 Gemini 生成深度诊断分析，
输出精美本地 HTML 报告并自动打开浏览器。

用法:
    python report_generator.py                    # 分析今日全部日志
    python report_generator.py --file custom.jsonl  # 指定日志文件
    python report_generator.py --no-browser          # 不自动打开浏览器
"""
import argparse
import json
import os
import sys
import webbrowser
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean, median

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel

load_dotenv()
console = Console()

LOG_PATH         = Path("logs/cognitive_telemetry.jsonl")
REPORT_DIR       = Path("logs")
REPORT_FILENAME  = f"neuro_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"


# ─── 日志读取与统计 ────────────────────────────────────────────────────────────

def load_records(path: Path) -> list[dict]:
    """读取 JSONL 日志，过滤 SESSION_END 摘要行，返回样本列表"""
    if not path.exists():
        console.print(f"[red]日志文件不存在: {path}[/red]")
        sys.exit(1)

    records = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                if rec.get("type") != "SESSION_END":
                    records.append(rec)
            except json.JSONDecodeError:
                pass

    return records


def compute_stats(records: list[dict]) -> dict:
    """计算会话统计指标"""
    if not records:
        return {}

    total = len(records)
    aligned = sum(1 for r in records if r.get("is_aligned"))
    flow    = sum(1 for r in records if r.get("mental_state") == "Deep_Flow")
    struggle= sum(1 for r in records if r.get("mental_state") == "Active_Struggle")
    escape  = sum(1 for r in records if r.get("mental_state") == "Passive_Escapism")
    fog     = sum(1 for r in records if r.get("mental_state") == "Brain_Fog")

    fatigue_scores = [r["fatigue_score"] for r in records if "fatigue_score" in r]
    elapsed_mins   = [r["elapsed_min"]    for r in records if "elapsed_min" in r]
    session_mins   = [r["session_elapsed_min"] for r in records if "session_elapsed_min" in r]

    interventions = defaultdict(int)
    for r in records:
        lvl = r.get("intervention_applied", "—")
        interventions[lvl] += 1

    # 逃避最高发生的阶段
    escape_times = [
        r.get("elapsed_min", 0)
        for r in records
        if r.get("mental_state") == "Passive_Escapism"
    ]

    # 疲劳爆发拐点（第一次 fatigue_score >= 7 的 elapsed_min）
    fatigue_breakpoint = None
    for r in records:
        if r.get("fatigue_score", 0) >= 7:
            fatigue_breakpoint = r.get("session_elapsed_min", r.get("elapsed_min", "?"))
            break

    max_session = max(session_mins) if session_mins else 0

    return {
        "total_samples":      total,
        "aligned_count":      aligned,
        "focus_rate_pct":     round(aligned / total * 100, 1) if total else 0,
        "flow_count":         flow,
        "flow_rate_pct":      round(flow / total * 100, 1) if total else 0,
        "struggle_count":     struggle,
        "escape_count":       escape,
        "escape_rate_pct":    round(escape / total * 100, 1) if total else 0,
        "fog_count":          fog,
        "avg_fatigue":        round(mean(fatigue_scores), 2) if fatigue_scores else 0,
        "median_fatigue":     round(median(fatigue_scores), 2) if fatigue_scores else 0,
        "max_fatigue":        max(fatigue_scores) if fatigue_scores else 0,
        "fatigue_breakpoint_min": fatigue_breakpoint,
        "session_duration_min": round(max_session, 1),
        "escape_peak_times":  escape_times[:5],
        "interventions":      dict(interventions),
        "l1_count":           interventions.get("L1", 0),
        "l2_count":           interventions.get("L2", 0),
        "fog_alert_count":    interventions.get("BRAIN_FOG", 0),
        "tasks":              list({r.get("task_goal", "") for r in records if r.get("task_goal")}),
        "cognitive_types":    list({r.get("cognitive_type", "") for r in records if r.get("cognitive_type")}),
        "cycle_names":        list({r.get("cycle_name", "") for r in records if r.get("cycle_name")}),
    }

def get_player_stats() -> dict:
    try:
        from engine.reward_engine import PlayerProfile
        pp = PlayerProfile()
        level_info = getattr(pp, 'level_title', '') if hasattr(pp, 'level_title') else ''
        return {
            "level": getattr(pp, 'level', 1),
            "level_title": level_info,
            "total_xp": pp.total_xp,
            "streak_days": pp.streak_days,
            "longest_streak": pp.longest_streak,
            "milestones_unlocked": pp.milestones_unlocked,
            "pr_longest_flow_min": pp.personal_records.pr_longest_flow_min,
            "pr_session_focus_rate": pp.personal_records.pr_session_focus_rate,
            "pr_daily_focus_min": pp.personal_records.pr_daily_focus_min,
            "pr_session_xp": pp.personal_records.pr_session_xp
        }
    except Exception as e:
        return {}


def build_chart_data(records: list[dict]) -> dict:
    """构建 Chart.js 所需的数据序列"""
    timeline_labels = []
    mental_states   = []
    fatigue_series  = []
    alignment_series = []

    state_numeric = {
        "Deep_Flow":        4,
        "Active_Struggle":  3,
        "Passive_Escapism": 1,
        "Brain_Fog":        2,
    }

    for r in records:
        ts = r.get("timestamp", "")
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                timeline_labels.append(dt.strftime("%H:%M"))
            except Exception:
                timeline_labels.append(ts[:16])
        else:
            timeline_labels.append(str(len(timeline_labels)))

        ms  = r.get("mental_state", "Active_Struggle")
        mental_states.append(state_numeric.get(ms, 2))
        fatigue_series.append(r.get("fatigue_score", 5))
        alignment_series.append(1 if r.get("is_aligned") else 0)

    return {
        "labels":     timeline_labels,
        "mental":     mental_states,
        "fatigue":    fatigue_series,
        "alignment":  alignment_series,
    }


# ─── Gemini 叙事分析 ──────────────────────────────────────────────────────────

def get_narrative(stats: dict, records: list[dict]) -> str:
    """调用 Gemini 生成深度诊断叙事"""
    try:
        from engine.analyzer import GeminiAnalyzer
    except ImportError:
        return "（引擎模块未找到，跳过 AI 叙事）"

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return "（未找到 GEMINI_API_KEY，跳过 AI 叙事）"

    # 取最近 20 条记录作为样本
    sample_recs = records[-20:]
    log_sample = "\n".join(
        f"[{r.get('session_elapsed_min', '?')}min] "
        f"{r.get('mental_state', '?')} | "
        f"fatigue={r.get('fatigue_score', '?')} | "
        f"{'✓' if r.get('is_aligned') else '✗'} | "
        f"{r.get('app_or_site', '')} | "
        f"{r.get('activity_detail', '')}"
        for r in sample_recs
    )

    stats_str = json.dumps(stats, ensure_ascii=False, indent=2)

    with console.status("[bold #4488ff]🧠  Gemini 正在生成深度诊断报告...[/bold #4488ff]"):
        analyzer = GeminiAnalyzer(api_key)
        return analyzer.generate_report_narrative(stats_str, log_sample)


# ─── HTML 报告生成 ────────────────────────────────────────────────────────────

def generate_html(stats: dict, chart_data: dict, narrative: str, records: list[dict]) -> str:
    """生成完整的 HTML 报告"""
    player_stats = get_player_stats()
    
    focus_color = (
        "#44ff88" if stats.get("focus_rate_pct", 0) >= 80
        else "#ffaa44" if stats.get("focus_rate_pct", 0) >= 60
        else "#ff6644"
    )

    grade_map = [
        (90, "A+", "#44ff88"), (80, "A",  "#44ff88"),
        (70, "B",  "#88ff44"), (60, "C",  "#ffaa44"),
        (0,  "D",  "#ff6644"),
    ]
    grade, grade_color = "D", "#ff6644"
    for threshold, g, c in grade_map:
        if stats.get("focus_rate_pct", 0) >= threshold:
            grade, grade_color = g, c
            break

    task_list = "<br>".join(stats.get("tasks", ["—"]))
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    chart_labels_json = json.dumps(chart_data["labels"])
    chart_mental_json = json.dumps(chart_data["mental"])
    chart_fatigue_json = json.dumps(chart_data["fatigue"])
    chart_align_json  = json.dumps(chart_data["alignment"])

    # Markdown → 简单 HTML 转换
    narrative_html = narrative.replace("\n\n", "</p><p>").replace("\n", "<br>")
    narrative_html = narrative_html.replace("## ", "<h3>").replace("# ", "<h2>")
    # Fix unclosed headers (basic)
    for tag in ["h2", "h3"]:
        parts = narrative_html.split(f"<{tag}>")
        fixed = parts[0]
        for part in parts[1:]:
            end_idx = part.find("<br>")
            if end_idx == -1:
                end_idx = part.find("</p>")
            if end_idx == -1:
                end_idx = len(part)
            fixed += f"<{tag}>{part[:end_idx]}</{tag}>{part[end_idx:]}"
        narrative_html = fixed
    narrative_html = f"<p>{narrative_html}</p>"

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>神经专注报告 — {generated_at}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    :root {{
      --bg:       #07071a;
      --surface:  #0e0e2a;
      --surface2: #151535;
      --border:   #1e1e4a;
      --text:     #c8d0f0;
      --muted:    #6677aa;
      --blue:     #4488ff;
      --green:    #44ff88;
      --yellow:   #ffaa44;
      --red:      #ff6644;
      --purple:   #aa44ff;
      --cyan:     #44ccff;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: "SF Pro Display", "Helvetica Neue", "PingFang SC", system-ui, sans-serif;
      line-height: 1.7;
      padding: 0 0 80px;
    }}

    /* Header */
    .hero {{
      background: linear-gradient(135deg, #0a0a2e 0%, #0d0d3a 50%, #0a1a3a 100%);
      border-bottom: 1px solid var(--border);
      padding: 48px 40px 40px;
      position: relative;
      overflow: hidden;
    }}
    .hero::before {{
      content: "";
      position: absolute;
      top: -80px; left: -80px;
      width: 400px; height: 400px;
      background: radial-gradient(circle, #4488ff15 0%, transparent 70%);
      pointer-events: none;
    }}
    .hero-label {{ color: var(--muted); font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; }}
    .hero h1 {{ font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 6px; }}
    .hero .meta {{ color: var(--muted); font-size: 13px; }}
    .hero .task {{ color: var(--cyan); font-size: 14px; margin-top: 8px; }}

    /* Grade Badge */
    .grade-badge {{
      position: absolute;
      right: 48px; top: 48px;
      width: 100px; height: 100px;
      border-radius: 50%;
      border: 3px solid {grade_color};
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: {grade_color}18;
    }}
    .grade-badge .grade {{ font-size: 36px; font-weight: 800; color: {grade_color}; }}
    .grade-badge .grade-label {{ font-size: 11px; color: var(--muted); }}

    /* Layout */
    .container {{ max-width: 1100px; margin: 0 auto; padding: 0 32px; }}
    .section {{ margin-top: 40px; }}
    .section-title {{
      font-size: 13px; font-weight: 600; letter-spacing: 2px;
      text-transform: uppercase; color: var(--muted);
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px; margin-bottom: 20px;
    }}

    /* Cards */
    .card-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }}
    .card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }}
    .card::before {{
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: var(--accent, var(--blue));
    }}
    .card .label {{ font-size: 11px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }}
    .card .value {{ font-size: 32px; font-weight: 700; color: #fff; }}
    .card .unit  {{ font-size: 14px; color: var(--muted); margin-left: 4px; }}
    .card .sub   {{ font-size: 12px; color: var(--muted); margin-top: 4px; }}

    /* Chart */
    .chart-wrap {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
    }}
    .chart-wrap h3 {{ font-size: 14px; color: var(--muted); margin-bottom: 16px; }}
    canvas {{ max-height: 280px; }}

    /* Narrative */
    .narrative {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 3px solid var(--blue);
      border-radius: 12px;
      padding: 28px 32px;
      line-height: 1.9;
    }}
    .narrative h2 {{ color: var(--blue); font-size: 18px; margin: 24px 0 10px; }}
    .narrative h3 {{ color: var(--cyan); font-size: 15px; margin: 20px 0 8px; font-weight: 600; }}
    .narrative p  {{ color: var(--text); font-size: 14px; margin-bottom: 10px; }}

    /* Footer */
    .footer {{ margin-top: 60px; text-align: center; color: var(--muted); font-size: 12px; }}
  </style>
</head>
<body>

<div class="hero">
  <div class="grade-badge">
    <span class="grade">{grade}</span>
    <span class="grade-label">专注评级</span>
  </div>
  <div class="container">
    <div class="hero-label">Neuro-Focus Engine · 认知复盘报告</div>
    <h1>专注会话分析</h1>
    <div class="meta">生成时间: {generated_at} &nbsp;·&nbsp; 总样本: {stats.get('total_samples', 0)} 次采样</div>
    <div class="task">📌 任务: {task_list}</div>
  </div>
</div>

<div class="container">

  <!-- KPI Cards -->
  <div class="section">
    <div class="section-title">核心指标</div>
    <div class="card-grid">
      <div class="card" style="--accent: {focus_color}">
        <div class="label">心流专注率</div>
        <div class="value" style="color:{focus_color}">{stats.get('focus_rate_pct', 0)}<span class="unit">%</span></div>
        <div class="sub">{stats.get('aligned_count', 0)} / {stats.get('total_samples', 0)} 次对齐</div>
      </div>
      <div class="card" style="--accent: #44ff88">
        <div class="label">心流时长占比</div>
        <div class="value" style="color:#44ff88">{stats.get('flow_rate_pct', 0)}<span class="unit">%</span></div>
        <div class="sub">{stats.get('flow_count', 0)} 次 Deep_Flow</div>
      </div>
      <div class="card" style="--accent: #ff6644">
        <div class="label">逃避率</div>
        <div class="value" style="color:#ff6644">{stats.get('escape_rate_pct', 0)}<span class="unit">%</span></div>
        <div class="sub">{stats.get('escape_count', 0)} 次 Escapism</div>
      </div>
      <div class="card" style="--accent: #ffaa44">
        <div class="label">平均疲劳指数</div>
        <div class="value" style="color:#ffaa44">{stats.get('avg_fatigue', 0)}<span class="unit">/10</span></div>
        <div class="sub">最高 {stats.get('max_fatigue', 0)} · 中位 {stats.get('median_fatigue', 0)}</div>
      </div>
      <div class="card" style="--accent: #44ccff">
        <div class="label">会话时长</div>
        <div class="value" style="color:#44ccff">{stats.get('session_duration_min', 0)}<span class="unit">min</span></div>
        <div class="sub">疲劳拐点: {stats.get('fatigue_breakpoint_min', '—')} min</div>
      </div>
      <div class="card" style="--accent: #aa44ff">
        <div class="label">干预统计</div>
        <div class="value" style="color:#aa44ff">{stats.get('l1_count', 0) + stats.get('l2_count', 0)}</div>
        <div class="sub">L1×{stats.get('l1_count',0)} L2×{stats.get('l2_count',0)} 脑雾×{stats.get('fog_alert_count',0)}</div>
      </div>
    </div>
  </div>

  <!-- Player Profile / Gamification -->
  <div class="section">
    <div class="section-title">GAMIFICATION · LEVEL & PRs</div>
    <div class="card-grid">
      <div class="card" style="--accent: #44ff88">
        <div class="label">当前等级</div>
        <div class="value" style="color:#44ff88">Lv.{player_stats.get('level', 1)}</div>
        <div class="sub">{player_stats.get('level_title', '初学者')} · {player_stats.get('total_xp', 0)} XP</div>
      </div>
      <div class="card" style="--accent: #ffaa44">
        <div class="label">当前连打 (Streak)</div>
        <div class="value" style="color:#ffaa44">{player_stats.get('streak_days', 0)}<span class="unit">Days</span></div>
        <div class="sub">历史最高: {player_stats.get('longest_streak', 0)} Days</div>
      </div>
      <div class="card" style="--accent: #44ccff">
        <div class="label">🏆 PR: 最长连续心流</div>
        <div class="value" style="color:#44ccff">{player_stats.get('pr_longest_flow_min', 0)}<span class="unit">min</span></div>
      </div>
      <div class="card" style="--accent: #ff6644">
        <div class="label">🏆 PR: 单次最高专注率</div>
        <div class="value" style="color:#ff6644">{player_stats.get('pr_session_focus_rate', 0)}<span class="unit">%</span></div>
      </div>
    </div>
  </div>

  <!-- Charts -->
  <div class="section">
    <div class="section-title">认知状态时序图</div>
    <div class="chart-wrap">
      <h3>精神状态曲线 (4=心流 · 3=攻坚 · 2=脑雾 · 1=逃避)</h3>
      <canvas id="mentalChart"></canvas>
    </div>
    <div class="chart-wrap">
      <h3>疲劳指数曲线</h3>
      <canvas id="fatigueChart"></canvas>
    </div>
  </div>

  <!-- AI Narrative -->
  <div class="section">
    <div class="section-title">Gemini AI 深度诊断</div>
    <div class="narrative">
      {narrative_html}
    </div>
  </div>

</div>

<div class="footer">
  <p>神经认知专注引擎 v1.0 · 数据仅保存本地 · 截图仅存在于内存中</p>
</div>

<script>
const labels  = {chart_labels_json};
const mental  = {chart_mental_json};
const fatigue = {chart_fatigue_json};
const align   = {chart_align_json};

const CHART_DEFAULTS = {{
  responsive: true,
  maintainAspectRatio: false,
  plugins: {{ legend: {{ labels: {{ color: "#6677aa", font: {{ size: 12 }} }} }} }},
  scales: {{
    x: {{ ticks: {{ color: "#445566", maxTicksLimit: 20 }}, grid: {{ color: "#0e0e2a" }} }},
    y: {{ ticks: {{ color: "#445566" }},               grid: {{ color: "#1e1e4a" }} }},
  }},
}};

new Chart(document.getElementById("mentalChart"), {{
  type: "line",
  data: {{
    labels,
    datasets: [{{
      label: "精神状态",
      data: mental,
      borderColor: "#4488ff",
      backgroundColor: "#4488ff22",
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }}, {{
      label: "任务对齐",
      data: align.map(v => v * 4),
      borderColor: "#44ff8866",
      backgroundColor: "transparent",
      borderDash: [4, 4],
      tension: 0,
      pointRadius: 0,
    }}],
  }},
  options: {{ ...CHART_DEFAULTS, plugins: {{ ...CHART_DEFAULTS.plugins }},
    scales: {{ ...CHART_DEFAULTS.scales, y: {{ min: 0, max: 4.5, ticks: {{ color: "#445566",
      callback: v => ({{1:"逃避",2:"脑雾",3:"攻坚",4:"心流"}})[v] || "" }} }} }} }},
}});

new Chart(document.getElementById("fatigueChart"), {{
  type: "line",
  data: {{
    labels,
    datasets: [{{
      label: "疲劳指数",
      data: fatigue,
      borderColor: "#ffaa44",
      backgroundColor: "#ffaa4422",
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }}],
  }},
  options: {{ ...CHART_DEFAULTS, scales: {{ ...CHART_DEFAULTS.scales, y: {{ min: 0, max: 10, ticks: {{ color: "#445566" }} }} }} }},
}});
</script>
</body>
</html>"""


# ─── 主函数 ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="神经专注引擎 — 复盘报告生成器")
    parser.add_argument("--file",       default=str(LOG_PATH), help="日志文件路径")
    parser.add_argument("--no-browser", action="store_true",   help="不自动打开浏览器")
    parser.add_argument("--no-ai",      action="store_true",   help="跳过 AI 叙事分析")
    args = parser.parse_args()

    log_path = Path(args.file)
    console.print(f"\n  [dim]读取日志:[/dim] [cyan]{log_path}[/cyan]")

    records = load_records(log_path)
    if not records:
        console.print("[red]  日志为空，无法生成报告。[/red]")
        sys.exit(1)

    console.print(f"  [dim]样本数量:[/dim] {len(records)} 条")

    with console.status("  [dim]统计计算中...[/dim]"):
        stats      = compute_stats(records)
        chart_data = build_chart_data(records)

    narrative = "（使用 --no-ai 跳过了 AI 分析）"
    if not args.no_ai:
        narrative = get_narrative(stats, records)

    with console.status("  [dim]生成 HTML 报告...[/dim]"):
        html_content = generate_html(stats, chart_data, narrative, records)

    report_path = REPORT_DIR / REPORT_FILENAME
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(html_content, encoding="utf-8")

    console.print(
        Panel(
            f"  ✅ 报告已生成\n\n"
            f"  📄 路径: [cyan]{report_path.resolve()}[/cyan]\n"
            f"  🎯 专注率: [bold]{stats.get('focus_rate_pct', 0)}%[/bold]  |  "
            f"心流: [green]{stats.get('flow_count', 0)}[/green]  |  "
            f"逃避: [red]{stats.get('escape_count', 0)}[/red]",
            border_style="green",
            padding=(0, 2),
        )
    )

    if not args.no_browser:
        webbrowser.open(f"file://{report_path.resolve()}")
        console.print("  [dim]已在浏览器中打开报告[/dim]\n")


if __name__ == "__main__":
    main()
