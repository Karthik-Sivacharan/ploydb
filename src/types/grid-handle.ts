import type { Table } from "@tanstack/react-table"
import type { CellUpdate } from "@/types/data-grid"

type FlatRow = Record<string, unknown>

/**
 * Imperative handle exposing grid APIs for Korra tool calls.
 *
 * DataGridView owns all grid internals; this is the narrow surface
 * that HomeDashboard (and eventually onToolCall) can use to
 * manipulate the table programmatically.
 */
export interface AddColumnOptions {
  id: string
  name: string
  type: string
  options?: Array<{ value: string; label: string; color?: string }>
}

export interface GridHandle {
  /** TanStack Table instance — filters, sorting, selection, row model */
  table: Table<FlatRow>
  /** Update one or more cells by row index + column ID */
  updateCells: (updates: CellUpdate | CellUpdate[]) => void
  /** Delete rows by index */
  deleteRows: (rowIndices: number[]) => void
  /** Add a row with the given field values */
  addRow: (row: FlatRow) => void
  /** Add a new column to the grid */
  addColumn: (options: AddColumnOptions) => void
  /** Replace data + columns (for switching databases) */
  setDataAndColumns: (data: FlatRow[], columns: import("@tanstack/react-table").ColumnDef<FlatRow>[]) => void
  /** Current row data */
  getData: () => FlatRow[]
  /** Switch to an API database by slug */
  openDatabase: (slug: string) => void
}
