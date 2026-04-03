"use client";

import * as React from "react";

import {
  CheckboxCell,
  DateCell,
  FileCell,
  LongTextCell,
  MultiSelectCell,
  NumberCell,
  SelectCell,
  ShortTextCell,
  UrlCell,
} from "@/components/data-grid/data-grid-cell-variants";
import { CurrencyCell } from "@/components/cells/currency-cell";
import { PercentCell } from "@/components/cells/percent-cell";
import { EmailCell } from "@/components/cells/email-cell";
import { PhoneCell } from "@/components/cells/phone-cell";
import { LocationCell } from "@/components/cells/location-cell";
import { StatusCell } from "@/components/cells/status-cell";
import { TagsCell } from "@/components/cells/tags-cell";
import { ColorCell } from "@/components/cells/color-cell";
import { JsonCell } from "@/components/cells/json-cell";
import { DatetimeCell } from "@/components/cells/datetime-cell";
import { RefCell } from "@/components/cells/ref-cell";
import { RefsCell } from "@/components/cells/refs-cell";
import type { DataGridCellProps } from "@/types/data-grid";

export const DataGridCell = React.memo(DataGridCellImpl, (prev, next) => {
  // Fast path: check stable primitive props first
  if (prev.isFocused !== next.isFocused) return false;
  if (prev.isEditing !== next.isEditing) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isSearchMatch !== next.isSearchMatch) return false;
  if (prev.isActiveSearchMatch !== next.isActiveSearchMatch) return false;
  if (prev.readOnly !== next.readOnly) return false;
  if (prev.rowIndex !== next.rowIndex) return false;
  if (prev.columnId !== next.columnId) return false;
  if (prev.rowHeight !== next.rowHeight) return false;

  // Check cell value using row.original instead of getValue() for stability
  // getValue() is unstable and recreates on every render, breaking memoization
  const prevValue = (prev.cell.row.original as Record<string, unknown>)[
    prev.columnId
  ];
  const nextValue = (next.cell.row.original as Record<string, unknown>)[
    next.columnId
  ];
  if (prevValue !== nextValue) {
    return false;
  }

  // Check cell/row identity
  if (prev.cell.row.id !== next.cell.row.id) return false;

  return true;
}) as typeof DataGridCellImpl;

function DataGridCellImpl<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
  rowHeight,
}: DataGridCellProps<TData>) {
  const cellOpts = cell.column.columnDef.meta?.cell;
  const variant = cellOpts?.variant ?? "text";

  let Comp: React.ComponentType<DataGridCellProps<TData>>;

  switch (variant) {
    case "short-text":
      Comp = ShortTextCell;
      break;
    case "long-text":
      Comp = LongTextCell;
      break;
    case "number":
      Comp = NumberCell;
      break;
    case "url":
      Comp = UrlCell;
      break;
    case "checkbox":
      Comp = CheckboxCell;
      break;
    case "select":
      Comp = SelectCell;
      break;
    case "multi-select":
      Comp = MultiSelectCell;
      break;
    case "date":
      Comp = DateCell;
      break;
    case "file":
      Comp = FileCell;
      break;
    case "currency":
      Comp = CurrencyCell;
      break;
    case "percent":
      Comp = PercentCell;
      break;
    case "email":
      Comp = EmailCell;
      break;
    case "phone":
      Comp = PhoneCell;
      break;
    case "location":
      Comp = LocationCell;
      break;
    case "status":
      Comp = StatusCell;
      break;
    case "tags":
      Comp = TagsCell;
      break;
    case "color":
      Comp = ColorCell;
      break;
    case "json":
      Comp = JsonCell;
      break;
    case "datetime":
      Comp = DatetimeCell;
      break;
    case "ref":
      Comp = RefCell;
      break;
    case "refs":
      Comp = RefsCell;
      break;

    default:
      Comp = ShortTextCell;
      break;
  }

  return (
    <Comp
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
    />
  );
}
