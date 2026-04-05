export type CellActor = "korra" | "user"

export interface CellAuditEntry {
  actor: CellActor
  value: unknown
  prevValue: unknown
  timestamp: number
  /** Optional: links back to the AI tool call ID */
  toolCallId?: string
  /** Optional: which ploybook/context triggered this */
  context?: string
}

/**
 * Maps "rowId:columnId" -> array of audit entries (most recent last).
 * Stored in a React useState at the DataGridView level.
 * Resets on page refresh (no persistence needed).
 */
export type CellAuditMap = Map<string, CellAuditEntry[]>

/** Helper to build the map key */
export function cellKey(rowId: string, columnId: string): string {
  return `${rowId}:${columnId}`
}

/** Get the most recent entry for a cell (or undefined if never edited) */
export function getLastEdit(
  map: CellAuditMap,
  rowId: string,
  columnId: string
): CellAuditEntry | undefined {
  const entries = map.get(cellKey(rowId, columnId))
  return entries?.[entries.length - 1]
}
