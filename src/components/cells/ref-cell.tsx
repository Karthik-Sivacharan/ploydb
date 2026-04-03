"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DataGridCellProps } from "@/types/data-grid";

interface RefValue {
  id: string;
  name: string;
}

export function RefCell<TData>({
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
  const cellValue = cell.getValue() as RefValue | null;
  const [selected, setSelected] = React.useState<RefValue | null>(
    cellValue ?? null,
  );
  const [searchValue, setSearchValue] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const cellOpts = cell.column.columnDef.meta?.cell;
  const refRecords = React.useMemo(
    () => (cellOpts?.variant === "ref" ? cellOpts.refRecords : []),
    [cellOpts],
  );

  const prevCellValueRef = React.useRef(cellValue);
  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue;
    setSelected(cellValue ?? null);
  }

  const onSelect = React.useCallback(
    (record: RefValue) => {
      if (readOnly) return;
      const newValue =
        selected?.id === record.id ? null : { id: record.id, name: record.name };
      setSelected(newValue);
      setSearchValue("");
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
      tableMeta?.onCellEditingStop?.();
    },
    [tableMeta, rowIndex, columnId, readOnly, selected],
  );

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        setSearchValue("");
        tableMeta?.onCellEditingStop?.();
      }
    },
    [tableMeta, rowIndex, columnId, readOnly],
  );

  const onOpenAutoFocus: NonNullable<
    React.ComponentProps<typeof PopoverContent>["onOpenAutoFocus"]
  > = React.useCallback((event) => {
    event.preventDefault();
    inputRef.current?.focus();
  }, []);

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault();
        setSelected(cellValue ?? null);
        setSearchValue("");
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault();
        setSearchValue("");
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        });
      }
    },
    [isEditing, isFocused, cellValue, tableMeta],
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
            sideOffset={-(containerRef.current?.clientHeight ?? 0)}
            className="w-[250px] p-0"
            onOpenAutoFocus={onOpenAutoFocus}
          >
            <Command>
              <CommandInput
                ref={inputRef}
                value={searchValue}
                onValueChange={setSearchValue}
                placeholder="Search records..."
              />
              <CommandList>
                <CommandEmpty>No records found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {refRecords.map((record) => {
                    const isActive = selected?.id === record.id;
                    return (
                      <CommandItem
                        key={record.id}
                        value={record.name}
                        onSelect={() => onSelect(record)}
                      >
                        <div
                          className={cn(
                            "flex size-4 items-center justify-center rounded-sm border border-primary",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <Check className="size-3" />
                        </div>
                        <span>{record.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : null}
      {selected ? (
        <Badge variant="secondary" className="px-1.5 py-px">
          {selected.name}
        </Badge>
      ) : null}
    </DataGridCellWrapper>
  );
}
