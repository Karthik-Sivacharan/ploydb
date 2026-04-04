"use client";

import type { ColumnDef, HeaderContext, CellContext } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Creates the row select / row-number column used by tablecn data-grid.
 *
 * This is the first column in the grid — it shows:
 *  - Header: a "select all" checkbox
 *  - Cell: the visual row number, replaced by a checkbox on hover or when selected
 *
 * Uses the existing tablecn infrastructure:
 *  - `tableMeta.getVisualRowIndex()` for sorted/filtered row numbers
 *  - `tableMeta.onRowSelect()` for shift-click range selection
 *  - Column id "select" is already excluded from navigation, borders, and stretching
 */
export function createSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    size: 48,
    minSize: 48,
    maxSize: 48,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
    enablePinning: true,
    enableHiding: false,

    header: ({ table }: HeaderContext<TData, unknown>) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(!!checked)
          }
          aria-label="Select all"
        />
      </div>
    ),

    cell: ({ row, table }: CellContext<TData, unknown>) => {
      const tableMeta = table.options.meta;
      const visualIndex = tableMeta?.getVisualRowIndex?.(row.id);
      const isSelected = row.getIsSelected();

      return (
        <div className="group flex items-center justify-center">
          <span
            className={
              isSelected
                ? "hidden"
                : "block text-xs text-muted-foreground group-hover:hidden"
            }
          >
            {visualIndex ?? ""}
          </span>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              tableMeta?.onRowSelect?.(row.id, !!checked, false)
            }
            onClick={(e) => {
              if (e.shiftKey) {
                e.preventDefault();
                tableMeta?.onRowSelect?.(row.id, !isSelected, true);
              }
            }}
            aria-label={`Select row ${visualIndex ?? ""}`}
            className={
              isSelected
                ? "block"
                : "hidden group-hover:block"
            }
          />
        </div>
      );
    },
  };
}
