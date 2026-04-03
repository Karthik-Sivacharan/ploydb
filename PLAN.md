# PloyDB Prototype — Implementation Plan

## Overview

A **design project** — a fully interactive CRM table experience with AI agent (Korra) UI. Pure frontend, no backend, no database. Deploys to Vercel as a static site. All edits (cell editing, filtering, sorting, column ops) work in-browser via React state. Page refresh resets to seed data — that's intentional.

---

## Stack

| Layer | Tool | Purpose |
|---|---|---|
| Framework | Next.js (App Router) | App scaffold, static deploy to Vercel |
| Styling | Tailwind CSS 4.x | Default shadcn theme (custom design system later) |
| Components | shadcn/ui (**default** style, **Radix** primitives) | All UI primitives — fully owned source files |
| Data Grid | tablecn data-grid (`@diceui/data-grid`) | Editable spreadsheet grid — 9 built-in cell types, filtering, sorting, column ops, keyboard nav, copy/paste, undo/redo |
| Table Engine | TanStack Table v8 | Headless table state (bundled inside tablecn's `useDataGrid` hook) |
| Virtualization | TanStack Virtual | Row virtualization for 150+ rows (bundled inside tablecn) |
| Data | React `useState` + @faker-js/faker | Seed data on page load, all edits in-memory, refresh = reset |
| AI Chat UI | Vercel AI SDK (`ai` package) | Chat panel infrastructure — `useChat`, message rendering, tool call display |
| AI Model (demo) | `MockLanguageModelV1` from `ai/test` | Pre-scripted Korra responses, no API key needed |
| AI Model (later) | `@ai-sdk/anthropic` (optional) | Swap mock for real Claude API when ready |
| Icons | Lucide React | All icons |
| Dark Mode | next-themes (class-based) | Light/dark toggle |
| Animation | Motion (Framer Motion) | Cell transitions, micro-interactions, panel animations |

### What We Don't Use

- ~~Zustand~~ — no store needed, React state is enough
- ~~localStorage / persist~~ — no persistence, refresh = reset
- ~~Audit logging~~ — no tracking
- ~~dnd-kit~~ — tablecn handles column reorder; kanban is a stretch goal

---

## CRITICAL: shadcn Must Use "default" Style (Radix)

tablecn data-grid requires **Radix** primitive APIs: `PopoverAnchor`, `SelectTrigger`/`SelectContent`/`SelectItem`, `CommandInput`/`CommandList`, `DropdownMenuTrigger`/`DropdownMenuContent`, etc.

- **DO** use `"style": "default"` in `components.json`
- **DO NOT** use `"style": "base-nova"` (Base UI) — it has incompatible APIs

---

## Full UI Control

All code is **your source files**, not npm dependencies:

- `src/components/data-grid/*.tsx` — every cell variant, row renderer, column header. Add Motion animations, custom hover effects, transition states.
- `src/components/ui/*.tsx` — all shadcn components (popovers, dialogs, dropdowns). Modify freely.
- `src/hooks/use-data-grid.ts` — the main hook wrapping TanStack Table. Full access to table internals.

**Nothing is locked.** Want a glow animation when a cell enters edit mode? Edit `data-grid-cell-wrapper.tsx`. Want rows to animate in/out on filter? Wrap row renderer in `<motion.div>`. Want custom spring transitions on status badge changes? Edit the cell variant directly.

---

## Bootstrap from Scratch

### Step 0 — Create Next.js App

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

### Step 1 — Initialize shadcn/ui (default/Radix style)

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default** (Radix primitives — NOT base-nova)
- Base color: **Neutral**
- CSS variables: **Yes**

### Step 2 — Install shadcn components needed by tablecn

```bash
npx shadcn@latest add badge button calendar checkbox command dialog dropdown-menu input popover scroll-area select separator skeleton textarea tooltip
```

### Step 3 — Install tablecn data-grid

```bash
npx shadcn@latest add https://diceui.com/r/data-grid.json
```

This copies source files into your project. Verify these exist:
- `src/components/data-grid/data-grid.tsx`
- `src/components/data-grid/data-grid-cell-variants.tsx`
- `src/hooks/use-data-grid.ts`
- `src/lib/data-grid.ts`
- `src/types/data-grid.ts`

**Post-install fix:** Data-grid files may import from a barrel like `@/components/data-grid/data-grid`. Fix these to:
- Functions → `@/lib/data-grid`
- Types → `@/types/data-grid`

### Step 4 — Install remaining dependencies

```bash
npm install ai @ai-sdk/anthropic @faker-js/faker date-fns lucide-react next-themes motion class-variance-authority clsx tailwind-merge zod
```

Note: `ai` is the Vercel AI SDK (chat UI, useChat, MockModel). `@ai-sdk/anthropic` is optional for later real AI. `zod` is needed for AI SDK tool schemas.

### Step 5 — Install additional shadcn components

```bash
npx shadcn@latest add card sheet tabs table toggle switch label
```

### Step 6 — Verify data-grid renders

Create a minimal page with hardcoded sample data. Should look like https://tablecn.com/data-grid-live.

---

## Data Approach (No Persistence)

```tsx
// page.tsx (client component)
const [data, setData] = useState(() => generateSeedData())  // Faker runs once on mount
```

- `generateSeedData()` creates 150 flat row objects using Faker
- `setData` is passed to data-grid callbacks for edits
- Page refresh = `generateSeedData()` runs again = fresh data
- No Zustand, no localStorage, no API

### Data Shape (flat rows for tablecn)

```ts
{
  _id: "row-1",
  companyName: "Acme Corp",
  contactName: "Jane Smith",
  dealSize: 50000,
  status: "qualified",
  email: "jane@acme.com",
  // ... all fields at top level
}
```

---

## What tablecn Data Grid Gives Us for Free

### Built-in Cell Types (9 of 20)

| tablecn Variant | PloyDB Field Type | Edit Widget |
|---|---|---|
| `short-text` | text | contentEditable with auto-focus |
| `long-text` | rich_text | Multi-line textarea popover |
| `number` | number | Numeric input with min/max/step |
| `select` | select | Single-select dropdown |
| `multi-select` | multi_select | Multi-select with badge overflow |
| `checkbox` | checkbox | Boolean toggle |
| `date` | date | Calendar popover picker |
| `url` | url | URL input with link detection |
| `file` | (bonus) | File upload with drag-and-drop |

### Built-in Features

- [x] Inline cell editing with click-to-edit
- [x] Keyboard navigation (Tab, Enter, Escape, arrow keys)
- [x] Copy/paste with TSV parsing (paste from Excel/Sheets works)
- [x] Undo/redo
- [x] Column resizing, reordering, pinning, visibility toggle
- [x] Rich filtering with type-aware operators
- [x] Multi-column sorting
- [x] Search across all cells with match navigation
- [x] Row virtualization (TanStack Virtual)
- [x] Context menu (right-click)
- [x] Row selection with checkboxes
- [x] Cell selection (click, shift-click, drag)

### Programmatic API (for Korra AI panel)

`useDataGrid` returns both a TanStack Table `table` instance and a `tableMeta` object. Korra's tool calls use these to manipulate the grid:

```ts
const { table, tableMeta, ...dataGridProps } = useDataGrid({ data, columns, onDataChange: setData });

// Edit cells (single or batch)
tableMeta.onDataUpdate({ rowIndex: 2, columnId: "status", value: "qualified" });
tableMeta.onDataUpdate([
  { rowIndex: 0, columnId: "website", value: "https://acme.com" },
  { rowIndex: 1, columnId: "employeeCount", value: 250 },
]);

// Add rows
setData(prev => [...prev, { _id: generateId(), companyName: "New Lead", ...defaults }]);

// Delete rows
tableMeta.onRowsDelete?.([1, 3]);  // by index

// Filter
table.setColumnFilters([{ id: "status", value: "qualified" }]);
table.setColumnFilters([]);  // clear

// Sort
table.setSorting([{ id: "dealSize", desc: true }]);

// Select rows
table.setRowSelection({ "row-1": true, "row-5": true });
table.toggleAllRowsSelected(true);  // select all
```

### Column Definition Pattern

```ts
{
  id: "companyName",
  accessorKey: "companyName",
  meta: {
    label: "Company Name",
    cell: { variant: "short-text" }
  }
}
```

For select variants with options:
```ts
meta: {
  label: "Status",
  cell: {
    variant: "select",
    options: [
      { value: "new", label: "New", icon: CircleIcon },
      { value: "qualified", label: "Qualified", icon: CheckCircleIcon },
    ]
  }
}
```

---

## What We Still Build

### 11 Custom Cell Variants

| PloyDB Field | Based On | What We Add |
|---|---|---|
| `currency` | `number` | $ prefix, comma formatting, 2 decimal places |
| `percent` | `number` | % suffix, 0-100 range |
| `status` | `select` | Colored dot + colored badge (pipeline stages) |
| `tags` | `multi-select` | Subtle badge styling + "Add tag" input |
| `datetime` | `date` | Time picker alongside calendar |
| `email` | `short-text` | Mailto link in display mode |
| `phone` | `short-text` | Tel link + formatting in display mode |
| `color` | New | Color swatch + preset grid popover |
| `json` | `long-text` | Collapsed preview + JSON validation |
| `location` | `short-text` | City/country text (simplified) |
| `ref` | New | Record badge + Combobox searching linked table |
| `refs` | New | Multiple badges + multi-select Combobox |

To add custom variants: extend switch in `data-grid-cell.tsx` and `CellOpts` union in `types/data-grid.ts`.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  React State (useState in page component)        │
│                                                  │
│  data: FlatRow[]     — all rows                  │
│  columns: ColumnDef[] — field definitions        │
│                                                  │
│  Faker generates seed data on mount              │
│  setData updates rows from grid callbacks        │
│  Page refresh = fresh seed data                  │
└────────────────┬────────────────┬────────────────┘
                 │                │
          reads/writes     reads/writes
                 │                │
    ┌────────────▼──────┐  ┌─────▼──────────────┐
    │   tablecn          │  │   Korra Panel       │
    │   Data Grid        │  │   (Vercel AI SDK)   │
    │                    │  │                     │
    │   TanStack Table   │  │   useChat() +       │
    │   table instance   │  │   MockModel (demo)  │
    │   + tableMeta      │  │   or Claude (later) │
    │   + cell variants  │  │                     │
    │   + all grid ops   │  │   onToolCall →      │
    │                    │  │   table/tableMeta    │
    │                    │  │   programmatic API   │
    └────────────────────┘  └─────────────────────┘
```

### How Korra Manipulates the Grid

Korra's tool calls bridge the AI chat panel to the data grid via the programmatic API:

```tsx
// In page component — pass these to Korra panel
const { table, tableMeta, ...dataGridProps } = useDataGrid({ ... });

// In Korra panel — onToolCall handler
function handleToolCall(toolCall) {
  switch (toolCall.name) {
    case "editCells":
      tableMeta.onDataUpdate(toolCall.args.updates);  // batch CellUpdate[]
      break;
    case "filterBy":
      table.setColumnFilters(toolCall.args.filters);
      break;
    case "sortBy":
      table.setSorting(toolCall.args.sorts);
      break;
    case "deleteRows":
      tableMeta.onRowsDelete?.(toolCall.args.rowIndices);
      break;
    case "addRow":
      setData(prev => [...prev, { _id: generateId(), ...toolCall.args.data }]);
      break;
  }
}
```

---

## Phase 1: Foundation

### 1.1 — Scaffold
- [ ] Create Next.js app with `create-next-app`
- [ ] Init shadcn/ui with **default** style (**Radix** primitives)
- [ ] Install shadcn components needed by tablecn
- [ ] Install tablecn data-grid via registry
- [ ] Fix any import path issues in data-grid files
- [ ] Install remaining deps (faker, date-fns, lucide, next-themes, motion, cva, clsx, tailwind-merge)
- [ ] Install additional shadcn components

### 1.2 — Seed Data
- [ ] `generateSeedData()` function using Faker
- [ ] 150 flat row objects for "Sales Pipeline" with fields:
  - text: Company Name, Contact Name, Notes
  - rich_text: Description
  - number: Employee Count
  - currency: Deal Size
  - percent: Win Probability
  - select: Lead Source (Referral, Website, Cold Call, Event, Partner)
  - multi_select: Industries (SaaS, Fintech, Healthcare, E-commerce, AI/ML)
  - status: Stage (New → Contacted → Qualified → Proposal → Negotiation → Won → Lost)
  - tags: Labels (Hot Lead, Follow Up, Enterprise, SMB, Startup)
  - date: Last Contacted
  - datetime: Next Follow Up
  - email: Contact Email
  - phone: Contact Phone
  - url: Website
  - color: Account Color
  - json: Custom Metadata
  - location: Company HQ
  - checkbox: Has NDA, Verified
  - ref: Assigned To (→ Team Members)
  - refs: Related Deals
- [ ] 5-8 hand-tuned hero rows for demos
- [ ] Weighted status distribution (40% New, 25% Contacted, 15% Qualified, etc.)

### 1.3 — Wire Data Grid
- [ ] `useState(() => generateSeedData())` in page component
- [ ] Map fields to column definitions with `meta.cell.variant`
- [ ] Pass data + columns to `useDataGrid` hook + `<DataGrid>` component
- [ ] Wire `onDataChange` → `setData`
- [ ] Verify it looks and behaves like https://tablecn.com/data-grid-live
- [ ] Verify inline editing, keyboard nav, copy/paste, filtering, sorting all work

---

## Phase 2: Custom Cell Types (11 remaining)

### 2.1 — Number Variants
- [ ] `currency` — $ + commas display, plain number edit
- [ ] `percent` — % suffix display, 0-100 edit

### 2.2 — Choice Variants
- [ ] `status` — colored dot + badge
- [ ] `tags` — subtle badges + "Add tag"

### 2.3 — Date Variant
- [ ] `datetime` — calendar + time picker

### 2.4 — Contact Variants
- [ ] `email` — mailto link display
- [ ] `phone` — tel link + formatting

### 2.5 — New Cell Types
- [ ] `color` — swatch + color grid popover
- [ ] `json` — collapsed preview + validated textarea
- [ ] `location` — text input
- [ ] `ref` — badge + Combobox
- [ ] `refs` — multi-badge + multi-Combobox

### 2.6 — Register All
- [ ] Extend `CellOpts` in `types/data-grid.ts`
- [ ] Add cases in `data-grid-cell.tsx`

---

## Phase 3: Column Operations

- [ ] Column header dropdown menu (sort, filter, hide, rename, delete, pin, change type)
- [ ] "+" button to add column with field type picker

---

## Phase 4: Row Operations

- [ ] "+" button to add row
- [ ] Floating bulk action bar (delete, update, duplicate)
- [ ] Row detail panel (shadcn Sheet, vertical form, navigate between rows)
- [ ] Extended context menu (expand, duplicate, copy, delete)

---

## Phase 5: Views + Grouping

- [ ] Group by field → collapsible sections
- [ ] Saved views tab bar (All Leads, My Pipeline, Hot Leads)

---

## Phase 6: Search + Command Palette

- [ ] tablecn built-in search (customize styling)
- [ ] Cmd+K command palette (quick filters, sort, views, actions)

---

## Phase 7: Korra AI Panel

Uses Vercel AI SDK for the chat infrastructure. Starts with `MockLanguageModelV1` (no API key), can swap to real Claude later.

### 7.1 — Chat UI (Vercel AI SDK)
- [ ] Install `ai` package, set up `useChat` hook
- [ ] Right side panel (collapsible, resizable)
- [ ] Chat message list with streaming text rendering
- [ ] Tool call results rendered as custom components in chat
- [ ] Korra avatar + typing indicator
- [ ] Input area with send button

### 7.2 — API Route + Mock Model
- [ ] `app/api/chat/route.ts` — Vercel AI SDK route handler
- [ ] Use `MockLanguageModelV1` from `ai/test` for pre-scripted responses
- [ ] No API key needed — works on Vercel static deploy
- [ ] Later: swap `MockLanguageModelV1` for `@ai-sdk/anthropic` with `ANTHROPIC_API_KEY`

### 7.3 — Tool Definitions (Zod schemas)
- [ ] `editCells` — `{ updates: CellUpdate[] }` → `tableMeta.onDataUpdate()`
- [ ] `addRow` — `{ data: Record<string, unknown> }` → `setData(prev => [...prev, newRow])`
- [ ] `deleteRows` — `{ rowIndices: number[] }` → `tableMeta.onRowsDelete()`
- [ ] `filterBy` — `{ filters: ColumnFilter[] }` → `table.setColumnFilters()`
- [ ] `sortBy` — `{ sorts: SortingState }` → `table.setSorting()`
- [ ] `selectRows` — `{ rowIds: string[] }` → `table.setRowSelection()`
- [ ] `clearFilters` — `{}` → `table.setColumnFilters([])`

### 7.4 — Pre-Scripted Demo Flows (Mock Recipes)
- [ ] `demo-scripts.ts` — recipe file with scripted sequences:
  - **"enrich leads"** → Korra streams "I'll enrich your pipeline data..." → tool call: `editCells` batch updating website, employee count on 5 rows → result card: "Updated 5 leads"
  - **"show hot leads"** → Korra: "Filtering to hot leads..." → tool call: `filterBy` tags contains "Hot Lead" → result card: filter badge
  - **"sort by deal size"** → Korra: "Sorting by deal size..." → tool call: `sortBy` dealSize desc → result card: sort indicator
  - **"qualify stale leads"** → Korra: "Finding stale leads..." → tool call: `editCells` updating status on leads with old lastContacted → result card: "Qualified 3 leads"
  - **"summarize pipeline"** → Korra streams a text summary of deal count/value by stage (no tool call, just text)
- [ ] Each recipe: trigger keyword → mock model response with streaming text + tool calls → `onToolCall` handler calls programmatic API

### 7.5 — AI Trust Signals
- [ ] Sparkle icon on AI-modified cells
- [ ] Subtle tint on touched rows
- [ ] Accept/revert on hover

---

## Phase 8: Board View (Kanban) — Stretch Goal

- [ ] Table/Board toggle
- [ ] Columns = status values, cards = rows
- [ ] Drag between columns → updates status in state

---

## Phase 9: Polish

- [ ] Loading skeletons, empty states
- [ ] Row count footer
- [ ] Keyboard shortcuts help
- [ ] Motion animations (cell edit glow, row add/delete, filter transitions)
- [ ] "Reset data" button
- [ ] Dark mode toggle

---

## Parallel Worktree Strategy

| Worktree | Phases | Dependencies |
|---|---|---|
| **A: Foundation** | 1.1–1.3 | None (do this first) |
| **B: Custom Cell Types** | 2.1–2.6 | Phase 1 |
| **C: Column + Row Ops** | 3, 4 | Phase 1 |
| **D: Views + Grouping** | 5 | Phase 1 |
| **E: Search + Cmd Palette** | 6 | Phase 1 |
| **F: Korra Panel** | 7 | Phase 1 + Phase 2 |
| **G: Polish** | 9 | Everything |

Phase 1 first. Then B–F in parallel. G last.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                # ThemeProvider, fonts
│   ├── page.tsx                  # Main page — useState + DataGrid + Korra panel
│   ├── globals.css               # Default shadcn theme
│   └── api/
│       └── chat/
│           └── route.ts          # Vercel AI SDK route — MockModel or Claude
│
├── components/
│   ├── ui/                       # shadcn/ui (Radix-based, your files)
│   │
│   ├── data-grid/                # tablecn data-grid (your files, full control)
│   │   ├── data-grid.tsx
│   │   ├── data-grid-cell-variants.tsx   # 9 built-in + extend with custom
│   │   ├── data-grid-cell-wrapper.tsx    # Add animations here
│   │   ├── data-grid-cell.tsx            # Cell variant switch
│   │   ├── data-grid-column-header.tsx
│   │   ├── data-grid-context-menu.tsx
│   │   ├── data-grid-paste-dialog.tsx
│   │   ├── data-grid-row.tsx             # Add row animations here
│   │   └── data-grid-search.tsx
│   │
│   ├── cells/                    # 11 custom cell variants
│   ├── table/                    # Toolbar, add-column, bulk-actions
│   ├── row-detail/               # Row detail sheet
│   ├── korra/                    # AI panel (Vercel AI SDK)
│   │   ├── korra-panel.tsx       # Collapsible right panel shell
│   │   ├── chat-messages.tsx     # Message list with streaming
│   │   └── tool-results.tsx      # Custom components for tool call results
│   └── board/                    # Kanban (stretch)
│
├── hooks/
│   └── use-data-grid.ts          # tablecn hook (wraps TanStack Table)
│
├── data/
│   ├── seed.ts                   # generateSeedData() — Faker
│   ├── columns.ts                # Column definitions with meta.cell.variant
│   ├── hero-rows.ts              # Hand-crafted demo rows
│   └── demo-scripts.ts           # Pre-scripted Korra demo flows (mock recipes)
│
├── lib/
│   ├── utils.ts                  # cn() helper
│   ├── data-grid.ts              # tablecn utilities
│   └── ai-tools.ts              # Zod tool schemas for Korra (editCells, filterBy, etc.)
│
└── types/
    └── data-grid.ts              # tablecn types + custom CellOpts extensions
```
