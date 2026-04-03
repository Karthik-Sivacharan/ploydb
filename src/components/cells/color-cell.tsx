"use client";

import * as React from "react";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DataGridCellProps } from "@/types/data-grid";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#000000",
];

export function ColorCell<TData>({
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
  const [hexInput, setHexInput] = React.useState(initialValue ?? "");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

  const prevInitialValueRef = React.useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? "");
    setHexInput(initialValue ?? "");
  }

  const selectColor = React.useCallback(
    (color: string) => {
      if (readOnly) return;
      setValue(color);
      setHexInput(color);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: color });
    },
    [tableMeta, rowIndex, columnId, readOnly],
  );

  const onHexSubmit = React.useCallback(() => {
    if (readOnly) return;
    const trimmed = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
      setValue(trimmed);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: trimmed });
    } else {
      setHexInput(value);
    }
  }, [hexInput, value, tableMeta, rowIndex, columnId, readOnly]);

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
        setValue(initialValue ?? "");
        setHexInput(initialValue ?? "");
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

  const onHexKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onHexSubmit();
      }
      if (event.key === "Escape") {
        event.stopPropagation();
      }
    },
    [onHexSubmit],
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
      {isEditing ? (
        <Popover open={isEditing} onOpenChange={onOpenChange}>
          <PopoverAnchor asChild>
            <div className="absolute inset-0" />
          </PopoverAnchor>
          <PopoverContent
            data-grid-cell-editor=""
            align="start"
            sideOffset={sideOffset}
            className="w-[220px] p-3"
          >
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "size-7 rounded-md border-2 transition-transform hover:scale-110",
                    value === color
                      ? "border-ring ring-1 ring-ring"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => selectColor(color)}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div
                className="size-7 shrink-0 rounded-md border"
                style={{ backgroundColor: value || "#ffffff" }}
              />
              <Input
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={onHexSubmit}
                onKeyDown={onHexKeyDown}
                placeholder="#000000"
                className="h-7 font-mono text-xs"
              />
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
      <div
        data-slot="grid-cell-content"
        className="flex items-center gap-2"
      >
        {value ? (
          <>
            <span
              className="inline-block size-4 shrink-0 rounded-full border"
              style={{ backgroundColor: value }}
            />
            <span className="truncate font-mono text-xs text-muted-foreground">
              {value}
            </span>
          </>
        ) : null}
      </div>
    </DataGridCellWrapper>
  );
}
