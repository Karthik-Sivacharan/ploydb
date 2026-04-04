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

## Phase 1: Foundation ✅

### 1.1 — Scaffold ✅
- [x] Create Next.js app with `create-next-app`
- [x] Init shadcn/ui with **default** style (**Radix** primitives)
- [x] Install shadcn components needed by tablecn
- [x] Install tablecn data-grid via registry
- [x] Fix import path issues in data-grid files (barrel → @/lib/data-grid, @/types/data-grid)
- [x] Install remaining deps (ai, @ai-sdk/anthropic, faker, date-fns, lucide, next-themes, motion, cva, clsx, tailwind-merge, zod)
- [x] Install additional shadcn components
- [x] Fix PopoverAnchor export, DropdownMenuItem variant prop, SelectTrigger size prop
- [x] Fix data-slot="dropdown-menu-content" for grid focus management

### 1.2 — Seed Data ✅
- [x] `generateSeedData()` function using Faker with deterministic seed
- [x] 150 flat row objects with all 20 field types
- [x] 5 hand-tuned hero rows (Acme Corp, TechVault Inc, GlobalSync, NovaPay, DataForge)
- [x] Weighted status distribution
- [x] Team Members (10 records) and Deals (30 records) for ref fields

### 1.3 — Wire Data Grid ✅
- [x] `useState(() => generateSeedData())` in page component
- [x] 20 column definitions with `meta.cell.variant`
- [x] `useDataGrid` hook + `<DataGrid>` component
- [x] `onDataChange` → `setData`
- [x] Navbar with breadcrumb, theme toggle, avatar
- [x] Geist font fix (direct font-family, not circular var reference)
- [x] Full viewport layout (no rounded border, no maxHeight cap)

---

## Phase 2: Custom Cell Types ✅

### 2.1 — Number Variants ✅
- [x] `currency` — $ + commas via Intl.NumberFormat, plain number edit
- [x] `percent` — % suffix, 0-100 range

### 2.2 — Choice Variants ✅
- [x] `status` — colored dot + tinted badge (inline styles for dynamic colors)
- [x] `tags` — outline badges + Command-based multi-select

### 2.3 — Date Variant ✅
- [x] `datetime` — Calendar + `<Input type="time">` (native, avoids Radix Select/Popover portal conflict)

### 2.4 — Contact Variants ✅
- [x] `email` — clickable mailto link, text-primary styling
- [x] `phone` — clickable tel link

### 2.5 — New Cell Types ✅
- [x] `color` — read-only, stores string[] (1-3 hex colors), overlapping circular swatches with ring-background stroke
- [x] `json` — collapsed `{ N keys }` preview, syntax-highlighted editor (layered pre + transparent textarea), semantic token colors
- [x] `location` — MapPin icon + text with inline-flex fix for line-clamp
- [x] `ref` — Badge display + Command combobox searching linked table
- [x] `refs` — Multi-badge with useBadgeOverflow + multi-select Command combobox

### 2.6 — Register All ✅
- [x] Extended `CellOpts` union in `types/data-grid.ts` (11 new variants)
- [x] Added cases in `data-grid-cell.tsx` switch
- [x] Documentation in `src/components/cells/README.md`

### Known Issues
- Column header dropdown closes immediately when a cell is actively editing (Radix focus/portal race condition — minor UX issue)
- Calendar `--cell-size` var references fixed to use `var(--cell-size)` syntax

---

## Phase 2.5: Grid Toolbar (Filter, Sort, View, Row Height) ✅

tablecn provides these as separate registry components. Install and wire to table instance.

### Install
```bash
npx shadcn@latest add "https://tablecn.com/r/data-grid-filter-menu.json"
npx shadcn@latest add "https://tablecn.com/r/data-grid-sort-menu.json"
npx shadcn@latest add "https://tablecn.com/r/data-grid-view-menu.json"
npx shadcn@latest add "https://tablecn.com/r/data-grid-row-height-menu.json"
```

### Wire up ✅
- [x] Import all 4 menu components
- [x] Add toolbar div above DataGrid in page.tsx
- [x] Pass `table` instance to each: `<DataGridFilterMenu table={table} />`
- [x] Verify filter, sort, view toggle, row height all work
- [x] Fix any import path issues (same barrel fix pattern as data-grid)

---

## Phase 2.7: Home Dashboard (Entry Point)

The workspace home screen. Chat-first interface that proves PloyDB is part of the workspace, not a separate app. Korra navigates to the right database for you.

### 2.7.1 — Layout
- [ ] Full-screen chat layout (Korra chat centered, like ChatGPT home)
- [ ] Left sidebar showing workspace items (databases: Contacts, Companies, Deals, Content, Categories, Media + documents, assets)
- [ ] Connected sources section below chat (Google Sheets, Airtable icons — already synced)

### 2.7.2 — Starter Templates
- [ ] Template cards below the chat input: "Prioritize stale leads", "Clean up contacts", "Analyze deal pipeline", "Audit content status"
- [ ] Clicking a template populates the chat with that prompt
- [ ] One template triggers the happy path demo flow

### 2.7.3 — Transition to Table View
- [ ] When user sends a message or clicks a template, Korra responds and opens the relevant database
- [ ] Sidebar item highlights as Korra selects it
- [ ] Smooth transition animation: full-screen chat → split view (table left + chat panel right)
- [ ] Chat history carries over to the right panel seamlessly

---

## Phase 3: Korra AI Panel (PRIMARY FOCUS)

The AI collaboration surface is the core differentiator. This is what makes PloyDB feel AI-native, not a Notion clone with a chat sidebar. Korra is a peer working on the same table — the UI must make that visible, trustworthy, and natural.

### 3.1 — Chat UI
- [ ] Right side panel (collapsible, resizable)
- [ ] Chat message list with streaming text rendering
- [ ] Korra avatar + typing indicator
- [ ] Input area with send button
- [ ] Ploybook/Skill tags visible near chat input (e.g., `Ploybook: Client Health Assessment` + `Skill: Acme Client Tiers`) — shows what context Korra is using

### 3.2 — Dry-Run Preview Cards
- [ ] Before Korra acts on all rows, she shows a preview card in chat with results for first 5 rows
- [ ] Card has Approve / Reject buttons
- [ ] On approve → Korra executes on all rows
- [ ] On reject → Korra asks for corrections

### 3.3 — Edit Summary Cards
- [ ] After Korra makes changes, a summary card appears in chat ("Updated 200 rows — added Client Health column")
- [ ] Clicking the card opens a diff view — code-editor style: removed values in red, added in green, edited in yellow
- [ ] Diff view shows before/after per cell, grouped by row

### 3.4 — Tool Definitions + Mock Model
- [ ] `editCells` — batch cell updates → `tableMeta.onDataUpdate()`
- [ ] `addColumn` — add a new column with type/options → updates column definitions
- [ ] `filterBy` — apply filters → `table.setColumnFilters()`
- [ ] `sortBy` — apply sorts → `table.setSorting()`
- [ ] `addRow` / `deleteRows` — row CRUD
- [ ] Mock model with pre-scripted responses for the happy path demo (no API key needed)
- [ ] Later: swap mock for real Claude via `@ai-sdk/anthropic`

### 3.5 — Pre-Scripted Happy Path Demo (Contacts table)
The demo flow follows Happy Path v2 — prioritizing stale leads:
- [ ] **Step 0:** User clicks "Prioritize stale leads" template on home → Korra: "I see 960 contacts in your CRM. I'll open that up." → transition to split view with Contacts table
- [ ] **Step 1:** Korra filters: Tags contains "lead" + Last Contacted > 60 days → table narrows
- [ ] **Step 2:** "I'll add a Priority column based on title seniority and company size" → Ploybook tag appears → dry-run on 5 rows → approve → Korra fills all rows with wave animation
- [ ] **Step 3:** User corrects a cell → badge flips to "You" → "Do this for all healthcare contacts" → bulk update → edit summary card with diff
- [ ] **Step 4:** Click row → side panel with audit trail showing Korra + User edits

---

## Phase 4: AI Trust Signals (IN THE TABLE)

Trust is built into the table itself, not just the chat panel.

### 4.1 — Cell-Level Attribution
- [ ] When clicking a cell, show a badge indicating last editor (user avatar or Korra icon)
- [ ] AI-written cells have a subtle visual indicator (not loud — discoverable on hover/click)
- [ ] Non-editable columns show a lock icon in the column header

### 4.2 — Row-Level Activity
- [ ] Subtle pulse/highlight animation when Korra updates a row in realtime
- [ ] Rows recently touched by Korra have a faint tint that fades over time

---

## Phase 5: Row Detail Panel

### 5.1 — Side Panel
- [ ] Click row → shadcn Sheet opens as side panel
- [ ] All fields editable in vertical form layout
- [ ] Relations navigable (click a linked record → navigate)
- [ ] Navigate between rows (prev/next) without closing panel

### 5.2 — Audit Trail
- [ ] Timeline at bottom of row detail showing edit history
- [ ] Each entry: who (user avatar or Korra icon), what changed, when
- [ ] Human vs AI edits visually distinct
- [ ] Korra entries show reasoning ("Set to At Risk — no campaign in 120 days, plan tier downgraded")
- [ ] Clicking an audit entry shows the diff (red/green/yellow)

---

## Phase 6: Column Operations

- [ ] "+" button at end of column headers to add column
- [ ] Field type picker (approachable for non-technical users)
- [ ] Constraints: required, unique
- [ ] Option management for select/status fields
- [ ] Relation configuration (link to another table)
- [ ] Column header dropdown menu (sort, filter, hide, rename, delete)

---

## Phase 7: Polish + Stretch

- [ ] Motion animations (cell edit glow, row add/delete, filter transitions, Korra activity pulse)
- [ ] Loading skeletons, empty states
- [ ] Row count footer
- [ ] Dark mode toggle
- [ ] "Reset data" button
- [ ] Board View (kanban) — stretch goal

---

## Priority Order

1. **Phase 2.7 (Home Dashboard)** — the entry point, proves PloyDB is part of the workspace
2. **Phase 3 (Korra Panel)** — the differentiator, the soul of the prototype
3. **Phase 4 (Trust Signals)** — makes the table feel AI-native
3. **Phase 5 (Row Detail)** — completes the happy path (review what AI did)
4. **Phase 6 (Column Ops)** — supports the "add a column" moment in the flow
5. **Phase 7 (Polish)** — only if time permits

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
