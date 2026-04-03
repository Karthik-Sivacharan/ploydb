"use client";

import * as React from "react";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import type { DataGridCellProps } from "@/types/data-grid";

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
  const value = cell.getValue() as string[];
  const colors = Array.isArray(value) ? value : [];

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={false}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly
    >
      <div
        data-slot="grid-cell-content"
        className="flex items-center -space-x-1.5"
      >
        {colors.map((color, i) => (
          <span
            key={i}
            className="inline-block size-4 shrink-0 rounded-full ring-2 ring-background"
            style={{ backgroundColor: color, zIndex: colors.length - i }}
          />
        ))}
      </div>
    </DataGridCellWrapper>
  );
}
