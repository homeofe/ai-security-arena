# AI Security Arena

> Interactive web interface for AI-powered Red Team vs Blue Team security battles.
> Combines [ai-red-team](https://github.com/homeofe/ai-red-team) and [ai-blue-team](https://github.com/homeofe/ai-blue-team) in one place.

---

## Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.jpg)

### Arena Setup (Red Team vs Blue Team)
![Arena Setup](docs/screenshots/arena-setup.jpg)

### Battle Report (Post-Match Analysis)
![Battle Report](docs/screenshots/battle-report.jpg)

---

## Concept

```
┌──────────────────────────────────────────────────────────────┐
│                    AI SECURITY ARENA                         │
│                                                              │
│   ┌──────────────┐                    ┌──────────────┐      │
│   │   RED TEAM   │    ← sandbox →     │  BLUE TEAM   │      │
│   │  (Attacker)  │                    │  (Defender)   │      │
│   │              │    live battle     │              │      │
│   │  Model: ...  │ ←──────────────→  │  Model: ...  │      │
│   └──────────────┘                    └──────────────┘      │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │                  WEB INTERFACE                        │  │
│   │  - Model selection per team                          │  │
│   │  - Custom prompts + example library                  │  │
│   │  - Live battle log (WebSocket)                       │  │
│   │  - Scoreboard + leaderboard                          │  │
│   │  - Scenario builder                                  │  │
│   │  - Round-by-round replay                             │  │
│   │  - AAHP evolution tracker                            │  │
│   │  - Match export (JSON/PDF)                           │  │
│   └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Features

### Core
- **Model Selection:** Choose any LLM for each team (Claude, GPT, Gemini, Grok, local models)
- **Custom Prompts:** Write your own attack/defense strategies or use curated examples
- **Live Battle Log:** Real-time WebSocket stream, Red (left) vs Blue (right), every action timestamped
- **Scenario Builder:** Pick environments (web-server, database, cloud-infra, IoT) or create custom ones

### Scoring & History
- **Scoreboard:** Per-match scoring (attacks landed, attacks blocked, time to detect, etc.)
- **Leaderboard:** Which model pairs perform best? Historical rankings across all matches
- **Round-by-Round Replay:** Step through completed matches forensic-style

### Intelligence
- **AAHP Evolution Tracker:** Both teams self-improve via GitHub Issues. Track the evolution over time.
- **Match Export:** Download reports as JSON or PDF for documentation

### Safety
- **Sandbox Isolation:** All battles run in isolated sandboxes. Clear visual indicator.
- **Budget Limiter:** Cap API costs per match (both teams make LLM calls simultaneously)
- **Prompt Sanitization:** Custom prompts are validated to prevent sandbox escape

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15 (App Router, React Server Components) |
| Styling | Tailwind CSS |
| Realtime | WebSocket (ws) + Server-Sent Events fallback |
| Backend | Next.js API Routes + ai-red-team/ai-blue-team as libraries |
| Database | SQLite (via better-sqlite3) for match history |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm

### Installation

```bash
git clone https://github.com/homeofe/ai-security-arena.git
cd ai-security-arena
pnpm install
pnpm dev
```

Open http://localhost:3000

### Environment Variables

```env
# At least one LLM provider key required
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Optional: budget limit per match (USD)
MATCH_BUDGET_LIMIT=1.00
```

## Project Structure

```
ai-security-arena/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Landing / dashboard
│   │   ├── arena/
│   │   │   └── page.tsx      # Battle setup + live view
│   │   ├── history/
│   │   │   └── page.tsx      # Match history + replays
│   │   ├── leaderboard/
│   │   │   └── page.tsx      # Model rankings
│   │   └── api/
│   │       ├── battle/       # Start/stop battles
│   │       ├── ws/           # WebSocket endpoint
│   │       └── matches/      # Match CRUD
│   ├── components/
│   │   ├── BattleLog.tsx         # Split-screen live log
│   │   ├── BattleHeader.tsx      # Round counter, timer, cost
│   │   ├── ModelPicker.tsx       # Model selection per team
│   │   ├── PromptEditor.tsx      # Tabbed prompt editor (examples + custom)
│   │   ├── ScenarioSelector.tsx  # Horizontal scroll scenario cards
│   │   ├── ScoreBar.tsx          # Animated score comparison bar
│   │   ├── PhaseIcon.tsx         # Color-coded phase badges
│   │   ├── ReportHeader.tsx      # Classified intel briefing header
│   │   ├── ScoreOverview.tsx     # Large score display + stats
│   │   ├── ScoreChart.tsx        # Pure CSS/SVG bar + line charts
│   │   ├── DecisionTimeline.tsx  # Vertical alternating timeline
│   │   ├── ReasoningViewer.tsx   # Expandable LLM reasoning per round
│   │   ├── StrategyBreakdown.tsx # Side-by-side strategy analysis
│   │   ├── TurningPoints.tsx     # Momentum shift highlights
│   │   └── ExportButtons.tsx     # JSON/PDF/share export
│   ├── lib/
│   │   ├── arena.ts              # Arena controller (mock/cli/api modes)
│   │   ├── cli-provider.ts       # CLI-based LLM provider (claude/gemini/codex)
│   │   ├── prompt-builder.ts     # Battle prompt construction per round
│   │   ├── response-parser.ts    # Parse LLM responses into BattleEvents
│   │   ├── report-generator.ts   # Post-match analysis and report generation
│   │   ├── mock-battle.ts        # Realistic mock battle events
│   │   ├── models.ts             # Available model registry
│   │   ├── prompts.ts            # Example prompt library
│   │   ├── scenarios.ts          # Built-in scenarios
│   │   └── scoring.ts            # Scoring engine
│   └── types/
│       └── index.ts              # Shared type definitions
├── .ai/handoff/                  # AAHP protocol files
├── docs/screenshots/             # UI screenshots
├── package.json
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── vitest.config.ts
```

## Roadmap

| # | Feature | Status |
|---|---------|--------|
| 1 | Project setup (Next.js + Tailwind + dependencies) | ✅ Done |
| 2 | Model picker + scenario selector UI | ✅ Done |
| 3 | Arena controller (mock + CLI + API modes) | ✅ Done |
| 4 | Split-screen battle view (Red vs Blue) | ✅ Done |
| 5 | Scoring engine | ✅ Done |
| 6 | Custom prompt editor + example library | ✅ Done |
| 7 | CLI provider integration (claude/gemini/codex) | ✅ Done |
| 8 | Battle Report page (timeline, reasoning, strategy, export) | ✅ Done |
| 9 | Export (JSON/PDF) | ✅ Done |
| 10 | SSE real-time battle events | ✅ Done |
| 11 | ai-red-team SDK integration | ✅ Done |
| 12 | ai-blue-team SDK integration | ✅ Done |
| 13 | Match history + SQLite persistence | ✅ Done |
| 14 | Round-by-round replay viewer | ✅ Done |
| 15 | Leaderboard with model rankings | ✅ Done |
| 16 | Scenario builder | ✅ Done |
| 17 | Deployment (Docker + Vercel) | ✅ Done |

## License

Apache-2.0. Copyright 2026 Elvatis - Emre Kohler.

## Related Projects

- [ai-red-team](https://github.com/homeofe/ai-red-team) - Offensive security agent
- [ai-blue-team](https://github.com/homeofe/ai-blue-team) - Defensive security agent
- [AAHP](https://github.com/homeofe/AAHP) - Agent Handoff Protocol (self-evolution)
