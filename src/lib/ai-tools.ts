import { tool } from "ai";
import { z } from "zod";

/**
 * Column type options that Korra can use when adding new columns.
 * Matches the CellOpts variant union in types/data-grid.ts.
 */
const columnTypeSchema = z.enum([
  "short-text",
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
};

/** Union type of all Korra tool names */
export type KorraToolName = keyof typeof korraTools;

/** Array of all tool names for runtime use */
export const KORRA_TOOL_NAMES = Object.keys(korraTools) as KorraToolName[];
