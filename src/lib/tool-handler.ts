import type { RefObject } from "react"
import type { GridHandle } from "@/types/grid-handle"

type FlatRow = Record<string, unknown>

/**
 * Create an onToolCall handler that bridges Korra's AI tool calls
 * to the data grid via the GridHandle ref.
 *
 * This is the critical integration between the AI chat panel and
 * the data grid. Each tool call dispatches to the appropriate
 * GridHandle method.
 */
export function createToolCallHandler(
  gridRef: RefObject<GridHandle | null>
) {
  return async ({ toolCall }: { toolCall: { toolCallId: string; toolName: string; input: unknown } }) => {
    const { toolName, input } = toolCall
    const args = input as Record<string, unknown>

    if (process.env.NODE_ENV === "development") {
      console.log("[Korra tool]", toolName, args)
    }

    const grid = gridRef.current
    if (!grid && toolName !== "openDatabase") {
      console.warn("[Korra tool] Grid ref not available for:", toolName)
      return
    }

    switch (toolName) {
      case "openDatabase": {
        const slug = args.slug as string
        // Grid ref may not be available yet (view is still transitioning).
        // If available, switch to the API database. The view switch to
        // split mode is already handled by HomeDashboard's first-message
        // callback before tool calls arrive.
        if (grid) {
          grid.openDatabase(slug)
        }
        return
      }

      case "editCells": {
        const updates = args.updates as Array<{
          rowIndex: number
          columnId: string
          value: unknown
        }>
        grid!.updateCells(updates)
        return
      }

      case "addColumn": {
        grid!.addColumn({
          id: args.id as string,
          name: args.name as string,
          type: args.type as string,
          options: args.options as
            | Array<{ value: string; label: string; color?: string }>
            | undefined,
        })
        return
      }

      case "filterBy": {
        const filters = args.filters as Array<{
          columnId: string
          value: unknown
          operator?: string
        }>
        // Map to tablecn FilterValue format: { operator, value }
        grid!.table.setColumnFilters(
          filters.map((f) => ({
            id: f.columnId,
            value: {
              operator: f.operator ?? "contains",
              value: f.value,
            },
          }))
        )
        return
      }

      case "sortBy": {
        const sorts = args.sorts as Array<{
          columnId: string
          desc: boolean
        }>
        // Map to TanStack Table SortingState format: { id, desc }
        grid!.table.setSorting(
          sorts.map((s) => ({ id: s.columnId, desc: s.desc }))
        )
        return
      }

      case "addRow": {
        const data = args.data as FlatRow
        const id = `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        grid!.addRow({ _id: id, ...data })
        return
      }

      case "deleteRows": {
        const rowIndices = args.rowIndices as number[]
        grid!.deleteRows(rowIndices)
        return
      }

      default: {
        console.warn("[Korra tool] Unknown tool:", toolName)
        return
      }
    }
  }
}
