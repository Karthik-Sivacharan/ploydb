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
import { getCellKey, getLineCount } from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import type { DataGridCellProps } from "@/types/data-grid";

export function TagsCell<TData>({
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
    const value = cell.getValue() as string[];
    return value ?? [];
  }, [cell]);

  const cellKey = getCellKey(rowIndex, columnId);
  const prevCellKeyRef = React.useRef(cellKey);

  const [selectedValues, setSelectedValues] =
    React.useState<string[]>(cellValue);
  const [searchValue, setSearchValue] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const options = React.useMemo(
    () =>
      cellOpts?.variant === "tags"
        ? cellOpts.options
        : [],
    [cellOpts],
  );
  const optionByValue = React.useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

  const prevCellValueRef = React.useRef(cellValue);
  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue;
    setSelectedValues(cellValue);
  }

  if (prevCellKeyRef.current !== cellKey) {
    prevCellKeyRef.current = cellKey;
    setSearchValue("");
  }

  const onValueChange = React.useCallback(
    (value: string) => {
      if (readOnly) return;
      let newValues: string[] = [];
      setSelectedValues((curr) => {
        newValues = curr.includes(value)
          ? curr.filter((v) => v !== value)
          : [...curr, value];
        return newValues;
      });
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues });
        inputRef.current?.focus();
      });
      setSearchValue("");
    },
    [tableMeta, rowIndex, columnId, readOnly],
  );

  const removeValue = React.useCallback(
    (valueToRemove: string, event?: React.MouseEvent) => {
      if (readOnly) return;
      event?.stopPropagation();
      event?.preventDefault();
      let newValues: string[] = [];
      setSelectedValues((curr) => {
        newValues = curr.filter((v) => v !== valueToRemove);
        return newValues;
      });
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues });
        inputRef.current?.focus();
      });
    },
    [tableMeta, rowIndex, columnId, readOnly],
  );

  const clearAll = React.useCallback(() => {
    if (readOnly) return;
    setSelectedValues([]);
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
  > = React.useCallback((event: Event) => {
    event.preventDefault();
    inputRef.current?.focus();
  }, []);

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault();
        setSelectedValues(cellValue);
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
        let newValues: string[] | null = null;
        setSelectedValues((curr) => {
          if (curr.length === 0) return curr;
          newValues = curr.slice(0, -1);
          return newValues;
        });
        queueMicrotask(() => {
          if (newValues !== null) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: newValues,
            });
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

  const displayLabels = selectedValues
    .map((val) => optionByValue.get(val)?.label ?? val)
    .filter(Boolean);

  const selectedValuesSet = React.useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const lineCount = getLineCount(rowHeight);

  const { visibleItems: visibleLabels, hiddenCount: hiddenBadgeCount } =
    useBadgeOverflow({
      items: displayLabels,
      getLabel: (label) => label,
      containerRef,
      lineCount,
    });

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
                {selectedValues.map((value) => {
                  const label = optionByValue.get(value)?.label ?? value;

                  return (
                    <Badge
                      key={value}
                      variant="outline"
                      className="gap-1 px-1.5 py-px text-muted-foreground"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={(event) => removeValue(value, event)}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
                })}
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
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden">
                  {options.map((option) => {
                    const isSelected = selectedValuesSet.has(option.value);

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => onValueChange(option.value)}
                      >
                        <div
                          className={cn(
                            "flex size-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <Check className="size-3" />
                        </div>
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {selectedValues.length > 0 && (
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
      {displayLabels.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1 overflow-hidden">
          {visibleLabels.map((label, index) => (
            <Badge
              key={selectedValues[index]}
              variant="outline"
              className="px-1.5 py-px text-muted-foreground"
            >
              {label}
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
