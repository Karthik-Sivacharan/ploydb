# Step 6 Update + New Steps 9-12: Spec

## Overview

Two changes to the demo flow:

1. **Step 6 (Priority)** — ✅ DONE. Added Clearbit website visits + generalized shimmer.
2. **Steps 9-12 (Landing Pages)** — After email drafts, Korra suggests personalized landing pages, checks Google Analytics A/B test data, creates pages, then appends links to the existing emails.

Total demo steps go from 0-8 → 0-12.

---

## Step 6 — ✅ COMPLETED

See commit `d89ec73` on `user-journey-refinements` branch.

---

## Steps 9-12: Personalized Landing Pages (Google Analytics)

Four new steps after the current step 8 (email drafts).

### New tool: `checkAnalytics`

A proper tool (not reusing `searchNews`) since Google Analytics is a connected source.

**ai-tools.ts** — new tool definition:
```ts
checkAnalytics: tool({
  description: "Check analytics data from connected tools like Google Analytics. Use this to look up AB test results, conversion data, and experiment outcomes.",
  inputSchema: z.object({
    source: z.string().describe("Analytics source to check, e.g. 'Google Analytics'"),
    query: z.string().describe("What to look up, e.g. 'AB test results for legal landing page'"),
  }),
})
```

**tool-handler.ts** — no-op handler (like searchNews):
```ts
case "checkAnalytics": {
  console.log("[Korra tool] checkAnalytics (research):", args.source, args.query)
  return
}
```

**demo-scripts.ts** — add `"checkAnalytics"` to `DemoToolCall.name` union.

**tool-result-card.tsx** — add a card for `checkAnalytics` tool calls (similar to searchNews loading card but with Google Analytics branding).

### New editCells mode: `append`

Step 12 needs to add a P.S. line to existing email drafts without erasing them.

**ai-tools.ts** — add optional `mode` to editCells schema:
```ts
mode: z.enum(["replace", "append"]).optional()
  .describe("Update mode — 'replace' (default) overwrites, 'append' adds to existing value"),
```

**tool-handler.ts** — in `case "editCells"`, before applying updates, check for `mode === "append"`:
```ts
const mode = args.mode as "replace" | "append" | undefined
if (mode === "append") {
  const visibleRows = grid!.table.getRowModel().rows
  for (const u of updates) {
    const row = visibleRows[u.rowIndex]
    if (row) {
      const existing = (row.original as Record<string, unknown>)[u.columnId]
      if (existing != null && String(existing).length > 0) {
        u.value = `${String(existing)}\n\n${u.value}`
      }
    }
  }
}
```

---

### Step 9 — Korra pitches the idea, waits for user

**Trigger:** Auto-advanced from step 8 (step 8 gets `autoAdvance: 500`).

**What Korra says:**
> "Emails are ready. We can take this a step further — hyperpersonalized landing pages for each lead dramatically boost response rates. Want me to set that up?"

**Tool calls:** None
**Auto-advance:** No (waits for user to say yes)
**Thinking delay:** 1500ms

### Step 10 — Korra checks GA, returns with findings

**Trigger:** User says yes.

**Context tags:**
```ts
contextTags: [
  { type: "ploybook", name: "Build a Content Page", icon: "ploybook" },
  { type: "source", name: "Google Analytics", icon: "google-analytics" },
]
```

**Response text:**
> "Pulling your Google Analytics data to see which page variant performed best..."

**Tool calls:**
```ts
{
  name: "checkAnalytics",
  args: {
    source: "Google Analytics",
    query: "AB test results for legal landing page variants",
  },
}
```

**Reasoning (chain-of-thought):**
```
Checking Google Analytics experiment data for stackline.com...
→ Found: Experiment "Legal Landing Page" (Jan 15 – Feb 28, 2026)
→ Variant A: "AI-Powered Document Automation for Law Firms" — 14.2% conversion rate
→ Variant B: "Streamline Your Legal Workflows" — 11.5% conversion rate
→ Variant A wins by 23% relative lift (p-value 0.03, statistically significant)
→ Variant A also had 40% lower bounce rate among legal industry visitors
```

**followUp:**
> "Clear winner — \"AI-Powered Document Automation for Law Firms\" converted 23% better with a significantly lower bounce rate among legal visitors. I'll use that as the base for each personalized page."

**Thinking delay:** 2000ms
**Auto-advance:** Yes (500ms → step 11)

### Step 11 — Korra creates landing pages

**Trigger:** Auto-advanced from step 10.

**Response text:**
> "Building personalized landing pages for your High priority contacts using the winning variant."

**Tool calls:**
1. `addColumn("Personalized Page", url, ai-generated)` — new URL column with shimmer
2. `editCells` → fill 8 URLs for rows 0-7 with personalized page URLs

**Thinking delay:** 1500ms
**Auto-advance:** Yes (500ms → step 12)

### Step 12 — Korra appends landing page links to email drafts

**Trigger:** Auto-advanced from step 11.

**Response text:**
> "Let me append the landing page links to those draft emails."

**Tool calls:**
1. `editCells` with `mode: "append"` → appends P.S. line with landing page URL to `fld_followup_draft` for rows 0-7

**followUp:**
> "Done — the full loop is complete: enriched data → prioritized contacts → personalized email → personalized landing page."

**Thinking delay:** 1500ms
**Auto-advance:** No (end of demo)

---

### Helper: `generatePageUrlUpdates()`

8 URLs for rows 0-7 (High priority contacts):
```ts
function generatePageUrlUpdates() {
  const slugs = [
    "martinez-legal", "chen-partners", "williams-law",
    "johnson-legal", "patel-associates", "thompson-firm",
    "garcia-legal", "kim-partners",
  ]
  return slugs.map((slug, i) => ({
    rowIndex: i,
    columnId: "fld_personalized_page",
    value: `https://stackline.com/for/${slug}`,
  }))
}
```

### Helper: `generateEmailAppendUpdates()`

Appends a P.S. line to existing email drafts for rows 0-7:
```ts
function generateEmailAppendUpdates() {
  const slugs = [
    "martinez-legal", "chen-partners", "williams-law",
    "johnson-legal", "patel-associates", "thompson-firm",
    "garcia-legal", "kim-partners",
  ]
  return slugs.map((slug, i) => ({
    rowIndex: i,
    columnId: "fld_followup_draft",
    value: `\n\nP.S. I put together a page specifically for your team: https://stackline.com/for/${slug}`,
  }))
}
```

Note: Uses `mode: "append"` so the existing email text is preserved and the P.S. is added at the end.

---

## Updated step count

| Step | Description | Auto-advance? |
|------|-------------|---------------|
| 0 | Open contacts → | Yes (→1) |
| 1 | (auto) 130 stale leads found, ask to filter | No |
| 2 | Filter → ask about linking | No |
| 3 | Link Industry + Company Size → ask about research | No |
| 4 | Research → filter to Legal → | Yes (→5) |
| 5 | (auto) Ask about prioritizing (mentions Clearbit) | No |
| 6 | Add Website Visits + Priority + sort | No |
| 7 | Acknowledge manual edit → ask about emails | No |
| 8 | Draft follow-up emails → | Yes (→9) |
| 9 | (auto) Pitch hyperpersonalized landing pages | No (waits for user) |
| 10 | Pull GA data + checkAnalytics tool + reasoning + findings → | Yes (→11) |
| 11 | (auto) Create Personalized Page column + fill URLs → | Yes (→12) |
| 12 | (auto) Append landing page links to email drafts | No (end of demo) |

---

## Files that need changes

| File | What changes |
|------|-------------|
| `src/data/demo-scripts.ts` | Add `"checkAnalytics"` to DemoToolCall union, add `"google-analytics"` to icon union, add steps 9-12, add helpers, add `autoAdvance: 500` to step 8 |
| `src/lib/ai-tools.ts` | Add `checkAnalytics` tool definition, add `mode` to editCells schema |
| `src/lib/tool-handler.ts` | Add `case "checkAnalytics"` no-op handler, add append mode to editCells handler |
| `src/components/home/korra-chat.tsx` | Add Google Analytics icon branch in ContextTagsRow |
| `src/components/korra/tool-cards/tool-result-card.tsx` | Add card rendering for `checkAnalytics` tool calls |
| `src/app/api/chat/route.ts` | No changes (step counter is automatic) |
