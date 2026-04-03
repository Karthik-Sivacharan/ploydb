"use client";

import * as React from "react";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DataGridCellProps } from "@/types/data-grid";

function getJsonPreview(value: string): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) {
      return String(parsed);
    }
    if (Array.isArray(parsed)) {
      return `[ ${parsed.length} items ]`;
    }
    const keys = Object.keys(parsed);
    if (keys.length === 0) return "{}";
    if (keys.length <= 2) {
      const pairs = keys.map((k) => {
        const v = parsed[k];
        const display =
          typeof v === "string" ? `"${v}"` : JSON.stringify(v);
        return `${k}: ${display}`;
      });
      return `{ ${pairs.join(", ")} }`;
    }
    return `{ ${keys.length} keys }`;
  } catch {
    return value;
  }
}

function isValidJson(value: string): boolean {
  if (!value.trim()) return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function JsonCell<TData>({
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);
  const valid = isValidJson(value);

  const prevInitialValueRef = React.useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? "");
  }

  const onSave = React.useCallback(() => {
    if (readOnly) return;
    if (value !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
    }
    tableMeta?.onCellEditingStop?.();
  }, [value, initialValue, tableMeta, rowIndex, columnId, readOnly]);

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        onSave();
      }
    },
    [tableMeta, rowIndex, columnId, readOnly, onSave],
  );

  const onOpenAutoFocus = React.useCallback((event: Event) => {
    event.preventDefault();
    textareaRef.current?.focus();
  }, []);

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault();
        setValue(initialValue ?? "");
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

  const onTextareaKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
      }
      // Cmd/Ctrl+Enter to save
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onSave();
      }
    },
    [onSave],
  );

  const preview = getJsonPreview(value);

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
            className="w-[360px] p-2"
            onOpenAutoFocus={onOpenAutoFocus}
          >
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onTextareaKeyDown}
              rows={6}
              className={cn(
                "resize-y font-mono text-xs transition-colors",
                valid
                  ? "border-green-500 focus-visible:ring-green-500/30"
                  : "border-red-500 focus-visible:ring-red-500/30",
              )}
              placeholder='{ "key": "value" }'
            />
            <div className="mt-1 flex items-center justify-between">
              <span
                className={cn(
                  "text-xs",
                  valid ? "text-green-600" : "text-red-500",
                )}
              >
                {valid ? "Valid JSON" : "Invalid JSON"}
              </span>
              <span className="text-xs text-muted-foreground">
                Ctrl+Enter to save
              </span>
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
      <div
        data-slot="grid-cell-content"
        className="truncate font-mono text-xs text-muted-foreground"
      >
        {preview}
      </div>
    </DataGridCellWrapper>
  );
}
