# PloyDB — AI-Native CRM Database Prototype

@AGENTS.md
@PLAN.md

## Project Overview
A fully interactive CRM table experience with AI agent (Korra) integration. Frontend-only prototype — data persists via Zustand + localStorage. Features inline cell editing (20 field types), filter/sort/group builders, saved views, kanban board, and an AI panel that mutates table state via tool calls.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x (default shadcn theme — custom design system deferred)
- **Components:** shadcn/ui (**default** style, Radix primitives — NOT base-nova)
- **Data Grid:** tablecn / Dice UI data-grid (`@diceui/data-grid`) — installed via shadcn registry
- **Table Engine:** TanStack Table v8 (bundled inside tablecn)
- **Data Store:** Zustand + persist middleware (localStorage)
- **Mock Data:** @faker-js/faker
- **AI Chat:** Vercel AI SDK (`useChat`)
- **Icons:** Lucide React (`lucide-react`)
- **Dark Mode:** next-themes (class-based)
- **Variants:** class-variance-authority (cva)
- **Animation:** Motion (Framer Motion)

## CRITICAL: shadcn Style Must Be "default" (Radix)

The tablecn data-grid requires Radix primitive APIs (PopoverAnchor, SelectTrigger/Content/Item, CommandInput/List, DropdownMenuTrigger/Content, etc.). Do NOT use `base-nova` style. When initializing shadcn, choose **default** style. The `components.json` must have `"style": "default"`.

## Coding Conventions

### File Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Types/interfaces: `PascalCase`

### Import Alias
- `@/*` maps to `src/*`

### Component Rules
- **Server Components by default** — no `'use client'` unless needed for interactivity
- **`'use client'` boundary as low as possible** — keep it on leaf components
- Composition over inheritance

### State Management
- Zustand for all shared state (rows, schema, filters, sorts, views, audit log)
- Every mutation logs to auditLog[] with `{ who: 'human' | 'korra', action, timestamp, diff }`
- Never mutate state — always create new copies
- **Rows must be flat objects** (not nested `{ id, data: {} }`) for tablecn compatibility

### Styling Rules
- Use default shadcn theme for now (custom design system deferred to later phase)
- Use semantic tokens (`bg-primary`, `bg-muted`) not raw colors (`bg-blue-500`)
- Use `cn()` utility for conditional class merging
- Use `cva()` for component variants

### Code Quality
- Functions < 50 lines
- Files < 400 lines (800 max)
- No deep nesting (> 4 levels)
- No hardcoded values — use constants or tokens

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Never commit secrets or .env files

## Quick Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
```
