"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnOrderState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { AddColumn } from "@/components/table/add-column";
import { DragHandleProvider } from "@/components/table/drag-handle-context";
import { useDbStore } from "@/store";
import type { Row } from "@/store/types";
import type { Header } from "@tanstack/react-table";

interface DataTableProps {
  columns: ColumnDef<Row, unknown>[];
  data: Row[];
}

const ROW_HEIGHT = 40;

export function DataTable({ columns, data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const defaultOrder = useMemo(
    () => columns.map((c) => (c.id ?? "") as string),
    [columns]
  );
  const [columnOrder, setColumnOrder] =
    useState<ColumnOrderState>(defaultOrder);

  // Sync column order when columns change
  const currentOrder = useMemo(() => {
    const colIds = new Set(columns.map((c) => c.id ?? ""));
    const kept = columnOrder.filter((id) => colIds.has(id));
    const newIds = columns
      .map((c) => c.id ?? "")
      .filter((id) => !kept.includes(id));
    const merged = [...kept, ...newIds];
    return merged.length === colIds.size ? merged : defaultOrder;
  }, [columns, columnOrder, defaultOrder]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnOrder: currentOrder,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const sortableIds = useMemo(
    () => currentOrder.filter((id) => id !== "select"),
    [currentOrder]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
      setColumnOrder(newOrder);

      const fieldOrder = newOrder.filter((id) => id !== "select");
      useDbStore.getState().reorderColumns(fieldOrder);
    },
    [currentOrder]
  );

  // Row virtualization
  const parentRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-80px)] w-full overflow-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table style={{ width: table.getCenterTotalSize() }}>
          <TableHeader className="bg-muted/30 sticky top-0 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                <SortableContext
                  items={sortableIds}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header, index) => (
                    <SortableHeader
                      key={header.id}
                      header={header}
                      index={index}
                    />
                  ))}
                </SortableContext>
                <TableHead className="w-10 border-l-0">
                  <AddColumn />
                </TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-40 text-center text-muted-foreground"
                >
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Spacer for virtual rows above */}
                {virtualizer.getVirtualItems().length > 0 && (
                  <tr
                    style={{
                      height: virtualizer.getVirtualItems()[0]?.start ?? 0,
                    }}
                  />
                )}
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      ref={(node) => virtualizer.measureElement(node)}
                      data-state={
                        row.getIsSelected() ? "selected" : undefined
                      }
                      className={cn(
                        virtualRow.index % 2 === 0 && "bg-muted/50",
                        "transition-colors"
                      )}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            cellIndex === 0 &&
                              "sticky left-0 z-10 bg-inherit",
                            cellIndex === 1 &&
                              "sticky left-[40px] z-10 bg-inherit font-medium"
                          )}
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="w-10" />
                    </TableRow>
                  );
                })}
                {/* Spacer for virtual rows below */}
                {virtualizer.getVirtualItems().length > 0 && (
                  <tr
                    style={{
                      height:
                        virtualizer.getTotalSize() -
                        (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                    }}
                  />
                )}
              </>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}

/* ── Sortable header wrapper ── */

function SortableHeader({
  header,
  index,
}: {
  header: Header<Row, unknown>;
  index: number;
}) {
  const isCheckbox = header.id === "select";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.id,
    disabled: isCheckbox,
  });

  const style = {
    width: header.getSize(),
    minWidth: header.column.columnDef.minSize,
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        index === 0 && "sticky left-0 z-10 bg-muted/30",
        index === 1 && "sticky left-[40px] z-10 bg-muted/30"
      )}
    >
      {header.isPlaceholder ? null : (
        <DragHandleProvider
          listeners={isCheckbox ? undefined : listeners}
          attributes={isCheckbox ? undefined : attributes}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
        </DragHandleProvider>
      )}

      {/* Resize handle */}
      {!isCheckbox && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none",
            "hover:bg-primary/50 active:bg-primary",
            header.column.getIsResizing() && "bg-primary"
          )}
        />
      )}
    </TableHead>
  );
}
