// ---------------------------------------------------------------------------
// Demo Scripts — Pre-scripted Korra responses for the happy-path demo.
//
// Pure data + simple state. No React. The Vercel AI SDK MockLanguageModelV1
// streams each `response` character-by-character. A step counter advances on
// every user message — no matter what the user types, we play the next step.
// ---------------------------------------------------------------------------

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
  /** Korra's text response (streamed via mock model) */
  response: string
  /** Tool calls Korra makes after responding */
  toolCalls: DemoToolCall[]
  /** If true, UI shows a dry-run preview card before executing */
  dryRun?: boolean
  /** Ploybook context tag to show in chat */
  ploybook?: string
  /** Delay in ms before tool calls execute (feels like "thinking") */
  toolDelay?: number
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export const DEMO_STEPS: DemoStep[] = [
  // -- Step 0: Open the Contacts database ------------------------------------
  {
    step: 0,
    response:
      "I see 960 contacts in your CRM. Let me open that up and help you prioritize the ones you haven't reached in a while.",
    toolCalls: [
      {
        name: "openDatabase",
        args: { slug: "contacts" },
      },
    ],
    toolDelay: 500,
  },

  // -- Step 1: Filter to stale leads ----------------------------------------
  {
    step: 1,
    response:
      "Filtering to leads you haven't contacted in 60+ days\u2026 I can see 47 stale leads that might need attention.",
    toolCalls: [
      {
        name: "filterBy",
        args: {
          filters: [
            { columnId: "labels", value: "Follow Up" },
            { columnId: "lastContacted", value: "2026-02-01" },
          ],
        },
      },
    ],
    toolDelay: 500,
  },

  // -- Step 2: Add Priority column + dry-run preview (5 rows) ---------------
  {
    step: 2,
    response:
      "I'll add a Priority column based on title seniority and company size. Here's a preview of the first 5 rows \u2014 let me know if this looks right.",
    toolCalls: [
      {
        name: "addColumn",
        args: {
          id: "priority",
          name: "Priority",
          type: "select",
          options: [
            { value: "High", label: "High", color: "#ef4444" },
            { value: "Medium", label: "Medium", color: "#f59e0b" },
            { value: "Low", label: "Low", color: "#22c55e" },
          ],
        },
      },
      {
        name: "editCells",
        args: {
          updates: [
            { rowIndex: 0, columnId: "priority", value: "High" },
            { rowIndex: 1, columnId: "priority", value: "Medium" },
            { rowIndex: 2, columnId: "priority", value: "Low" },
            { rowIndex: 3, columnId: "priority", value: "High" },
            { rowIndex: 4, columnId: "priority", value: "Low" },
          ],
        },
      },
    ],
    dryRun: true,
    ploybook: "Contact Prioritization",
    toolDelay: 800,
  },

  // -- Step 3: Bulk update all 47 contacts ----------------------------------
  {
    step: 3,
    response:
      "Done! Updated all 47 contacts with priority scores. 12 marked as High priority \u2014 mostly healthcare and fintech contacts with VP+ titles.",
    toolCalls: [
      {
        name: "editCells",
        args: {
          updates: [
            { rowIndex: 0, columnId: "priority", value: "High" },
            { rowIndex: 1, columnId: "priority", value: "Medium" },
            { rowIndex: 2, columnId: "priority", value: "Low" },
            { rowIndex: 3, columnId: "priority", value: "High" },
            { rowIndex: 4, columnId: "priority", value: "Low" },
            { rowIndex: 5, columnId: "priority", value: "High" },
            { rowIndex: 6, columnId: "priority", value: "Medium" },
            { rowIndex: 7, columnId: "priority", value: "High" },
            { rowIndex: 8, columnId: "priority", value: "Low" },
            { rowIndex: 9, columnId: "priority", value: "Medium" },
            { rowIndex: 10, columnId: "priority", value: "High" },
            { rowIndex: 11, columnId: "priority", value: "Low" },
            { rowIndex: 12, columnId: "priority", value: "Medium" },
            { rowIndex: 13, columnId: "priority", value: "High" },
            { rowIndex: 14, columnId: "priority", value: "Low" },
            { rowIndex: 15, columnId: "priority", value: "Medium" },
            { rowIndex: 16, columnId: "priority", value: "High" },
            { rowIndex: 17, columnId: "priority", value: "Medium" },
            { rowIndex: 18, columnId: "priority", value: "Low" },
            { rowIndex: 19, columnId: "priority", value: "High" },
          ],
        },
      },
    ],
    toolDelay: 800,
  },

  // -- Step 4: Sort by priority + deal size ---------------------------------
  {
    step: 4,
    response:
      "Here are your high-priority leads sorted by deal size. I'd recommend starting outreach with the top 5 \u2014 they have the largest potential value and haven't been contacted in over 90 days.",
    toolCalls: [
      {
        name: "sortBy",
        args: {
          sorts: [
            { columnId: "priority", desc: false },
            { columnId: "dealSize", desc: true },
          ],
        },
      },
    ],
    toolDelay: 500,
  },
]

// ---------------------------------------------------------------------------
// State management — simple module-level counter
// ---------------------------------------------------------------------------

const FALLBACK_STEP: DemoStep = {
  step: -1,
  response:
    "That covers the priority analysis! Is there anything else you'd like me to help with — cleaning up duplicates, analyzing your pipeline, or something else?",
  toolCalls: [],
}

let currentStep = 0

/** Get the next demo step. Advances the internal counter. Returns a fallback when all steps are exhausted. */
export function getNextDemoStep(): DemoStep {
  if (currentStep >= DEMO_STEPS.length) return FALLBACK_STEP
  const step = DEMO_STEPS[currentStep]!
  currentStep++
  return step
}

/** Reset the demo step counter (for page refresh or restart). */
export function resetDemo(): void {
  currentStep = 0
}

/** Current step index (read-only). */
export function getCurrentStep(): number {
  return currentStep
}
