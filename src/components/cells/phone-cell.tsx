"use client";

import * as React from "react";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { cn } from "@/lib/utils";
import type { DataGridCellProps } from "@/types/data-grid";

export function PhoneCell<TData>({
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
  const cellRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prevIsEditingRef = React.useRef(false);

  const prevInitialValueRef = React.useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
    if (cellRef.current && !isEditing) {
      cellRef.current.textContent = initialValue;
    }
  }

  const onBlur = React.useCallback(() => {
    const currentValue = cellRef.current?.textContent ?? "";
    if (!readOnly && currentValue !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: currentValue });
    }
    tableMeta?.onCellEditingStop?.();
  }, [tableMeta, rowIndex, columnId, initialValue, readOnly]);

  const onInput = React.useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const currentValue = event.currentTarget.textContent ?? "";
      setValue(currentValue);
    },
    [],
  );

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === "Enter") {
          event.preventDefault();
          const currentValue = cellRef.current?.textContent ?? "";
          if (currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue,
            });
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true });
        } else if (event.key === "Tab") {
          event.preventDefault();
          const currentValue = cellRef.current?.textContent ?? "";
          if (currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue,
            });
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? "left" : "right",
          });
        } else if (event.key === "Escape") {
          event.preventDefault();
          setValue(initialValue);
          cellRef.current?.blur();
        }
      } else if (
        isFocused &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        setValue(event.key);

        queueMicrotask(() => {
          if (cellRef.current && cellRef.current.contentEditable === "true") {
            cellRef.current.textContent = event.key;
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(cellRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        });
      }
    },
    [isEditing, isFocused, initialValue, tableMeta, rowIndex, columnId],
  );

  React.useEffect(() => {
    const wasEditing = prevIsEditingRef.current;
    prevIsEditingRef.current = isEditing;

    if (isEditing && !wasEditing && cellRef.current) {
      cellRef.current.focus();

      if (!cellRef.current.textContent && value) {
        cellRef.current.textContent = value;
      }

      if (cellRef.current.textContent) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(cellRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [isEditing, value]);

  const displayValue = !isEditing ? (value ?? "") : "";

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
        <div
          role="textbox"
          data-slot="grid-cell-content"
          contentEditable
          tabIndex={-1}
          ref={cellRef}
          onBlur={onBlur}
          onInput={onInput}
          suppressContentEditableWarning
          className={cn(
            "size-full overflow-hidden outline-none",
            "whitespace-nowrap **:inline **:whitespace-nowrap [&_br]:hidden",
          )}
        />
      ) : displayValue ? (
        <a
          href={`tel:${displayValue.replace(/[^\d+]/g, "")}`}
          data-slot="grid-cell-content"
          className="text-primary truncate hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {displayValue}
        </a>
      ) : (
        <span data-slot="grid-cell-content" />
      )}
    </DataGridCellWrapper>
  );
}
