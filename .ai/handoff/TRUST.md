# ai-security-arena: Trust Register

> Tracks verification status of critical system properties.
> Every claim here has a confidence level tied to how it was verified.

---

## Confidence Levels

| Level | Meaning |
|-------|---------|
| **verified** | Agent executed code, ran tests, or observed output to confirm |
| **assumed** | Derived from docs or config, not directly tested |
| **untested** | Status unknown, needs verification |

---

## Build System

| Property | Status | Last Verified | Agent | Notes |
|----------|--------|---------------|-------|-------|
| `next build` passes | untested | - | - | Pages still being built |
| `vitest run` passes | untested | - | - | No tests written yet |
| `tsc --noEmit` passes | assumed | 2026-03-18 | akido | Types compile, not fully verified |

---

## Core Libraries

| Property | Status | Last Verified | Agent | Notes |
|----------|--------|---------------|-------|-------|
| Models registry exports correctly | verified | 2026-03-18 | akido | Used in dashboard page |
| Scenarios registry exports correctly | verified | 2026-03-18 | akido | Used in dashboard page |
| Prompts registry exports correctly | assumed | 2026-03-18 | akido | Defined, not yet consumed |
| Scoring engine calculates correctly | assumed | 2026-03-18 | akido | Logic defined, no test coverage |
| ArenaController orchestrates battle | untested | - | - | Placeholder implementation |

---

## Integrations

| Property | Status | Last Verified | Agent | Notes |
|----------|--------|---------------|-------|-------|
| ai-red-team imports as library | untested | - | - | Not yet added as dependency |
| ai-blue-team imports as library | untested | - | - | Not yet added as dependency |
| WebSocket streams events | untested | - | - | Not implemented |
| SQLite stores match history | untested | - | - | Not implemented |

---

## Security

| Property | Status | Last Verified | Agent | Notes |
|----------|--------|---------------|-------|-------|
| Custom prompts are sanitized | untested | - | - | Prompt injection prevention needed |
| Battles run in sandbox | untested | - | - | Depends on ai-red/blue-team sandbox |
| No API keys leak to client | assumed | 2026-03-18 | akido | Keys in .env, server-side only |
