# Column & Cell Attribution System

> Design spec for visual indicators showing where data comes from and who edited it.

## Two Levels

### 1. Column-Level Source (Built)

**What it does:** Marks entire columns based on where their data comes from.

**Current implementation:**
- `meta.source` on ColumnDef — typed as `"lookup" | "ai-generated"`
- `source` field in AddColumnOptions, Zod schema, tool handler
- Module-augmented into TanStack Table's ColumnMeta type

**Visual treatment for `source: "lookup"`:**
- Link2 icon in column header (teal-500) with tooltip "Linked from another table" ✅ Working
- Subtle teal background tint on entire column (header + all cells) — **not rendering yet, needs fix**

**Visual treatment for `source: "ai-generated"` (future):**
- Sparkles or wand icon in column header
- No tint (or a very subtle purple/sky tint)
- Shimmer animation on first appearance that fades after a few seconds

**Where it lives:** Column definition metadata — never sent to API.

### 2. Cell-Level Attribution (Not Built)

**What it does:** Tracks who last edited each cell (Korra or the user). Shows a small corner indicator on each cell.

**Data structure:**
```ts
// On each row's data object (prefixed with _ so API persistence skips it)
{
  _id: "row-123",
  fld_name: "Sarah Chen",
  fld_priority: "high",
  _attribution: {
    fld_priority: "korra",    // Korra set this via editCells tool
    fld_name: "user",         // User edited this manually
    // fields without an entry = original data, no indicator
  }
}
```

**How it gets set:**
- **Korra edits:** tool-handler.ts writes `_attribution[columnId] = "korra"` when processing `editCells` tool calls
- **User edits:** handleDataChange callback in data-grid-view.tsx writes `_attribution[columnId] = "user"` when it detects a manual cell change
- **New columns:** When Korra adds a column and fills it, all filled cells get `"korra"` attribution
- **Original data:** No attribution entry = data from the API, no indicator shown

**Visual treatment:**
- Small solid triangle in the top-right corner of the cell
- Korra: sky/blue triangle
- User: no triangle (or a subtle green one — TBD)
- No attribution: nothing shown
- On hover/click: tooltip or badge showing "Last edited by Korra" or "Last edited by You"

**Where it lives:** Row data with `_` prefix — skipped by API persistence (already handled: handleDataChange skips `_` prefixed keys).

## Implementation Plan (Cell-Level)

### Step 1: Attribution tracking
- Add `_attribution: Record<string, "korra" | "user">` to row data type
- In tool-handler.ts `editCells` case: after calling `grid.updateCells()`, also update `_attribution` on affected rows
- In data-grid-view.tsx `handleDataChange`: when a cell changes and it's a user edit (not from tool handler), set `_attribution[key] = "user"`

### Step 2: Cell renderer
- In data-grid-cell-wrapper.tsx: read `row.original._attribution?.[columnId]`
- Render a small CSS triangle (border trick or clip-path) in the top-right corner
- Color based on value: `"korra"` = sky-500, `"user"` = transparent or green-500

### Step 3: Hover/click detail
- On cell hover: show tooltip with "Korra" or "You" + timestamp (if tracked)
- On cell click (when attribution badge is visible): show a small popover with edit history

### Step 4: Highlight Changes Mode (future)
- Toggle in chat panel or toolbar
- When active: all cells WITHOUT Korra attribution get dimmed (opacity 0.35, desaturated)
- Korra-attributed cells get a subtle glow ring
- Uses the `dim` and `glow` variants from motion.ts

## Column Tint Fix Needed

The teal background tint for lookup columns (header + cells) is not rendering despite the classes being added (`bg-teal-50/60`, `bg-teal-50/40`). Possible causes:
- The cell/header div might have an opaque background that covers the tint
- The tint classes might be overridden by other background classes (e.g., `bg-background`, `bg-muted`)
- The tint might need to be applied to a different element in the DOM tree
- May need `!important` or a more specific selector

Investigation needed: check what existing background classes are on the header/cell divs and whether the teal classes are being overridden.
