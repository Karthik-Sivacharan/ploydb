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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataGridSkeleton } from "@/components/ui/data-grid-skeleton"
import { createSelectColumn } from "@/lib/select-column"
import type { ColumnDef } from "@tanstack/react-table"
import type { GridHandle, AddColumnOptions, Attribution } from "@/types/grid-handle"
import type { CellSelectOption, CellOpts } from "@/types/data-grid"

type FlatRow = Record<string, unknown>

const selectColumn = createSelectColumn<FlatRow>()

const DEMO_SOURCE_ID = "__demo__"

function DataGridWithToolbar({
  data,
  columns,
  onDataChange,
  onAddColumn,
  onOpenDatabase,
  toolbarSlot,
  gridRef,
}: {
  data: FlatRow[]
  columns: ColumnDef<FlatRow>[]
  onDataChange: (updater: FlatRow[] | ((prev: FlatRow[]) => FlatRow[])) => void
  onAddColumn: (options: AddColumnOptions) => void
  onOpenDatabase: (slug: string) => void
  toolbarSlot: React.RefObject<HTMLDivElement | null>
  gridRef?: React.RefObject<GridHandle | null>
}) {
  // Track who last changed filters/sorting (Korra vs user)
  const [filterAttr, setFilterAttr] = React.useState<Attribution>("user")
  const [sortAttr, setSortAttr] = React.useState<Attribution>("user")
  // Flag: when true, the next filter/sort change came from Korra's tool call
  const korraFilterFlag = React.useRef(false)
  const korraSortFlag = React.useRef(false)

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
    onColumnFiltersChange: () => {
      if (korraFilterFlag.current) {
        korraFilterFlag.current = false
      } else {
        setFilterAttr("user")
      }
    },
    onSortingChange: () => {
      if (korraSortFlag.current) {
        korraSortFlag.current = false
      } else {
        setSortAttr("user")
      }
    },
  })

  // Expose grid APIs for Korra tool calls via imperative handle
  React.useImperativeHandle(gridRef, () => ({
    table: dataGrid.table,
    updateCells: (updates) => dataGrid.tableMeta.onDataUpdate?.(updates),
    deleteRows: (indices) => dataGrid.tableMeta.onRowsDelete?.(indices),
    addRow: (row) => onDataChange((prev) => [...prev, row]),
    addColumn: onAddColumn,
    setDataAndColumns: () => {}, // handled at DataGridView level
    getData: () => data,
    openDatabase: onOpenDatabase,
    setFilterAttribution: (attr) => {
      if (attr === "korra") korraFilterFlag.current = true
      setFilterAttr(attr)
    },
    setSortAttribution: (attr) => {
      if (attr === "korra") korraSortFlag.current = true
      setSortAttr(attr)
    },
  }), [dataGrid.table, dataGrid.tableMeta, onDataChange, onAddColumn, onOpenDatabase, data])

  return (
    <>
      {toolbarSlot.current &&
        ReactDOM.createPortal(
          <>
            <DataGridFilterMenu table={dataGrid.table} align="end" attribution={filterAttr} />
            <DataGridSortMenu table={dataGrid.table} align="end" attribution={sortAttr} />
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

export function DataGridView({
  gridRef,
  initialSlug,
}: {
  gridRef?: React.RefObject<GridHandle | null>
  initialSlug?: string
}) {
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
        const initial = initialSlug ? dbs.find((d) => d.slug === initialSlug) : null
        setActiveDbId(initial?.id ?? dbs[0]?.id ?? null)
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
              const schemaFieldIds = new Set(activeDb.schema.map((f) => f.id))
              for (const key of Object.keys(newRow)) {
                if (key.startsWith("_")) continue
                // Skip columns not in the API schema (e.g. AI-created columns)
                if (!schemaFieldIds.has(key)) continue
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

  // ─── Add column handler (for Korra addColumn tool) ───────────────────
  const handleAddColumn = React.useCallback(
    (opts: AddColumnOptions) => {
      // Build cell config matching the CellOpts union shape exactly
      // so tablecn cell variants can narrow on `variant` at runtime.
      let cellConfig: CellOpts = { variant: "short-text" }

      if (opts.options && ["select", "multi-select", "status", "tags"].includes(opts.type)) {
        const mappedOptions = opts.options.map((o) => ({
          value: o.value,
          label: o.label,
          ...(o.color ? { color: o.color } : {}),
        })) satisfies CellSelectOption[]

        switch (opts.type) {
          case "select":
            cellConfig = { variant: "select", options: mappedOptions }
            break
          case "multi-select":
            cellConfig = { variant: "multi-select", options: mappedOptions }
            break
          case "status":
            cellConfig = {
              variant: "status",
              options: mappedOptions.map((o) => ({
                value: o.value,
                label: o.label,
                color: o.color ?? "#64748b",
              })),
            }
            break
          case "tags":
            cellConfig = { variant: "tags", options: mappedOptions }
            break
        }
      } else {
        // Map type string to known CellOpts variants
        const simpleVariants: Record<string, CellOpts> = {
          "short-text": { variant: "short-text" },
          "long-text": { variant: "long-text" },
          number: { variant: "number" },
          checkbox: { variant: "checkbox" },
          date: { variant: "date" },
          url: { variant: "url" },
          currency: { variant: "currency" },
          percent: { variant: "percent" },
          email: { variant: "email" },
          phone: { variant: "phone" },
          location: { variant: "location" },
          color: { variant: "color" },
          json: { variant: "json" },
          datetime: { variant: "datetime" },
        }
        cellConfig = simpleVariants[opts.type] ?? { variant: "short-text" }
      }

      const newCol: ColumnDef<FlatRow> = {
        id: opts.id,
        accessorKey: opts.id,
        header: opts.name,
        size: 150,
        meta: {
          label: opts.name,
          cell: cellConfig,
          ...(opts.source ? { source: opts.source } : {}),
        },
      }

      setColumns((prev) => [...prev, newCol])

      // Force DataGridRow memo to re-render by creating new row object
      // references. The memo compares `row.original` by reference — if
      // only columns change but data stays the same, rows skip re-render
      // and the new column's cells never mount.
      setData((prev) => prev.map((row) => ({ ...row })))
    },
    []
  )

  // ─── Open database by slug (for Korra openDatabase tool) ─────────────
  const handleOpenDatabase = React.useCallback(
    (slug: string) => {
      const db = databases.find((d) => d.slug === slug)
      if (db) {
        setDataSource("api")
        setActiveDbId(db.id)
      }
    },
    [databases]
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

        {/* Collaborator avatars */}
        <div className="flex -space-x-2">
          <Avatar className="size-9 ring-2 ring-background">
            <AvatarFallback className="bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
              KO
            </AvatarFallback>
          </Avatar>
          <Avatar className="size-9 ring-2 ring-background">
            <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              SC
            </AvatarFallback>
          </Avatar>
        </div>
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
            onAddColumn={handleAddColumn}
            onOpenDatabase={handleOpenDatabase}
            toolbarSlot={toolbarSlotRef}
            gridRef={gridRef}
          />
        ) : null}
      </div>
    </div>
  )
}
