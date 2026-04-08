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
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Folder, Table2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DataGridSkeleton } from "@/components/ui/data-grid-skeleton"
import { createSelectColumn } from "@/lib/select-column"
import type { ColumnDef } from "@tanstack/react-table"
import type { GridHandle, AddColumnOptions, Attribution } from "@/types/grid-handle"
import type { CellSelectOption, CellOpts } from "@/types/data-grid"
import type { CellAuditMap, CellActor } from "@/types/cell-attribution"
import { cellKey } from "@/types/cell-attribution"

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
  footerExtra,
  generatingColumns,
  onSetGeneratingColumn,
  cellAuditMap,
  onRecordCellEdit,
  showAuditTrail = true,
  korraEditCount,
}: {
  data: FlatRow[]
  columns: ColumnDef<FlatRow>[]
  onDataChange: (updater: FlatRow[] | ((prev: FlatRow[]) => FlatRow[])) => void
  onAddColumn: (options: AddColumnOptions) => void
  onOpenDatabase: (slug: string) => void
  toolbarSlot: React.RefObject<HTMLDivElement | null>
  gridRef?: React.RefObject<GridHandle | null>
  footerExtra?: React.ReactNode
  generatingColumns?: Set<string>
  onSetGeneratingColumn?: (columnId: string, generating: boolean) => void
  cellAuditMap?: CellAuditMap
  onRecordCellEdit?: (rowId: string, columnId: string, value: unknown, prevValue: unknown, actor: CellActor, toolCallId?: string, context?: string) => void
  showAuditTrail?: boolean
  korraEditCount?: React.RefObject<number>
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
    updateCells: (updates) => {
      if (korraEditCount) korraEditCount.current++
      dataGrid.tableMeta.onDataUpdate?.(updates)
    },
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
    setGeneratingColumn: (columnId, generating) => {
      onSetGeneratingColumn?.(columnId, generating)
    },
    recordCellEdit: onRecordCellEdit,
  }), [dataGrid.table, dataGrid.tableMeta, onDataChange, onAddColumn, onOpenDatabase, data, onSetGeneratingColumn, onRecordCellEdit])

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
      <DataGrid {...dataGrid} height={0} className="h-full" footerExtra={footerExtra} generatingColumns={generatingColumns} cellAuditMap={cellAuditMap} showAuditTrail={showAuditTrail} />
    </>
  )
}

type DataSource = "api" | "demo"

export function DataGridView({
  gridRef,
  initialSlug,
  showAuditTrail = true,
}: {
  gridRef?: React.RefObject<GridHandle | null>
  initialSlug?: string
  showAuditTrail?: boolean
}) {
  const toolbarSlotRef = React.useRef<HTMLDivElement | null>(null)
  const [dataSource, setDataSource] = React.useState<DataSource>("api")
  const [databases, setDatabases] = React.useState<DatabaseRecord[]>([])
  const [activeDbId, setActiveDbId] = React.useState<string | null>(null)
  const [data, setData] = React.useState<FlatRow[]>([])
  const [columns, setColumns] = React.useState<ColumnDef<FlatRow>[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [syncEnabled, setSyncEnabled] = React.useState(true)
  const [generatingColumns, setGeneratingColumns] = React.useState<Set<string>>(new Set())
  const [cellAuditMap, setCellAuditMap] = React.useState<CellAuditMap>(new Map())
  // Counter: suppress "user" attribution when Korra's tool calls flow through handleDataChange.
  // Uses a counter instead of boolean so multiple concurrent Korra edits (e.g. two lookup
  // columns resolving near-simultaneously) don't lose the flag when the first one is consumed.
  const korraEditCount = React.useRef(0)
  // Flag: suppress attribution when addColumn spreads rows for re-render
  const addColumnFlag = React.useRef(false)
  // Tracks the latest committed data so handleDataChange can diff outside of
  // the setData updater. This avoids React strict mode double-invoking the
  // updater and recording duplicate attribution entries.
  const committedDataRef = React.useRef(data)
  React.useEffect(() => { committedDataRef.current = data }, [data])

  const recordCellEdit = React.useCallback(
    (
      rowId: string,
      columnId: string,
      value: unknown,
      prevValue: unknown,
      actor: CellActor,
      toolCallId?: string,
      context?: string
    ) => {
      setCellAuditMap((prev) => {
        const key = cellKey(rowId, columnId)
        const entries = [...(prev.get(key) ?? [])]

        // Deduplicate: when React strict mode double-invokes this updater,
        // the second invocation is chained (receives the first's result as
        // `prev`) and sees the entry we just pushed. Skip if the last entry
        // matches exactly within the same edit cycle.
        const last = entries[entries.length - 1]
        if (
          last &&
          last.actor === actor &&
          last.value === value &&
          last.prevValue === prevValue &&
          Date.now() - last.timestamp < 500
        ) {
          return prev
        }

        const next = new Map(prev)
        entries.push({
          actor,
          value,
          prevValue,
          timestamp: Date.now(),
          toolCallId,
          context,
        })
        // Keep last 10 entries per cell
        if (entries.length > 10) entries.shift()
        next.set(key, entries)
        return next
      })
    },
    []
  )

  const handleSetGeneratingColumn = React.useCallback(
    (columnId: string, generating: boolean) => {
      setGeneratingColumns((prev) => {
        const next = new Set(prev)
        if (generating) next.add(columnId)
        else next.delete(columnId)
        return next
      })
    },
    []
  )

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
  // Attribution and API-sync logic lives OUTSIDE the setData updater to
  // avoid React strict mode double-invoking the updater and recording
  // duplicate audit entries / duplicate API calls.
  const handleDataChange = React.useCallback(
    (updater: FlatRow[] | ((prev: FlatRow[]) => FlatRow[])) => {
      const prev = committedDataRef.current
      const next = typeof updater === "function" ? updater(prev) : updater

      // Eagerly update the ref so back-to-back calls (e.g. concurrent
      // Korra edits) each see the previous call's result as `prev`.
      committedDataRef.current = next

      // Record user edits for attribution.
      // Skip when: Korra's tool call triggered this (korraEditCount) or
      // addColumn spread rows for re-render (addColumnFlag).
      // Always consume addColumnFlag when korraEditCount is consumed —
      // otherwise the flag leaks (addColumn is always followed by
      // updateCells which has korraEditCount > 0, so the else-if never
      // fires, leaving addColumnFlag stale for the next user edit).
      if (korraEditCount.current > 0) {
        korraEditCount.current--
        if (addColumnFlag.current) addColumnFlag.current = false
      } else if (addColumnFlag.current) {
        addColumnFlag.current = false
      } else {
        // Build set of lookup column IDs — these are linked data, not user edits
        const lookupColIds = new Set<string>()
        for (const col of columns) {
          const meta = (col as { meta?: { source?: string } }).meta
          if (meta?.source === "lookup" || meta?.source === "clearbit") {
            lookupColIds.add((col as { id?: string }).id ?? "")
          }
        }

        for (let i = 0; i < next.length; i++) {
          const oldRow = prev[i]
          const newRow = next[i]
          if (oldRow && newRow && oldRow !== newRow) {
            const rowId = (newRow._id ?? oldRow._id) as string | undefined
            if (rowId) {
              for (const key of Object.keys(newRow)) {
                if (key.startsWith("_")) continue
                // Skip lookup columns — they're linked data, not edits
                if (lookupColIds.has(key)) continue
                if (newRow[key] !== oldRow[key]) {
                  recordCellEdit(rowId, key, newRow[key], oldRow[key], "user")
                }
              }
            }
          }
        }
      }

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

      // Pass the value directly — not a function updater — so React strict
      // mode has nothing to double-invoke.
      setData(next)
    },
    [dataSource, activeDbId, activeDb, columns, recordCellEdit]
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

      // Build custom sort function for select columns — sort by option
      // order (index in the options array) instead of alphabetical.
      // This ensures High > Medium > Low, not alphabetical h < l < m.
      let sortingFn: ColumnDef<FlatRow>["sortingFn"] | undefined
      if (opts.options && ["select", "status"].includes(opts.type)) {
        const rankMap = new Map(opts.options.map((o, i) => [o.value, i]))
        sortingFn = (rowA, rowB, columnId) => {
          const a = rankMap.get(rowA.getValue(columnId) as string) ?? 999
          const b = rankMap.get(rowB.getValue(columnId) as string) ?? 999
          return a - b
        }
      }

      const newCol: ColumnDef<FlatRow> = {
        id: opts.id,
        accessorKey: opts.id,
        header: opts.name,
        size: 150,
        ...(sortingFn ? { sortingFn } : {}),
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
      addColumnFlag.current = true
      setData((prev) => prev.map((row) => ({ ...row })))

      // Scroll to reveal the new column after it renders
      requestAnimationFrame(() => {
        const grid = document.querySelector<HTMLElement>('[data-slot="grid"]')
        if (grid) {
          grid.scrollTo({ left: grid.scrollWidth, behavior: "smooth" })
        }
      })
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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Folder className="h-3.5 w-3.5" />
                Q1 Tables
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Select value={pickerValue} onValueChange={handlePickerChange}>
                <SelectTrigger className="h-auto gap-1.5 border-0 bg-transparent p-0 text-sm font-normal text-foreground shadow-none focus:ring-0">
                  <Table2 className="h-3.5 w-3.5" />
                  <span>{activeDb?.title ?? (dataSource === "demo" ? "CRM Demo" : "Select table")}</span>
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
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

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
            generatingColumns={generatingColumns}
            onSetGeneratingColumn={handleSetGeneratingColumn}
            cellAuditMap={cellAuditMap}
            onRecordCellEdit={recordCellEdit}
            showAuditTrail={showAuditTrail}
            korraEditCount={korraEditCount}
            footerExtra={
              <div className="flex items-center gap-1.5">
                <Label htmlFor="sync-toggle" className="text-xs text-muted-foreground">
                  Sync
                </Label>
                <Switch
                  id="sync-toggle"
                  checked={syncEnabled}
                  onCheckedChange={setSyncEnabled}
                  className="h-4 w-7 data-[state=checked]:bg-sky-600 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-3"
                />
                <img
                  src="https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idKa2XnbFY.svg?c=1bxid64Mup7aczewSAYMX&t=1755572735234"
                  alt="Sheets"
                  width={14}
                  height={14}
                  className="size-3.5 object-contain"
                />
                <Separator orientation="vertical" className="h-3 bg-muted-foreground/40" />
                <span className={cn(
                  "text-xs",
                  syncEnabled ? "text-muted-foreground" : "text-amber-500"
                )}>
                  Last synced 2m ago
                </span>
              </div>
            }
          />
        ) : null}
      </div>

    </div>
  )
}
