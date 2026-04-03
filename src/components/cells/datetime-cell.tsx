"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
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

function getTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

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

  const timeValue = React.useMemo(
    () => (parsedDate ? getTimeString(parsedDate) : "12:00"),
    [parsedDate],
  );

  const updateDateTime = React.useCallback(
    (date: Date, time: string) => {
      const [h, m] = time.split(":").map(Number);
      const d = new Date(date);
      d.setHours(h, m, 0, 0);
      const iso = d.toISOString();
      setValue(iso);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: iso });
    },
    [tableMeta, rowIndex, columnId],
  );

  const onDateSelect = React.useCallback(
    (date: Date | undefined) => {
      if (!date || readOnly) return;
      updateDateTime(date, timeValue);
    },
    [readOnly, timeValue, updateDateTime],
  );

  const onTimeInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      const base = parsedDate ?? new Date();
      updateDateTime(base, e.target.value);
    },
    [readOnly, parsedDate, updateDateTime],
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
            <div className="border-t px-3 py-2">
              <Input
                type="time"
                value={timeValue}
                onChange={onTimeInputChange}
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
          </PopoverContent>
        )}
      </Popover>
    </DataGridCellWrapper>
  );
}
