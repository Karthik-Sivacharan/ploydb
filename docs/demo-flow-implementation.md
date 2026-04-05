# Demo Flow Implementation Spec — Happy Path V4

> Engineering spec for the 8-step scripted demo (steps 0-7).
> All data comes from the **live Railway API** — no Faker demo data.
> The Contacts table (960 rows) links to the Companies table via `fld_company` ref.
> Lookup columns (Industry, Company Size) resolve through this ref automatically.
>
> **V4 changes from V3:**
> - Lookup columns resolve from API (no hardcoded ENRICHMENT_UPDATES)
> - Step 2 is lookup-only + permission question ("want me to scan industries?")
> - Step 3 is new: `searchNews` fake research tool + sort by industry
> - Step 4 fills ALL 130 rows with Priority (no empties)
> - Step 5 sorts by Priority (High first)
> - Step 6 acknowledges user manual edits + asks about emails
> - `demo-data.ts` ENRICHMENT_UPDATES removed (dead file)
> - `searchNews` tool added (no-op handler, UI renders research card in chat)

---

## Architecture Overview

```
home-dashboard.tsx (page owner)
├── data, columns, table, tableMeta  ← lifted state
├── useChat()                        ← single instance, shared
│
├── KorraChat                        ← receives chat + onToolCall results
│   ├── home variant (centered)      ─┐
│   └── panel variant (right side)   ─┤── ONE motion.div, layout animated
│                                      │
│   ├── Context tags (Badge)          ← source parts from messages
│   ├── Tool result cards             ← rendered per tool invocation
│   │   ├── FilterBadgeCard
│   │   ├── ResearchCard (searchNews) ← NEW: globe icon, industries ticking off
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

## Data Source

All demo data comes from the **PloyDB Railway API**:
- **Contacts** (960 rows): `fld_name`, `fld_email`, `fld_phone`, `fld_title`, `fld_company` (ref → companies), `fld_tags`, `fld_last_contacted`
- **Companies** (180 rows): `fld_name`, `fld_domain`, `fld_industry` (select), `fld_size` (select), `fld_notes`, `fld_hq`

Key numbers (as of 2026-04-05):
- 960 total contacts, 265 tagged "lead", 130 stale (60+ days)
- Industry distribution among stale leads: Legal (34), Technology (27), Finance (25), Retail (23), Consulting (21)
- Company size distribution: 1-10 (43), 201-1000 (34), 51-200 (31), 11-50 (22)

Faker demo data is only used as fallback when the API is unreachable.

---

## Step-by-Step Flow

### Step 0 — Open Contacts Table

**Trigger:** User clicks "Prioritize stale leads" template

**Korra says:** "I see 960 contacts in your CRM. Let me open that up and help you prioritize the stale ones."

**Tool calls:** `openDatabase({ slug: "contacts" })`

**Visual:** Sidebar highlights "Contacts" → full-screen chat transitions to split view (table left + chat panel right). Chat history carries over seamlessly.

---

### Step 1 — Filter to Stale Leads

**Trigger:** User sends any message

**Korra says:** "Filtering to leads you haven't contacted in 60+ days. I can see 130 stale leads that need attention."

**Tool calls:**
```json
filterBy({
  filters: [
    { columnId: "fld_tags", operator: "contains", value: "lead" },
    { columnId: "fld_last_contacted", operator: "before", value: "2026-02-03" }
  ]
})
```

**Visual:** Rows fade out, 130 remain. Korra attribution badge appears on filter controls.

---

### Step 2 — Link Lookup Columns + Ask Permission

**Trigger:** User sends any message

**Korra says:** "Linked Industry and Company Size from your Companies table. I can see 5 industries across your stale leads — Legal (34), Technology (27), Finance (25), Retail (23), Consulting (21). Want me to scan what's happening in these industries so we can prioritize smarter?"

**Context tags:** `Companies` (google-sheets icon)

**Tool calls:**
```json
addColumn({ id: "fld_industry", name: "Industry", type: "select", source: "lookup", options: [...] })
addColumn({ id: "fld_company_size", name: "Company Size", type: "select", source: "lookup", options: [...] })
```

**Visual:** Two new columns appear with teal tint + Link2 icon (lookup styling). Values auto-resolve from each contact's `fld_company` ref to the Companies table. Korra ends with a question — waits for user response.

**Implementation note:** Lookup column value resolution needs to follow the `fld_company` ref for each contact row, look up the matching company in the Companies table, and display that company's `fld_industry` and `fld_size` values. This is a client-side join — the Companies data is already loaded (DataGridView fetches ref target tables on mount).

---

### Step 3 — Research Industries + Sort (NEW in V4)

**Trigger:** User says "yes" or sends any message

**Korra says:** "Legal is seeing major regulatory activity right now — new compliance deadlines are pushing companies to re-evaluate vendors. That's 34 contacts worth reaching out to. Sorting them to the top."

**Tool calls:**
```json
searchNews({ industries: ["Legal", "Technology", "Finance", "Retail", "Consulting"] })
sortBy({ sorts: [{ columnId: "fld_industry", desc: false }] })
```

**Visual:**
1. **Research card appears in chat** — compact card with globe/search icon. Lists the 5 industries being "researched." Each one gets a checkmark after a staggered delay (~400ms each). Card takes ~2s total.
2. After research card completes, Korra's text streams in with the Legal insight.
3. Table re-sorts with Legal contacts at the top. Korra attribution badge on sort controls.

**Implementation note:** `searchNews` is a fake tool — the handler is a no-op. The research card is rendered in the chat UI whenever it sees a `searchNews` tool call in the message stream. The "insight" about Legal regulatory activity is hardcoded in the demo script response text.

---

### Step 4 — Add Priority Column (ALL 130 Rows)

**Trigger:** User sends any message

**Korra says:** "Now let me score all 130 leads by priority based on title seniority, company size, and industry activity. Here's a preview of the first 5 rows before I apply it to all."

**Ploybook:** "Contact Prioritization"
**Context tags:** `Contact Prioritization` (ploybook icon)
**dryRun:** true

**Tool calls:**
```json
addColumn({ id: "fld_priority", name: "Priority", type: "select", source: "ai-generated", options: [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
]})
editCells({ updates: [/* ALL 130 rows — ~30 High, ~50 Medium, ~50 Low */] })
```

**Visual:**
1. Priority column appears with sky-blue generating shimmer + FilePenLine icon (ai-generated styling).
2. **Dry-run preview card** shows first 5 rows with proposed Priority values. Approve / Reject buttons.
3. On approve → all 130 rows fill with High/Medium/Low values. Wave animation across cells.
4. "Contact Prioritization" ploybook tag appears near chat input.

**Distribution:** ~30 High (large companies + senior titles in active industries), ~50 Medium (mid-size or mid-level), ~50 Low (small companies + junior titles). No empty cells.

---

### Step 5 — Sort by Priority

**Trigger:** User sends any message

**Korra says:** "Sorting by priority so your high-value contacts are at the top. Take a look — feel free to adjust any that don't look right."

**Tool calls:**
```json
sortBy({ sorts: [{ columnId: "fld_priority", desc: true }] })
```

**Visual:** Table re-sorts — High-priority contacts float to the top. Korra attribution badge on sort. Korra explicitly invites the user to review and make manual corrections.

---

### Step 6 — Acknowledge Manual Edits + Ask About Emails

**Trigger:** User manually changes a couple of Low → High in the grid (acquaintances they recognize), then sends a message

**Korra says:** "Nice catches — I see you bumped a couple to High. Your priority list is looking solid. Want me to draft personalized re-engagement emails for the high-priority ones?"

**Tool calls:** None

**Visual:** No table changes. This is a permission checkpoint — Korra asks before taking the next big action (drafting emails). The user's manual edits are tracked in the cell audit map with "user" attribution.

**Note:** The scripted response assumes the user made manual edits. In a live demo, the presenter manually edits 2-3 cells before sending the next message. If the user doesn't edit anything, the message is slightly off but still works narratively.

---

### Step 7 — Draft Follow-up Emails

**Trigger:** User says "yes" or sends any message

**Korra says:** "Writing follow-up drafts for your high-priority contacts. Each email is personalized with their name, title, company, and the industry context we found."

**Context tags:** `Personalized Outreach` (ploybook icon)

**Tool calls:**
```json
addColumn({ id: "fld_followup_draft", name: "Follow-up Draft", type: "long-text", source: "ai-generated" })
```

**Visual:**
1. New Follow-up Draft column appears with sky-blue generating shimmer + skeleton cells.
2. FilePenLine icon + tooltip ("Generated by Korra") in column header.
3. Emails generate via `/api/generate-emails` endpoint (real Claude API or mock).
4. "Personalized Outreach" ploybook tag appears near chat input.

---

### Fallback (after Step 7)

**Trigger:** User sends any message

**Korra says:** "That's the full flow! You can click any row to see the detail view, edit cells directly in the grid, or ask me to help with something else."

---

## Key Narrative Beats

| Beat | Steps | What it proves |
|------|-------|----------------|
| **Orient** | 0-1 | Korra opens the right data and narrows focus automatically |
| **Enrich** | 2-3 | Korra links external data (Companies table) and researches context (industry news) |
| **Analyze** | 4-5 | Korra applies AI judgment (Priority scoring) with human review (dry-run + sort) |
| **Collaborate** | 5-6 | Human corrects AI (manual edits), AI acknowledges and asks before next action |
| **Act** | 7 | Korra drafts personalized content using all the context gathered |

**Two permission checkpoints:**
1. Step 2 → 3: "Want me to scan these industries?" (before research)
2. Step 6 → 7: "Want me to draft emails?" (before content generation)

---

## Tool Result Card Components

All rendered inside chat messages when a tool invocation is present.

### FilterBadgeCard
- Shows applied filter chips: `Tags contains "lead"` + `Last Contacted > 60 days`
- Badge variant with filter icon
- "130 matches" count

### ResearchCard (NEW in V4)
- Compact card with globe/search icon
- Lists industries being "researched": Legal, Technology, Finance, Retail, Consulting
- Each industry gets a checkmark after staggered delay (~400ms)
- Total animation ~2s
- Triggered by seeing `searchNews` tool call in message stream

### DryRunPreviewCard
- Mini-table: 5 rows with columns [Contact, Company, Proposed Priority]
- Approve button → executes full editCells on all 130 rows
- Reject button → Korra asks for corrections
- Uses existing `Badge`, table HTML, `Button` components

### EditSummaryCard
- Header: "Updated 130 rows — Priority column scored"
- Expandable (click to toggle)
- Expanded: diff table with columns [Contact, Before, After]
- Before values: `text-destructive` with line-through
- After values: `text-green-500`
- Uses `Collapsible` from shadcn

### AddColumnCard
- Simple confirmation: "Added Priority column (Select type)"
- Column icon + name + type badge

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

## Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `src/data/demo-scripts.ts` | Modified (V4) | 8-step scripted responses with searchNews + full priority fill |
| `src/data/demo-data.ts` | Dead file | ENRICHMENT_UPDATES no longer imported — can be deleted |
| `src/lib/ai-tools.ts` | Modified | Added searchNews tool definition |
| `src/lib/tool-handler.ts` | Modified | Added searchNews no-op handler |
| `src/app/api/chat/route.ts` | No change needed | Step counter logic works with new steps |
| `src/components/home/home-dashboard.tsx` | No change needed | Layout animation works with new steps |
| `src/components/home/korra-chat.tsx` | Needs update | Render ResearchCard for searchNews tool calls |
| `src/components/home/data-grid-view.tsx` | Needs update | Lookup column value resolution from fld_company ref |
| `src/components/home/tool-cards/research-card.tsx` | Create | Globe icon + staggered industry checkmarks |
| `src/components/home/tool-cards/dry-run-preview-card.tsx` | Create | Preview with approve/reject |
| `src/components/home/tool-cards/edit-summary-card.tsx` | Create | Summary + expandable diff |
