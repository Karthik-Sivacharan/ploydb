"use client"

import { useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  BarChart3,
  Filter,
  Pencil,
  Columns3,
  ArrowUpDown,
  Table2,
  ChevronDown,
  Link2,
  FilePenLine,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────

interface ToolCardProps {
  toolName: string
  input: Record<string, unknown>
  result?: Record<string, unknown>
}

// ─── Dispatcher ──────────────────────────────────────────────────────

export function ToolResultCard({ toolName, input, result }: ToolCardProps) {
  switch (toolName) {
    case "filterBy":
      return <FilterBadgeCard input={input} result={result} />
    case "editCells":
      return <EditSummaryCard input={input} result={result} />
    case "addColumn":
      return <AddColumnCard input={input} />
    case "sortBy":
      return <SortBadgeCard input={input} />
    case "openDatabase":
      return <OpenDatabaseCard input={input} />
    case "checkAnalytics":
      return <CheckAnalyticsCard input={input} />
    case "connectApp":
      return <ConnectAppCard input={input} />
    default:
      return null
  }
}

// ─── Shared Card Shell ───────────────────────────────────────────────

function CardShell({
  icon: Icon,
  iconClassName,
  children,
  expandable = false,
  expandContent,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconClassName?: string
  children: React.ReactNode
  expandable?: boolean
  expandContent?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  if (!expandable) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-sm">
        <Icon className={cn("size-3.5 shrink-0 text-muted-foreground", iconClassName)} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {children}
        </div>
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className={cn(
        "flex w-full items-center gap-2.5 border border-border/50 bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted/60",
        open ? "rounded-t-lg border-b-0" : "rounded-lg"
      )}>
        <Icon className={cn("size-3.5 shrink-0 text-muted-foreground", iconClassName)} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {children}
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <div className="rounded-b-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-xs">
          {expandContent}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ─── Filter Badge Card ───────────────────────────────────────────────

function FilterBadgeCard({
  input,
  result,
}: {
  input: Record<string, unknown>
  result?: Record<string, unknown>
}) {
  const filters = (input.filters as Array<Record<string, unknown>>) ?? []
  const filterCount = filters.length
  const rowCount = result?.rowCount as number | undefined

  return (
    <CardShell
      icon={Filter}
      iconClassName="text-sky-600 dark:text-sky-400"
      expandable={filterCount > 1}
      expandContent={
        <div className="space-y-1">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatColumnName(f.columnId as string)}
              </span>
              <span>{formatOperator(f.operator as string)}</span>
              <span className="font-medium text-foreground">
                {formatFilterValue(f.value)}
              </span>
            </div>
          ))}
        </div>
      }
    >
      <span className="text-muted-foreground">
        Applied {filterCount} filter{filterCount !== 1 ? "s" : ""}
      </span>
      {rowCount != null && (
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {rowCount} rows
        </Badge>
      )}
    </CardShell>
  )
}

// ─── Edit Summary Card ───────────────────────────────────────────────

function EditSummaryCard({
  input,
  result,
}: {
  input: Record<string, unknown>
  result?: Record<string, unknown>
}) {
  const updates = (input.updates as Array<Record<string, unknown>>) ?? []
  const updateCount = result?.updateCount ?? updates.length
  const columns = [...new Set(updates.map((u) => u.columnId as string))]
  const columnLabel = columns.length === 1 ? formatColumnName(columns[0]) : `${columns.length} columns`
  const previewUpdates = updates.slice(0, 5)
  const remaining = updates.length - 5

  return (
    <CardShell
      icon={Pencil}
      iconClassName="text-sky-600 dark:text-sky-400"
      expandable={updates.length > 0}
      expandContent={
        <div className="space-y-1">
          {previewUpdates.map((u, i) => (
            <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[10px] tabular-nums text-muted-foreground/60">
                Row {(u.rowIndex as number) + 1}
              </span>
              <span className="font-medium text-foreground">
                {formatColumnName(u.columnId as string)}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {String(u.value)}
              </span>
            </div>
          ))}
          {remaining > 0 && (
            <div className="text-muted-foreground/60">
              and {remaining} more...
            </div>
          )}
        </div>
      }
    >
      <span className="text-muted-foreground">
        Updated {String(updateCount)} row{Number(updateCount) !== 1 ? "s" : ""}
      </span>
      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
        {columnLabel}
      </Badge>
    </CardShell>
  )
}

// ─── Add Column Card ─────────────────────────────────────────────────

function AddColumnCard({ input }: { input: Record<string, unknown> }) {
  const name = input.name as string
  const type = input.type as string
  const source = input.source as "lookup" | "ai-generated" | "clearbit" | undefined
  const options = input.options as Array<{ value: string; label: string }> | undefined

  return (
    <CardShell
      icon={Columns3}
      iconClassName="text-sky-600 dark:text-sky-400"
      expandable={!!options && options.length > 0}
      expandContent={
        options && (
          <div className="space-y-1">
            <div className="text-muted-foreground">
              Type: <span className="font-medium text-foreground">{type}</span>
            </div>
            {options.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {options.map((o) => (
                  <Badge key={o.value} variant="outline" className="px-1.5 py-0 text-[10px]">
                    {o.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      }
    >
      <span className="text-muted-foreground">Added</span>
      <span className="font-medium text-foreground">{name}</span>
      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
        {type}
      </Badge>
      {source && <SourceBadge source={source} />}
    </CardShell>
  )
}

// ─── Sort Badge Card ─────────────────────────────────────────────────

function SortBadgeCard({ input }: { input: Record<string, unknown> }) {
  const sorts = (input.sorts as Array<{ columnId: string; desc: boolean }>) ?? []
  const primary = sorts[0]

  return (
    <CardShell
      icon={ArrowUpDown}
      iconClassName="text-sky-600 dark:text-sky-400"
      expandable={sorts.length > 1}
      expandContent={
        <div className="space-y-1">
          {sorts.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatColumnName(s.columnId)}
              </span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {s.desc ? "DESC" : "ASC"}
              </Badge>
            </div>
          ))}
        </div>
      }
    >
      <span className="text-muted-foreground">Sorted by</span>
      {primary && (
        <>
          <span className="font-medium text-foreground">
            {formatColumnName(primary.columnId)}
          </span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {primary.desc ? "DESC" : "ASC"}
          </Badge>
        </>
      )}
    </CardShell>
  )
}

// ─── Open Database Card ──────────────────────────────────────────────

function OpenDatabaseCard({ input }: { input: Record<string, unknown> }) {
  const slug = input.slug as string

  return (
    <CardShell icon={Table2} iconClassName="text-sky-600 dark:text-sky-400">
      <span className="text-muted-foreground">Opened</span>
      <span className="font-medium capitalize text-foreground">{slug}</span>
    </CardShell>
  )
}

// ─── Check Analytics Card ─────────────────────────────────────────

function CheckAnalyticsCard({ input }: { input: Record<string, unknown> }) {
  const source = input.source as string
  const query = input.query as string

  return (
    <CardShell icon={BarChart3} iconClassName="text-sky-600 dark:text-sky-400">
      <span className="text-muted-foreground">Checked</span>
      <span className="font-medium text-foreground">{source}</span>
      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
        {query}
      </Badge>
    </CardShell>
  )
}

// ─── Connect App Card ─────────────────────────────────────────────

const APP_ICONS: Record<string, { url: string; label: string }> = {
  gmail: {
    url: "https://cdn.brandfetch.io/id5o3EIREg/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1696475443284",
    label: "Gmail",
  },
}

function ConnectAppCard({ input }: { input: Record<string, unknown> }) {
  const app = input.app as string
  const config = APP_ICONS[app] ?? { url: "", label: app }

  return (
    <div className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60">
      {config.url && (
        <img
          src={config.url}
          alt={config.label}
          width={16}
          height={16}
          className="size-4 shrink-0 object-contain"
        />
      )}
      <span className="flex-1 font-medium text-foreground">
        Connect {config.label}
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </div>
  )
}

// ─── Source Badge ────────────────────────────────────────────────────

function SourceBadge({ source }: { source: "lookup" | "ai-generated" | "clearbit" }) {
  if (source === "lookup" || source === "clearbit") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-teal-200 bg-teal-50 px-1.5 py-0 text-[10px] text-teal-700 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300"
      >
        <Link2 className="size-2.5" />
        {source === "clearbit" ? "Clearbit" : "Lookup"}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-sky-200 bg-sky-50 px-1.5 py-0 text-[10px] text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
    >
      <FilePenLine className="size-2.5" />
      AI
    </Badge>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convert "fld_company_name" → "Company Name" */
function formatColumnName(columnId: string): string {
  return columnId
    .replace(/^fld_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatOperator(op?: string): string {
  if (!op) return "="
  const map: Record<string, string> = {
    contains: "contains",
    equals: "=",
    before: "before",
    after: "after",
    gt: ">",
    lt: "<",
    gte: ">=",
    lte: "<=",
    isEmpty: "is empty",
    isNotEmpty: "is not empty",
  }
  return map[op] ?? op
}

function formatFilterValue(value: unknown): string {
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === "string") {
    // Format dates like "2026-02-03" more readably
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
    return value
  }
  return String(value)
}
