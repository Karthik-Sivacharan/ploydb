# Cell-Level Audit Attribution — Implementation Reference

> Written 2026-04-05. Documents the current implementation of cell-level edit tracking (Phase 4.1).

---

## Overview

Every cell-level value change (by Korra or the user) is recorded in a single React state `Map`. The last editor determines the triangle color on each cell. The full history is viewable via hover tooltip / click popover.

---

## Data Model

### Central State

```ts
// src/components/home/data-grid-view.tsx:182
const [cellAuditMap, setCellAuditMap] = React.useState<CellAuditMap>(new Map())
```

One `Map`, one owner (`DataGridView`). Resets on page refresh.

### Map Shape

```
Map<string, CellAuditEntry[]>

Key format: "rowId:columnId"
Example:    "row-42:fld_priority"

Value: array of entries (most recent last), capped at 10 per cell
```

### Entry Schema (`src/types/cell-attribution.ts`)

```ts
type CellActor = "korra" | "user"

interface CellAuditEntry {
  actor: CellActor        // Who made the change
  value: unknown           // New value after change
  prevValue: unknown       // Old value before change (null if first edit)
  timestamp: number        // Date.now() when it happened
  toolCallId?: string      // Links to AI SDK tool call ID (Korra only)
  context?: string         // Ploybook/skill name (e.g. "Follow-up Draft")
}
```

### Helper Functions (`src/types/cell-attribution.ts`)

- `cellKey(rowId, columnId)` → `"rowId:columnId"` composite key
- `getLastEdit(map, rowId, columnId)` → most recent `CellAuditEntry` or `undefined`

---

## Write Paths (Only Two)

### 1. Korra Edits → `src/lib/tool-handler.ts`

**In `editCells` case:**
1. Captures prev values BEFORE calling `grid.updateCells()`
2. Applies updates
3. Calls `grid.recordCellEdit()` for EVERY cell in the updates array

**In `addColumn` case (AI email generation):**
1. After async `/api/generate-emails` returns
2. Calls `grid.recordCellEdit()` for each generated email cell
3. Includes `context: "Follow-up Draft"`

Both paths use `actor: "korra"` and include `toolCallId` when available.

### 2. User Edits → `src/components/home/data-grid-view.tsx` (`handleDataChange`)

1. Compares `oldRow` vs `newRow` for each row in the data array
2. For each changed field (skipping `_` prefixed keys like `_id`, `_version`)
3. Calls `recordCellEdit(rowId, key, newValue, oldValue, "user")`

### Guards Against False "User" Attribution

Two ref flags prevent `handleDataChange` from falsely recording "user" edits when the data change was not a manual user action:

1. **`korraEditFlag`** (ref in `DataGridView`) — set to `true` by `GridHandle.updateCells()` before calling `tableMeta.onDataUpdate()`. When `handleDataChange` sees this flag, it skips "user" attribution recording and resets the flag. This prevents double-recording: Korra's edits flow through `updateCells → onDataUpdate → handleDataChange`, but only the tool-handler records them as "korra".

2. **`addColumnFlag`** (ref in `DataGridView`) — set to `true` by `handleAddColumn` before the row spread (`prev.map(row => ({ ...row }))`). This spread creates new object references to force re-renders when a column is added, but no cell values actually change. The flag suppresses all attribution recording for that cycle.

**Bug this fixed (2026-04-05):** Lookup columns (`fld_industry`, `fld_company_size`) added by Korra in Step 2 showed amber "You" triangles instead of sky-blue "Korra" triangles. Root cause: `updateCells` flowed through `handleDataChange` which recorded edits as "user" before the tool handler could record them as "korra". The `addColumn` row spread also triggered spurious "user" entries.

---

## Read Path (Triangle Rendering)

### Prop Chain

```
DataGridView (owns cellAuditMap)
  → DataGridWithToolbar (passes through)
    → DataGrid (passes through, src/components/data-grid/data-grid.tsx)
      → DataGridRow (looks up entries per cell, src/components/data-grid/data-grid-row.tsx)
        → CellAttributionIndicator (renders triangle + tooltip + popover)
```

### Per-Cell Lookup (`data-grid-row.tsx`)

```ts
const rowId = (row.original as Record<string, unknown>)._id as string
const auditEntries = columnId !== "select" && rowId && cellAuditMap
  ? cellAuditMap.get(cellKey(rowId, columnId)) ?? null
  : null
```

- Excludes "select" (checkbox) column
- Returns `null` (no triangle) if cell was never edited
- Returns entry array (triangle appears) if any edits exist

### Triangle UI (`src/components/cells/cell-attribution-indicator.tsx`)

- **Sky-blue triangle** (top-right corner) = Korra made the last change
- **Amber triangle** = User made the last change
- **No triangle** = original data, never edited
- **Hover** → Tooltip: "Last edited by Korra · 2 minutes ago"
- **Click** → Popover with git-style history (newest first, shows old → new per entry)
- Event propagation stopped (`stopPropagation` on click/mousedown/doubleclick) so grid isn't disrupted

---

## GridHandle Integration (`src/types/grid-handle.ts`)

```ts
recordCellEdit?: (
  rowId: string,
  columnId: string,
  value: unknown,
  prevValue: unknown,
  actor: CellActor,
  toolCallId?: string,
  context?: string
) => void
```

Exposed on the imperative handle so `tool-handler.ts` can call it without direct state access.

---

## What Gets Tracked vs Not

| Event | Tracked? | Where |
|---|---|---|
| Korra edits cells (editCells tool) | Yes | tool-handler.ts |
| User edits a cell inline | Yes | handleDataChange |
| Korra adds a column | No (column-level, not cell) | Column has `meta.source` instead |
| Korra fills new column values | Yes | tool-handler.ts (editCells or email generation) |
| Filter/sort changes | No (no cell values change) | Separate amber/sky badge on filter buttons |
| Row deletions | No (rows are gone) | N/A |
| Initial seed/API data | No (map starts empty) | N/A |

---

## Demo Flow Attribution

| Step | Columns | Cells | Actor |
|---|---|---|---|
| 0 (open DB) | — | 0 | — |
| 1 (filter) | — | 0 | — |
| 2 (enrich) | fld_industry, fld_company_size | 262 | korra |
| 3 (priority dry-run) | fld_priority | 5 | korra |
| 4 (proactive insight) | fld_priority | 23 | korra |
| 5 (bulk update) | fld_priority | 27 | korra |
| 6 (question) | — | 0 | — |
| 7 (email drafts) | fld_followup_draft | ~30 | korra |

User can edit any cell at any time → amber triangle replaces sky on that cell.

---

## Future: Chat Panel Integration

The `cellAuditMap` can be consumed by the chat panel to show edit activity. Two approaches:

**Option A — Lift state:** Move `cellAuditMap` up to `HomeDashboard` where both grid and chat live.

**Option B — Callback:** Add `onCellEdit` callback that fires alongside `recordCellEdit`, notifying the chat panel of changes.

The `toolCallId` field links audit entries back to specific chat message tool calls, enabling correlation like "this tool call touched 27 cells."

---

## Audit Trail Toggle

A Switch in the Korra chat panel header controls triangle visibility.

- **State:** `showAuditTrail` boolean, owned by `HomeDashboard`, default `true` (ON)
- **Toggle location:** Left side of the Korra panel header (same Switch styling as autopilot toggle)
- **Prop chain:** `HomeDashboard` → `DataGridView` → `DataGridWithToolbar` → `DataGrid` → `DataGridRow`
- **Behavior:** When OFF, `CellAttributionIndicator` is not rendered. The `cellAuditMap` continues recording edits regardless — toggling back ON shows all accumulated data.
- **Files:** `korra-chat.tsx` (toggle UI), `home-dashboard.tsx` (state owner)

---

## Known Limitation

`rowIndex` in demo scripts maps to the full data array position, not filtered view position. Works for the scripted demo (deterministic order), but could misalign if user manually sorts/filters before demo starts. This is a demo script concern, not an attribution system bug.

---

## Files

| File | Role |
|---|---|
| `src/types/cell-attribution.ts` | Types + helpers |
| `src/components/cells/cell-attribution-indicator.tsx` | Triangle + tooltip + popover UI |
| `src/types/grid-handle.ts` | `recordCellEdit` on GridHandle |
| `src/lib/tool-handler.ts` | Records Korra edits |
| `src/components/home/data-grid-view.tsx` | Owns state, records user edits |
| `src/components/data-grid/data-grid.tsx` | Passes cellAuditMap to rows |
| `src/components/data-grid/data-grid-row.tsx` | Looks up entries, renders indicator |
| `src/components/home/korra-chat.tsx` | Audit Trail toggle in panel header |
| `src/components/home/home-dashboard.tsx` | Owns `showAuditTrail` state |
