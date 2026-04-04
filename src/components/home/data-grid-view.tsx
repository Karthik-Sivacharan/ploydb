"use client"

import * as React from "react"
import * as ReactDOM from "react-dom"
import { DataGrid } from "@/components/data-grid/data-grid"
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu"
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu"
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu"
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu"
import { useDataGrid } from "@/hooks/use-data-grid"

import {
  listDatabases,
  queryRows,
  updateRow as apiUpdateRow,
  type DatabaseRecord,
} from "@/lib/ploydb-api"
import {
  schemaToColumns,
  apiRowToFlat,
  flatPropsToApi,
  extractDisplayName,
} from "@/lib/schema-to-columns"

import { generateSeedData } from "@/data/seed"
import { columns as fakerColumns } from "@/data/columns"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataGridSkeleton } from "@/components/ui/data-grid-skeleton"
import { createSelectColumn } from "@/lib/select-column"
import type { ColumnDef } from "@tanstack/react-table"

type FlatRow = Record<string, unknown>

const selectColumn = createSelectColumn<FlatRow>()

const DEMO_SOURCE_ID = "__demo__"

function DataGridWithToolbar({
  data,
  columns,
  onDataChange,
  toolbarSlot,
}: {
  data: FlatRow[]
  columns: ColumnDef<FlatRow>[]
  onDataChange: (updater: FlatRow[] | ((prev: FlatRow[]) => FlatRow[])) => void
  toolbarSlot: React.RefObject<HTMLDivElement | null>
}) {
  const dataGrid = useDataGrid<FlatRow>({
    data,
    columns,
    onDataChange,
    enableSearch: true,
    enablePaste: true,
    enableRowSelection: true,
    initialState: {
      columnPinning: { left: ["select"] },
    },
  })

  return (
    <>
      {toolbarSlot.current &&
        ReactDOM.createPortal(
          <>
            <DataGridFilterMenu table={dataGrid.table} align="end" />
            <DataGridSortMenu table={dataGrid.table} align="end" />
            <DataGridRowHeightMenu table={dataGrid.table} align="end" />
            <DataGridViewMenu table={dataGrid.table} align="end" />
          </>,
          toolbarSlot.current,
        )}
      <DataGrid {...dataGrid} height={0} className="h-full" />
    </>
  )
}

type DataSource = "api" | "demo"

export function DataGridView() {
  const toolbarSlotRef = React.useRef<HTMLDivElement | null>(null)
  const [dataSource, setDataSource] = React.useState<DataSource>("api")
  const [databases, setDatabases] = React.useState<DatabaseRecord[]>([])
  const [activeDbId, setActiveDbId] = React.useState<string | null>(null)
  const [data, setData] = React.useState<FlatRow[]>([])
  const [columns, setColumns] = React.useState<ColumnDef<FlatRow>[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const activeDb = databases.find((db) => db.id === activeDbId) ?? null

  // ─── Load database list on mount ──────────────────────────────────────
  React.useEffect(() => {
    listDatabases()
      .then((dbs) => {
        setDatabases(dbs)
        const companies = dbs.find((d) => d.slug === "companies")
        setActiveDbId(companies?.id ?? dbs[0]?.id ?? null)
      })
      .catch(() => {
        setDataSource("demo")
        loadDemoData()
      })
  }, [])

  // ─── Load demo (faker) data ───────────────────────────────────────────
  const loadDemoData = React.useCallback(() => {
    const seedData = generateSeedData() as unknown as FlatRow[]
    setColumns([selectColumn, ...(fakerColumns as unknown as ColumnDef<FlatRow>[])])
    setData(seedData)
    setLoading(false)
    setError(null)
  }, [])

  // ─── Load API data when active DB changes ─────────────────────────────
  React.useEffect(() => {
    if (dataSource !== "api" || !activeDbId || !activeDb) return

    let cancelled = false
    setLoading(true)
    setError(null)

    async function loadDatabase() {
      try {
        const { rows } = await queryRows(activeDbId!, { limit: 1000 })

        const refRecordsMap = new Map<
          string,
          Array<{ id: string; name: string }>
        >()

        const refSlugs = [
          ...new Set(
            activeDb!.schema
              .filter((f) => f.type === "ref" || f.type === "refs")
              .map((f) => f.config?.targetDatabase as string)
              .filter(Boolean)
          ),
        ]

        await Promise.all(
          refSlugs.map(async (slug) => {
            const targetDb = databases.find((d) => d.slug === slug)
            if (!targetDb) return
            try {
              const { rows: refRows } = await queryRows(targetDb.id, {
                limit: 500,
              })
              refRecordsMap.set(
                slug,
                refRows.map((r) => ({
                  id: r.id,
                  name: extractDisplayName(r),
                }))
              )
            } catch {
              refRecordsMap.set(slug, [])
            }
          })
        )

        if (cancelled) return

        const cols = schemaToColumns(
          activeDb!.schema,
          activeDb!.fieldOrder,
          refRecordsMap
        )
        const flatRows = rows.map((r) =>
          apiRowToFlat(r, activeDb!.schema, refRecordsMap)
        )

        setColumns([selectColumn, ...cols])
        setData(flatRows)
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(
            `Failed to load: ${err instanceof Error ? err.message : String(err)}`
          )
          setLoading(false)
        }
      }
    }

    loadDatabase()
    return () => {
      cancelled = true
    }
  }, [dataSource, activeDbId, activeDb, databases])

  // ─── Handle data changes ──────────────────────────────────────────────
  const handleDataChange = React.useCallback(
    (updater: FlatRow[] | ((prev: FlatRow[]) => FlatRow[])) => {
      setData((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : updater

        if (dataSource === "api" && activeDbId && activeDb) {
          for (let i = 0; i < next.length; i++) {
            const oldRow = prev[i]
            const newRow = next[i]
            if (oldRow && newRow && oldRow !== newRow) {
              const changedProps: Record<string, unknown> = {}
              for (const key of Object.keys(newRow)) {
                if (key.startsWith("_")) continue
                if (newRow[key] !== oldRow[key]) {
                  changedProps[key] = newRow[key]
                }
              }

              if (Object.keys(changedProps).length > 0) {
                const rowId = newRow._id as string
                const version = (newRow._version as number) ?? 0
                const apiProps = flatPropsToApi(changedProps, activeDb.schema)

                apiUpdateRow(activeDbId, rowId, apiProps, version)
                  .then((updated) => {
                    setData((current) =>
                      current.map((r) =>
                        r._id === rowId
                          ? { ...r, _version: Number(updated.version) }
                          : r
                      )
                    )
                  })
                  .catch((err) => {
                    console.error("Failed to save row:", err)
                  })
              }
            }
          }
        }

        return next
      })
    },
    [dataSource, activeDbId, activeDb]
  )

  // ─── Picker change handler ────────────────────────────────────────────
  function handlePickerChange(value: string) {
    if (value === DEMO_SOURCE_ID) {
      setDataSource("demo")
      setActiveDbId(null)
      loadDemoData()
    } else {
      setDataSource("api")
      setActiveDbId(value)
    }
  }

  const pickerValue =
    dataSource === "demo" ? DEMO_SOURCE_ID : activeDbId ?? ""

  const ready = !loading && !error && columns.length > 0

  return (
    <div className="flex h-full flex-col">
      <div
        role="toolbar"
        aria-orientation="horizontal"
        className="flex items-center gap-2 border-b px-4 py-2"
      >
        <Select value={pickerValue} onValueChange={handlePickerChange}>
          <SelectTrigger className="h-9 w-fit gap-1.5">
            <SelectValue placeholder="Select database" />
          </SelectTrigger>
          <SelectContent>
            {databases.length > 0 && (
              <SelectGroup>
                <SelectLabel>Live API</SelectLabel>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    {db.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            <SelectGroup>
              <SelectLabel>Demo</SelectLabel>
              <SelectItem value={DEMO_SOURCE_ID}>
                CRM Demo (Faker)
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {data.length} rows
          {dataSource === "demo" && " · in-memory"}
        </span>

        <div ref={toolbarSlotRef} className="ml-auto flex items-center gap-2" />
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <DataGridSkeleton className="h-full" />
        ) : error ? (
          <div className="flex h-full items-center justify-center text-destructive">
            {error}
          </div>
        ) : ready ? (
          <DataGridWithToolbar
            key={dataSource === "demo" ? "demo" : activeDbId ?? "api"}
            data={data}
            columns={columns}
            onDataChange={handleDataChange}
            toolbarSlot={toolbarSlotRef}
          />
        ) : null}
      </div>
    </div>
  )
}
