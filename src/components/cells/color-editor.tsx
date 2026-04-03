"use client";

import { useState, useCallback } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import type { CellValue } from "@/store/types";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#1e293b",
  "#f43f5e",
  "#14b8a6",
];

interface ColorEditorProps {
  value: CellValue;
  onSave: (value: CellValue) => void;
  onCancel: () => void;
}

export function ColorEditor({ value, onSave, onCancel }: ColorEditorProps) {
  const [draft, setDraft] = useState(String(value ?? "#000000"));
  const [open, setOpen] = useState(true);

  const handlePresetClick = useCallback(
    (color: string) => {
      onSave(color);
      setOpen(false);
    },
    [onSave]
  );

  const handleHexKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSave(draft);
        setOpen(false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        setOpen(false);
      }
    },
    [draft, onSave, onCancel]
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        onCancel();
      }
      setOpen(next);
    },
    [onCancel]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="flex items-center gap-2 text-sm">
        <span
          className="size-4 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: String(value ?? "#000") }}
        />
        <span className="text-xs text-muted-foreground">
          {String(value ?? "")}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              className="size-7 rounded-md border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="size-7 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: draft }}
          />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleHexKeyDown}
            placeholder="#000000"
            className="h-7 font-mono text-xs"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
