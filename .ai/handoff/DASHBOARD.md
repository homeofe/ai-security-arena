# ai-security-arena: Build Dashboard

> Single source of truth for build health, test coverage, and pipeline state.
> Updated: 2026-03-18 12:00

---

## Components

| Name | Version | Build | Tests | Status | Notes |
|------|---------|-------|-------|--------|-------|
| Type definitions | 0.1.0 | ✅ | - | ✅ | Battle, Score, Model, Scenario, Prompt, CLI, Report types |
| Model registry | 0.1.0 | ✅ | - | ✅ | 8 models (Anthropic, OpenAI, Google, Grok) |
| Scenario library | 0.1.0 | ✅ | - | ✅ | 6 scenarios |
| Prompt library | 0.1.0 | ✅ | - | ✅ | 8 example prompts (4 red, 4 blue) |
| Scoring engine | 0.1.0 | ✅ | - | ✅ | Point-based |
| Arena controller | 0.1.0 | ✅ | - | ✅ | Supports mock/cli/api modes |
| CLI provider | 0.1.0 | ✅ | 30/30 ✅ | ✅ | claude/gemini/codex detection + execution |
| Prompt builder | 0.1.0 | ✅ | ✅ | ✅ | Red + Blue team prompt construction |
| Response parser | 0.1.0 | ✅ | ✅ | ✅ | Structured + fallback parsing |
| Report generator | 0.1.0 | ✅ | - | ✅ | Turning points, strategy analysis, timeline |
| Mock battle engine | 0.1.0 | ✅ | - | ✅ | Realistic cybersecurity events |
| Dashboard page | 0.1.0 | ✅ | - | ✅ | Hero, stats, scenario cards |
| Arena page | 0.1.0 | ✅ | - | ✅ | Setup + battle phases, provider toggle |
| Report page | 0.1.0 | ✅ | - | ✅ | Timeline, reasoning, strategy, turning points, export |
| API: cli-status | 0.1.0 | ✅ | - | ✅ | GET endpoint for CLI detection |
| API: battle | 0.1.0 | ✅ | - | ✅ | POST endpoint for CLI battle turns |
| ModelPicker | 0.1.0 | ✅ | - | ✅ | Card grid, provider icons, cost tiers |
| PromptEditor | 0.1.0 | ✅ | - | ✅ | Tabbed (examples/custom) |
| ScenarioSelector | 0.1.0 | ✅ | - | ✅ | Horizontal scroll, difficulty badges |
| BattleLog | 0.1.0 | ✅ | - | ✅ | Split-screen, auto-scroll, animations |
| BattleHeader | 0.1.0 | ✅ | - | ✅ | Round counter, timer, cost |
| ScoreBar | 0.1.0 | ✅ | - | ✅ | Animated red/blue progress |
| PhaseIcon | 0.1.0 | ✅ | - | ✅ | Color-coded phase badges |
| ReportHeader | 0.1.0 | ✅ | - | ✅ | Classified intel header + CLASSIFIED watermark |
| ScoreOverview | 0.1.0 | ✅ | - | ✅ | Large score display + percentage bar |
| ScoreChart | 0.1.0 | ✅ | - | ✅ | Pure CSS/SVG bar + line charts |
| DecisionTimeline | 0.1.0 | ✅ | - | ✅ | Vertical alternating timeline |
| ReasoningViewer | 0.1.0 | ✅ | - | ✅ | Expandable prompt/response per round |
| StrategyBreakdown | 0.1.0 | ✅ | - | ✅ | Side-by-side strategy analysis |
| TurningPoints | 0.1.0 | ✅ | - | ✅ | Momentum shift highlights |
| ExportButtons | 0.1.0 | ✅ | - | ✅ | JSON/PDF/share export |

**Legend:** ✅ passing | ❌ failing | 🔵 stub/mock | ⏳ pending | 🔴 blocked

---

## Test Coverage

| Suite | Tests | Status | Last Run |
|-------|-------|--------|----------|
| cli-provider | 30 | ✅ | 2026-03-18 |
| unit (other) | 0 | ⏳ | - |
| integration | 0 | ⏳ | - |
| e2e | 0 | ⏳ | - |

---

## Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Local dev (next dev) | ✅ | Port 3333 |
| Next.js build | ✅ | Clean |
| TypeScript strict | ✅ | tsc --noEmit passes |
| Docker | ⏳ | Not configured |
| Vercel | ⏳ | Not deployed |

---

## Pages

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Dashboard (hero, stats, scenarios) |
| `/arena` | ✅ | Battle setup + live battle view |
| `/report` | ✅ | Battle report (timeline, reasoning, strategy, export) |
| `/history` | ⏳ | Match history (not started) |
| `/leaderboard` | ⏳ | Model rankings (not started) |

---

## API Routes

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/cli-status` | GET | ✅ | Detect installed CLIs |
| `/api/battle` | POST | ✅ | Execute battle turn via CLI |
