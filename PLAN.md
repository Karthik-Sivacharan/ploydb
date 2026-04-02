# PloyDB Prototype — Implementation Plan

## Overview

Build a fully interactive CRM table experience inside `src/ploy-app` with AI agent (Korra) integration. All frontend, no real backend. Data persists across page refresh via Zustand + localStorage.

---

## Stack

| Layer | Tool | Purpose |
|---|---|---|
| Framework | Next.js (App Router) | App scaffold |
| Styling | Tailwind CSS + Design Tokens | Full styling control |
| Components | shadcn/ui (Radix primitives) | Inputs, selects, popovers, sheets, dialogs, calendar, command palette |
| Table Shell | sadmann7/shadcn-table | Filter UI, sort UI, pagination, row selection, bulk actions |
| Table Engine | TanStack Table v8 | Headless state management (bundled with shadcn-table) |
| Data Store | Zustand + persist middleware | Shared state for rows, filters, sorts, views. Persists to localStorage |
| Mock Data | @faker-js/faker | Seed 150 CRM rows with all 20 field types |
| AI Chat | Vercel AI SDK (`useChat`) | Korra panel — `onToolCall` calls Zustand actions |
| Chat UI | @assistant-ui/react OR custom shadcn | Message list, streaming, tool result rendering |
| Drag & Drop | dnd-kit | Column reordering, kanban board view |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Zustand Store (single source of truth)                  │
│                                                          │
│  state:                                                  │
│    databases[]        — list of databases                │
│    activeDbId         — currently viewed database        │
│    rows[]             — records for active database      │
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
    │   sadmann7/       │    │   Vercel AI SDK    │
    │   shadcn-table    │    │   useChat()        │
    │   + cell editors  │    │   onToolCall →     │
    │   + column ops    │    │     Zustand action │
    │   + row detail    │    │                    │
    └───────────────────┘    └────────────────────┘
```

---

## Styling Control

**You own every pixel.** Here's why:

- **shadcn/ui** copies component source files into `src/components/ui/`. They're your files — edit freely.
- **sadmann7/shadcn-table** is a reference/starting point — you copy the patterns, not install a package.
- **Cell renderers** are plain React components you write. Each one is a `.tsx` file styled with Tailwind + your design tokens.
- **TanStack Table** is headless — it never renders anything. Every `<td>`, every cell, every color is your code.
- **Design tokens** flow through Tailwind's config (`tailwind.config.ts`) and CSS variables. All shadcn components reference these variables.

Example of styling control in a cell:

```tsx
// You write this. Every class, every color, every interaction is yours.
function StatusCell({ value, options }) {
  const option = options.find(o => o.value === value)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: option.color + '20', color: option.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: option.color }} />
      {option.label}
    </span>
  )
}
```

---

## Phase 1: Data Layer + Basic Table

### 1.1 — Scaffold
- [ ] Next.js app in `src/ploy-app`
- [ ] Tailwind config with design tokens (colors, typography, spacing, radii)
- [ ] Install shadcn/ui, configure with your tokens
- [ ] Install Zustand, @faker-js/faker, TanStack Table

### 1.2 — Zustand Store
- [ ] Define store with state shape (rows, schema, filters, sorts, views, auditLog)
- [ ] Implement all actions (updateCell, addRow, deleteRows, etc.)
- [ ] Add `persist` middleware → localStorage (survives refresh)
- [ ] Wrap every action with audit logging (who, what, when, diff)

### 1.3 — Faker Seed Script
- [ ] Generate schema for "Sales Pipeline" CRM with all 20 field types
- [ ] Generate ~150 leads with realistic data:
  - Weighted status distribution (40% New, 25% Contacted, 15% Qualified, 10% Proposal, 5% Won, 5% Lost)
  - Consistent relationships (contacts belong to companies)
  - 5-8 hand-tuned "hero" rows for demos
  - Temporal coherence (created_at < updated_at < next_followup)
- [ ] Generate a small "Team Members" table (10 people) for ref fields
- [ ] Generate a small "Deals" table (30 deals) for refs fields
- [ ] Seed on first load if store is empty
- [ ] "Reset data" button to re-seed

### 1.4 — Basic Table Render
- [ ] Wire TanStack Table with Zustand store data
- [ ] Column definitions from schema (one column per field)
- [ ] Basic cell rendering (plain text for now)
- [ ] Horizontal scroll for 20+ columns
- [ ] Sticky first column (Company Name)
- [ ] Row selection checkbox column
- [ ] Field type icon in column headers

---

## Phase 2: Cell Editors (20 Field Types)

Each field type gets two components: **DisplayCell** (read mode) and **EditCell** (edit mode).

### Cell Editor Registry

```
fieldType → { display: Component, editor: Component, icon: Icon }
```

### 2.1 — Text Fields
- [ ] `text` — Display: truncated text. Edit: `<Input>` auto-focus, save on blur/Enter, Escape to cancel
- [ ] `rich_text` — Display: plain text preview. Edit: `<Popover>` with `<Textarea>` (or Tiptap if time permits)

### 2.2 — Number Fields
- [ ] `number` — Display: formatted number. Edit: `<Input type="number">`
- [ ] `currency` — Display: formatted with $ symbol and commas. Edit: `<Input>` with currency mask
- [ ] `percent` — Display: "73.2%". Edit: `<Input>` with % suffix

### 2.3 — Choice Fields
- [ ] `select` — Display: colored `<Badge>`. Edit: shadcn `<Select>` dropdown with colored options
- [ ] `multi_select` — Display: row of colored badges (overflow as +N). Edit: `<Popover>` with checkbox list
- [ ] `status` — Display: colored badge with dot indicator. Edit: `<Select>` with status-specific colors
- [ ] `tags` — Display: row of subtle badges. Edit: `<Popover>` with checkbox list + "Add tag" input

### 2.4 — Date Fields
- [ ] `date` — Display: formatted date (e.g., "Mar 15, 2026"). Edit: shadcn `<DatePicker>`
- [ ] `datetime` — Display: formatted date + time. Edit: `<DatePicker>` + time select

### 2.5 — Contact Fields
- [ ] `email` — Display: clickable mailto link. Edit: `<Input type="email">`
- [ ] `phone` — Display: formatted phone. Edit: `<Input type="tel">`
- [ ] `url` — Display: clickable link (show domain only). Edit: `<Input type="url">`

### 2.6 — Media Fields
- [ ] `color` — Display: color swatch circle. Edit: color picker popover (grid of preset colors + hex input)

### 2.7 — Structured Fields
- [ ] `json` — Display: `{ ... }` preview. Edit: `<Textarea>` with JSON validation in popover
- [ ] `location` — Display: city/country text. Edit: `<Input>` (simplified for prototype)

### 2.8 — Logic Fields
- [ ] `checkbox` — Display AND edit: shadcn `<Checkbox>`, always interactive (no separate edit mode)

### 2.9 — Relation Fields
- [ ] `ref` — Display: linked record name as badge/chip. Edit: `<Combobox>` (`<Command>` + `<Popover>`) searching the linked table
- [ ] `refs` — Display: row of record name badges. Edit: multi-select `<Combobox>`

### 2.10 — Edit Interaction Pattern
- [ ] Click cell → enter edit mode (swap display → editor)
- [ ] Blur or Enter → save to Zustand store → audit log → exit edit mode
- [ ] Escape → discard changes → exit edit mode
- [ ] Tab → save current cell, move to next cell (stretch goal)
- [ ] Empty cells show subtle "Empty" placeholder

---

## Phase 3: Column Operations

### 3.1 — Column Header Menu
- [ ] Dropdown menu on each column header (click or right-click):
  - Sort ascending
  - Sort descending
  - Filter by this column (opens filter popover pre-set to this field)
  - Hide column
  - Rename column (inline edit)
  - Duplicate column
  - Delete column (with confirmation)
  - Pin left / Pin right / Unpin
  - Change field type (dropdown of 20 types)

### 3.2 — Column Resize
- [ ] Drag handle on column border (TanStack's `getResizeHandler()`)
- [ ] Double-click handle to auto-fit width
- [ ] Minimum column width (100px)
- [ ] Store widths in view config

### 3.3 — Column Reorder
- [ ] Drag column headers to reorder (dnd-kit + TanStack `columnOrder` state)
- [ ] Visual drag overlay (ghost of column header)
- [ ] Drop indicator line between columns

### 3.4 — Add Column
- [ ] "+" button as last column header
- [ ] Opens field type picker → name input → creates column
- [ ] New column appears at the end

---

## Phase 4: Row Operations

### 4.1 — Add Row
- [ ] "+" button at bottom of table
- [ ] Creates empty row, auto-focuses first editable cell
- [ ] Row appears with default values (empty strings, false for checkbox, etc.)

### 4.2 — Row Selection + Bulk Actions
- [ ] Checkbox column for selection
- [ ] Shift+click for range select
- [ ] "Select all" checkbox in header
- [ ] Floating bulk action bar appears when rows selected:
  - Delete selected (N rows)
  - Set field to value (bulk update)
  - Duplicate selected

### 4.3 — Row Detail Panel
- [ ] Expand icon on each row (or click row)
- [ ] shadcn `<Sheet>` slides in from right
- [ ] All fields shown in vertical form layout
- [ ] Each field editable using the same cell editors
- [ ] Related records (ref/refs) are clickable → navigate to that record
- [ ] Audit history section at bottom (timeline of changes to this row)
- [ ] Navigate between rows with up/down arrows while panel is open

### 4.4 — Row Context Menu
- [ ] Right-click row → context menu:
  - Expand row
  - Duplicate row
  - Copy row
  - Delete row

---

## Phase 5: Filter, Sort, Group

### 5.1 — Filter Builder
- [ ] "Filter" button in toolbar (badge shows active filter count)
- [ ] Popover with flat list of filter rules
- [ ] Each rule: `[Field dropdown] [Operator dropdown] [Value input] [Remove button]`
- [ ] Operators change based on field type:
  - text: contains, equals, starts with, ends with, is empty
  - number/currency/percent: =, !=, >, >=, <, <=, is empty
  - select/status: is, is not, is any of
  - multi_select/tags: contains, does not contain, is empty
  - date/datetime: is, before, after, between, is empty
  - checkbox: is true, is false
  - email/phone/url: contains, equals, is empty
  - ref/refs: is, is not, is empty
- [ ] AND / OR toggle at top (single conjunction for all rules)
- [ ] "Add filter" button
- [ ] "Clear all" button
- [ ] Filters stored in Zustand → TanStack Table applies them

### 5.2 — Sort Builder
- [ ] "Sort" button in toolbar
- [ ] Popover with ordered list of sort rules
- [ ] Each rule: `[Field dropdown] [Asc/Desc toggle] [Remove button]`
- [ ] Direction labels are type-aware (A→Z / Z→A for text, 1→9 / 9→1 for numbers, Old→New / New→Old for dates)
- [ ] Drag to reorder sort priority (dnd-kit sortable)
- [ ] Also: click column header to quick-sort

### 5.3 — Group By
- [ ] "Group" button in toolbar
- [ ] Dropdown to select a field (works best with select/status/tags)
- [ ] Rows grouped into collapsible sections
- [ ] Section header: group value + count
- [ ] Chevron to toggle collapse/expand
- [ ] "Hide empty groups" toggle

### 5.4 — Saved Views
- [ ] Tab bar above table: view tabs + "+" button
- [ ] Each view stores: name, filters, sorts, groupBy, visible columns, column order, column widths
- [ ] Auto-save: changing filters/sorts/columns updates the active view
- [ ] "+" creates new view (name prompt, optional type: table/board)
- [ ] Right-click view tab: rename, duplicate, delete
- [ ] Default views: "All Leads", "My Pipeline", "Hot Leads"

---

## Phase 6: Search + Command Palette

### 6.1 — Search
- [ ] Search input in toolbar
- [ ] Filters across all text-type fields (name, email, company, notes, etc.)
- [ ] Debounced (200ms)
- [ ] Shows result count

### 6.2 — Command Palette
- [ ] Cmd+K opens shadcn `<Command>` palette
- [ ] Groups:
  - **Quick Filters**: "Status is Qualified", "Source is Referral", etc.
  - **Sort**: "Sort by Deal Size", "Sort by Last Contacted"
  - **Views**: "Go to My Pipeline", "Go to Hot Leads"
  - **Actions**: "Add new row", "Reset data"
- [ ] Fuzzy search across all commands

---

## Phase 7: Korra AI Panel

### 7.1 — Chat UI
- [ ] Right side panel (collapsible, resizable)
- [ ] Chat message list with streaming
- [ ] Input area with send button
- [ ] Korra avatar + typing indicator

### 7.2 — Tool Definitions
- [ ] `editCell` — { rowId, field, value }
- [ ] `addRow` — { data }
- [ ] `deleteRows` — { rowIds }
- [ ] `addColumn` — { name, type, options }
- [ ] `removeColumn` — { field }
- [ ] `applyFilter` — { filters[] }
- [ ] `applySort` — { sorts[] }
- [ ] `setGroupBy` — { field }
- [ ] `bulkUpdate` — { rowIds[], field, value }
- [ ] `switchView` — { viewName }

### 7.3 — Tool Execution
- [ ] `onToolCall` in useChat → calls corresponding Zustand action
- [ ] Tool results render as custom components in chat (e.g., "Updated 5 rows" with a mini diff view)

### 7.4 — Demo Mode
- [ ] MockLanguageModelV1 for scripted demos (no API key needed)
- [ ] Pre-scripted flows:
  - "Enrich leads" → batch updates company info
  - "Show me hot leads" → applies filter
  - "Sort by deal size" → applies sort
  - "Create a follow-up task for stale leads" → bulk updates
- [ ] Optional: real Claude API for freeform requests

### 7.5 — AI Trust Signals
- [ ] Sparkle icon on cells modified by Korra
- [ ] Subtle background tint on AI-touched rows
- [ ] "Modified by Korra" badge in row detail panel
- [ ] Audit log: timeline of Korra's changes with before/after diffs
- [ ] Accept/revert buttons on AI-modified cells

---

## Phase 8: Board View (Kanban)

### 8.1 — Board Layout
- [ ] Toggle between Table and Board view (view type in saved views)
- [ ] Columns = status field values (New, Contacted, Qualified, etc.)
- [ ] Cards = rows, showing key fields (name, company, deal size)
- [ ] Card count per column

### 8.2 — Drag & Drop
- [ ] Drag cards between columns (dnd-kit multi-container)
- [ ] Dropping in a column updates the status field in Zustand
- [ ] Drag within column to reorder (stretch goal)

### 8.3 — Card Detail
- [ ] Click card → opens same row detail sheet as table view

---

## Phase 9: Database Home

### 9.1 — Database List
- [ ] Grid/list of databases in workspace
- [ ] Cards showing: name, icon, row count, last modified
- [ ] Three pre-seeded databases: Sales Pipeline, Team Members, Deals

### 9.2 — Create Database
- [ ] "New Database" button
- [ ] Name input + optional template selection
- [ ] AI option: "Describe your database" → Korra creates schema

---

## Phase 10: Polish

- [ ] Loading skeletons for initial data load
- [ ] Empty states (no rows, no filter results)
- [ ] Row count footer ("42 of 150 leads")
- [ ] Undo last action (Cmd+Z) — pop from audit log, revert
- [ ] Keyboard shortcuts help modal
- [ ] Responsive: collapse Korra panel on smaller screens
- [ ] Animations: smooth transitions for filter/sort changes, row additions/deletions
- [ ] Error states: invalid JSON, invalid URL, required field empty

---

## Parallel Worktree Strategy

These can be built independently in parallel worktrees:

| Worktree | Phases | Dependencies |
|---|---|---|
| **A: Foundation** | 1.1, 1.2, 1.3, 1.4 | None (do this first) |
| **B: Cell Editors** | 2.1–2.10 | Needs Phase 1 complete |
| **C: Column Ops** | 3.1–3.4 | Needs Phase 1 complete |
| **D: Row Ops** | 4.1–4.4 | Needs Phase 1 complete |
| **E: Filter/Sort/Group** | 5.1–5.4 | Needs Phase 1 complete |
| **F: Search + Cmd Palette** | 6.1–6.2 | Needs Phase 1 complete |
| **G: Korra Panel** | 7.1–7.5 | Needs Phase 1 + some cell editors |
| **H: Board View** | 8.1–8.3 | Needs Phase 1 complete |
| **I: Database Home** | 9.1–9.2 | Needs Phase 1 complete |
| **J: Polish** | 10 | Needs everything else |

**Phase 1 (Foundation) must be done first.** After that, B through I can run in parallel.

---

## File Structure

```
src/ploy-app/
├── app/                          # Next.js app router pages
│   ├── layout.tsx
│   ├── page.tsx                  # Database home
│   └── [dbId]/
│       └── page.tsx              # Table/Board view
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (your files, full control)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── popover.tsx
│   │   ├── command.tsx
│   │   ├── sheet.tsx
│   │   ├── calendar.tsx
│   │   ├── checkbox.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   │
│   ├── table/                    # Table view components
│   │   ├── data-table.tsx        # Main table (TanStack + shadcn)
│   │   ├── table-toolbar.tsx     # Filter, sort, group, search buttons
│   │   ├── column-header.tsx     # Header with menu, resize, sort indicator
│   │   ├── column-header-menu.tsx
│   │   ├── add-column.tsx
│   │   ├── add-row.tsx
│   │   ├── bulk-actions.tsx
│   │   └── view-tabs.tsx
│   │
│   ├── cells/                    # Cell editor registry (20 types)
│   │   ├── cell-renderer.tsx     # Routes fieldType → display/edit component
│   │   ├── text-cell.tsx
│   │   ├── rich-text-cell.tsx
│   │   ├── number-cell.tsx
│   │   ├── currency-cell.tsx
│   │   ├── percent-cell.tsx
│   │   ├── select-cell.tsx
│   │   ├── multi-select-cell.tsx
│   │   ├── status-cell.tsx
│   │   ├── tags-cell.tsx
│   │   ├── date-cell.tsx
│   │   ├── datetime-cell.tsx
│   │   ├── email-cell.tsx
│   │   ├── phone-cell.tsx
│   │   ├── url-cell.tsx
│   │   ├── color-cell.tsx
│   │   ├── json-cell.tsx
│   │   ├── location-cell.tsx
│   │   ├── checkbox-cell.tsx
│   │   ├── ref-cell.tsx
│   │   └── refs-cell.tsx
│   │
│   ├── filters/                  # Filter/Sort/Group UI
│   │   ├── filter-builder.tsx
│   │   ├── filter-rule.tsx
│   │   ├── sort-builder.tsx
│   │   ├── group-selector.tsx
│   │   └── operators.ts          # Field type → operator mapping
│   │
│   ├── row-detail/               # Row detail side panel
│   │   ├── row-detail-sheet.tsx
│   │   ├── field-form.tsx
│   │   ├── audit-timeline.tsx
│   │   └── related-records.tsx
│   │
│   ├── board/                    # Kanban board view
│   │   ├── board-view.tsx
│   │   ├── board-column.tsx
│   │   └── board-card.tsx
│   │
│   ├── korra/                    # AI agent panel
│   │   ├── korra-panel.tsx
│   │   ├── chat-messages.tsx
│   │   ├── tool-results.tsx      # Custom components for tool call results
│   │   └── demo-scripts.ts       # Pre-scripted demo flows
│   │
│   └── database-home/            # Database listing
│       ├── database-grid.tsx
│       └── create-database.tsx
│
├── store/                        # Zustand store
│   ├── index.ts                  # Main store definition
│   ├── actions.ts                # All mutation actions
│   ├── audit.ts                  # Audit logging middleware
│   └── types.ts                  # TypeScript types for schema, rows, views
│
├── data/                         # Seed data
│   ├── seed.ts                   # Faker seed script
│   ├── schema.ts                 # CRM field definitions (20 types)
│   └── hero-rows.ts              # Hand-crafted demo rows
│
├── lib/                          # Utilities
│   ├── field-types.ts            # Field type registry (icon, operators, default value)
│   ├── formatters.ts             # Display formatters (currency, date, phone, etc.)
│   └── ai-tools.ts              # Vercel AI SDK tool definitions for Korra
│
└── styles/
    └── tokens.css                # Design system CSS variables
```

---

## Success Criteria

After all phases, the prototype should:

1. **Render a full CRM table** with 150+ rows and 20 field types, all styled with your design tokens
2. **Inline edit any cell** by clicking — appropriate editor for each field type
3. **Filter, sort, group** with visual builders — field-type-aware operators
4. **Save and switch between views** (table + board)
5. **Korra panel** can edit cells, add/remove rows and columns, apply filters, sort — all via chat
6. **AI trust signals** — see what Korra changed, when, with diffs
7. **Persist across page refresh** — all data and view configs survive reload
8. **Full styling control** — everything matches your design system, nothing looks like a generic library
