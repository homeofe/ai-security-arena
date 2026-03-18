# ai-security-arena: Current State of the Nation

> Last updated: 2026-03-18 by Akido (initial setup)
> Commit: 5c0582d
>
> **Rule:** This file is rewritten (not appended) at the end of every session.

---

## Build Health

| Check | Result | Notes |
|-------|--------|-------|
| `build` | ⏳ | Next.js scaffolded, not yet buildable (pages in progress) |
| `test` | ⏳ | Vitest configured, no tests written yet |
| `lint` | ⏳ | ESLint configured via next |
| `type-check` | ⏳ | TypeScript strict, types defined |

---

## Components

| Component | Status | Notes |
|-----------|--------|-------|
| Type definitions | ✅ Done | `src/types/index.ts`, all battle/model/scenario types |
| Model registry | ✅ Done | 8 models (Anthropic, OpenAI, Google, Grok) |
| Scenario library | ✅ Done | 6 scenarios (web, network, cloud, IoT, API, k8s) |
| Prompt library | ✅ Done | 8 example prompts (4 red, 4 blue) |
| Scoring engine | ✅ Done | Point system for attacks/detections |
| Arena controller | ✅ Done | Placeholder, needs ai-red/blue-team integration |
| Dashboard page | ✅ Done | Hero, stats, scenario cards |
| Arena page | 🔧 In Progress | Subagent building setup + battle UI |
| Mock battle system | 🔧 In Progress | Realistic fake events for demo |
| WebSocket server | ⏳ Not started | For real-time event streaming |
| History page | ⏳ Not started | Match history + SQLite |
| Leaderboard page | ⏳ Not started | Model rankings |
| Replay viewer | ⏳ Not started | Step-by-step match replay |
| Red Team integration | ⏳ Not started | Import ai-red-team as lib |
| Blue Team integration | ⏳ Not started | Import ai-blue-team as lib |

---

## Current Focus

Arena page UI (futuristic design, split-screen battle log, model picker, prompt editor, scenario selector). Being built by a subagent on Opus 4.6.

## Dependencies

- [ai-red-team](https://github.com/homeofe/ai-red-team): Offensive security agent (SDK mode available)
- [ai-blue-team](https://github.com/homeofe/ai-blue-team): Defensive security agent (SDK mode available)
- [AAHP](https://github.com/homeofe/AAHP): Agent Handoff Protocol for self-evolution tracking
