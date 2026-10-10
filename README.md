# 神经认知专注引擎 🧠

> **前额叶皮层外挂** — 超短周期屏幕视差采样 × 多模态大模型意图推理 × 脑科学节律控制

## 脑科学原理

| 机制 | 说明 |
|------|------|
| **超日节律 Ultradian Rhythm** | 单次高强度 PFC 负荷上限 90min，强制匹配 5min 神经复位 |
| **注意力残留阻断** | 任务切换哪怕 5 秒，重建工作记忆需 15~20min；分心初现即施加摩擦力 |
| **多巴胺回路保护** | 攻坚痛点时，严禁娱乐/无脑闲聊作为逃避代偿 |
| **NSDR 副交感充能** | 休息必须是真正视觉与认知卸载（远眺/闭眼/放空），严禁刷信息流 |

## 安装

```bash
# 1. 克隆项目
git clone <repo> && cd neuro-focus-engine

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 Gemini API Key
# 获取地址: https://aistudio.google.com/app/apikey
```

## 使用

```bash
# 启动专注会话
python main.py

# 生成复盘报告（会话结束后）
python report_generator.py

# 报告选项
python report_generator.py --no-ai          # 跳过 AI 叙事，只看统计图表
python report_generator.py --file path.jsonl  # 指定日志文件
```

## 会话流程

```
启动
 ↓
输入任务目标 + 认知类型
 ↓
描述当前状态 → Gemini AI 推荐最优专注周期
 ↓
确认启动
 ↓
每 30 秒: 截图 → Gemini 视觉分析 → 更新看板
 ↓
违规干预:
  L0 (单次)      → 静默记录
  L1 (连续2次)   → 系统通知 + 蜂鸣
  L2 (连续3次)   → 全屏深呼吸遮罩 5 秒
  脑雾 (连续3次) → TTS 语音 + 全屏遮罩 10 秒
 ↓
90 分钟 → 强制 5 分钟休息
 ↓
Ctrl+C → 会话结束，查看统计摘要
 ↓
python report_generator.py → 生成 HTML 复盘报告
```

## 干预等级

| 等级 | 触发条件 | 行为 |
|------|---------|------|
| **L0** | 单次偏离目标 (< 30s) | 静默记录，不打扰 |
| **L1** | 连续 2 次偏离 (≥ 60s) | 蜂鸣音 + macOS 系统通知 |
| **L2** | 连续 3 次违规 | 全屏深呼吸动画遮罩，5 秒强制复位 |
| **脑雾** | 连续 3 次 fatigue ≥ 8 或 Brain_Fog | TTS 语音警报 + 10 秒遮罩 |

## Gemini 分析字段

| 字段 | 说明 |
|------|------|
| `is_aligned` | 是否对齐任务目标 |
| `app_or_site` | 当前前台应用/网页 |
| `current_progress` | 具体推进内容 |
| `activity_detail` | 细粒度行为（20字内）|
| `mental_state` | Deep_Flow / Active_Struggle / Passive_Escapism / Brain_Fog |
| `fatigue_score` | 1-10 疲劳程度 |
| `intervention_required` | 是否需要立刻干预 |

## 隐私声明

- 截图**仅存在于 RAM** (`io.BytesIO`)，绝不写入磁盘
- 日志只记录**文字标签**，不保存任何像素数据
- API Key 通过 `.env` 文件加载，绝不硬编码

## 目录结构

```
neuro-focus-engine/
├── main.py                # CLI 主入口
├── report_generator.py    # 复盘报告生成器
├── requirements.txt
├── .env.example
├── engine/
│   ├── screen.py          # 截屏 + 内存压缩（隐私优先）
│   ├── analyzer.py        # Gemini 认知分析引擎
│   ├── intervention.py    # 阶梯干预流水线
│   ├── state_machine.py   # 90/5 周期状态机
│   └── overlay.py         # 全屏深呼吸遮罩（子进程）
└── logs/
    └── cognitive_telemetry.jsonl  # 本地日志（git ignored）
```

## 系统要求

- macOS（通知与 TTS 使用 osascript / say）
- Python 3.10+
- Gemini API Key（免费额度通常足够日常使用）
