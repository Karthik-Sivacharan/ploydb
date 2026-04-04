# Demo Flow Implementation Spec

> Engineering spec for the 5-step happy path demo. Covers API route structure, tool call payloads, client-side handlers, layout animation, and component wiring.

---

## Architecture Overview

```
home-dashboard.tsx (page owner)
├── data, columns, table, tableMeta  ← lifted state (Option A)
├── useChat()                        ← single instance, shared
│
├── KorraChat                        ← receives chat + onToolCall results
│   ├── home variant (centered)      ─┐
│   └── panel variant (right side)   ─┤── ONE motion.div, layout animated
│                                      │
│   ├── Context tags (Badge)          ← source parts from messages
│   ├── Tool result cards             ← rendered per tool invocation
│   │   ├── FilterBadgeCard
│   │   ├── DryRunPreviewCard (approve/reject)
│   │   ├── EditSummaryCard (expandable diff)
│   │   └── AddColumnCard
│   └── PromptInput (pinned bottom)
│
└── DataGridView                     ← receives lifted state
    ├── toolbar + database picker
    └── DataGrid (tablecn)
```

---

## State Lifting (Step 0 — Do First)

Move grid state from `DataGridView` into `home-dashboard.tsx` so both the grid and chat can access it:

```tsx
// home-dashboard.tsx
const [data, setData] = useState<FlatRow[]>([])
const [columns, setColumns] = useState<ColumnDef<FlatRow>[]>([])
const tableRef = useRef<{ table: Table<FlatRow>; tableMeta: TableMeta }>()

// Pass down to DataGridView
<DataGridView data={data} columns={columns} onDataChange={setData} tableRef={tableRef} />

// Pass to onToolCall handler
function handleToolCall(toolCall) {
  const { table, tableMeta } = tableRef.current
  switch (toolCall.toolName) {
    case "filterBy": table.setColumnFilters(toolCall.args.filters); break;
    case "editCells": tableMeta.onDataUpdate(toolCall.args.updates); break;
    case "addColumn": setColumns(prev => [...prev, toolCall.args.column]); break;
  }
}
```

---

## Layout Animation (Step 1)

Single `motion.div` container wrapping `KorraChat`. Morphs from centered to right-pinned.

```tsx
<motion.div
  layout
  style={{
    width: view === "split" ? 380 : "100%",
    maxWidth: view === "split" ? 380 : 640,
    margin: view === "split" ? 0 : "0 auto",
  }}
  transition={{ type: "spring", stiffness: 200, damping: 30 }}
>
  <KorraChat chat={chat} onToolCall={handleToolCall} />
</motion.div>
```

Table slides in with `AnimatePresence`:

```tsx
<AnimatePresence>
  {view === "split" && (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 30, delay: 0.1 }}
      className="min-w-0 flex-1 overflow-hidden"
    >
      <DataGridView ... />
    </motion.div>
  )}
</AnimatePresence>
```

**Transition trigger:** After Step 0 response finishes streaming → 1s delay → `setView("split")`

---

## Mock API Route — `/api/chat/route.ts`

Uses `MockLanguageModelV3` with a step counter. Each POST advances the counter and returns the next scripted response.

### Stream Format Per Step

Each step returns a combination of:
- **Text parts** — Korra's message text (streamed character by character)
- **Tool invocation parts** — tool calls with `state: "call"` then `state: "result"`
- **Source parts** — context tags (ploybook name, table reference)

### Step-by-Step Payloads

#### Step 0 — Greeting + Open Table

```
Source: { type: "source", source: { title: "Contacts", description: "960 rows" } }
Source: { type: "source", source: { title: "Ploybook: Lead Prioritization" } }
Text: "I see 960 contacts in your CRM. I'll open that up and help you prioritize stale leads."
```

No tool calls. Client waits for stream to finish, then triggers layout transition.

#### Step 1 — Filter Contacts

```
Text: "I'll filter to leads you haven't contacted in 60+ days."
Tool call: filterBy
  args: {
    filters: [
      { id: "tags", value: "lead" },
      { id: "lastContacted", value: { operator: "olderThan", days: 60 } }
    ]
  }
  result: { applied: true, matchCount: 47 }
```

Client `onToolCall`:
```tsx
table.setColumnFilters([
  { id: "tags", value: "lead" },
  { id: "lastContacted", value: "60_days_ago" }
])
```

Chat renders: filter badge card showing applied filters + "47 matches"

#### Step 2 — Add Priority Column + Dry-Run Preview

```
Source: { type: "source", source: { title: "Ploybook: Contact Prioritization" } }
Text: "I'll add a Priority column based on their title seniority and company size."
Tool call: addColumn
  args: { id: "priority", label: "Priority", variant: "select", options: [...] }
  result: { added: true }
Tool call: editCells
  args: {
    preview: true,
    sample: [
      { rowIndex: 0, columnId: "priority", value: "High", reason: "VP at 500+ company" },
      { rowIndex: 1, columnId: "priority", value: "Medium", reason: "Manager at 200 company" },
      ...3 more
    ]
  }
  result: awaiting_approval
```

Chat renders:
1. "Added Priority column" confirmation card
2. Dry-run preview card — mini-table with 5 rows showing proposed values + reasoning
3. Approve / Reject buttons on the card

On Approve → `addToolOutput({ approved: true })` → API returns next chunk with full editCells

#### Step 3 — Human Corrects + Bulk Update

```
Text: "Got it — I'll apply High priority to all healthcare contacts."
Tool call: editCells
  args: {
    updates: [
      { rowIndex: 5, columnId: "priority", oldValue: "Low", newValue: "High" },
      { rowIndex: 12, columnId: "priority", oldValue: "Medium", newValue: "High" },
      ...45 more
    ],
    summary: { count: 47, column: "priority", reason: "Healthcare industry contacts" }
  }
  result: { updated: 47 }
```

Chat renders: Edit summary card — "Updated 47 rows — Priority for healthcare contacts"
Card is expandable → shows diff view (mini-table with old → new values, red/green)

Client `onToolCall`:
```tsx
tableMeta.onDataUpdate(toolCall.args.updates)
```

#### Step 4 — Row Detail (No Chat Interaction)

This step is triggered by clicking a row in the grid, not by a chat message.
Opens a `Sheet` side panel with:
- All fields in form layout
- Audit timeline at bottom:
  - "Korra set Priority to High — VP-level role at 500+ company" (Korra avatar, timestamp)
  - "You changed Priority from Low to High" (User avatar, timestamp)

---

## Tool Result Card Components

All rendered inside chat messages when a tool invocation is present.

### FilterBadgeCard
- Shows applied filter chips: `Tags contains "lead"` + `Last Contacted > 60 days`
- Badge variant with filter icon
- "47 matches" count

### DryRunPreviewCard
- Mini-table: 5 rows with columns [Contact, Company, Proposed Priority, Reason]
- Approve button → calls `addToolOutput({ approved: true })`
- Reject button → calls `addToolOutput({ approved: false })`, Korra asks for corrections
- Uses existing `Badge`, table HTML, `Button` components

### EditSummaryCard
- Header: "Updated 47 rows — Priority for healthcare contacts"
- Expandable (click to toggle)
- Expanded: diff table with columns [Contact, Before, After]
- Before values: `text-destructive` with line-through
- After values: `text-green-500` (or `text-chart-2`)
- Uses `Collapsible` from shadcn

### AddColumnCard
- Simple confirmation: "Added Priority column (Select type)"
- Column icon + name + type badge

---

## Source Part Rendering

Source parts appear as context tags above the message text:

```tsx
// In message renderer
{message.parts.filter(p => p.type === "source").map(source => (
  <Badge variant="outline" className="gap-1 text-xs">
    <Paperclip className="size-3" />
    {source.source.title}
  </Badge>
))}
```

---

## Transition Timing

```
t=0s     User clicks template / sends message
t=0s     sendMessage() fires, chat stays centered
t=0.1s   Source tags appear (context badges)
t=0.3s   Korra typing indicator shows
t=0.5s   Text starts streaming
t=2-3s   Text finishes streaming
t=3-4s   1s pause after stream completes
t=4s     setView("split") triggers
t=4-4.5s Chat animates to right (spring, 0.5s)
t=4.1s   Table slides in from left (spring, staggered 0.1s delay)
t=4.5s   Sidebar collapses to icon mode
t=5s     Layout settled — user sees grid + chat
```

---

## Build Order

1. **Layout animation** — `motion.div layout` on chat container, `AnimatePresence` on grid
2. **Lift grid state** — move data/columns/table out of `DataGridView`, pass as props
3. **Mock API route** — script 5 steps with text + tool calls + source parts
4. **Tool result cards** — FilterBadgeCard, DryRunPreviewCard, EditSummaryCard, AddColumnCard
5. **`onToolCall` handler** — bridge tool calls to table/tableMeta APIs
6. **Source part renderer** — context tag badges in messages
7. **Row detail Sheet** — form layout + audit timeline (Step 4)

---

## Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `src/app/api/chat/route.ts` | Modify | 5-step scripted responses with tool calls |
| `src/components/home/home-dashboard.tsx` | Modify | Lift state, add animation, wire onToolCall |
| `src/components/home/korra-chat.tsx` | Modify | Render tool cards + source tags in messages |
| `src/components/home/data-grid-view.tsx` | Modify | Accept lifted state as props |
| `src/components/home/tool-cards/filter-badge-card.tsx` | Create | Filter result card |
| `src/components/home/tool-cards/dry-run-preview-card.tsx` | Create | Preview with approve/reject |
| `src/components/home/tool-cards/edit-summary-card.tsx` | Create | Summary + expandable diff |
| `src/components/home/tool-cards/add-column-card.tsx` | Create | Column added confirmation |
| `src/components/row-detail/row-detail-sheet.tsx` | Create | Row detail side panel |
| `src/components/row-detail/audit-timeline.tsx` | Create | Edit history timeline |
