# PloyDB Prototype — Implementation Plan

## Overview

Build a fully interactive CRM table experience with AI agent (Korra) integration. All frontend, no real backend. Data persists across page refresh via Zustand + localStorage.

---

## Stack

| Layer | Tool | Purpose |
|---|---|---|
| Framework | Next.js (App Router) | App scaffold |
| Styling | Tailwind CSS 4.x | Default shadcn theme (customize later) |
| Components | shadcn/ui (**default** style, Radix primitives) | Inputs, selects, popovers, sheets, dialogs, calendar, command palette |
| Data Grid | tablecn data-grid (`@diceui/data-grid`) | Editable spreadsheet grid with 9 built-in cell types, filtering, sorting, column ops, keyboard nav, copy/paste, undo/redo |
| Table Engine | TanStack Table v8 | Headless state management (bundled inside tablecn) |
| Virtualization | TanStack Virtual | Row virtualization for 150+ rows (bundled inside tablecn) |
| Data Store | Zustand + persist middleware | Shared state for rows, filters, sorts, views. Persists to localStorage |
| Mock Data | @faker-js/faker | Seed 150 CRM rows with all 20 field types |
| AI Chat | Vercel AI SDK (`useChat`) | Korra panel — `onToolCall` calls Zustand actions |
| Chat UI | Custom shadcn components | Message list, streaming, tool result rendering |
| Drag & Drop | dnd-kit | Kanban board view (tablecn handles column reorder internally) |
| Icons | Lucide React | All icons |
| Dark Mode | next-themes (class-based) | Light/dark toggle |
| Animation | Motion (Framer Motion) | Transitions and micro-interactions |

---

## Bootstrap from Scratch

### Step 0 — Create Next.js App

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

This creates the Next.js scaffold with TypeScript, Tailwind CSS 4, ESLint, App Router, `src/` directory, and `@/*` import alias.

### Step 1 — Initialize shadcn/ui (default/Radix style)

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default** (NOT base-nova — we need Radix primitives for tablecn compatibility)
- Base color: **Neutral**
- CSS variables: **Yes**

This creates `components.json` and sets up the shadcn registry.

### Step 2 — Install shadcn components needed by tablecn

tablecn's data-grid depends on these shadcn components. Install them BEFORE the data-grid:

```bash
npx shadcn@latest add badge button calendar checkbox command dialog dropdown-menu input popover scroll-area select separator skeleton textarea tooltip
```

### Step 3 — Install tablecn data-grid

```bash
npx shadcn@latest add https://diceui.com/r/data-grid.json
```

This copies data-grid source files into your project (components, hooks, lib, types). You own them fully.

**IMPORTANT:** After install, verify these files exist:
- `src/components/data-grid/data-grid.tsx` (main component)
- `src/components/data-grid/data-grid-cell-variants.tsx` (9 built-in cell types)
- `src/hooks/use-data-grid.ts` (main hook)
- `src/lib/data-grid.ts` (utilities)
- `src/types/data-grid.ts` (type definitions)

**IMPORTANT:** The data-grid files may import from a barrel like `@/components/data-grid/data-grid` for utilities and types. These imports need to be fixed to point to:
- Functions (`flexRender`, `getCellKey`, etc.) → `@/lib/data-grid`
- Types (`DataGridCellProps`, `CellUpdate`, etc.) → `@/types/data-grid`

### Step 4 — Install remaining dependencies

```bash
npm install zustand @faker-js/faker date-fns lucide-react next-themes motion class-variance-authority clsx tailwind-merge
```

### Step 5 — Install additional shadcn components for the app

```bash
npx shadcn@latest add card sheet tabs table toggle switch label accordion avatar
```

### Step 6 — Verify data-grid works

Create a minimal page that renders the data-grid with hardcoded sample data to verify everything works before wiring up Zustand. It should look like the demo at https://tablecn.com/data-grid-live.

---

## What tablecn Data Grid Gives Us for Free

tablecn is installed via shadcn registry — source files copied into your project, full styling control. It provides:

### Built-in Cell Types (9 of 20)

| tablecn Variant | PloyDB Field Type | Edit Widget |
|---|---|---|
| `short-text` | text | contentEditable with auto-focus |
| `long-text` | rich_text | Multi-line textarea |
| `number` | number | Numeric input with min/max/step |
| `select` | select | Single-select dropdown with icons |
| `multi-select` | multi_select | Multi-select with badge overflow |
| `checkbox` | checkbox | Boolean toggle |
| `date` | date | Calendar popover picker |
| `url` | url | URL input with link detection |
| `file` | (bonus) | File upload with drag-and-drop |

### Built-in Features (we don't need to build)

- [x] Inline cell editing with click-to-edit
- [x] Keyboard navigation (Tab, Enter, Escape, arrow keys)
- [x] Copy/paste with TSV parsing (paste from Excel/Sheets works)
- [x] Undo/redo (`useDataGridUndoRedo` hook)
- [x] Column resizing (`columnResizeMode: "onChange"`)
- [x] Column reordering
- [x] Column pinning (left/right with sticky positioning)
- [x] Column visibility toggle
- [x] Rich filtering with type-aware operators (text: contains/equals/startsWith, number: equals/lessThan/greaterThan, date: before/after/between, select: is/isAnyOf, boolean: isTrue/isFalse)
- [x] Multi-column sorting
- [x] Search across all cells with match navigation
- [x] Row virtualization (TanStack Virtual)
- [x] Context menu (right-click on cells)
- [x] Row selection with checkboxes
- [x] Row height adjustment
- [x] Cell selection (click, shift-click, drag)

### Programmatic API (for Korra AI agent)

- `onDataUpdate({ rowIndex, columnId, value })` — edit one or many cells
- `onRowsDelete(rowIndices[])` — delete rows
- `onRowAdd` — add rows
- `onCellEditingStart(rowIndex, columnId)` / `onCellEditingStop()` — enter/exit edit mode
- Filter/sort state settable via TanStack Table's `setColumnFilters` / `setSorting`

### Data Shape Requirement

**IMPORTANT:** tablecn expects **flat row objects** where `row[columnId]` returns the value directly. Do NOT use nested `{ id, data: { field: value } }` shape. Use flat rows like:

```ts
{ _id: "1", companyName: "Acme Corp", dealSize: 50000, status: "qualified", ... }
```

If Zustand stores rows differently, flatten before passing to DataGrid and unflatten in callbacks.

### Column Definition Pattern

```ts
{
  id: "fieldName",
  accessorKey: "fieldName",  // or accessorFn for computed values
  meta: {
    label: "Field Label",
    cell: { variant: "short-text" }  // or "number", "select", etc.
  }
}
```

For select/multi-select variants, pass options in meta:
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

## What We Still Build (11 custom cell types + everything else)

### Custom Cell Variants (extending tablecn's 9 built-in types)

| PloyDB Field | Based On | What We Add |
|---|---|---|
| `currency` | `number` variant | $ prefix, comma formatting, 2 decimal places |
| `percent` | `number` variant | % suffix, 0-100 range |
| `status` | `select` variant | Colored dot indicator + colored badge (like Airtable pipeline stages) |
| `tags` | `multi-select` variant | Subtle badge styling + "Add tag" inline input |
| `datetime` | `date` variant | Add time picker (hour:minute) alongside calendar |
| `email` | `short-text` variant | Email validation + clickable mailto link in display mode |
| `phone` | `short-text` variant | Phone formatting + clickable tel link in display mode |
| `color` | New | Color swatch display + preset color grid popover with hex input |
| `json` | `long-text` variant | JSON syntax highlighting in display + validation on save |
| `location` | `short-text` variant | City/country text input (simplified for prototype) |
| `ref` | New | Linked record badge display + `<Combobox>` searching linked table |
| `refs` | New | Multiple record badges + multi-select `<Combobox>` |

To add custom variants, extend the switch statement in `data-grid-cell.tsx` and add to the `CellOpts` union type in `types/data-grid.ts`.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Zustand Store (single source of truth)                  │
│                                                          │
│  state:                                                  │
│    databases[]        — list of databases                │
│    activeDbId         — currently viewed database        │
│    rows[]             — flat records for active db       │
│    schema[]           — field definitions (name, type,   │
│                         options, required, unique)       │
│    views[]            — saved view presets               │
│    activeViewId       — current view                     │
│    filters[]          — active filter rules              │
│    sorts[]            — active sort rules                │
│    groupBy            — active grouping field            │
│    selectedRowIds[]   — selected rows                    │
│    auditLog[]         — mutation history                 │
│                                                          │
│  actions:                                                │
│    updateCell(rowId, field, value)                       │
│    addRow(data)                                          │
│    deleteRows(rowIds[])                                  │
│    duplicateRow(rowId)                                   │
│    addColumn(fieldDef)                                   │
│    removeColumn(fieldName)                               │
│    renameColumn(fieldName, newName)                      │
│    reorderColumns(newOrder[])                            │
│    setFilters(filters[])                                 │
│    setSorts(sorts[])                                     │
│    setGroupBy(field | null)                              │
│    saveView(viewDef)                                     │
│    switchView(viewId)                                    │
│    bulkUpdate(rowIds[], field, value)                    │
│                                                          │
│  Every action logs to auditLog[] with:                   │
│    { who: 'human' | 'korra', action, timestamp, diff }  │
└────────────────┬─────────────────────┬───────────────────┘
                 │                     │
        reads/writes            reads/writes
                 │                     │
    ┌────────────▼──────┐    ┌────────▼──────────┐
    │   Table UI        │    │   Korra Panel      │
    │                   │    │                    │
    │   tablecn         │    │   Vercel AI SDK    │
    │   data-grid       │    │   useChat()        │
    │   + 11 custom     │    │   onToolCall →     │
    │     cell types    │    │     Zustand action │
    │   + row detail    │    │                    │
    │   + board view    │    │                    │
    └───────────────────┘    └────────────────────┘
```

---

## Phase 1: Foundation

### 1.1 — Scaffold (follow Bootstrap steps 0-5 above)
- [ ] Create Next.js app with `create-next-app`
- [ ] Init shadcn/ui with **default** style (Radix primitives)
- [ ] Install shadcn components needed by tablecn
- [ ] Install tablecn data-grid via registry
- [ ] Fix any import path issues in data-grid files
- [ ] Install remaining deps (zustand, faker, date-fns, lucide, next-themes, motion)
- [ ] Install additional shadcn components for the app
- [ ] Verify data-grid renders with hardcoded sample data

### 1.2 — Zustand Store
- [ ] Define store with state shape (rows as flat objects, schema, filters, sorts, views, auditLog)
- [ ] Implement all actions (updateCell, addRow, deleteRows, etc.)
- [ ] Add `persist` middleware → localStorage (survives refresh)
- [ ] Wrap every action with audit logging (who, what, when, diff)

### 1.3 — Faker Seed Script
- [ ] Generate schema for "Sales Pipeline" CRM with all 20 field types:
  - text: Company Name, Contact Name, Notes
  - rich_text: Description
  - number: Employee Count
  - currency: Deal Size
  - percent: Win Probability
  - select: Lead Source (Referral, Website, Cold Call, Event, Partner)
  - multi_select: Industries (SaaS, Fintech, Healthcare, E-commerce, AI/ML)
  - status: Stage (New → Contacted → Qualified → Proposal → Negotiation → Closed Won → Closed Lost)
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
  - ref: Assigned To (→ Team Members table)
  - refs: Related Deals (→ Deals table)
- [ ] Generate ~150 leads with realistic data (weighted status distribution, hero rows, temporal coherence)
- [ ] Generate "Team Members" table (10 people) and "Deals" table (30 deals)
- [ ] Seed on first load if store is empty
- [ ] "Reset data" button to re-seed

### 1.4 — Wire tablecn Data Grid
- [ ] Connect data-grid to Zustand store data (flat rows)
- [ ] Map schema fields to column definitions with appropriate `meta.cell.variant`
- [ ] Map the 9 built-in field types to tablecn variants
- [ ] Wire `onDataUpdate` → Zustand `updateCell` (resolve rowIndex to rowId)
- [ ] Wire `onRowsDelete` → Zustand `deleteRows`
- [ ] Wire `onRowAdd` → Zustand `addRow`
- [ ] Verify inline editing, keyboard nav, copy/paste, undo/redo all work
- [ ] Verify it looks and behaves like https://tablecn.com/data-grid-live

---

## Phase 2: Custom Cell Types (11 remaining)

Extend tablecn's cell variant system to cover all 20 PloyDB field types.

### 2.1 — Number Variants
- [ ] `currency` — Extend number variant: display with $ and commas ("$12,450.00"), edit as plain number
- [ ] `percent` — Extend number variant: display with % suffix ("73.2%"), edit with 0-100 range

### 2.2 — Choice Variants
- [ ] `status` — Extend select variant: colored dot + colored badge display, pipeline-stage styling
- [ ] `tags` — Extend multi-select variant: subtle badge styling, inline "Add tag" input

### 2.3 — Date Variant
- [ ] `datetime` — Extend date variant: add time picker (hour:minute selector) alongside calendar popover

### 2.4 — Contact Variants
- [ ] `email` — Extend short-text variant: email validation, clickable mailto link in display mode
- [ ] `phone` — Extend short-text variant: phone formatting, clickable tel: link in display mode

### 2.5 — New Cell Types (not based on existing variants)
- [ ] `color` — Display: color swatch circle + hex label. Edit: popover with preset color grid (8-12 colors) + hex input
- [ ] `json` — Display: `{ ... }` collapsed preview with key count. Edit: popover with monospace textarea + JSON validation feedback
- [ ] `location` — Display: "San Francisco, CA" text. Edit: text input (simplified)
- [ ] `ref` — Display: linked record name as clickable badge/chip. Edit: shadcn `<Combobox>` searching linked table
- [ ] `refs` — Display: row of record name badges (overflow as +N). Edit: multi-select `<Combobox>` with search

### 2.6 — Register All Variants
- [ ] Extend `CellOpts` union in `types/data-grid.ts`
- [ ] Add cases to switch in `data-grid-cell.tsx`
- [ ] Map each schema field type to its variant in column definitions

---

## Phase 3: Column Operations

tablecn provides column resize, reorder, pin, and visibility. We add:

### 3.1 — Column Header Menu
- [ ] Enhanced dropdown menu on each column header:
  - Sort ascending / descending (tablecn has this)
  - Filter by this column
  - Hide column (tablecn has this)
  - Rename column (inline edit on header)
  - Duplicate column
  - Delete column (with confirmation)
  - Pin left / Pin right / Unpin (tablecn has this)
  - Change field type (dropdown of 20 types)

### 3.2 — Add Column
- [ ] "+" button as last column header
- [ ] Opens field type picker → name input → creates column

---

## Phase 4: Row Operations

### 4.1 — Add Row
- [ ] "+" button at bottom of table
- [ ] Creates empty row, auto-focuses first editable cell

### 4.2 — Bulk Actions
- [ ] tablecn provides row selection — we add a floating bulk action bar:
  - Delete selected (N rows)
  - Set field to value (bulk update)
  - Duplicate selected

### 4.3 — Row Detail Panel
- [ ] Expand icon or double-click row → shadcn `<Sheet>` from right
- [ ] All fields in vertical form layout using same cell editors
- [ ] Audit history section at bottom
- [ ] Navigate between rows with up/down arrows

### 4.4 — Row Context Menu
- [ ] Extend tablecn's built-in context menu: Expand, Duplicate, Copy, Delete

---

## Phase 5: Views + Grouping

### 5.1 — Group By
- [ ] "Group" button → dropdown → collapsible sections with header + count

### 5.2 — Saved Views
- [ ] Tab bar: view tabs + "+" button
- [ ] Each view stores: name, type, filters, sorts, groupBy, visible columns, column order, widths
- [ ] Default views: "All Leads", "My Pipeline", "Hot Leads"

---

## Phase 6: Search + Command Palette

### 6.1 — Search
- [ ] tablecn has built-in search — customize styling

### 6.2 — Command Palette
- [ ] Cmd+K opens shadcn `<Command>` palette with quick filters, sort, views, actions

---

## Phase 7: Korra AI Panel

### 7.1 — Chat UI
- [ ] Right side panel (collapsible, resizable)
- [ ] Chat message list with streaming + Korra avatar

### 7.2 — Tool Definitions (Zod schemas)
- [ ] editCell, addRow, deleteRows, addColumn, removeColumn, applyFilter, applySort, setGroupBy, bulkUpdate, switchView

### 7.3 — Tool Execution Bridge
- [ ] `onToolCall` → Zustand actions → table updates
- [ ] Tool results as custom chat components

### 7.4 — Demo Mode (no API key needed)
- [ ] `MockLanguageModelV1` with pre-scripted flows

### 7.5 — AI Trust Signals
- [ ] Sparkle icon on AI-modified cells, audit timeline, accept/revert

---

## Phase 8: Board View (Kanban)

- [ ] View type toggle (Table | Board)
- [ ] Columns = status values, cards = rows
- [ ] dnd-kit drag between columns → updates status

---

## Phase 9: Database Home

- [ ] Grid of databases (Sales Pipeline, Team Members, Deals)
- [ ] "New Database" button with AI schema generation option

---

## Phase 10: Polish

- [ ] Loading skeletons, empty states, row count footer
- [ ] Keyboard shortcuts help modal
- [ ] Animations, error states, "Reset data" button

---

## Parallel Worktree Strategy

| Worktree | Phases | Dependencies |
|---|---|---|
| **A: Foundation** | 1.1–1.4 | None (do this first) |
| **B: Custom Cell Types** | 2.1–2.6 | Needs Phase 1 |
| **C: Column + Row Ops** | 3.1–3.2, 4.1–4.4 | Needs Phase 1 |
| **D: Views + Grouping** | 5.1–5.2 | Needs Phase 1 |
| **E: Search + Cmd Palette** | 6.1–6.2 | Needs Phase 1 |
| **F: Korra Panel** | 7.1–7.5 | Needs Phase 1 + Phase 2 |
| **G: Board View** | 8.1–8.3 | Needs Phase 1 |
| **H: Database Home** | 9.1–9.2 | Needs Phase 1 |
| **I: Polish** | 10 | Needs everything else |

**Phase 1 (Foundation) must complete first.** Then B–H can run in parallel.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # Main table view (start simple, add routing later)
│   ├── globals.css               # Default shadcn theme (customize later)
│   └── api/
│       └── chat/
│           └── route.ts          # Vercel AI SDK endpoint (or mock)
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (Radix-based, your files)
│   │
│   ├── data-grid/                # tablecn data-grid (copied via registry, fully owned)
│   │   ├── data-grid.tsx
│   │   ├── data-grid-cell-variants.tsx
│   │   ├── data-grid-cell-wrapper.tsx
│   │   ├── data-grid-cell.tsx
│   │   ├── data-grid-column-header.tsx
│   │   ├── data-grid-context-menu.tsx
│   │   ├── data-grid-paste-dialog.tsx
│   │   ├── data-grid-row.tsx
│   │   └── data-grid-search.tsx
│   │
│   ├── cells/                    # Custom cell variants (11 PloyDB-specific)
│   │
│   ├── table/                    # Table view extensions (toolbar, add-column, bulk-actions)
│   │
│   ├── row-detail/               # Row detail side panel
│   │
│   ├── board/                    # Kanban board view
│   │
│   ├── korra/                    # AI agent panel
│   │
│   └── database-home/            # Database listing
│
├── hooks/                        # tablecn hooks + custom hooks
│   └── use-data-grid.ts          # Main data-grid hook (from tablecn)
│
├── store/                        # Zustand store
│   ├── index.ts
│   └── types.ts
│
├── data/                         # Seed data
│   ├── seed.ts
│   ├── schema.ts
│   └── hero-rows.ts
│
├── lib/                          # Utilities
│   ├── utils.ts                  # cn() helper
│   ├── data-grid.ts              # tablecn utilities (from registry)
│   └── field-types.ts            # Field type registry
│
└── types/
    └── data-grid.ts              # tablecn type definitions (from registry)
```
