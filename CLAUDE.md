# PloyDB — AI-Native CRM Database Prototype

@AGENTS.md
@PLAN.md

## Project Overview
A design project — fully interactive CRM table experience with AI agent (Korra) UI. Pure frontend, no backend, no database. Deploys to Vercel as a static site. All edits work in-browser via React state. Page refresh resets to Faker seed data.

## Tech Stack
- **Framework:** Next.js (App Router), static deploy to Vercel
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x (default shadcn theme — custom design system deferred)
- **Components:** shadcn/ui (**default** style, **Radix** primitives — NOT base-nova/Base UI)
- **Data Grid:** tablecn / Dice UI data-grid (`@diceui/data-grid`) — installed via shadcn registry, source files owned
- **Table Engine:** TanStack Table v8 (bundled inside tablecn's `useDataGrid` hook)
- **Virtualization:** TanStack Virtual (bundled inside tablecn)
- **Data:** React `useState` + @faker-js/faker — no persistence, refresh = reset
- **AI Chat:** Vercel AI SDK (`ai` package) — `useChat`, message rendering, tool calls
- **AI Model:** `MockLanguageModelV1` (demo, no API key) → `@ai-sdk/anthropic` (later, real Claude)
- **Icons:** Lucide React (`lucide-react`)
- **Dark Mode:** next-themes (class-based)
- **Animation:** Motion (Framer Motion) — cell transitions, micro-interactions

### Not Used
- No Zustand (React state is enough)
- No localStorage / persistence
- No real LLM API key needed (MockModel for demo, real Claude optional later)

## CRITICAL: shadcn Style = "default" (Radix)

tablecn data-grid requires Radix APIs (PopoverAnchor, SelectTrigger/Content/Item, CommandInput/List, etc.). `components.json` must have `"style": "default"`. Never use `base-nova`.

## Full UI Control

All tablecn and shadcn files are source code in your project, not npm packages:
- `src/components/data-grid/*.tsx` — cell variants, row renderer, column header. Add Motion animations freely.
- `src/components/ui/*.tsx` — all shadcn components. Modify freely.
- `src/hooks/use-data-grid.ts` — wraps TanStack Table. Full access to internals.

## Coding Conventions

### File Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Types/interfaces: `PascalCase`

### Import Alias
- `@/*` maps to `src/*`

### Component Rules
- **Server Components by default** — no `'use client'` unless needed
- **`'use client'` boundary as low as possible**
- Composition over inheritance

### Data Shape
- **Flat row objects** for tablecn: `{ _id: "1", companyName: "Acme", dealSize: 50000, ... }`
- NOT nested `{ id, data: { field: value } }`

### Styling Rules
- Default shadcn theme for now (custom design system later)
- Semantic tokens (`bg-primary`, `bg-muted`) not raw colors (`bg-blue-500`)
- `cn()` for conditional class merging
- `cva()` for component variants

### Code Quality
- Functions < 50 lines
- Files < 400 lines (800 max)
- No deep nesting (> 4 levels)

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Never commit secrets or .env files

## Quick Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
```
