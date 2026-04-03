"use client";

import * as React from "react";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import type { DataGridCellProps } from "@/types/data-grid";

function getJsonPreview(value: string): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) return String(parsed);
    if (Array.isArray(parsed)) return `[ ${parsed.length} items ]`;
    const keys = Object.keys(parsed);
    if (keys.length === 0) return "{}";
    if (keys.length <= 2) {
      const pairs = keys.map((k) => {
        const v = parsed[k];
        const display = typeof v === "string" ? `"${v}"` : JSON.stringify(v);
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

/** Tokenize JSON string into colored spans */
function highlightJson(json: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match: strings, numbers, booleans, null, braces/brackets, colons, commas
  const regex =
    /("(?:[^"\\]|\\.)*")(\s*:)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\]])|([,])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(json)) !== null) {
    // Add any whitespace/text before this match
    if (match.index > lastIndex) {
      nodes.push(json.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Key (string followed by colon)
      nodes.push(
        <span key={`k${match.index}`} className="text-chart-5">
          {match[1]}
        </span>,
      );
      // Colon after key
      nodes.push(
        <span key={`c${match.index}`} className="text-foreground/40">
          {match[2]}
        </span>,
      );
    } else if (match[3]) {
      // String value
      nodes.push(
        <span key={`s${match.index}`} className="text-chart-2">
          {match[3]}
        </span>,
      );
    } else if (match[4]) {
      // Number
      nodes.push(
        <span key={`n${match.index}`} className="text-chart-1">
          {match[4]}
        </span>,
      );
    } else if (match[5]) {
      // Boolean
      nodes.push(
        <span key={`b${match.index}`} className="text-chart-4">
          {match[5]}
        </span>,
      );
    } else if (match[6]) {
      // Null
      nodes.push(
        <span key={`x${match.index}`} className="text-muted-foreground">
          {match[6]}
        </span>,
      );
    } else if (match[7]) {
      // Braces/brackets
      nodes.push(
        <span key={`p${match.index}`} className="text-foreground/60">
          {match[7]}
        </span>,
      );
    } else if (match[8]) {
      // Comma
      nodes.push(
        <span key={`cm${match.index}`} className="text-foreground/40">
          {match[8]}
        </span>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < json.length) {
    nodes.push(json.slice(lastIndex));
  }

  return nodes;
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
  const preRef = React.useRef<HTMLPreElement>(null);
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);
  const valid = isValidJson(value);

  const prevInitialValueRef = React.useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? "");
  }

  const onSave = React.useCallback(() => {
    if (readOnly) return;
    let saveValue = value;
    try {
      saveValue = JSON.stringify(JSON.parse(value));
    } catch {
      // save as-is
    }
    if (saveValue !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: saveValue });
    }
    tableMeta?.onCellEditingStop?.();
  }, [value, initialValue, tableMeta, rowIndex, columnId, readOnly]);

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        try {
          const parsed = JSON.parse(value);
          setValue(JSON.stringify(parsed, null, 2));
        } catch {
          // leave as-is
        }
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        onSave();
      }
    },
    [tableMeta, rowIndex, columnId, readOnly, onSave, value],
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
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onSave();
      }
    },
    [onSave],
  );

  // Sync scroll between textarea and highlighted pre
  const onScroll = React.useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const highlighted = React.useMemo(() => highlightJson(value), [value]);
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
            className="w-[380px] p-2"
            onOpenAutoFocus={onOpenAutoFocus}
          >
            <div className="relative rounded-md border bg-muted/30">
              {/* Highlighted layer (behind) */}
              <pre
                ref={preRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-3 font-mono text-xs leading-5"
              >
                {highlighted}
                {/* Trailing newline so pre matches textarea height */}
                {"\n"}
              </pre>
              {/* Editable textarea (on top, transparent text) */}
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onTextareaKeyDown}
                onScroll={onScroll}
                rows={8}
                spellCheck={false}
                className="relative w-full resize-y overflow-auto whitespace-pre-wrap break-words rounded-md bg-transparent p-3 font-mono text-xs leading-5 text-transparent caret-foreground outline-none"
              />
            </div>
            {!valid && (
              <p className="mt-1 text-xs text-destructive">Invalid JSON</p>
            )}
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
