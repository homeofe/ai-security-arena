# ai-security-arena: Development Workflow

> Based on the [AAHP Protocol](https://github.com/homeofe/AAHP).
> This project combines ai-red-team and ai-blue-team into a web interface.

---

## How This Project Develops

### 1. Task Execution (AAHP Standard)
```
Agent reads MANIFEST.json -> picks top "ready" task -> implements it -> updates handoff files -> commits
```

### 2. Integration Pattern
```
Arena imports ai-red-team SDK -> Arena imports ai-blue-team SDK -> Arena orchestrates battles via ArenaController
```

### 3. UI Development Loop
```
Design component -> Implement in TSX -> Style with Tailwind -> Test with mock data -> Replace mock with real integration
```

---

## Agent Roles

| Phase | What the Agent Does |
|-------|-------------------|
| UI Build | Creates React components, pages, and styles |
| Integration | Wires up ai-red-team and ai-blue-team SDKs |
| Testing | Writes Vitest tests for components and logic |
| DevOps | Docker, CI/CD, deployment configuration |

---

## Architecture Decisions

### Frontend Only (no separate backend)
The Arena runs as a Next.js app. API routes handle battle orchestration server-side.
No separate Express/Fastify server needed. WebSocket via Next.js custom server or API route upgrade.

### Mock-First Development
Every feature is built with mock data first, then real integration added.
This allows UI work to proceed independently of ai-red-team/ai-blue-team changes.

### No External Component Libraries
Pure Tailwind CSS + custom styles. No shadcn, MUI, or Chakra.
Reason: full control over the futuristic/cyberpunk aesthetic. No dependency bloat.

### SQLite for Persistence
Match history stored locally in SQLite via better-sqlite3.
No cloud database dependency. Portable. Fast.

---

## File Conventions

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js pages (App Router) |
| `src/components/` | Reusable React components |
| `src/lib/` | Business logic, data, utilities |
| `src/types/` | TypeScript type definitions |
| `.ai/handoff/` | AAHP handoff files |
| `public/` | Static assets |
