# Demo Flow Implementation Spec — Happy Path V4

> Engineering spec for the 9-step scripted demo (steps 0-8).
> All data comes from the **live Railway API** — no Faker demo data.
> The Contacts table (960 rows) links to the Companies table via `fld_company` ref.
> Lookup columns (Industry, Company Size) resolve through this ref automatically.
>
> **Key implementation details:**
> - Conversational flow with per-step `thinkingDelay` (800ms-3s)
> - `autoAdvance` on steps 0 and 4 — sends hidden `__auto__` user message to trigger next step
> - Chain-of-thought reasoning via `Reasoning`/`ReasoningContent` components (step 4)
> - Lookup columns resolve from API via sequential queue with shared cache
> - Custom sort order for select columns (option index, not alphabetical)
> - Cell attribution uses `table.getRowModel().rows` (visible row model) for correct rowIndex mapping
> - `searchNews` tool (no-op handler, reasoning provides the research UX)
> - Emails generated for High + Medium priority contacts only

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

### Step 0 — Open Contacts Table (auto-advances)

**Trigger:** User clicks "Prioritize stale leads" template
**thinkingDelay:** 800ms
**autoAdvance:** 500ms

**Korra says:** "I see 960 contacts in your CRM. Let me open that up and take a look."

**Tool calls:** `openDatabase({ slug: "contacts" })`

**Visual:** Sidebar highlights "Contacts" → full-screen chat transitions to split view. Auto-advances to step 1 after 500ms.

---

### Step 1 — Analyze + Ask About Filtering (auto-triggered)

**Trigger:** Auto-triggered by step 0's autoAdvance (hidden `__auto__` message)
**thinkingDelay:** 2000ms (simulates Korra analyzing the table)

**Korra says:** "I've been looking through your contacts — 130 of them are tagged as leads but haven't been reached in over 60 days. That's a good place to start. Want me to filter those out?"

**Tool calls:** None

**Visual:** 2s thinking shimmer, then Korra explains her finding and asks permission.

---

### Step 2 — Filter + Ask About Linking

**Trigger:** User says "yes"
**thinkingDelay:** 800ms

**Korra says:** "Filtered to 130 stale leads. Now, I want to look at data from other tables to prioritize these smarter. I'd like to link Industry and Company Size from your Companies table — that'll give us a clearer picture. Sound good?"

**Tool calls:**
```json
filterBy({ filters: [
  { columnId: "fld_tags", operator: "contains", value: "lead" },
  { columnId: "fld_last_contacted", operator: "before", value: "2026-02-03" }
]})
```

**Visual:** Rows fade out, 130 remain. Korra attribution badge on filter. Korra proposes enrichment.

---

### Step 3 — Link Lookup Columns + Ask About Research

**Trigger:** User says "yes"
**thinkingDelay:** 800ms

**Korra says:** "Linked Industry and Company Size from your Companies table. I can see 5 industries: Legal (34), Technology (27), Finance (25), Retail (23), Consulting (21). I want to scan these industries online for recent news so we can figure out where the best opportunities are. Does that plan sound good?"

**Context tags:** `Companies` (google-sheets icon)

**Tool calls:**
```json
addColumn({ id: "fld_industry", ..., source: "lookup", lookupConfig: { targetTable: "companies", refField: "fld_company", targetField: "fld_industry" } })
addColumn({ id: "fld_company_size", ..., source: "lookup", lookupConfig: { targetTable: "companies", refField: "fld_company", targetField: "fld_size" } })
```

**Visual:** Two teal lookup columns appear. Values resolve from Companies table via sequential lookup queue with shared cache. Korra asks about research.

**Implementation:** Lookup resolution in `tool-handler.ts` uses `processLookupQueue()` — fetches Companies schema + rows, maps option IDs to labels, joins on `fld_company.id`, fills via `updateCells()`. Second lookup reuses cached data.

---

### Step 4 — Research Industries + Filter to Legal (auto-advances)

**Trigger:** User says "yes" (and possibly mentions sources)
**thinkingDelay:** 800ms
**autoAdvance:** 500ms

**Reasoning (chain-of-thought):**
```
Searching Reuters and Bloomberg for Legal sector news...
→ Found: EU Digital Services Act enforcement deadline Q2 2026
→ Found: New corporate compliance reporting requirements effective April 2026
Scanning TechCrunch and Crunchbase for Technology sector...
→ AI infrastructure spending up 40% YoY, but hiring freeze at mid-market
Checking Financial Times for Finance sector updates...
→ Interest rate holds steady — banks tightening vendor budgets
Reviewing Retail and Consulting trends...
→ Retail: cautious spending post-holiday season
→ Consulting: steady demand, no major shifts

**Conclusion:** Legal has the strongest re-engagement signal
```

**Korra says:** "Legal is seeing major regulatory activity right now — new compliance deadlines are pushing companies to re-evaluate vendors. That's 34 contacts worth reaching out to. Let me filter to those."

**Tool calls:**
```json
searchNews({ industries: ["Legal", "Technology", "Finance", "Retail", "Consulting"] })
filterBy({ filters: [...existing + { columnId: "fld_industry", operator: "equals", value: "Legal" }] })
```

**Visual:** Reasoning block streams line by line (~300ms each) via `Reasoning`/`ReasoningContent` components. Auto-opens while streaming, auto-closes after. Then table filters 130 → 34. Auto-advances to step 5.

**Implementation:** `searchNews` is a no-op tool handler. Reasoning is streamed via `reasoning-start`/`reasoning-delta`/`reasoning-end` events in `route.ts`. Standalone thinking shimmer suppressed when reasoning is present.

---

### Step 5 — Ask About Prioritizing (auto-triggered)

**Trigger:** Auto-triggered by step 4's autoAdvance
**thinkingDelay:** 1500ms

**Korra says:** "I'm going to prioritize these 34 Legal contacts by title seniority and company size. Does that sound good?"

**Tool calls:** None

**Visual:** 1.5s thinking shimmer, then Korra asks permission.

---

### Step 6 — Add Priority + Sort + Ask If It Looks Right

**Trigger:** User says "yes"
**thinkingDelay:** 2000ms

**Korra says:** "Here's how they stack up — sorted by priority. Take a look, does this feel right?"

**Ploybook:** "Contact Prioritization"
**Context tags:** `Contact Prioritization` (ploybook icon)

**Tool calls:**
```json
addColumn({ id: "fld_priority", name: "Priority", type: "select", source: "ai-generated", options: [High, Medium, Low] })
editCells({ updates: [/* 34 rows — ~8 High, ~13 Medium, ~13 Low */] })
sortBy({ sorts: [{ columnId: "fld_priority", desc: false }] })
```

**Visual:** 2s thinking, then Priority column appears (sky-blue shimmer), all 34 cells fill, table sorts (High first via custom sort by option rank). Korra invites review.

**Implementation:** Custom `sortingFn` on the column uses option array index (High=0, Medium=1, Low=2). Attribution uses `table.getRowModel().rows` for correct filtered row mapping.

---

### Step 7 — Acknowledge Manual Edit + Ask About Emails

**Trigger:** User bumps one Low → High, then sends a message
**thinkingDelay:** 800ms

**Korra says:** "Good catch — I see you bumped one to High. Your priority list is looking solid. Want me to draft personalized re-engagement emails for the High and Medium priority contacts?"

**Tool calls:** None

**Visual:** No table changes. Permission checkpoint for emails.

---

### Step 8 — Draft Follow-up Emails

**Trigger:** User says "yes"
**thinkingDelay:** 800ms

**Korra says:** "Writing follow-up drafts for your High and Medium priority contacts. Each email is personalized with their name, title, company, and the regulatory context we found."

**Context tags:** `Personalized Outreach` (ploybook icon)

**Tool calls:**
```json
addColumn({ id: "fld_followup_draft", name: "Follow-up Draft", type: "long-text", source: "ai-generated" })
```

**Visual:** Follow-up Draft column with sky-blue shimmer + skeleton cells. Emails generate via `/api/generate-emails` for High + Medium priority contacts only. Attribution uses visible row model.

---

### Fallback (after Step 8)

**Korra says:** "That's the full flow! You can click any row to see the detail view, edit cells directly in the grid, or ask me to help with something else."

---

## Key Narrative Beats

| Beat | Steps | What it proves |
|------|-------|----------------|
| **Orient** | 0-2 | Korra opens data, analyzes, narrows focus |
| **Enrich** | 3-4 | Korra links data + researches external context with visible reasoning |
| **Analyze** | 5-6 | Korra scores with AI judgment, presents for review |
| **Collaborate** | 6-7 | Human corrects, AI acknowledges and asks permission |
| **Act** | 8 | Korra drafts content using the full context chain |

**Five permission checkpoints:**
1. Step 1 → 2: "Want me to filter those out?" (before filtering)
2. Step 2 → 3: "I'd like to link Industry and Company Size" (before enrichment)
3. Step 3 → 4: "Does that plan sound good?" (before research)
4. Step 5 → 6: "Does that sound good?" (before prioritizing)
5. Step 7 → 8: "Want me to draft emails?" (before content generation)

---

## Files

| File | Purpose |
|---|---|
| `src/data/demo-scripts.ts` | 9-step scripted demo with autoAdvance, thinkingDelay, reasoning |
| `src/app/api/chat/route.ts` | Per-step thinkingDelay + reasoning streaming |
| `src/components/home/home-dashboard.tsx` | Auto-advance effect (hidden `__auto__` messages) |
| `src/components/home/korra-chat.tsx` | Filters auto-advance messages, renders Reasoning/ReasoningContent, suppresses thinking shimmer during reasoning |
| `src/lib/tool-handler.ts` | Lookup queue with cache, searchNews no-op, attribution via visible row model |
| `src/lib/ai-tools.ts` | searchNews + lookupConfig tool schemas |
| `src/components/home/data-grid-view.tsx` | Custom sortingFn for select columns, korraEditCount, lookup column audit skip |
