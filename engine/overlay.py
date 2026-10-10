#!/usr/bin/env python3
"""
全屏 Physiological Sigh 遮罩 - 作为独立子进程运行（L2 强制复位干预）

Huberman Protocol — Physiological Sigh:
  Step 1: Double inhale through nose (充满肺 + 补吸一口)
  Step 2: Long, forceful exhale through mouth (直到肺完全排空)
  → 肺泡重新充气 → 血液 CO₂ 迅速清除 → 副交感神经主导
  → 皮质醇在数秒内下降，比普通深呼吸快 5-10 倍
  Ref: Huberman Lab, "Tools for Managing Stress & Anxiety"

Usage:
    python engine/overlay.py "违规消息文本" [countdown_seconds]

Design:
    - 全屏置顶，覆盖所有窗口
    - 三阶段呼吸动画: 双吸气（两段快速扩张）→ 长呼气（缓慢收缩）
    - N 秒倒计时后自动关闭，期间无法手动关闭
    - 在子进程中运行，不影响主进程 rich 显示
"""
import sys
import math
import tkinter as tk


# ─── 呼吸阶段定义 (Physiological Sigh) ───────────────────────────────────────
# 相比普通正弦呼吸，Physiological Sigh 有双峰吸气 + 长呼气
# 时序: inhale1(1.5s) → tiny_inhale(0.5s) → exhale(4s) → pause(1s) = 7s/cycle

PHASE_NAMES = ["INHALE 1", "INHALE 2", "EXHALE", "PAUSE"]
PHASE_DURATIONS_FRAMES = None  # 动态计算


def compute_phases(fps: int):
    """
    返回每个阶段的帧数列表，基于 Physiological Sigh 的最优时序
    吸气1 = 1.5s, 补吸 = 0.5s, 呼气 = 4.0s, 暂停 = 1.0s
    """
    return [
        int(1.5 * fps),  # Phase 0: first inhale
        int(0.5 * fps),  # Phase 1: second (top-up) inhale
        int(4.0 * fps),  # Phase 2: long exhale
        int(1.0 * fps),  # Phase 3: pause before next cycle
    ]


def main():
    message = sys.argv[1] if len(sys.argv) > 1 else "Physiological Sigh Protocol\nDouble inhale → Long exhale"
    countdown_total = int(sys.argv[2]) if len(sys.argv) > 2 else 7

    root = tk.Tk()
    root.title("Neuro-Focus Engine — Physiological Sigh")
    root.attributes("-fullscreen", True)
    root.attributes("-topmost", True)
    root.configure(bg="#04050f")
    root.lift()
    root.focus_force()

    # 禁止用户关闭
    root.protocol("WM_DELETE_WINDOW", lambda: None)
    for key in ("<Escape>", "<Command-q>", "<Command-w>", "<Alt-F4>"):
        root.bind(key, lambda e: None)

    screen_w = root.winfo_screenwidth()
    screen_h = root.winfo_screenheight()
    cx, cy = screen_w // 2, int(screen_h * 0.48)

    canvas = tk.Canvas(root, bg="#04050f", highlightthickness=0)
    canvas.pack(fill=tk.BOTH, expand=True)

    FPS = 20
    FRAME_MS = 1000 // FPS
    phases = compute_phases(FPS)
    BREATH_CYCLE = sum(phases)  # total frames per full cycle

    state = {
        "frame":     0,
        "remaining": countdown_total,
        "tick_accum": 0,
    }

    # ── 颜色 ──────────────────────────────────────────────────────────────────
    # 吸气: 蓝白色 (高激活) → 呼气: 深紫 (副交感主导)
    INHALE_COLOR  = (80, 160, 255)   # bright blue
    EXHALE_COLOR  = (100, 40, 200)   # deep violet
    PAUSE_COLOR   = (40,  20, 100)   # dark indigo

    def lerp_color(c1: tuple, c2: tuple, t: float) -> str:
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        return f"#{r:02x}{g:02x}{b:02x}"

    def get_breath_state(f: int):
        """
        返回当前帧的呼吸状态:
        (phase_index, phase_progress 0-1, radius 0-1, color_tuple)
        """
        pos = f % BREATH_CYCLE
        acc = 0
        for i, dur in enumerate(phases):
            if pos < acc + dur:
                t = (pos - acc) / dur  # 0→1 within this phase
                return i, t
            acc += dur
        return 3, 1.0  # fallback: pause

    R_MIN, R_MAX = 70, 165

    def get_radius_and_color(phase_idx: int, t: float):
        """Map phase + progress to circle radius and color."""
        if phase_idx == 0:
            # First inhale: smooth expansion 0→0.85
            r_norm = t * 0.85
            color = lerp_color(PAUSE_COLOR, INHALE_COLOR, t)
        elif phase_idx == 1:
            # Second (top-up) inhale: 0.85→1.0 (small bump)
            r_norm = 0.85 + t * 0.15
            # Accent: flash slightly brighter
            color = lerp_color(INHALE_COLOR, (160, 220, 255), t)
        elif phase_idx == 2:
            # Long exhale: 1.0→0.1 (slow decay)
            r_norm = 1.0 - t * 0.9
            color = lerp_color(INHALE_COLOR, EXHALE_COLOR, t)
        else:
            # Pause: hold small
            r_norm = 0.1
            color = PAUSE_COLOR

        R = R_MIN + (R_MAX - R_MIN) * r_norm
        return R, color if isinstance(color, str) else lerp_color(color, color, 0)

    PHASE_LABELS_EN = [
        "INHALE through nose…",
        "TOP-UP inhale (quick!)",
        "exhale… slowly… fully…",
        "• pause •",
    ]
    PHASE_LABELS_CN = [
        "用鼻子吸气，充满肺部",
        "鼻子快速再补吸一口",
        "嘴巴缓慢长呼出，直到肺空",
        "自然暂停",
    ]
    PHASE_COLORS_HEX = ["#50a0ff", "#a0d4ff", "#a028c8", "#441880"]

    # ── 主绘制函数 ────────────────────────────────────────────────────────────
    def draw():
        canvas.delete("all")
        f = state["frame"]
        phase_idx, t = get_breath_state(f)
        R, color_tuple = get_radius_and_color(phase_idx, t)

        # Convert color_tuple to hex if needed
        if isinstance(color_tuple, tuple):
            color_hex = f"#{color_tuple[0]:02x}{color_tuple[1]:02x}{color_tuple[2]:02x}"
        else:
            color_hex = color_tuple

        # ── 顶部进度条 ─────────────────────────────────────────────────────
        rem = state["remaining"]
        bar_w = screen_w - 200
        bar_h = 5
        bar_x = 100
        bar_y = 18
        elapsed_ratio = 1.0 - (rem / countdown_total)
        canvas.create_rectangle(bar_x, bar_y, bar_x + bar_w, bar_y + bar_h,
                                 fill="#0d0e20", outline="")
        canvas.create_rectangle(bar_x, bar_y, bar_x + int(bar_w * elapsed_ratio), bar_y + bar_h,
                                 fill=color_hex, outline="")

        # ── 光晕环（多层伪辉光）──────────────────────────────────────────
        for i in range(7, 0, -1):
            glow_r = R + i * 16
            base_brightness = max(5, 28 - i * 4)
            glow_hex = (
                f"#{'%02x' % min(255, base_brightness + i * 2)}"
                f"{'%02x' % max(0, base_brightness - i * 2)}"
                f"{'%02x' % min(255, base_brightness + i * 8)}"
            )
            canvas.create_oval(
                cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r,
                outline=glow_hex, width=2
            )

        # ── 主呼吸圆 ─────────────────────────────────────────────────────
        canvas.create_oval(
            cx - R, cy - R, cx + R, cy + R,
            fill=color_hex, outline=""
        )

        # ── 内核白光 ─────────────────────────────────────────────────────
        inner_r = max(12, R * 0.30)
        canvas.create_oval(
            cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r,
            fill="#ffffff", outline=""
        )

        # ── 阶段标签（英文 + 中文）────────────────────────────────────────
        phase_color_hex = PHASE_COLORS_HEX[phase_idx]
        canvas.create_text(
            cx, cy + R + 36,
            text=PHASE_LABELS_EN[phase_idx],
            fill=phase_color_hex,
            font=("Helvetica Neue", 20, "bold"),
            anchor="center"
        )
        canvas.create_text(
            cx, cy + R + 64,
            text=PHASE_LABELS_CN[phase_idx],
            fill="#8899cc",
            font=("Helvetica Neue", 14),
            anchor="center"
        )

        # ── 主消息（多行，在圆上方）──────────────────────────────────────
        lines = message.replace("\\n", "\n").split("\n")
        y_msg = cy - R - 100
        for i, line in enumerate(lines[:5]):
            canvas.create_text(
                cx, y_msg + i * 28,
                text=line.strip(),
                fill="#dde8ff" if i == 0 else "#9099bb",
                font=("Helvetica Neue", 18, "bold") if i == 0 else ("Helvetica Neue", 14),
                anchor="center",
                width=screen_w - 260,
            )

        # ── 倒计时 ────────────────────────────────────────────────────────
        canvas.create_text(
            cx, cy + R + 100,
            text=f"{rem}s",
            fill="#44335a",
            font=("Helvetica Neue", 13),
            anchor="center"
        )

        # ── 底部 Huberman 科学提示 ────────────────────────────────────────
        canvas.create_text(
            cx, screen_h - 55,
            text="🫁  Physiological Sigh  ·  Double inhale + long exhale  ·  Fastest parasympathetic activation  ·  Huberman Lab",
            fill="#221a33",
            font=("Helvetica Neue", 12),
            anchor="center"
        )

    # ── 定时器 tick ───────────────────────────────────────────────────────────
    def tick():
        draw()
        state["frame"] += 1
        state["tick_accum"] += 1

        if state["tick_accum"] >= FPS:
            state["tick_accum"] = 0
            state["remaining"] -= 1

        if state["remaining"] <= 0:
            root.destroy()
            return

        root.after(FRAME_MS, tick)

    tick()
    root.mainloop()


if __name__ == "__main__":
    main()
