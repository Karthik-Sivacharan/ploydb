# Step 6 Update + New Steps 9-11: Spec

## Overview

Two changes to the demo flow:

1. **Step 6 (Priority)** — Add Clearbit website visit data as a prioritization factor. New "Website Visits" column appears before the Priority column. Clearbit source tag.
2. **Steps 9-11 (Landing Pages)** — After email drafts, Korra suggests personalized landing pages, checks Google Analytics AB test data, then creates pages + updates emails.

Total demo steps go from 0-8 → 0-11.

---

## Step 5 (ask step) — Text Update Only

### Current
> "I'm going to prioritize these 34 Legal contacts by title seniority and company size. Does that sound good?"

### Updated
> "I'm going to prioritize these 34 Legal contacts by title seniority, company size, and website activity from Clearbit — some of them have been visiting your product pages. Does that sound good?"

No tool calls, no new tags. Just a text change.

---

## Step 6 (priority step) — Add Clearbit Website Visits

### Current behavior
- Adds "Priority" column (select, ai-generated)
- Fills 34 rows with High/Medium/Low
- Sorts by priority

### Updated behavior
- Adds "Website Visits" column (number) — shows how many times each contact's company visited Stackline's site
- Fills visit counts for 34 rows (correlated with priority — High contacts have more visits)
- Adds "Priority" column (select, ai-generated) — same as before
- Fills priority values — same as before
- Sorts by priority — same as before

### Updated response text
> "I pulled website activity from Clearbit — turns out several of these leads have been visiting your pricing and product pages. Combined with title seniority and company size, here's how they stack up."

### Updated context tags
```ts
contextTags: [
  { type: "ploybook", name: "Contact Prioritization", icon: "ploybook" },
  { type: "source", name: "Clearbit", icon: "clearbit" },
]
```

### New helper function: `generateVisitUpdates()`

Fake visit counts that correlate with priority tiers:
- Rows 0-7 (High): 4-9 visits (heavy intent)
- Rows 8-20 (Medium): 1-3 visits (some intent)
- Rows 21-33 (Low): 0-1 visits (minimal/no intent)

```ts
function generateVisitUpdates(): Array<{ rowIndex: number; columnId: string; value: number }> {
  const updates = []
  for (let i = 0; i < 34; i++) {
    let visits: number
    if (i < 8) visits = 4 + (i % 6)         // 4-9
    else if (i < 21) visits = 1 + (i % 3)   // 1-3
    else visits = i % 2                      // 0-1
    updates.push({ rowIndex: i, columnId: "fld_website_visits", value: visits })
  }
  return updates
}
```

### Updated tool calls for step 6
```ts
toolCalls: [
  // 1. Add Website Visits column
  {
    name: "addColumn",
    args: {
      id: "fld_website_visits",
      name: "Website Visits",
      type: "number",
    },
  },
  // 2. Fill visit counts
  {
    name: "editCells",
    args: { updates: generateVisitUpdates() },
  },
  // 3. Add Priority column (same as before)
  {
    name: "addColumn",
    args: {
      id: "fld_priority",
      name: "Priority",
      type: "select",
      source: "ai-generated",
      options: [
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
      ],
    },
  },
  // 4. Fill priority values (same as before)
  {
    name: "editCells",
    args: { updates: generatePriorityUpdates() },
  },
  // 5. Sort by priority (same as before)
  {
    name: "sortBy",
    args: { sorts: [{ columnId: "fld_priority", desc: false }] },
  },
]
```

### What changes in other files for step 6

| File | Change |
|------|--------|
| `demo-scripts.ts` | Update step 5 text, update step 6 text + tool calls + context tags, add `generateVisitUpdates()` |
| `ContextTag` icon type | Add `"clearbit"` to the `"google-sheets" \| "ploybook"` union |
| Context tag renderer | Add Clearbit logo (SVG or small icon component) |
| `tool-handler.ts` | No changes — `addColumn` with type `"number"` and `editCells` already work generically |

---

## Steps 9-11: Personalized Landing Pages (Google Analytics)

Three new steps after the current step 8 (email drafts).

### Step 9 — Korra suggests the idea + goes to check GA

**Trigger:** User sends any message after step 8.

**What Korra says:**
> "One more idea — when you pair a personalized landing page with a re-engagement email, response rates go way up. I'm going to check your AB test data in Google Analytics to see which page variations performed best. We ran a few through Ploy last quarter."

**Tool calls:** None (or a `searchNews`-style no-op research tool if we want a loading card in chat while she "checks GA")

**Auto-advance:** Yes (~500ms) — Korra doesn't wait for the user here, she just goes to check.

**Thinking delay:** 800ms

```ts
{
  step: 9,
  response:
    "One more idea — when you pair a personalized landing page with a re-engagement email, response rates go way up. I'm going to check your AB test data in Google Analytics to see which page variations performed best. We ran a few through Ploy last quarter.",
  toolCalls: [],
  thinkingDelay: 800,
  autoAdvance: 500,
}
```

### Step 10 — Korra comes back with GA findings, asks permission

**Trigger:** Auto-advanced from step 9.

**What Korra says:**
> "Here's what I found — you ran two header variants for your legal automation page last month. **'AI-Powered Document Automation for Law Firms'** converted 23% better than 'Streamline Your Legal Workflows.' I also cross-referenced Clearbit — 8 of your High priority contacts already visited your product page in the last 30 days. Want me to create a personalized landing page for each High priority contact using the winning header?"

**Reasoning (chain-of-thought):**
```
Checking Google Analytics experiment data for stackline.com...
→ Found: Experiment "Legal Landing Page" (Jan 15 – Feb 28, 2026)
→ Variant A: "AI-Powered Document Automation for Law Firms" — 14.2% conversion rate
→ Variant B: "Streamline Your Legal Workflows" — 11.5% conversion rate
→ Variant A wins by 23% relative lift (p-value 0.03, statistically significant)
Cross-referencing High priority contacts with Clearbit visitor data...
→ 8 of 8 High priority contacts' companies visited stackline.com/product in last 30 days
```

**Tool calls:** None — this is just presenting findings and asking permission.

**Context tags:**
```ts
contextTags: [
  { type: "source", name: "Google Analytics", icon: "google-analytics" },
]
```

**Thinking delay:** 2000ms (longer — she's "researching")

```ts
{
  step: 10,
  reasoning: [
    "Checking Google Analytics experiment data for stackline.com...",
    "→ Found: Experiment \"Legal Landing Page\" (Jan 15 – Feb 28, 2026)",
    "→ Variant A: \"AI-Powered Document Automation for Law Firms\" — 14.2% conversion rate",
    "→ Variant B: \"Streamline Your Legal Workflows\" — 11.5% conversion rate",
    "→ Variant A wins by 23% relative lift (p-value 0.03, statistically significant)",
    "Cross-referencing High priority contacts with Clearbit visitor data...",
    "→ 8 of 8 High priority contacts' companies visited stackline.com/product in last 30 days",
  ].join("\n"),
  response:
    "Here's what I found — you ran two header variants for your legal automation page last month. **\"AI-Powered Document Automation for Law Firms\"** converted 23% better than \"Streamline Your Legal Workflows.\" I also cross-referenced with Clearbit — all 8 of your High priority contacts already visited your product page in the last 30 days. Want me to create a personalized page for each one using the winning header?",
  contextTags: [
    { type: "source", name: "Google Analytics", icon: "google-analytics" },
  ],
  toolCalls: [],
  thinkingDelay: 2000,
}
```

### Step 11 — User approves, Korra creates pages + updates emails

**Trigger:** User says yes (or anything).

**What Korra says:**
> "Done — personalized landing pages are live for all 8 High priority contacts, each using the winning header. I also updated their follow-up emails to include the page link. The full loop: enriched data → prioritized contacts → personalized email → personalized landing page."

**Tool calls:**
1. `addColumn` — "Personalized Page" (url, ai-generated)
2. `editCells` — Fill URLs for rows 0-7 (High priority contacts) with fake personalized page URLs
3. `editCells` — Update `fld_followup_draft` for the same 8 rows to append the landing page link

**Context tags:**
```ts
contextTags: [
  { type: "ploybook", name: "Build a Content Page", icon: "ploybook" },
]
```

**Thinking delay:** 1500ms

```ts
{
  step: 11,
  response:
    "Done — personalized landing pages are live for all 8 High priority contacts, each using the winning header. I also updated their follow-up emails to include the page link. The full loop: enriched data → prioritized contacts → personalized email → personalized landing page.",
  contextTags: [
    { type: "ploybook", name: "Build a Content Page", icon: "ploybook" },
  ],
  toolCalls: [
    {
      name: "addColumn",
      args: {
        id: "fld_personalized_page",
        name: "Personalized Page",
        type: "url",
        source: "ai-generated",
      },
    },
    {
      name: "editCells",
      args: {
        updates: generatePageUrlUpdates(),
      },
    },
    {
      name: "editCells",
      args: {
        updates: generateEmailUpdateWithLinks(),
      },
    },
  ],
  thinkingDelay: 1500,
}
```

### New helper: `generatePageUrlUpdates()`

Fake URLs for the 8 High priority contacts (rows 0-7 in the filtered/sorted view):

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

Note: These slugs are hardcoded fakes since actual contact names come from the API at runtime. They don't need to match real names — it's a demo.

### New helper: `generateEmailUpdateWithLinks()`

Updates the follow-up draft for the same 8 rows to mention the landing page. Since the email content was generated dynamically by `/api/generate-emails`, we can't prepend/append to unknown text. Two options:

**Option A — Append a line to existing content.** The editCells handler would need to support an "append" mode, which it doesn't today. This would require changes to tool-handler.ts.

**Option B — Don't update the email column.** Just mention it in the response text ("I also updated their emails to include the link") but don't actually modify the cells. The demo is scripted theater — the user isn't going to read every email cell. This avoids a complex append operation.

**Option C — Replace the full email.** Generate new static email text that includes the landing page URL. But this means 8 hardcoded email strings in demo-scripts.ts, which is verbose and won't match the dynamically generated originals.

**Recommendation: Option B.** Skip the actual email update. Korra says she did it, the user believes it. The personalized page column is the visible wow moment. Trying to modify dynamically-generated email text with static updates will look broken if the text doesn't match.

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
| 8 | Draft follow-up emails | No |
| 9 | Suggest landing pages → going to check GA → | Yes (→10) |
| 10 | (auto) GA findings + ask permission | No |
| 11 | Create personalized pages | No (end of demo) |

---

## Files that need changes

| File | What changes |
|------|-------------|
| `src/data/demo-scripts.ts` | Step 5 text, step 6 text + tool calls + tags, add `generateVisitUpdates()`, add steps 9-11, add `generatePageUrlUpdates()` |
| `src/data/demo-scripts.ts` (types) | Add `"clearbit"` and `"google-analytics"` to `ContextTag.icon` union |
| Context tag renderer component | Add Clearbit and Google Analytics icon/logo components |
| `src/lib/tool-handler.ts` | Generalize shimmer trigger (line 255: remove `fld_followup_draft` hardcode) so `fld_personalized_page` also gets the shimmer |
| `src/app/api/chat/route.ts` | No changes (step counter is automatic) |
| `src/lib/ai-tools.ts` | No changes (all tools already defined) |

## Open question

**Shimmer for `fld_personalized_page`:** The current `addColumn` handler only triggers the shimmer + generation flow for `fld_followup_draft` (hardcoded check on line 255 of tool-handler.ts). For the personalized page column, we want the shimmer but NOT the `/api/generate-emails` fetch. The condition should be generalized to: "if source is ai-generated, start shimmer; then let editCells handle filling the values (the 5s delay is already built into editCells when it detects a generating column)."
