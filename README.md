# PloyDB

An AI-native CRM database prototype. Interactive table experience with Korra, an AI agent that works alongside you to filter, enrich, prioritize, and act on your data.

**Pure frontend, no backend.** All edits happen in-browser via React state. Page refresh resets to seed data. Deploys as a static site on Vercel.

## What It Does

- **Editable data grid** with 20 field types (text, number, currency, status, tags, email, phone, date, color, JSON, location, refs, and more)
- **Korra AI panel** that manipulates the same table you see — filters, sorts, adds columns, edits cells, drafts emails
- **Pre-scripted demo flow** (no API key needed) — click "Re-engage cold leads" to watch Korra work through a 9-step lead prioritization workflow
- **Cell-level attribution** — see which cells were edited by you vs Korra (sky/amber triangle indicators)
- **Lookup columns** that resolve linked data from related tables via API
- **Chain-of-thought reasoning** streamed in the chat panel

## Demo Flow

1. Click **"Re-engage cold leads"** on the home screen
2. Korra opens the Contacts table, filters to 130 stale leads
3. Links Industry + Company Size from the Companies table
4. Researches industry news, surfaces Legal sector insight
5. Adds a Priority column, scores all contacts, sorts by priority
6. Drafts personalized follow-up emails for High + Medium contacts

Every step is visible in the table and the chat panel simultaneously.

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (default style, Radix primitives) |
| Data Grid | tablecn / Dice UI data-grid |
| Table Engine | TanStack Table v8 |
| Virtualization | TanStack Virtual |
| Data | React useState + Faker (seed on mount, no persistence) |
| AI Chat | Vercel AI SDK (useChat, MockLanguageModelV3) |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/              # Next.js app router pages + API routes
  components/
    ai-elements/    # Vercel AI SDK UI components (chat, prompt input, reasoning)
    cells/          # 11 custom cell variants (currency, status, tags, etc.)
    data-grid/      # tablecn data grid (fully owned source)
    home/           # Home dashboard, data grid view, Korra chat panel
    korra/          # Tool result cards, AI panel components
    ui/             # shadcn/ui components (owned source)
  data/             # Seed data, column definitions, demo scripts
  hooks/            # useDataGrid, custom hooks
  lib/              # Utilities, AI tool schemas, tool handler
  types/            # TypeScript type definitions
```

## Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run lint      # ESLint
```

## License

Private project.
