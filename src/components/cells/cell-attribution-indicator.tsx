"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { CellAuditEntry } from "@/types/cell-attribution"

interface CellAttributionIndicatorProps {
  entries: CellAuditEntry[]
}

export function CellAttributionIndicator({
  entries,
}: CellAttributionIndicatorProps) {
  if (entries.length === 0) return null

  const lastEntry = entries[entries.length - 1]
  const isKorra = lastEntry.actor === "korra"

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute right-0 top-0 z-10 size-0 cursor-pointer"
              style={{
                borderStyle: "solid",
                borderWidth: "0 8px 8px 0",
                borderColor: `transparent ${
                  isKorra
                    ? "var(--color-sky-500)"
                    : "var(--color-amber-500)"
                } transparent transparent`,
              }}
              aria-label={`Last edited by ${isKorra ? "Korra" : "You"}`}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                isKorra ? "bg-sky-500" : "bg-amber-500"
              )}
            />
            Last edited by {isKorra ? "Korra" : "You"}
            <span className="text-muted-foreground">
              {formatDistanceToNow(lastEntry.timestamp, {
                addSuffix: true,
              })}
            </span>
          </span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side="bottom"
        align="end"
        className="w-64 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            Edit History
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {[...entries].reverse().map((entry, i) => (
            <AuditEntryRow key={i} entry={entry} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AuditEntryRow({ entry }: { entry: CellAuditEntry }) {
  const isKorra = entry.actor === "korra"
  const displayValue = (v: unknown) => {
    if (v === null || v === undefined) return "(empty)"
    if (typeof v === "string") return v || "(empty)"
    return String(v)
  }

  return (
    <div className="flex items-start gap-2 border-b px-3 py-2 last:border-b-0">
      <span
        className={cn(
          "mt-1 inline-block size-2 shrink-0 rounded-full",
          isKorra ? "bg-sky-500" : "bg-amber-500"
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">
            {isKorra ? "Korra" : "You"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {entry.prevValue !== null && entry.prevValue !== undefined ? (
            <>
              <span className="line-through opacity-60">
                {displayValue(entry.prevValue)}
              </span>
              {" → "}
            </>
          ) : null}
          <span
            className={
              isKorra
                ? "text-sky-600 dark:text-sky-400"
                : "text-amber-600 dark:text-amber-400"
            }
          >
            {displayValue(entry.value)}
          </span>
        </div>
        {entry.context && (
          <div className="mt-0.5 text-[10px] text-muted-foreground italic">
            via {entry.context}
          </div>
        )}
      </div>
    </div>
  )
}
