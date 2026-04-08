import { tool } from "ai";
import { z } from "zod";

/**
 * Column type options that Korra can use when adding new columns.
 * Matches the CellOpts variant union in types/data-grid.ts.
 */
const columnTypeSchema = z.enum([
  "short-text",
  "long-text",
  "number",
  "select",
  "multi-select",
  "checkbox",
  "date",
  "url",
  "email",
  "phone",
  "currency",
  "percent",
  "status",
  "tags",
]);

const cellUpdateSchema = z.object({
  rowIndex: z.number().int().min(0).describe("Zero-based row index"),
  columnId: z.string().describe("Column ID (accessorKey) to update"),
  value: z.unknown().describe("New cell value"),
});

const columnOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  color: z.string().optional().describe("Hex color for status/tag badges"),
});

const filterSchema = z.object({
  columnId: z.string().describe("Column ID to filter on"),
  operator: z.string().optional().describe("Filter operator — e.g. contains, equals, before, after, isEmpty"),
  value: z.unknown().describe("Filter value — type depends on column"),
});

const sortSchema = z.object({
  columnId: z.string().describe("Column ID to sort by"),
  desc: z.boolean().describe("True for descending, false for ascending"),
});

/**
 * All Korra AI tools for manipulating the data grid.
 * No execute functions — tool calls are handled client-side via onToolCall.
 */
export const korraTools = {
  openDatabase: tool({
    description:
      "Open a database view in the workspace. Use this to navigate the user to a specific database like contacts, companies, or deals.",
    inputSchema: z.object({
      slug: z
        .string()
        .describe(
          'Database identifier, e.g. "contacts", "companies", "deals"'
        ),
    }),
  }),

  editCells: tool({
    description:
      "Batch update one or more cells in the data grid. Each update specifies a row index, column ID, and new value. Use this for bulk operations like filling a column or updating matching rows.",
    inputSchema: z.object({
      updates: z
        .array(cellUpdateSchema)
        .min(1)
        .describe("Array of cell updates to apply"),
      mode: z
        .enum(["replace", "append"])
        .optional()
        .describe("Update mode — 'replace' (default) overwrites the cell, 'append' adds to the existing value"),
    }),
  }),

  addColumn: tool({
    description:
      "Add a new column to the data grid with a specified field type. For select, multi-select, status, and tags types, provide options. The column appears at the end of the grid.",
    inputSchema: z.object({
      id: z.string().describe("Unique column identifier (camelCase)"),
      name: z.string().describe("Display name shown in the column header"),
      type: columnTypeSchema.describe("Cell variant / field type"),
      options: z
        .array(columnOptionSchema)
        .optional()
        .describe(
          "Options for select, multi-select, status, and tags column types"
        ),
      source: z
        .enum(["lookup", "ai-generated", "clearbit"])
        .optional()
        .describe("Column data source — lookup for cross-table references, ai-generated for AI-created data, clearbit for Clearbit enrichment"),
      lookupConfig: z
        .object({
          targetTable: z.string().describe("Slug of the target table to look up"),
          refField: z.string().describe("Ref field on the current table pointing to the target"),
          targetField: z.string().describe("Field on the target table to read the value from"),
        })
        .optional()
        .describe("Config for lookup columns — resolves values from a linked table"),
    }),
  }),

  filterBy: tool({
    description:
      "Apply column filters to narrow the visible rows. Pass an empty array to clear all filters. Each filter targets a column ID with a value.",
    inputSchema: z.object({
      filters: z
        .array(filterSchema)
        .describe("Filters to apply. Empty array clears all filters."),
    }),
  }),

  sortBy: tool({
    description:
      "Apply sorting to one or more columns. Pass an empty array to clear sorting. Multiple sorts create a multi-level sort (first sort is primary).",
    inputSchema: z.object({
      sorts: z
        .array(sortSchema)
        .describe("Sort specifications. Empty array clears sorting."),
    }),
  }),

  addRow: tool({
    description:
      "Add a new row to the data grid. Provide field values as key-value pairs where keys are column IDs. Omitted fields will be empty.",
    inputSchema: z.object({
      data: z
        .record(z.string(), z.unknown())
        .describe("Row data as { columnId: value } pairs"),
    }),
  }),

  deleteRows: tool({
    description:
      "Delete one or more rows from the data grid by their zero-based row indices. Indices refer to the current visible (filtered/sorted) order.",
    inputSchema: z.object({
      rowIndices: z
        .array(z.number().int().min(0))
        .min(1)
        .describe("Zero-based row indices to delete"),
    }),
  }),

  searchNews: tool({
    description:
      "Search external news sources for recent industry activity, market trends, and adoption signals. Returns insights that can inform prioritization and outreach strategy. This is a research tool — it does not modify the grid.",
    inputSchema: z.object({
      industries: z
        .array(z.string())
        .min(1)
        .describe("List of industry names to research"),
    }),
  }),

  checkAnalytics: tool({
    description:
      "Check analytics data from connected tools like Google Analytics. Use this to look up AB test results, conversion data, and experiment outcomes.",
    inputSchema: z.object({
      source: z.string().describe("Analytics source to check, e.g. 'Google Analytics'"),
      query: z.string().describe("What to look up, e.g. 'AB test results for legal landing page'"),
    }),
  }),

};

/** Union type of all Korra tool names */
export type KorraToolName = keyof typeof korraTools;

/** Array of all tool names for runtime use */
export const KORRA_TOOL_NAMES = Object.keys(korraTools) as KorraToolName[];
