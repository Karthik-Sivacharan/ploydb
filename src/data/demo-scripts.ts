// Happy Path V5 — "Prioritize stale leads"
//
// 13-step scripted demo (steps 0-12) using live PloyDB API (960 contacts).
// All data comes from the Railway API — no Faker demo data.
//
// V5: More conversational flow. Korra explains her thinking, asks permission
// at each step. Thinking states visible between actions. Step 0 auto-advances
// into step 1 (analysis). Steps 4+5 from V4 merged into single priority step.
//
// Data (as of 2026-04-05):
//   960 total contacts, 265 tagged "lead", 130 stale (60+ days)
//   Industries among stale leads: Legal (34), Technology (27), Finance (25),
//     Retail (23), Consulting (21)
//   Company sizes: 1-10 (43), 201-1000 (34), 51-200 (31), 11-50 (22)
//
// After step 4 filter to Legal: 34 contacts remain for priority scoring.
//
// Step counter is client-driven (route.ts counts assistant messages).
// Auto-advance steps send a hidden "__auto__" user message after completing.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DemoToolCall {
  name:
    | "openDatabase"
    | "editCells"
    | "addColumn"
    | "filterBy"
    | "sortBy"
    | "addRow"
    | "deleteRows"
    | "searchNews"
    | "checkAnalytics"
  args: Record<string, unknown>
}

export interface ContextTag {
  type: "source" | "ploybook"
  name: string
  /** Icon hint: "google-sheets" renders the Sheets logo, "ploybook" renders BookOpen */
  icon: "google-sheets" | "ploybook" | "clearbit" | "google-analytics"
}

export interface DemoStep {
  step: number
  response: string
  toolCalls: DemoToolCall[]
  dryRun?: boolean
  /** New context tags introduced at this step (accumulate forward) */
  contextTags?: ContextTag[]
  /** Delay in ms before text starts streaming (shows thinking shimmer). Default 800. */
  thinkingDelay?: number
  /** If set, auto-send a hidden message after this many ms to trigger the next step. */
  autoAdvance?: number
  /** Reasoning / chain-of-thought text streamed before the main response.
   *  Shows as an expandable "Thinking..." block with step-by-step reasoning. */
  reasoning?: string
  /** Text streamed after tool calls complete. Use for follow-up questions. */
  followUp?: string
}

// ─── Priority distribution for 34 Legal contacts ─────────────────────────────
// ~8 High, ~13 Medium, ~13 Low

function generatePriorityUpdates(): Array<{
  rowIndex: number
  columnId: string
  value: string
}> {
  const updates: Array<{ rowIndex: number; columnId: string; value: string }> = []
  for (let i = 0; i < 34; i++) {
    let priority: string
    if (i < 8) priority = "high"
    else if (i < 21) priority = "medium"
    else priority = "low"
    updates.push({ rowIndex: i, columnId: "fld_priority", value: priority })
  }
  return updates
}

function generateVisitUpdates(): Array<{
  rowIndex: number
  columnId: string
  value: number
}> {
  const updates: Array<{ rowIndex: number; columnId: string; value: number }> = []
  for (let i = 0; i < 34; i++) {
    let visits: number
    if (i < 8) visits = 4 + (i % 6)         // 4-9 (High priority = heavy intent)
    else if (i < 21) visits = 1 + (i % 3)   // 1-3 (Medium = some intent)
    else visits = i % 2                      // 0-1 (Low = minimal)
    updates.push({ rowIndex: i, columnId: "fld_website_visits", value: visits })
  }
  return updates
}

/** Generate personalized page URLs for the 8 High priority contacts (rows 0-7). */
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

/** Generate P.S. lines to append to existing email drafts for rows 0-7. */
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

// ─── Steps ───────────────────────────────────────────────────────────────────

export const DEMO_STEPS: DemoStep[] = [
  // ── Step 0: Open Contacts table (auto-advances to step 1) ──────────
  {
    step: 0,
    response:
      "I see 960 contacts in your CRM. Let me open that up and take a look.",
    contextTags: [
      { type: "ploybook", name: "Re-engage Stale Leads", icon: "ploybook" },
    ],
    toolCalls: [
      { name: "openDatabase", args: { slug: "contacts" } },
    ],
    thinkingDelay: 800,
    autoAdvance: 500,
  },

  // ── Step 1: Analyze + ask about filtering ──────────────────────────
  // Auto-triggered after step 0. Long thinking delay simulates Korra
  // analyzing the table before speaking.
  {
    step: 1,
    response:
      "I've been looking through your contacts — 130 of them are tagged as leads but haven't been reached in over 60 days. That's a good place to start. Want me to filter those out?",
    toolCalls: [],
    thinkingDelay: 2000,
  },

  // ── Step 2: Filter + ask about linking ─────────────────────────────
  {
    step: 2,
    response:
      "Filtered to 130 stale leads. Now, I want to look at data from other tables to prioritize these smarter. I'd like to link Industry and Company Size from your Companies table — that'll give us a clearer picture. Sound good?",
    toolCalls: [
      {
        name: "filterBy",
        args: {
          filters: [
            { columnId: "fld_tags", operator: "contains", value: "lead" },
            { columnId: "fld_last_contacted", operator: "before", value: "2026-02-03" },
          ],
        },
      },
    ],
    thinkingDelay: 800,
  },

  // ── Step 3: Link lookup columns + ask about research ───────────────
  {
    step: 3,
    response:
      "Linked Industry and Company Size from your Companies table. I can see 5 industries: Legal (34), Technology (27), Finance (25), Retail (23), Consulting (21). I want to scan these industries online for recent news so we can figure out where the best opportunities are. Does that plan sound good?",
    contextTags: [
      { type: "source", name: "Companies", icon: "google-sheets" },
    ],
    toolCalls: [
      {
        name: "addColumn",
        args: {
          id: "fld_industry",
          name: "Industry",
          type: "select",
          source: "lookup",
          options: [
            { value: "Technology", label: "Technology" },
            { value: "Legal", label: "Legal" },
            { value: "Finance", label: "Finance" },
            { value: "Retail", label: "Retail" },
            { value: "Consulting", label: "Consulting" },
          ],
          lookupConfig: {
            targetTable: "companies",
            refField: "fld_company",
            targetField: "fld_industry",
          },
        },
      },
      {
        name: "addColumn",
        args: {
          id: "fld_company_size",
          name: "Company Size",
          type: "select",
          source: "lookup",
          options: [
            { value: "1-10", label: "1-10" },
            { value: "11-50", label: "11-50" },
            { value: "51-200", label: "51-200" },
            { value: "201-1000", label: "201-1000" },
            { value: "1000+", label: "1000+" },
          ],
          lookupConfig: {
            targetTable: "companies",
            refField: "fld_company",
            targetField: "fld_size",
          },
        },
      },
    ],
    thinkingDelay: 800,
  },

  // ── Step 4: Research industries + filter to Legal ──────────────────
  // User said yes (and possibly mentioned a source). Korra shows chain
  // of thought during research, then filters to Legal.
  {
    step: 4,
    response:
      "Legal is the standout here — AI adoption in law firms just doubled in the past year, and the ABA formally cleared firms to use AI tools. Mid-market firms are in catch-up mode. That's 34 contacts worth reaching out to. Let me filter to those.",
    reasoning: [
      "Searching LawNext and Artificial Lawyer for legal AI adoption trends...",
      "→ Found: 70% of legal professionals now use generative AI — doubled in one year",
      "→ Found: Law firm tech spending grew 9.7% in 2025, fastest growth ever recorded",
      "Scanning Thomson Reuters State of Legal Market 2026...",
      "→ Found: Mid-market firms (50-200 attorneys) in aggressive tech catch-up phase",
      "→ Found: Per-lawyer tech spend at midsize firms up to $18K/year",
      "Checking ABA ethics guidance on AI adoption...",
      "→ Found: ABA Formal Opinion 512 — lawyers now have formal green light to use AI tools",
      "→ Found: State bars issuing new AI ethics opinions in 2026 — firms must have AI policies",
      "Reviewing Technology, Finance, Retail, Consulting...",
      "→ Tech: saturated, budget freezes at mid-market, long sales cycles",
      "→ Finance: conservative, 6-month procurement cycles",
      "→ Retail & Consulting: steady but no urgency signal",
      "",
      "**Conclusion:** Legal has the strongest re-engagement signal — ABA green light + record tech spending + mid-market catch-up phase = urgent demand for AI document tools.",
    ].join("\n"),
    toolCalls: [
      {
        name: "searchNews",
        args: {
          industries: ["Legal", "Technology", "Finance", "Retail", "Consulting"],
        },
      },
      {
        name: "filterBy",
        args: {
          filters: [
            { columnId: "fld_tags", operator: "contains", value: "lead" },
            { columnId: "fld_last_contacted", operator: "before", value: "2026-02-03" },
            { columnId: "fld_industry", operator: "equals", value: "Legal" },
          ],
        },
      },
    ],
    thinkingDelay: 800,
    autoAdvance: 500,
  },

  // ── Step 5: Ask about prioritizing ─────────────────────────────────
  // Auto-triggered after step 4. Thinking delay before asking.
  {
    step: 5,
    response:
      "I'm going to prioritize these 34 Legal contacts by title seniority, company size, and website activity from Clearbit — some of them might have visited your product pages. Does that sound good?",
    toolCalls: [],
    thinkingDelay: 1500,
  },

  // ── Step 6: Add Priority + sort + ask if it looks right ────────────
  // Combines addColumn + editCells + sortBy in one step.
  {
    step: 6,
    response:
      "I pulled website activity from Clearbit — turns out several of these leads have been visiting your pricing and product pages. Combined with title seniority and company size, here's how they stack up.",
    followUp:
      "Does this priority order look good to you?",
    contextTags: [
      { type: "source", name: "Clearbit", icon: "clearbit" },
    ],
    toolCalls: [
      // 1. Add Website Visits column (from Clearbit — treated as linked data)
      {
        name: "addColumn",
        args: {
          id: "fld_website_visits",
          name: "Website Visits",
          type: "number",
          source: "ai-generated",
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
        args: {
          updates: generatePriorityUpdates(),
        },
      },
      // 5. Sort by priority (same as before)
      {
        name: "sortBy",
        args: {
          sorts: [{ columnId: "fld_priority", desc: false }],
        },
      },
    ],
    thinkingDelay: 2000,
  },

  // ── Step 7: Acknowledge manual edit + ask about emails ─────────────
  // User bumped one Low → High, then sent a message.
  {
    step: 7,
    response:
      "Good catch — I see you bumped one to High. Your priority list is looking solid. Want me to draft personalized re-engagement emails for the High and Medium priority contacts?",
    toolCalls: [],
    thinkingDelay: 800,
  },

  // ── Step 8: Draft follow-up emails ─────────────────────────────────
  {
    step: 8,
    response:
      "Writing follow-up drafts for your High and Medium priority contacts. Each email is personalized with their name, title, company, and the AI adoption context we found.",
    contextTags: [],
    toolCalls: [
      {
        name: "addColumn",
        args: {
          id: "fld_followup_draft",
          name: "Follow-up Draft",
          type: "long-text",
          source: "ai-generated",
        },
      },
    ],
    thinkingDelay: 800,
    autoAdvance: 500,
  },

  // ── Step 9: Pitch hyperpersonalized landing pages ───────────────────
  // Auto-triggered after step 8. Korra suggests the idea without
  // revealing the "how" — waits for user to say yes.
  {
    step: 9,
    response:
      "Emails are ready. We can take this a step further — hyperpersonalized landing pages for each lead dramatically boost response rates. Want me to set that up?",
    toolCalls: [],
    thinkingDelay: 5000,
  },

  // ── Step 10: Check Google Analytics + findings ──────────────────────
  // User said yes. Korra connects to GA, shows chain-of-thought
  // research, then reports the winning variant. Auto-advances to step 11.
  {
    step: 10,
    response:
      "Pulling your Google Analytics data to see which page variant performed best...",
    contextTags: [
      { type: "ploybook", name: "Build a Content Page", icon: "ploybook" },
      { type: "source", name: "Google Analytics", icon: "google-analytics" },
    ],
    reasoning: [
      "Checking Google Analytics experiment data for stackline.com...",
      "→ Found: Experiment \"Legal Landing Page\" (Jan 15 – Feb 28, 2026)",
      "→ Variant A: \"AI-Powered Document Automation for Law Firms\" — 14.2% conversion rate",
      "→ Variant B: \"Streamline Your Legal Workflows\" — 11.5% conversion rate",
      "→ Variant A wins by 23% relative lift (p-value 0.03, statistically significant)",
      "→ Variant A also had 40% lower bounce rate among legal industry visitors",
    ].join("\n"),
    toolCalls: [
      {
        name: "checkAnalytics",
        args: {
          source: "Google Analytics",
          query: "AB test results for legal landing page variants",
        },
      },
    ],
    followUp:
      "Clear winner — \"AI-Powered Document Automation for Law Firms\" converted 23% better with a significantly lower bounce rate among legal visitors. I'll use that as the base for each personalized page.",
    thinkingDelay: 2000,
    autoAdvance: 500,
  },

  // ── Step 11: Create personalized landing pages ──────────────────────
  // Auto-triggered from step 10. Adds a URL column + fills 8 URLs.
  {
    step: 11,
    response:
      "Building personalized landing pages for your High priority contacts using the winning variant.",
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
        args: { updates: generatePageUrlUpdates() },
      },
    ],
    thinkingDelay: 1500,
    autoAdvance: 6000,
  },

  // ── Step 12: Append landing page links to email drafts ──────────────
  // Auto-triggered from step 11. Appends P.S. with landing page URL
  // to existing follow-up drafts — does NOT replace them.
  {
    step: 12,
    response:
      "Let me append the landing page links to those draft emails.",
    toolCalls: [
      {
        name: "editCells",
        args: {
          mode: "append",
          updates: generateEmailAppendUpdates(),
        },
      },
    ],
    followUp:
      "Done — the full loop is complete: enriched data → prioritized contacts → personalized email → personalized landing page.",
    thinkingDelay: 1500,
  },
]

// ─── Fallback ──────────────────────────────────────────────────────────────

const FALLBACK_STEP: DemoStep = {
  step: -1,
  response:
    "That's the full flow! You can click any row to see the detail view, edit cells directly in the grid, or ask me to help with something else.",
  toolCalls: [],
}

// ─── Step Counter (unused by route.ts but kept for direct imports) ────────

let currentStep = 0

export function getNextDemoStep(): DemoStep {
  if (currentStep >= DEMO_STEPS.length) return FALLBACK_STEP
  return DEMO_STEPS[currentStep++]
}

export function resetDemoStep(): void {
  currentStep = 0
}

export function getCurrentStep(): number {
  return currentStep
}

// ─── Accumulated context tags up to a given step ────────────────────────────

/**
 * Collects all contextTags from DEMO_STEPS[0..stepIndex] (inclusive).
 * Deduplicates by name so tags don't repeat.
 */
export function getAccumulatedTags(stepIndex: number): ContextTag[] {
  const seen = new Set<string>()
  const tags: ContextTag[] = []
  const end = Math.min(stepIndex, DEMO_STEPS.length - 1)
  for (let i = 0; i <= end; i++) {
    for (const tag of DEMO_STEPS[i].contextTags ?? []) {
      if (!seen.has(tag.name)) {
        seen.add(tag.name)
        tags.push(tag)
      }
    }
  }
  return tags
}

// ─── Auto-advance prefix ────────────────────────────────────────────────────
// User messages starting with this prefix are auto-sent by the client
// after an autoAdvance step. The UI hides them from the message list.
export const AUTO_ADVANCE_PREFIX = "__auto__"
