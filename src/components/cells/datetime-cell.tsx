"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DataGridCellProps } from "@/types/data-grid";

function formatDatetimeForDisplay(value: string): string {
  if (!value) return "";
  try {
    const date = parseISO(value);
    return format(date, "MMM d, yyyy h:mm a");
  } catch {
    return value;
  }
}

function parseHour12(date: Date): { hour12: number; minutes: number; ampm: "AM" | "PM" } {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  // Snap minutes to nearest quarter
  const snapped = [0, 15, 30, 45].reduce((prev, curr) =>
    Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev
  );
  return { hour12, minutes: snapped, ampm };
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];

export function DatetimeCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = React.useState(initialValue ?? "");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const prevInitialValueRef = React.useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? "");
  }

  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    try {
      return parseISO(value);
    } catch {
      return null;
    }
  }, [value]);

  const timeParts = React.useMemo(() => {
    if (!parsedDate) return { hour12: 12, minutes: 0, ampm: "PM" as const };
    return parseHour12(parsedDate);
  }, [parsedDate]);

  const buildIsoString = React.useCallback(
    (date: Date, hour12: number, minutes: number, ampm: "AM" | "PM") => {
      const d = new Date(date);
      let h = hour12 % 12;
      if (ampm === "PM") h += 12;
      d.setHours(h, minutes, 0, 0);
      return d.toISOString();
    },
    [],
  );

  const onDateSelect = React.useCallback(
    (date: Date | undefined) => {
      if (!date || readOnly) return;
      const iso = buildIsoString(date, timeParts.hour12, timeParts.minutes, timeParts.ampm);
      setValue(iso);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: iso });
    },
    [tableMeta, rowIndex, columnId, readOnly, timeParts, buildIsoString],
  );

  const onTimeChange = React.useCallback(
    (hour12: number, minutes: number, ampm: "AM" | "PM") => {
      if (readOnly) return;
      const base = parsedDate ?? new Date();
      const iso = buildIsoString(base, hour12, minutes, ampm);
      setValue(iso);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: iso });
    },
    [tableMeta, rowIndex, columnId, readOnly, parsedDate, buildIsoString],
  );

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [tableMeta, rowIndex, columnId, readOnly],
  );

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault();
        setValue(initialValue);
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        });
      }
    },
    [isEditing, isFocused, initialValue, tableMeta],
  );

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}
    >
      <Popover open={isEditing} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>
          <span data-slot="grid-cell-content">
            {formatDatetimeForDisplay(value)}
          </span>
        </PopoverAnchor>
        {isEditing && (
          <PopoverContent
            data-grid-cell-editor=""
            align="start"
            alignOffset={-8}
            className="w-auto p-0"
          >
            <Calendar
              autoFocus
              captionLayout="dropdown"
              mode="single"
              defaultMonth={parsedDate ?? new Date()}
              selected={parsedDate ?? undefined}
              onSelect={onDateSelect}
            />
            <div className="flex items-center gap-2 border-t px-3 py-2">
              <Select
                value={String(timeParts.hour12)}
                onValueChange={(v) =>
                  onTimeChange(Number(v), timeParts.minutes, timeParts.ampm)
                }
              >
                <SelectTrigger size="sm" className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">:</span>
              <Select
                value={String(timeParts.minutes)}
                onValueChange={(v) =>
                  onTimeChange(timeParts.hour12, Number(v), timeParts.ampm)
                }
              >
                <SelectTrigger size="sm" className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {String(m).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={timeParts.ampm}
                onValueChange={(v) =>
                  onTimeChange(
                    timeParts.hour12,
                    timeParts.minutes,
                    v as "AM" | "PM",
                  )
                }
              >
                <SelectTrigger size="sm" className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        )}
      </Popover>
    </DataGridCellWrapper>
  );
}
