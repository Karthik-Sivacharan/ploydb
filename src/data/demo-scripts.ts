// Happy Path V4 — "Prioritize stale leads"
//
// 8-step scripted demo (steps 0-7) using live PloyDB API (960 contacts).
// All data comes from the Railway API — no Faker demo data.
//
// Lookup columns (Industry, Company Size) resolve via fld_company ref
// to the Companies table. No hardcoded enrichment data.
//
// Data (as of 2026-04-05):
//   960 total contacts, 265 tagged "lead", 130 stale (60+ days)
//   Industries among stale leads: Legal (34), Technology (27), Finance (25),
//     Retail (23), Consulting (21)
//   Company sizes: 1-10 (43), 201-1000 (34), 51-200 (31), 11-50 (22)
//
// Step counter is client-driven (route.ts counts assistant messages).

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
  /** Delay in ms before executing tool calls */
  toolDelay?: number
}

// ─── Priority distribution for all 130 stale leads ──────────────────────────
// Weighted: ~30 High, ~50 Medium, ~50 Low
// High = large companies (201-1000) + senior titles in active industries
// Medium = mid-size companies (51-200) or mid-level titles
// Low = small companies (1-10, 11-50) + junior titles

function generatePriorityUpdates(): Array<{
  rowIndex: number
  columnId: string
  value: string
}> {
  const updates: Array<{ rowIndex: number; columnId: string; value: string }> = []
  for (let i = 0; i < 130; i++) {
    let priority: string
    if (i < 30) priority = "high"
    else if (i < 80) priority = "medium"
    else priority = "low"
    updates.push({ rowIndex: i, columnId: "fld_priority", value: priority })
  }
  return updates
}

// ─── Steps ───────────────────────────────────────────────────────────────────

export const DEMO_STEPS: DemoStep[] = [
  // ── Step 0: Open Contacts table ──────────────────────────────────────────
  {
    step: 0,
    response:
      "I see 960 contacts in your CRM. Let me open that up and help you prioritize the stale ones.",
    toolCalls: [
      { name: "openDatabase", args: { slug: "contacts" } },
    ],
    toolDelay: 800,
  },

  // ── Step 1: Filter to stale leads ────────────────────────────────────────
  {
    step: 1,
    response:
      "Filtering to leads you haven't contacted in 60+ days. I can see 130 stale leads that need attention.",
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
    toolDelay: 600,
  },

  // ── Step 2: Link lookup columns from Companies table ───────────────────
  // Adds Industry + Company Size as lookup columns. Values resolve
  // automatically via each contact's fld_company ref. No editCells needed.
  // Korra ends with a question — asks permission to research industries.
  {
    step: 2,
    response:
      "Linked Industry and Company Size from your Companies table. I can see 5 industries across your stale leads — Legal (34), Technology (27), Finance (25), Retail (23), Consulting (21). Want me to scan what's happening in these industries so we can prioritize smarter?",
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
        },
      },
    ],
    toolDelay: 800,
  },

  // ── Step 3: Research industries + sort by Legal ────────────────────────
  // User said "yes" to scanning industries. Korra shows a research loading
  // card (searchNews tool — fake, ~2s animation), then comes back with an
  // insight about Legal and sorts the table.
  {
    step: 3,
    response:
      "Legal is seeing major regulatory activity right now — new compliance deadlines are pushing companies to re-evaluate vendors. That's 34 contacts worth reaching out to. Sorting them to the top.",
    toolCalls: [
      {
        name: "searchNews",
        args: {
          industries: ["Legal", "Technology", "Finance", "Retail", "Consulting"],
        },
      },
      {
        name: "sortBy",
        args: {
          sorts: [{ columnId: "fld_industry", desc: false }],
        },
      },
    ],
    toolDelay: 600,
  },

  // ── Step 4: Add Priority column — ALL 130 rows scored ──────────────────
  // Adds Priority column and fills every row with High/Medium/Low.
  // No empties. dryRun shows preview of first 5 before applying to all.
  {
    step: 4,
    response:
      "Now let me score all 130 leads by priority based on title seniority, company size, and industry activity. Here's a preview of the first 5 rows before I apply it to all.",
    ploybook: "Contact Prioritization",
    contextTags: [
      { type: "ploybook", name: "Contact Prioritization", icon: "ploybook" },
    ],
    dryRun: true,
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
    ],
    toolDelay: 500,
  },

  // ── Step 5: Sort by Priority (High first) ──────────────────────────────
  // Korra sorts so High-priority contacts are at the top. Invites the user
  // to review and adjust — sets up the manual edit moment.
  {
    step: 5,
    response:
      "Sorting by priority so your high-value contacts are at the top. Take a look — feel free to adjust any that don't look right.",
    toolCalls: [
      {
        name: "sortBy",
        args: {
          sorts: [{ columnId: "fld_priority", desc: true }],
        },
      },
    ],
    toolDelay: 400,
  },

  // ── Step 6: Acknowledge manual edits + ask about emails ────────────────
  // Between steps 5 and 6, the user manually changes a couple of Low →
  // High (contacts they personally know). This step acknowledges that
  // and asks permission before drafting emails.
  {
    step: 6,
    response:
      "Nice catches — I see you bumped a couple to High. Your priority list is looking solid. Want me to draft personalized re-engagement emails for the high-priority ones?",
    toolCalls: [],
    toolDelay: 0,
  },

  // ── Step 7: Draft follow-up emails ─────────────────────────────────────
  // Adds a Follow-up Draft column (long-text, ai-generated) and generates
  // personalized emails for high-priority contacts.
  {
    step: 7,
    response:
      "Writing follow-up drafts for your high-priority contacts. Each email is personalized with their name, title, company, and the industry context we found.",
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
    toolDelay: 1000,
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
