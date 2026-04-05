// Happy Path V3 — "Prioritize stale leads"
//
// 8-step scripted demo using live PloyDB API (960 contacts).
// See /HAPPY-PATH-V3.md for the full narrative.
// Enrichment + email data in demo-data.ts (auto-generated from API).
//

import { ENRICHMENT_UPDATES } from "@/data/demo-data"

// Data (as of 2026-04-04):
//   960 total contacts, 266 tagged "lead", 131 stale (60+ days)
//   Industries among stale leads: Legal (34), Technology (27), Finance (24)
//   Company sizes: 1000+ (23 stale leads), 201-1000 (28), etc.
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
      "Filtering to leads you haven't contacted in 60+ days. I can see 131 stale leads that need attention.",
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

  // ── Step 2: Enrich from Companies table ──────────────────────────────────
  // Adds Industry + Company Size columns by reading each contact's linked
  // Company record. Simulated with addColumn + editCells (cross-table lookup
  // is the story, implementation is column add + fill).
  {
    step: 2,
    response:
      "Let me pull in their company details so we can prioritize smarter. Adding Industry and Company Size from your Companies table.",
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
      {
        name: "editCells",
        args: {
          // All 131 rows enriched from Companies table (industry + size)
          updates: ENRICHMENT_UPDATES,
        },
      },
    ],
    toolDelay: 800,
  },

  // ── Step 3: Add Priority column + dry-run preview ────────────────────────
  {
    step: 3,
    response:
      "I'll add a Priority column based on their title seniority and company size. Here's a preview of the first 5 rows before I apply it to all 131.",
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
          updates: [
            { rowIndex: 0, columnId: "fld_priority", value: "high" },
            { rowIndex: 1, columnId: "fld_priority", value: "medium" },
            { rowIndex: 2, columnId: "fld_priority", value: "high" },
            { rowIndex: 3, columnId: "fld_priority", value: "low" },
            { rowIndex: 4, columnId: "fld_priority", value: "medium" },
          ],
        },
      },
    ],
    toolDelay: 500,
  },

  // ── Step 4: Proactive insight ────────────────────────────────────────────
  // Korra surfaces something the user didn't ask for: 23 stale leads at
  // 1000+ companies are the biggest missed opportunities.
  {
    step: 4,
    response:
      "One thing I noticed — 23 of these stale leads are at companies with 1000+ employees. Those are your biggest missed opportunities. I've made sure they're all marked High priority.",
    toolCalls: [
      {
        name: "editCells",
        args: {
          updates: Array.from({ length: 23 }, (_, i) => ({
            rowIndex: i,
            columnId: "fld_priority",
            value: "high",
          })),
        },
      },
    ],
    toolDelay: 600,
  },

  // ── Step 5: Human correction + bulk update ───────────────────────────────
  // In the real flow, the user manually edits a cell first (cell badge flips
  // from Korra to You). Then they type a bulk instruction.
  // This step handles the bulk part — "Apply High to all Technology contacts."
  {
    step: 5,
    response:
      "Done — updated all 27 Technology company contacts to High priority.",
    toolCalls: [
      {
        name: "editCells",
        args: {
          updates: Array.from({ length: 27 }, (_, i) => ({
            rowIndex: i,
            columnId: "fld_priority",
            value: "high",
          })),
        },
      },
    ],
    toolDelay: 400,
  },

  // ── Step 6: Korra asks before drafting emails ────────────────────────────
  // No tool calls — just the question. The user's next message (yes/approve)
  // triggers step 7.
  {
    step: 6,
    response:
      "Your high-priority list is ready — 27 contacts who haven't heard from you in 60+ days. Would you like me to draft re-engagement emails for them?",
    toolCalls: [],
    toolDelay: 0,
  },

  // ── Step 7: Draft outreach emails ────────────────────────────────────────
  // Adds a Follow-up Draft column (long-text) and fills the first few rows
  // with personalized email drafts.
  {
    step: 7,
    response:
      "Writing follow-up drafts for your high-priority contacts. Each email is personalized with their name, title, company, and how long it's been since you last connected.",
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
