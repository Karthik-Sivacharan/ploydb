"use client";

import { useState, useCallback } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { CellValue, SelectOption } from "@/store/types";

interface MultiSelectEditorProps {
  value: CellValue;
  options?: SelectOption[];
  onSave: (value: CellValue) => void;
  onCancel: () => void;
}

export function MultiSelectEditor({
  value,
  options = [],
  onSave,
  onCancel,
}: MultiSelectEditorProps) {
  const initial = Array.isArray(value) ? (value as string[]) : [];
  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(true);

  const toggle = useCallback((optValue: string) => {
    setSelected((prev) =>
      prev.includes(optValue)
        ? prev.filter((v) => v !== optValue)
        : [...prev, optValue]
    );
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        onSave(selected);
      }
      setOpen(next);
    },
    [selected, onSave]
  );

  const displayText = initial.length
    ? initial
        .map((v) => options.find((o) => o.value === v)?.label ?? v)
        .join(", ")
    : "";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="w-full text-left text-sm truncate">
        {displayText || (
          <span className="text-muted-foreground/50">&mdash;</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1">
        <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox checked={selected.includes(opt.value)} />
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
