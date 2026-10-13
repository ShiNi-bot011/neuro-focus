# 🧠 Neuro Focus Engine (前额叶认知专注引擎)

> **Prefrontal Cortex Flow Accelerator** — Real-time Camera Vision Attention Tracking × Gemini AI Multi-Snapshot Timeline Analysis × AI Kua Kua Praise Engine × Interactive Radial Skill Tree.

[![Live Web App](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-8b5cf6?style=for-the-badge&logo=github)](https://shini-bot011.github.io/neuro-focus/)
[![GitHub Repo](https://img.shields.io/badge/Repository-ShiNi--bot011%2Fneuro--focus-06b6d4?style=for-the-badge&logo=github)](https://github.com/ShiNi-bot011/neuro-focus)

---

## 🌐 Live Web Access (随时随地在线访问)

You can run and access Neuro Focus Engine directly on any computer, tablet, or phone without installing anything:

👉 **[https://shini-bot011.github.io/neuro-focus/](https://shini-bot011.github.io/neuro-focus/)**

---

## ✨ Core Features (核心功能)

### 1. 💬 AI Kua Kua Praise Engine (夸夸大仙专属赞美)
- **Multi-Snapshot Vision Replay**: Captures optical keyframes throughout your session. At completion, Gemini analyzes all snapshots to reconstruct a minute-by-minute timeline of what you were actually doing.
- **Personalized High-Energy Hype**:
  - Warm, electrifying praise quotes in both **Chinese** and **English** tailored to your actual intellectual breakthroughs (e.g. C pointer boundaries, memory allocation, debugging tenacity).
  - **Visual Timeline Milestones** (*Min 5: Initial setup locked in*, *Min 18: High cognition state*, etc.).
  - Erupts with celebratory **confetti animation** upon session completion.
  - Automatically awards skill XP pills (**+40 XP Hard Skill**, **+35 XP Soft Skill**) into your Skill Tree.
  - **Daily Champion Mode**: Unlocks an exclusive trophy celebration when hitting 100% of your 3-hour daily goal!

### 2. 🌲 Prefrontal Radial Skill Tree (放射状蛛网技能树)
- **Interactive SVG Constellation**: Radiates outward from your central **PFC CORE**:
  - 💻 **Systems & Computing**: C & Pointer Mechanics, Memory Allocation, Data Structures & Algo
  - 🏗️ **Software Architecture**: Frontend & Reactive UI, State & Concurrency
  - 📐 **Analytical Logic**: Root Cause Debugging, Performance Optimization
  - 🧘 **Cognitive Stamina (Soft Skill)**: Deep Focus Endurance, Distraction Immunity, Instant Flow
  - 🏔️ **Mental Fortitude (Soft Skill)**: Metacognitive Grit, Rest & Restoration IQ
- **Level Progression & Unlocks**: Nodes level up with XP and progressively unlock child nodes.
- **Hover & Inspect**: Hover over any node to view level, XP bar, and unlock criteria.
- **Accessible Anywhere**: Embedded as a tab in the Session Evaluation modal, and as a full explorer in the Gamification tab.

### 3. 📷 Optical Attention Sensor (摄像头注意力监测)
- In-browser optical analysis detecting **Deep Flow**, **Focused**, **Distracted**, and **Away** states.
- Auditory micro-interventions for persistent distractions without being intrusive.

### 4. ⏱️ Dual Focus Engine & Restorative Breaks
- **Interval Mode** (custom duration 15–90 min) & **Flow Mode** (unlimited stopwatch).
- Dedicated break selector with science-backed categories:
  - 🚽 Bathroom / Toilet Break
  - ☕ Electrolytes & Snack
  - 👁️ NSDR & Eye Rest (20-20-20 rule)
  - 🧘 Physical Mobility & Stretch
  - ⚡ Custom Rest

### 5. 📅 Year-Round Heatmap Calendar & Analytics
- GitHub-style contribution calendar tracking daily minutes focused, quality score, and session counts.

### 6. 🖼️ Vision Board & Dopamine Affirmation Generator
- Create visual dream cards with AI-curated affirmations and wallpapers for Career, Mindset, and Health.

### 7. ☁️ Multi-Device Cloud Sync
- Sync across devices using Firebase Authentication or the built-in zero-config persistent storage.

---

## 🚀 Quick Start (本地开发与运行)

### Prerequisites
- Node.js 18+ and npm
- (Optional) Python 3.10+ for the desktop telemetry daemon

### 1. Clone & Install
```bash
git clone https://github.com/ShiNi-bot011/neuro-focus.git
cd neuro-focus
npm install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env
```
Add your [Gemini API Key](https://aistudio.google.com/app/apikey) if you want remote AI generation (the app includes intelligent heuristic fallbacks that work 100% offline).

### 3. Start the Web App
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** (or `http://127.0.0.1:3000`) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🛠️ Architecture & Tech Stack

```
Frontend (React 18 + TypeScript + Vite)
  ├── components/
  │   ├── KuaKua/              # Fullscreen Confetti Hype Modal
  │   ├── SkillTree/           # Radial SVG Spider Graph & Constellation
  │   ├── Camera/              # Webcam Optical Attention Sensor
  │   ├── Timer/               # Dual-Mode Flow & Interval Timer
  │   ├── Evaluation/          # Session Neural Score & AI Feedback Modal
  │   ├── Calendar/            # Year-round Contribution Heatmap
  │   ├── VisionBoard/         # Aspirational Goal Visualizer
  │   └── Gamification/        # Level, Badges & Skill Tree Explorer
  ├── hooks/
  │   ├── useSkillTree.ts      # XP Allocation & Progressive Unlock Logic
  │   ├── useCamera.ts         # Frame Capture & Snapshot History
  │   ├── useTimer.ts          # Tick Engine & Break State Machine
  │   └── useGamification.ts   # Tier Ranks & Achievements
  └── lib/
      ├── kuakua.ts            # Multi-Snapshot Vision Timeline & Praise Generator
      ├── gemini.ts            # Google Gemini 1.5 Flash Vision Client
      ├── firebase.ts          # Cross-Device Cloud Store & Offline Cache
      └── audio.ts             # Web Audio API Synthesizer Alerts
```

---

## 🔒 Privacy First

- **Camera frames never leave your computer unless sent directly to your configured Gemini API key for analysis.**
- No raw images are permanently stored on servers.
- All session logs, goals, and skill tree levels are cached locally and synced securely to your personal account.

---

## 📄 License

MIT © [ShiNi-bot011](https://github.com/ShiNi-bot011)
