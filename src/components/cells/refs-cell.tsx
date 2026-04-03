"use client";

import { Check, X } from "lucide-react";
import * as React from "react";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useBadgeOverflow } from "@/hooks/use-badge-overflow";
import { getLineCount } from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import type { DataGridCellProps } from "@/types/data-grid";

interface RefValue {
  id: string;
  name: string;
}

export function RefsCell<TData>({
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
  const cellValue = React.useMemo(() => {
    const val = cell.getValue() as RefValue[];
    return val ?? [];
  }, [cell]);

  const [selectedRefs, setSelectedRefs] = React.useState<RefValue[]>(cellValue);
  const [searchValue, setSearchValue] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const cellOpts = cell.column.columnDef.meta?.cell;
  const refRecords = React.useMemo(
    () => (cellOpts?.variant === "refs" ? cellOpts.refRecords : []),
    [cellOpts],
  );

  const prevCellValueRef = React.useRef(cellValue);
  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue;
    setSelectedRefs(cellValue);
  }

  const selectedIdSet = React.useMemo(
    () => new Set(selectedRefs.map((r) => r.id)),
    [selectedRefs],
  );

  const onToggle = React.useCallback(
    (record: RefValue) => {
      if (readOnly) return;
      let newRefs: RefValue[];
      setSelectedRefs((curr) => {
        const exists = curr.some((r) => r.id === record.id);
        newRefs = exists
          ? curr.filter((r) => r.id !== record.id)
          : [...curr, { id: record.id, name: record.name }];
        return newRefs;
      });
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newRefs! });
        inputRef.current?.focus();
      });
      setSearchValue("");
    },
    [tableMeta, rowIndex, columnId, readOnly],
  );

  const removeRef = React.useCallback(
    (id: string, event?: React.MouseEvent) => {
      if (readOnly) return;
      event?.stopPropagation();
      event?.preventDefault();
      let newRefs: RefValue[];
      setSelectedRefs((curr) => {
        newRefs = curr.filter((r) => r.id !== id);
        return newRefs;
      });
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newRefs! });
        inputRef.current?.focus();
      });
    },
    [tableMeta, rowIndex, columnId, readOnly],
  );

  const clearAll = React.useCallback(() => {
    if (readOnly) return;
    setSelectedRefs([]);
    tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: [] });
    queueMicrotask(() => inputRef.current?.focus());
  }, [tableMeta, rowIndex, columnId, readOnly]);

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
        setSelectedRefs(cellValue);
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

  const onInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace" && searchValue === "") {
        event.preventDefault();
        let newRefs: RefValue[] | null = null;
        setSelectedRefs((curr) => {
          if (curr.length === 0) return curr;
          newRefs = curr.slice(0, -1);
          return newRefs;
        });
        queueMicrotask(() => {
          if (newRefs !== null) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newRefs });
          }
          inputRef.current?.focus();
        });
      }
      if (event.key === "Escape") {
        event.stopPropagation();
      }
    },
    [searchValue, tableMeta, rowIndex, columnId],
  );

  const lineCount = getLineCount(rowHeight);

  const { visibleItems: visibleRefs, hiddenCount: hiddenBadgeCount } =
    useBadgeOverflow({
      items: selectedRefs,
      getLabel: (ref) => ref.name,
      containerRef,
      lineCount,
    });

  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

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
            className="w-[300px] rounded-none p-0"
            onOpenAutoFocus={onOpenAutoFocus}
          >
            <Command className="**:data-[slot=command-input-wrapper]:h-auto **:data-[slot=command-input-wrapper]:border-none **:data-[slot=command-input-wrapper]:p-0 [&_[data-slot=command-input-wrapper]_svg]:hidden">
              <div className="flex min-h-9 flex-wrap items-center gap-1 border-b px-3 py-1.5">
                {selectedRefs.map((ref) => (
                  <Badge
                    key={ref.id}
                    variant="secondary"
                    className="gap-1 px-1.5 py-px"
                  >
                    {ref.name}
                    <button
                      type="button"
                      onClick={(event) => removeRef(ref.id, event)}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <CommandInput
                  ref={inputRef}
                  value={searchValue}
                  onValueChange={setSearchValue}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search..."
                  className="h-auto flex-1 p-0"
                />
              </div>
              <CommandList className="max-h-full">
                <CommandEmpty>No records found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden">
                  {refRecords.map((record) => {
                    const isActive = selectedIdSet.has(record.id);
                    return (
                      <CommandItem
                        key={record.id}
                        value={record.name}
                        onSelect={() => onToggle(record)}
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
                {selectedRefs.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={clearAll}
                        className="justify-center text-muted-foreground"
                      >
                        Clear all
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : null}
      {selectedRefs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1 overflow-hidden">
          {visibleRefs.map((ref) => (
            <Badge key={ref.id} variant="secondary" className="px-1.5 py-px">
              {ref.name}
            </Badge>
          ))}
          {hiddenBadgeCount > 0 && (
            <Badge
              variant="outline"
              className="px-1.5 py-px text-muted-foreground"
            >
              +{hiddenBadgeCount}
            </Badge>
          )}
        </div>
      ) : null}
    </DataGridCellWrapper>
  );
}
