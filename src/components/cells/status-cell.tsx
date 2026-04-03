"use client";

import * as React from "react";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DataGridCellProps } from "@/types/data-grid";

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

export function StatusCell<TData>({
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
  const [value, setValue] = React.useState(initialValue);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const options = React.useMemo(
    () =>
      cellOpts?.variant === "status"
        ? (cellOpts.options as StatusOption[])
        : [],
    [cellOpts],
  );
  const optionByValue = React.useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );

  const prevInitialValueRef = React.useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
  }

  const onValueChange = React.useCallback(
    (newValue: string) => {
      if (readOnly) return;
      setValue(newValue);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
      tableMeta?.onCellEditingStop?.();
    },
    [tableMeta, rowIndex, columnId, readOnly],
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

  const currentOption = optionByValue.get(value);
  const displayLabel = currentOption?.label ?? value;
  const displayColor = currentOption?.color ?? "#64748b";

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
        <Select
          value={value}
          onValueChange={onValueChange}
          open={isEditing}
          onOpenChange={onOpenChange}
        >
          <SelectTrigger
            size="sm"
            className="size-full items-start border-none p-0 shadow-none focus-visible:ring-0 dark:bg-transparent [&_svg]:hidden"
          >
            <Badge
              variant="secondary"
              className="w-fit whitespace-pre-wrap px-1.5 py-px"
              style={{
                backgroundColor: displayColor + "15",
                color: displayColor,
              }}
            >
              <span
                className="mr-1 inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: displayColor }}
              />
              {displayLabel}
            </Badge>
          </SelectTrigger>
          <SelectContent
            data-grid-cell-editor=""
            align="start"
            alignOffset={-8}
            sideOffset={-8}
            className="min-w-[calc(var(--radix-select-trigger-width)+16px)]"
          >
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : displayLabel ? (
        <Badge
          data-slot="grid-cell-content"
          className="w-fit whitespace-pre-wrap border-transparent px-1.5 py-px"
          style={{
            backgroundColor: displayColor + "15",
            color: displayColor,
          }}
        >
          <span
            className="mr-1 inline-block size-2 shrink-0 rounded-full"
            style={{ backgroundColor: displayColor }}
          />
          {displayLabel}
        </Badge>
      ) : null}
    </DataGridCellWrapper>
  );
}
