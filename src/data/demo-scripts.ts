// Pre-scripted Korra demo flow — "Prioritize stale leads"
//
// Data sourced from live PloyDB API (960 contacts, Contacts table).
// Each step advances automatically on any user message.
//
// Filter math (as of 2026-04-04):
//   fld_tags contains "lead"  => 266 rows
//   fld_last_contacted before 2026-02-03 (60+ days ago) => ~550 rows
//   Combined => 131 stale leads

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

export interface DemoStep {
  step: number
  response: string
  toolCalls: DemoToolCall[]
  dryRun?: boolean
  ploybook?: string
  /** Delay in ms before executing tool calls (feels like "thinking") */
  toolDelay?: number
}

// ─── Steps ───────────────────────────────────────────────────────────────────

export const DEMO_STEPS: DemoStep[] = [
  // Step 0 — Greeting + open Contacts table
  {
    step: 0,
    response:
      "I see 960 contacts in your CRM. Let me open that up and help you prioritize the stale ones.",
    toolCalls: [
      { name: "openDatabase", args: { slug: "contacts" } },
    ],
    toolDelay: 800,
  },

  // Step 1 — Filter to stale leads (tags contains "lead" + last contacted > 60 days ago)
  {
    step: 1,
    response:
      "Filtering to leads you haven't contacted in 60+ days. I can see 131 stale leads that need attention.",
    toolCalls: [
      {
        name: "filterBy",
        args: {
          filters: [
            {
              columnId: "fld_tags",
              operator: "contains",
              value: "lead",
            },
            {
              columnId: "fld_last_contacted",
              operator: "before",
              value: "2026-02-03",
            },
          ],
        },
      },
    ],
    toolDelay: 600,
  },

  // Step 2 — Add Priority column + dry-run preview on first 5 rows
  {
    step: 2,
    response:
      "I'll add a Priority column based on their title seniority and company size. Here's a preview of the first 5 rows before I apply it to all 131.",
    ploybook: "Contact Prioritization",
    dryRun: true,
    toolCalls: [
      {
        name: "addColumn",
        args: {
          id: "fld_priority",
          name: "Priority",
          type: "select",
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

  // Step 3 — Bulk update: set all Technology company contacts to High priority
  //   (Technology = largest industry among stale leads at 27 contacts)
  {
    step: 3,
    response:
      "Done — updated all 27 Technology company contacts to High priority. These are your highest-value stale leads based on industry and seniority.",
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

  // Step 4 — Sort by priority descending so High-priority leads are on top
  {
    step: 4,
    response:
      "Sorted by priority so the most urgent leads are at the top. Click any row to see the full detail and audit trail.",
    toolCalls: [
      {
        name: "sortBy",
        args: {
          sorts: [{ columnId: "fld_priority", desc: false }],
        },
      },
    ],
    toolDelay: 300,
  },
]

// ─── Step Counter ────────────────────────────────────────────────────────────

let currentStep = 0

/** Returns the next demo step and advances the counter. */
export function getNextDemoStep(): DemoStep {
  const step = DEMO_STEPS[currentStep % DEMO_STEPS.length]
  currentStep++
  return step
}

/** Resets the demo counter back to step 0. */
export function resetDemoStep(): void {
  currentStep = 0
}

/** Returns the current step index (before next advance). */
export function getCurrentStep(): number {
  return currentStep
}
