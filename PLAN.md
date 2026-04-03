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
| Data Grid | tablecn data-grid (`@diceui/data-table`) | Editable spreadsheet grid with 9 built-in cell types, filtering, sorting, column ops, keyboard nav, copy/paste, undo/redo |
| Table Engine | TanStack Table v8 | Headless state management (bundled inside tablecn) |
| Virtualization | TanStack Virtual | Row virtualization for 150+ rows (bundled inside tablecn) |
| Data Store | Zustand + persist middleware | Shared state for rows, filters, sorts, views. Persists to localStorage |
| Mock Data | @faker-js/faker | Seed 150 CRM rows with all 20 field types |
| AI Chat | Vercel AI SDK (`useChat`) | Korra panel — `onToolCall` calls Zustand actions |
| Chat UI | @assistant-ui/react OR custom shadcn | Message list, streaming, tool result rendering |
| Drag & Drop | dnd-kit | Column reordering (tablecn has this), kanban board view |

---

## What tablecn Data Grid Gives Us for Free

tablecn (formerly sadmann7/shadcn-table) is installed via shadcn registry — source files copied into your project, full styling control. It provides:

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

---

## What We Still Build (11 custom cell types + everything else)

### Custom Cell Variants (extending tablecn's 9 built-in types)

These are wrappers/extensions of existing tablecn variants:

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

**Effort:** ~1 day. Most are thin wrappers around existing tablecn cell types with display formatting changes. Only `color`, `ref`, and `refs` need truly new edit widgets.

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
    │   tablecn         │    │   Vercel AI SDK    │
    │   data-grid       │    │   useChat()        │
    │   + 11 custom     │    │   onToolCall →     │
    │     cell types    │    │     Zustand action │
    │   + row detail    │    │                    │
    │   + board view    │    │                    │
    └───────────────────┘    └────────────────────┘
```

---

## Styling Control

**You own every pixel.** tablecn uses the shadcn registry model — source files are copied into your project, not installed as a dependency. You can:

- Modify any cell variant's display or edit component
- Change colors, typography, spacing, animations
- Add new cell variants by following the existing pattern
- Override any tablecn component with your own
- All styling uses Tailwind + your CSS variable design tokens

Example of customizing a cell variant:

```tsx
// This is YOUR file in YOUR project. Modify freely.
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

## Phase 1: Foundation

### 1.1 — Scaffold
- [ ] Next.js app in `src/ploy-app`
- [ ] Tailwind config with design tokens (colors, typography, spacing, radii)
- [ ] Install shadcn/ui, configure with your tokens
- [ ] Install tablecn data-grid via shadcn registry: `pnpm dlx shadcn@latest add "@diceui/data-table"`
- [ ] Install Zustand, @faker-js/faker

### 1.2 — Zustand Store
- [ ] Define store with state shape (rows, schema, filters, sorts, views, auditLog)
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
- [ ] Generate ~150 leads with realistic data:
  - Weighted status distribution (40% New, 25% Contacted, 15% Qualified, 10% Proposal, 5% Won, 5% Lost)
  - Consistent relationships (contacts belong to companies)
  - 5-8 hand-tuned "hero" rows for demos
  - Temporal coherence (created_at < updated_at < next_followup)
  - Per-entity-type faker seeds for stability
- [ ] Generate a small "Team Members" table (10 people) for ref fields
- [ ] Generate a small "Deals" table (30 deals) for refs fields
- [ ] Seed on first load if store is empty
- [ ] "Reset data" button to re-seed

### 1.4 — Wire tablecn Data Grid
- [ ] Connect tablecn data-grid to Zustand store data
- [ ] Map schema fields to tablecn column definitions with appropriate `meta.cell.variant`
- [ ] Map the 9 built-in field types to tablecn variants
- [ ] Wire `onDataUpdate` → Zustand `updateCell` action
- [ ] Wire `onRowsDelete` → Zustand `deleteRows` action
- [ ] Wire `onRowAdd` → Zustand `addRow` action
- [ ] Verify inline editing, keyboard nav, copy/paste, undo/redo all work
- [ ] Horizontal scroll for 20+ columns
- [ ] Sticky first column (Company Name)

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
- [ ] `ref` — Display: linked record name as clickable badge/chip. Edit: shadcn `<Combobox>` (`<Command>` + `<Popover>`) searching the linked table by name
- [ ] `refs` — Display: row of record name badges (overflow as +N). Edit: multi-select `<Combobox>` with search

### 2.6 — Register All Variants
- [ ] Extend tablecn's cell variant registry to include all 20 types
- [ ] Map each schema field type to its variant in column definitions
- [ ] Ensure display formatting, edit widgets, and validation work for all types

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
  - Change field type (dropdown of 20 types — visual type picker)

### 3.2 — Add Column
- [ ] "+" button as last column header
- [ ] Opens field type picker (icon grid of 20 types) → name input → creates column
- [ ] New column appears at the end with appropriate default variant

---

## Phase 4: Row Operations

### 4.1 — Add Row
- [ ] "+" button at bottom of table
- [ ] Creates empty row, auto-focuses first editable cell
- [ ] Row appears with default values

### 4.2 — Bulk Actions
- [ ] tablecn provides row selection — we add a floating bulk action bar:
  - Delete selected (N rows)
  - Set field to value (bulk update)
  - Duplicate selected

### 4.3 — Row Detail Panel
- [ ] Expand icon on each row (or double-click row)
- [ ] shadcn `<Sheet>` slides in from right
- [ ] All fields shown in vertical form layout using the same cell editors
- [ ] Related records (ref/refs) are clickable → navigate to that record
- [ ] Audit history section at bottom (timeline of changes to this row)
- [ ] Navigate between rows with up/down arrows while panel is open

### 4.4 — Row Context Menu
- [ ] Extend tablecn's built-in context menu:
  - Expand row
  - Duplicate row
  - Copy row data
  - Delete row

---

## Phase 5: Views + Grouping

### 5.1 — Group By
- [ ] "Group" button in toolbar
- [ ] Dropdown to select a field (works best with select/status/tags)
- [ ] Rows grouped into collapsible sections
- [ ] Section header: group value badge + count
- [ ] Chevron to toggle collapse/expand
- [ ] "Hide empty groups" toggle

### 5.2 — Saved Views
- [ ] Tab bar above table: view tabs + "+" button
- [ ] Each view stores: name, type (table/board), filters, sorts, groupBy, visible columns, column order, column widths
- [ ] Auto-save: changing filters/sorts/columns updates the active view
- [ ] "+" creates new view (name prompt, type picker)
- [ ] Right-click view tab: rename, duplicate, delete
- [ ] Default views: "All Leads", "My Pipeline" (filtered to assigned=me), "Hot Leads" (filtered to tags contains Hot Lead)

---

## Phase 6: Search + Command Palette

### 6.1 — Search
- [ ] tablecn has built-in search with match navigation — customize styling to match design tokens

### 6.2 — Command Palette
- [ ] Cmd+K opens shadcn `<Command>` palette
- [ ] Groups:
  - **Quick Filters**: "Status is Qualified", "Source is Referral", etc.
  - **Sort**: "Sort by Deal Size", "Sort by Last Contacted"
  - **Views**: "Go to My Pipeline", "Go to Hot Leads"
  - **Actions**: "Add new row", "Reset data", "Open Korra"
- [ ] Fuzzy search across all commands

---

## Phase 7: Korra AI Panel

### 7.1 — Chat UI
- [ ] Right side panel (collapsible, resizable via react-resizable-panels)
- [ ] Chat message list with streaming
- [ ] Input area with send button
- [ ] Korra avatar + typing indicator
- [ ] Sparkle icon toggle button to open/close panel

### 7.2 — Tool Definitions (Zod schemas)
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

### 7.3 — Tool Execution Bridge
- [ ] `onToolCall` in useChat → calls corresponding Zustand action
- [ ] Zustand action → tablecn's `onDataUpdate` / TanStack Table state → UI updates
- [ ] Tool results render as custom components in chat:
  - Cell edit → mini diff card (field: old → new)
  - Bulk update → "Updated N rows" summary with expandable details
  - Filter applied → filter badge preview
  - Row added → "Created: [row name]" with link to expand

### 7.4 — Demo Mode (no API key needed)
- [ ] `MockLanguageModelV1` from `ai/test` swapped at route level
- [ ] Pre-scripted flows triggered by keyword matching:
  - "enrich leads" → batch updates company info, website, employee count
  - "show hot leads" → applies filter (tags contains "Hot Lead")
  - "sort by deal size" → applies descending sort on currency field
  - "qualify stale leads" → finds leads with last_contacted > 30 days ago, updates status
  - "summarize pipeline" → generates text response with deal count/value by stage
- [ ] Optional: real Claude API via `@ai-sdk/anthropic` for freeform requests (needs ANTHROPIC_API_KEY)

### 7.5 — AI Trust Signals
- [ ] Sparkle icon (✨) on cells modified by Korra — subtle, not overwhelming
- [ ] Subtle background tint on AI-touched cells (e.g., faint purple-50)
- [ ] "Modified by Korra" badge with timestamp in row detail panel
- [ ] Audit log tab in row detail: timeline of all changes with before/after diffs
- [ ] Cell-level accept/revert: hover AI-modified cell → "Accept" (removes indicator) or "Revert" (restores old value)
- [ ] Global "Korra Activity" feed accessible from panel header — recent agent mutations across all rows

---

## Phase 8: Board View (Kanban)

### 8.1 — Board Layout
- [ ] View type toggle in view tabs (Table | Board)
- [ ] Columns = status/select field values (New, Contacted, Qualified, Proposal, etc.)
- [ ] Cards = rows, showing: Company Name, Contact Name, Deal Size, Tags
- [ ] Card count per column in header
- [ ] Color-coded column headers matching status colors

### 8.2 — Drag & Drop
- [ ] dnd-kit multi-container sortable
- [ ] Drag cards between columns → updates status field in Zustand → audit logged
- [ ] DragOverlay with card preview (slight scale + shadow)
- [ ] Drag within column to reorder (stretch goal)

### 8.3 — Card Interaction
- [ ] Click card → opens same row detail sheet as table view
- [ ] Quick-edit badge on card hover (edit deal size, tags without opening detail)

---

## Phase 9: Database Home

### 9.1 — Database List
- [ ] Grid/list of databases in workspace
- [ ] Cards showing: name, icon, row count, last modified, field count
- [ ] Three pre-seeded databases: Sales Pipeline, Team Members, Deals

### 9.2 — Create Database
- [ ] "New Database" button
- [ ] Name input + optional template selection (CRM, Content Calendar, Inventory)
- [ ] AI option: "Describe your database" → Korra creates schema + seed data

---

## Phase 10: Polish

- [ ] Loading skeletons for initial data load
- [ ] Empty states (no rows, no filter results, empty database)
- [ ] Row count footer ("Showing 42 of 150 leads · 3 filters active")
- [ ] Keyboard shortcuts help modal (? key)
- [ ] Responsive: collapse Korra panel on smaller screens
- [ ] Animations: smooth transitions for filter/sort changes, row additions/deletions, panel open/close
- [ ] Error states: invalid JSON, invalid URL, required field empty
- [ ] "Reset data" button in settings/toolbar

---

## Parallel Worktree Strategy

| Worktree | Phases | Effort | Dependencies |
|---|---|---|---|
| **A: Foundation** | 1.1, 1.2, 1.3, 1.4 | ~4-6 hrs | None (do this first) |
| **B: Custom Cell Types** | 2.1–2.6 | ~4-6 hrs | Needs Phase 1 |
| **C: Column + Row Ops** | 3.1–3.2, 4.1–4.4 | ~3-4 hrs | Needs Phase 1 |
| **D: Views + Grouping** | 5.1–5.2 | ~3-4 hrs | Needs Phase 1 |
| **E: Search + Cmd Palette** | 6.1–6.2 | ~2-3 hrs | Needs Phase 1 |
| **F: Korra Panel** | 7.1–7.5 | ~6-8 hrs | Needs Phase 1 + Phase 2 |
| **G: Board View** | 8.1–8.3 | ~4-6 hrs | Needs Phase 1 |
| **H: Database Home** | 9.1–9.2 | ~2-3 hrs | Needs Phase 1 |
| **I: Polish** | 10 | ~4-6 hrs | Needs everything else |

**Phase 1 (Foundation) must complete first.** Then B–H can run in parallel. Phase I (Polish) runs last.

**Total estimated effort: ~30-45 hours** (fits comfortably in a 3-day sprint with focus time)

---

## File Structure

```
src/ploy-app/
├── app/                          # Next.js app router pages
│   ├── layout.tsx
│   ├── page.tsx                  # Database home
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Vercel AI SDK endpoint (or mock)
│   └── [dbId]/
│       └── page.tsx              # Table/Board view + Korra panel
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
│   ├── data-grid/                # tablecn data-grid (copied via registry, fully owned)
│   │   ├── data-grid.tsx         # Main grid component
│   │   ├── data-grid-cells.tsx   # Built-in 9 cell variants
│   │   ├── data-grid-column-header.tsx
│   │   ├── data-grid-filter-menu.tsx
│   │   ├── data-grid-sort-menu.tsx
│   │   ├── data-grid-view-menu.tsx
│   │   └── ...
│   │
│   ├── cells/                    # Custom cell variants (11 PloyDB-specific)
│   │   ├── currency-cell.tsx
│   │   ├── percent-cell.tsx
│   │   ├── status-cell.tsx
│   │   ├── tags-cell.tsx
│   │   ├── datetime-cell.tsx
│   │   ├── email-cell.tsx
│   │   ├── phone-cell.tsx
│   │   ├── color-cell.tsx
│   │   ├── json-cell.tsx
│   │   ├── location-cell.tsx
│   │   ├── ref-cell.tsx
│   │   └── refs-cell.tsx
│   │
│   ├── table/                    # Table view extensions
│   │   ├── table-toolbar.tsx     # Toolbar with filter/sort/group/search/view buttons
│   │   ├── column-header-menu.tsx # Enhanced column header dropdown
│   │   ├── add-column.tsx        # Field type picker + name input
│   │   ├── add-row.tsx
│   │   ├── bulk-actions.tsx      # Floating bar for selected rows
│   │   └── view-tabs.tsx         # Saved view tab bar
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
│   │   ├── korra-panel.tsx       # Resizable right panel shell
│   │   ├── chat-messages.tsx     # Message list with streaming
│   │   ├── tool-results.tsx      # Custom components for tool call results
│   │   ├── ai-trust-signals.tsx  # Sparkle indicators, accept/revert controls
│   │   └── demo-scripts.ts      # Pre-scripted demo flows for MockModel
│   │
│   └── database-home/            # Database listing
│       ├── database-grid.tsx
│       └── create-database.tsx
│
├── store/                        # Zustand store
│   ├── index.ts                  # Main store definition with persist middleware
│   ├── actions.ts                # All mutation actions
│   ├── audit.ts                  # Audit logging wrapper (who, what, when, diff)
│   └── types.ts                  # TypeScript types for schema, rows, views, audit entries
│
├── data/                         # Seed data
│   ├── seed.ts                   # Faker seed script (per-entity-type seeds)
│   ├── schema.ts                 # CRM field definitions (20 types with options)
│   └── hero-rows.ts              # Hand-crafted demo rows for presentations
│
├── lib/                          # Utilities
│   ├── field-types.ts            # Field type registry (icon, operators, default value, variant mapping)
│   ├── formatters.ts             # Display formatters (currency, date, phone, etc.)
│   └── ai-tools.ts              # Vercel AI SDK tool definitions (Zod schemas) for Korra
│
└── styles/
    └── tokens.css                # Design system CSS variables
```

---

## Success Criteria

After all phases, the prototype should:

1. **Render a full CRM table** with 150+ rows and all 20 field types, styled with your design tokens
2. **Inline edit any cell** by clicking — appropriate editor for each field type, with keyboard nav, copy/paste, undo/redo
3. **Filter, sort, group** with type-aware operators and collapsible groups
4. **Save and switch between views** — named presets with different filters/sorts/columns (table + board)
5. **Korra panel** can edit cells, add/remove rows and columns, apply filters, sort — all via chat, with scripted demos
6. **AI trust signals** — sparkle icons on AI-modified cells, audit timeline, cell-level accept/revert
7. **Persist across page refresh** — all data, view configs, and audit history survive reload
8. **Full styling control** — everything matches your design system, no generic library aesthetics
9. **Board view** — kanban with drag-and-drop that updates the underlying data
10. **Database home** — navigate between multiple databases in the workspace
