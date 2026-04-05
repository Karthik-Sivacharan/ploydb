// Happy Path V5 — "Prioritize stale leads"
//
// 9-step scripted demo (steps 0-8) using live PloyDB API (960 contacts).
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
  args: Record<string, unknown>
}

export interface ContextTag {
  type: "source" | "ploybook"
  name: string
  /** Icon hint: "google-sheets" renders the Sheets logo, "ploybook" renders BookOpen */
  icon: "google-sheets" | "ploybook"
}

export interface DemoStep {
  step: number
  response: string
  toolCalls: DemoToolCall[]
  dryRun?: boolean
  ploybook?: string
  /** New context tags introduced at this step (accumulate forward) */
  contextTags?: ContextTag[]
  /** Delay in ms before text starts streaming (shows thinking shimmer). Default 800. */
  thinkingDelay?: number
  /** If set, auto-send a hidden message after this many ms to trigger the next step. */
  autoAdvance?: number
  /** Reasoning / chain-of-thought text streamed before the main response.
   *  Shows as an expandable "Thinking..." block with step-by-step reasoning. */
  reasoning?: string
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

// ─── Steps ───────────────────────────────────────────────────────────────────

export const DEMO_STEPS: DemoStep[] = [
  // ── Step 0: Open Contacts table (auto-advances to step 1) ──────────
  {
    step: 0,
    response:
      "I see 960 contacts in your CRM. Let me open that up and take a look.",
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
      "Legal is seeing major regulatory activity right now — new compliance deadlines are pushing companies to re-evaluate vendors. That's 34 contacts worth reaching out to. Let me filter to those.",
    reasoning: [
      "Searching Reuters and Bloomberg for Legal sector news...",
      "→ Found: EU Digital Services Act enforcement deadline Q2 2026",
      "→ Found: New corporate compliance reporting requirements effective April 2026",
      "Scanning TechCrunch and Crunchbase for Technology sector...",
      "→ AI infrastructure spending up 40% YoY, but hiring freeze at mid-market",
      "Checking Financial Times for Finance sector updates...",
      "→ Interest rate holds steady — banks tightening vendor budgets",
      "Reviewing Retail and Consulting trends...",
      "→ Retail: cautious spending post-holiday season",
      "→ Consulting: steady demand, no major shifts",
      "",
      "**Conclusion:** Legal has the strongest re-engagement signal — regulatory pressure creates urgency for companies to seek new solutions.",
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
      "I'm going to prioritize these 34 Legal contacts by title seniority and company size. Does that sound good?",
    toolCalls: [],
    thinkingDelay: 1500,
  },

  // ── Step 6: Add Priority + sort + ask if it looks right ────────────
  // Combines addColumn + editCells + sortBy in one step.
  {
    step: 6,
    response:
      "Here's how they stack up — sorted by priority. Take a look, does this feel right?",
    ploybook: "Contact Prioritization",
    contextTags: [
      { type: "ploybook", name: "Contact Prioritization", icon: "ploybook" },
    ],
    toolCalls: [
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
      {
        name: "editCells",
        args: {
          updates: generatePriorityUpdates(),
        },
      },
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
      "Writing follow-up drafts for your High and Medium priority contacts. Each email is personalized with their name, title, company, and the regulatory context we found.",
    contextTags: [
      { type: "ploybook", name: "Personalized Outreach", icon: "ploybook" },
    ],
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
