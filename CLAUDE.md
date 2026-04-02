# PloyDB — AI-Native CRM Database Prototype

@AGENTS.md
@PLAN.md

## Project Overview
A fully interactive CRM table experience with AI agent (Korra) integration. Frontend-only prototype — data persists via Zustand + localStorage. Features inline cell editing (20 field types), filter/sort/group builders, saved views, kanban board, and an AI panel that mutates table state via tool calls.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x with OKLCH design tokens
- **Components:** shadcn/ui (base-nova style, Base UI primitives)
- **Table Engine:** TanStack Table v8 (headless)
- **Data Store:** Zustand + persist middleware (localStorage)
- **Mock Data:** @faker-js/faker
- **AI Chat:** Vercel AI SDK (`useChat`)
- **Drag & Drop:** dnd-kit
- **Icons:** Lucide (`lucide-react`) for shadcn defaults + Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`) for custom UI
- **Dark Mode:** next-themes (class-based)
- **Variants:** class-variance-authority (cva)
- **Animation:** Motion (Framer Motion)
- **Fonts:** Clash Grotesk (brand) + Geist Mono (code)

## Design System
This project shares the Ploy design token system. All tokens are in `src/app/globals.css`:
- **Colors:** OKLch color space, 11-step scales (purple, neutral, green, red, amber)
- **Semantic tokens:** Light/dark mode via CSS custom properties
- **Glass effects:** Surface translucency, backdrop blurs, glow shadows
- **Motion:** Duration + easing tokens
- **Typography:** Caption through heading-xl scale
- **Radius:** Derived from base `--radius` variable

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
- Composition over inheritance (Card/CardHeader/CardBody pattern)

### State Management
- Zustand for all shared state (rows, schema, filters, sorts, views, audit log)
- Every mutation logs to auditLog[] with `{ who: 'human' | 'korra', action, timestamp, diff }`
- Never mutate state — always create new copies

### Styling Rules
- **Never use raw Tailwind colors** (e.g., `bg-blue-500`) — always semantic tokens (`bg-primary`, `bg-muted`)
- Use CSS variables for all design tokens
- Use `cn()` utility for conditional class merging
- Use `cva()` for component variants

### Icons
- Lucide for shadcn/ui component internals (configured in components.json)
- Hugeicons for custom UI elements and feature icons
- All custom icons registered in a central icon registry

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
