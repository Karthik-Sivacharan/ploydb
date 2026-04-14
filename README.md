# PloyDB

An AI-native CRM database prototype. Interactive table experience with Korra, an AI agent that works alongside you to filter, enrich, prioritize, and act on your data.

**Live demo:** Deployed on Vercel (link shared separately)

## What It Does

- **Editable data grid** with 20 field types (text, number, currency, status, tags, email, phone, date, color, JSON, location, refs, and more)
- **Korra AI panel** that manipulates the same table you see — filters, sorts, adds columns, edits cells, drafts emails
- **Pre-scripted 14-step demo flow** — click "Re-engage cold leads" to watch Korra work through a lead prioritization workflow
- **Cell-level attribution** — see which cells were edited by you vs Korra (sky/amber triangle indicators)
- **Lookup columns** that resolve linked data from related tables via API
- **Chain-of-thought reasoning** streamed in the chat panel
- **960 real contacts** loaded from a Railway-hosted mock CRM database

## Demo Flow

1. Click **"Re-engage cold leads"** on the home screen
2. Korra opens the Contacts table (960 rows from Railway DB), filters to 130 stale leads
3. Links Industry + Company Size from the Companies table (lookup columns)
4. Researches industry news with chain-of-thought reasoning, surfaces Legal sector insight
5. Filters to 34 Legal contacts, adds a Priority column, scores all contacts
6. Pulls website visit data from Clearbit, sorts by priority
7. User can override priorities — Korra acknowledges the change
8. Drafts personalized follow-up emails using Claude API (Anthropic)
9. Generates personalized landing pages with Analytics data
10. Appends landing page links to emails
11. Prompts to connect Gmail for sending

Every step is visible in the table and the chat panel simultaneously.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/Karthik-Sivacharan/ploydb.git
cd ploydb/app
cp .env.example .env.local
# Add your keys to .env.local (see Environment Variables below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file in the `app/` directory:

```bash
# Required — Mock CRM database hosted on Railway (960 contacts + companies)
NEXT_PUBLIC_PLOYDB_API_URL=
NEXT_PUBLIC_PLOYDB_TOKEN=

# Optional — Claude API for email generation (step 8 of demo)
# Without this, template fallback emails are used instead
ANTHROPIC_API_KEY=

# Optional — Brand logos for connected sources section
# Without this, fallback icons are shown
NEXT_PUBLIC_BRANDFETCH_API_KEY=
```

| Variable | Required | What It Does | Without It |
|----------|:--------:|-------------|------------|
| `NEXT_PUBLIC_PLOYDB_API_URL` | Yes | Railway DB URL — loads 960 contacts for the demo | Falls back to Faker seed data (150 rows) |
| `NEXT_PUBLIC_PLOYDB_TOKEN` | Yes | JWT auth token for the Railway API | API calls fail, uses Faker fallback |
| `ANTHROPIC_API_KEY` | No | Claude Haiku — generates personalized emails | Template fallback emails (demo still works) |
| `NEXT_PUBLIC_BRANDFETCH_API_KEY` | No | Fetches brand logos (Sheets, Figma, Gmail) | Hardcoded CDN logos used instead |

> **Note:** The demo runs without any keys — it falls back to sample data and template emails. For the full 960-contact experience with real email generation, you need the Railway + Anthropic keys.

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 (OKLCH design tokens) |
| Components | shadcn/ui (default style, Radix primitives) |
| Data Grid | tablecn / Dice UI data-grid |
| Table Engine | TanStack Table v8 |
| Virtualization | TanStack Virtual |
| Data | Railway-hosted mock DB (API) + Faker fallback |
| AI Chat | Vercel AI SDK (useChat, MockLanguageModelV3 for demo) |
| AI Emails | Anthropic Claude Haiku (real API, optional) |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| Deployment | Vercel (static) |

## Project Structure

```
src/
  app/                          # Next.js pages + API routes
    api/chat/                   # Demo script streamer (MockModel, no API key)
    api/generate-emails/        # Real Claude email generation
  components/
    ui/                         # Atoms — shadcn/ui primitives (34 components)
    molecules/
      cells/                    # Cell renderers (status, currency, tags, ref, etc.)
      chat/                     # Chat elements (message, reasoning, shimmer, suggestion)
      tool-cards/               # AI tool result cards
    organisms/
      grid/                     # Data grid system (13 files)
      chat/                     # Chat panel + input area
      layout/                   # App sidebar, navbar
      dashboard/                # Home page, data grid view
  data/                         # Seed data, column definitions, demo scripts
  hooks/                        # useDataGrid, custom hooks
  lib/                          # Utilities, AI tools, motion system, API client
  types/                        # TypeScript type definitions
```

## Design Token System

Three-layer architecture: **Primitives → Semantics → Tailwind classes**.

All tokens in `src/app/globals.css`. See `src/components/DESIGN-TOKENS.md` for full reference.

- **Primitives:** neutral (white→1000→black), sky, green, red, amber, teal, emerald + alpha variants
- **Semantics:** core (background, primary, muted...), status (destructive, success, warning), identity (ai, user, lookup, source)
- **Enforcement:** Primitives not registered as Tailwind utilities — forces semantic-only usage

## Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run lint      # ESLint
```

## License

Private project.
