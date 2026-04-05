# Design Surface Progress

> Updated 2026-04-04. Tracks coverage of the 7 design surfaces from the project brief.
> Demo flow: see `/HAPPY-PATH-V3.md` (8-step narrative with cross-table enrichment + email drafts).

## Coverage Summary

| # | Surface | Status | Depth |
|---|---------|--------|-------|
| 1 | Database Home | Built | Deep |
| 2 | Table View | Built | Deep |
| 3 | Schema & Field Editor | Partial | Programmatic only |
| 4 | Filter, Sort & Group | Built | Deep |
| 5 | Row Detail | Not started | — |
| 6 | AI Collaboration Surface | Partial | Tools work, trust UI missing |
| 7 | Board / Calendar / Gallery | Not started | Stretch goal |

---

## 1. Database Home — Built (Deep)

- Chat-first dashboard with Korra centered, greeting, template cards
- Workspace sidebar: Overview, Ploys, Sites, Records, Resources, Notifications, Settings
- Connected sources with Brandfetch brand logos (Google Sheets, Analytics, Figma)
- Starter templates: "Prioritize stale leads", "Clean up contacts", "Analyze deal pipeline", "Audit content status"
- Korra-driven navigation: `openDatabase` tool call opens the right table
- Smooth transition: home chat → split view (AnimatePresence crossfade + instant sidebar collapse)
- Initial database derived from demo script (not hardcoded)

## 2. Table View — Built (Deep)

- tablecn data grid with 20 cell types (9 built-in + 11 custom: currency, percent, status, tags, datetime, email, phone, color, json, location, ref/refs)
- Inline editing with click-to-edit, keyboard nav (Tab, Enter, Escape, arrows)
- Copy/paste with TSV parsing (Excel/Sheets compatible)
- Undo/redo
- Column resizing, reordering, pinning, visibility toggle
- Row virtualization via TanStack Virtual (handles 960 rows)
- Context menu (right-click)
- Row selection with checkboxes
- Cell selection (click, shift-click, drag)
- Live API integration: loads from PloyDB API with schema-driven columns, falls back to faker demo data

## 3. Schema & Field Editor — Partial

**What works:**
- Korra's `addColumn` tool call programmatically adds columns with type and options
- Properly typed CellOpts (select, tags, status with colors, all simple variants)
- Row re-render forced after column add (React.memo workaround)

**What's missing:**
- No "+" button at end of column headers
- No field type picker dialog for manual column creation
- No constraints UI (required, unique)
- No option management UI for select/status fields
- No relation configuration UI

## 4. Filter, Sort & Group — Built (Deep)

- tablecn's full filter system with type-aware operators (text: contains/equals/startsWith, dates: before/after/between, numbers: gt/lt/equals, select: isAnyOf/isNoneOf)
- Multi-column sorting
- Row height toggle (short/medium/tall/extra-tall)
- Column visibility menu
- Korra can apply filters and sorts programmatically via tool calls
- Filter operator passes through Zod schema correctly

**What's missing:**
- No saved views (named filter/sort/group presets)
- No nested AND/OR logic builder
- No grouping

## 5. Row Detail — Not Started

Planned:
- Click row → shadcn Sheet side panel
- All fields editable in vertical form layout
- Relations navigable (click linked record → navigate)
- Prev/next row navigation without closing
- Audit trail at bottom

## 6. AI Collaboration Surface — Partial (Focus Area)

**What works:**
- Korra chat panel (right side, 380px fixed width)
- Streaming text via MockLanguageModelV3
- KorraAvatar with sky-blue "KO" initials
- 7 tool definitions with Zod schemas (openDatabase, editCells, addColumn, filterBy, sortBy, addRow, deleteRows)
- Tool call handler bridges chat → grid via GridHandle imperative ref
- 5-step scripted demo flow calibrated to live API data (960 contacts, 131 stale leads)
- Demo step synced to client message count (no server-side counter drift)

**What's missing — the trust UI:**
- Dry-run preview cards: Korra shows 5 sample rows before bulk applying, user approves/rejects
- Edit summary cards: "Updated 27 rows" card with click-to-expand diff view (red/green/yellow)
- Ploybook/Skill context tags near chat input
- Cell-level attribution: badge showing last editor (Korra icon vs user avatar) on hover/click
- AI-written cell indicator (subtle, discoverable)
- Row highlight pulse when Korra updates a row
- Highlight Changes mode: spotlight AI edits, dim everything else
- Audit trail with reasoning ("Set to High — VP-level role at 500+ company")

## 7. Board / Calendar / Gallery — Not Started

Stretch goal. Kanban board view is the most likely candidate.

---

## Priority

1. **Surface 6 (AI Collaboration)** — the differentiator. Dry-run cards + edit summary cards + attribution make the demo compelling
2. **Surface 5 (Row Detail)** — completes the happy path (review what Korra did, audit trail)
3. **Surface 3 (Schema Editor)** — supports the "add column" moment with a proper UI
4. **Surface 7 (Board View)** — only if time permits
