import type { RefObject } from "react"
import type { GridHandle } from "@/types/grid-handle"

const AI_GENERATING_DELAY = 5000

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
  const generatingColumns = new Set<string>()

  return async ({ toolCall }: { toolCall: { toolCallId: string; toolName: string; input: unknown } }) => {
    const { toolName, input } = toolCall
    const args = input as Record<string, unknown>

    console.log("[Korra tool] raw toolCall:", JSON.stringify(toolCall).slice(0, 300))
    console.log("[Korra tool]", toolName, "args:", JSON.stringify(args).slice(0, 200))

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
        const targetCols = new Set(updates.map((u) => u.columnId))
        const hasGenerating = [...targetCols].some((c) => generatingColumns.has(c))

        // Capture previous values before update for attribution
        const prevValues: Array<{ rowId: string; columnId: string; prevValue: unknown }> = []
        if (grid!.recordCellEdit) {
          const data = grid!.getData()
          for (const u of updates) {
            const row = data[u.rowIndex]
            if (row) {
              prevValues.push({
                rowId: row._id as string,
                columnId: u.columnId,
                prevValue: row[u.columnId],
              })
            }
          }
        }

        // Default: apply updates directly (with delay if generating)
        if (hasGenerating) {
          await new Promise((r) => setTimeout(r, AI_GENERATING_DELAY))
        }
        grid!.updateCells(updates)

        // Record Korra edits for attribution
        if (grid!.recordCellEdit) {
          for (let i = 0; i < updates.length; i++) {
            const prev = prevValues[i]
            if (prev) {
              grid!.recordCellEdit(
                prev.rowId,
                prev.columnId,
                updates[i].value,
                prev.prevValue,
                "korra",
                toolCall.toolCallId
              )
            }
          }
        }

        for (const colId of targetCols) {
          if (generatingColumns.has(colId)) {
            generatingColumns.delete(colId)
            grid!.setGeneratingColumn(colId, false)
          }
        }
        return
      }

      case "addColumn": {
        const colId = args.id as string
        const source = args.source as "lookup" | "ai-generated" | undefined
        grid!.addColumn({
          id: colId,
          name: args.name as string,
          type: args.type as string,
          options: args.options as
            | Array<{ value: string; label: string; color?: string }>
            | undefined,
          source,
        })
        // Check if rows already have data for this column
        if (colId === "fld_followup_draft") {
          const existingData = grid!.getData()
          const rowsWithData = existingData
            .map((r: Record<string, unknown>, i: number) => r.fld_followup_draft ? { i, val: String(r.fld_followup_draft).slice(0, 50) } : null)
            .filter(Boolean)
          console.log("[Korra] rows with fld_followup_draft:", rowsWithData.length, "of", existingData.length)
          if (rowsWithData.length > 0) {
            console.log("[Korra] SAMPLE:", JSON.stringify(rowsWithData.slice(0, 3)))
          }
          // Also check if the key exists at all (even with falsy value)
          const rowsWithKey = existingData.filter((r: Record<string, unknown>) => "fld_followup_draft" in r).length
          console.log("[Korra] rows with key 'fld_followup_draft' (even undefined):", rowsWithKey)
        }
        // Clear any stale data for this column from rows
        if (colId === "fld_followup_draft") {
          const data = grid!.getData()
          const clearUpdates = data
            .map((_: unknown, i: number) => ({ rowIndex: i, columnId: colId, value: undefined }))
            .filter((_: unknown, i: number) => (data[i] as Record<string, unknown>)[colId] !== undefined)
          if (clearUpdates.length > 0) {
            console.log("[Korra] Clearing", clearUpdates.length, "stale fld_followup_draft values")
            grid!.updateCells(clearUpdates)
          }
        }
        // Start shimmer + AI content generation for follow-up draft column
        if (source === "ai-generated" && colId === "fld_followup_draft") {
          generatingColumns.add(colId)
          grid!.setGeneratingColumn(colId, true)

          // Generate AI content for high-priority contacts only
          const rows = grid!.table.getRowModel().rows
          const contacts = rows
            .map((row, i) => {
              const d = row.original as Record<string, unknown>
              if ((d.fld_priority as string) !== "high") return null
              const name = (d.fld_name as string) ?? (d.fld_first_name as string) ?? "there"
              const company = (d.fld_company_name as string) ?? (d.fld_company as string) ?? "your company"
              const title = (d.fld_title as string) ?? (d.fld_job_title as string) ?? ""
              const industry = (d.fld_industry as string) ?? ""
              const lastContacted = d.fld_last_contacted as string
              const daysSinceContact = lastContacted
                ? Math.floor((Date.now() - new Date(lastContacted).getTime()) / 86400000)
                : 90
              return { rowIndex: i, name, company, title, industry, daysSinceContact }
            })
            .filter((c): c is NonNullable<typeof c> => c !== null)
            .slice(0, 30)

          console.log("[Korra] Starting AI email generation for", contacts.length, "high-priority contacts")
          fetch("/api/generate-emails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contacts }),
          })
            .then((res) => res.json())
            .then(({ updates: emailUpdates }) => {
              // Record attribution before applying updates
              if (grid!.recordCellEdit) {
                const data = grid!.getData()
                for (const u of emailUpdates as Array<{ rowIndex: number; columnId: string; value: unknown }>) {
                  const row = data[u.rowIndex]
                  if (row) {
                    grid!.recordCellEdit!(
                      row._id as string,
                      u.columnId,
                      u.value,
                      row[u.columnId],
                      "korra",
                      undefined,
                      "Follow-up Draft"
                    )
                  }
                }
              }
              grid!.updateCells(emailUpdates)
              generatingColumns.delete(colId)
              grid!.setGeneratingColumn(colId, false)
            })
            .catch((err) => {
              console.error("[Korra] AI email generation failed:", err)
              generatingColumns.delete(colId)
              grid!.setGeneratingColumn(colId, false)
            })
        }
        return
      }

      case "filterBy": {
        const filters = args.filters as Array<{
          columnId: string
          value: unknown
          operator?: string
        }>
        grid!.setFilterAttribution("korra")
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
        grid!.setSortAttribution("korra")
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
