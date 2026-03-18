# ai-security-arena: Agent Conventions

> Every agent working on this project must read and follow these conventions.
> Update this file whenever a new standard is established.

---

## The Three Laws

> **First Law:** A robot may not injure a human being or, through inaction, allow a human being to come to harm.
> **Second Law:** A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.
> **Third Law:** A robot must protect its own existence as long as such protection does not conflict with the First or Second Laws.

**Do no damage** is the highest rule. This is a security tool for learning and testing. Never facilitate real attacks.

---

## Language

- All code, comments, commits, and documentation in **English only**
- No em dashes anywhere (use commas, periods, colons, parentheses)

## Code Style

- **TypeScript:** strict mode, no `any` types
- **React:** functional components only, hooks for state
- **CSS:** Tailwind utility classes only, custom CSS in globals.css
- **No external component libraries** (no shadcn, MUI, Chakra, Radix)
- **No external icon libraries** (use emoji or inline SVG)
- **Formatting:** Prettier defaults (2-space indent, semicolons, single quotes)

## Design System

- **Dark theme only** (gray-950 base)
- **Red Team:** red-500/red-600 accents
- **Blue Team:** blue-500/blue-600 accents
- **Neutral:** gray-800/gray-700 borders
- **Glass-morphism:** backdrop-blur + semi-transparent backgrounds
- **Monospace:** JetBrains Mono or system monospace for battle logs

## Branching and Commits

```
feat/<scope>-<short-name>    -> new feature
fix/<scope>-<short-name>     -> bug fix
docs/<scope>-<short-name>    -> documentation only
chore/<scope>-<short-name>   -> tooling, deps, cleanup
```

Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`, `docs:`).

## File Organization

| Location | Purpose |
|----------|---------|
| `src/app/` | Next.js pages |
| `src/components/` | Reusable UI components |
| `src/lib/` | Business logic and data |
| `src/types/` | TypeScript types |
| `.ai/handoff/` | AAHP protocol files |

## Testing

- Vitest for all tests
- Test files: `*.test.ts` or `*.test.tsx` colocated with source
- Mock external dependencies (LLM calls, WebSocket)

## Security Rules

- All battles run in sandboxes (never execute real attacks)
- API keys server-side only (never expose to client)
- Custom prompts must be sanitized before passing to LLMs
- Clear "sandbox" indicators in the UI at all times
