"use client";

import { useState, useCallback } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { CellValue, SelectOption } from "@/store/types";

interface SelectEditorProps {
  value: CellValue;
  options?: SelectOption[];
  onSave: (value: CellValue) => void;
  onCancel: () => void;
}

export function SelectEditor({
  value,
  options = [],
  onSave,
  onCancel,
}: SelectEditorProps) {
  const [open, setOpen] = useState(true);
  const currentValue = value !== null && value !== undefined ? String(value) : "";

  const handleChange = useCallback(
    (newValue: string | null) => {
      if (newValue !== null) {
        onSave(newValue);
      }
      setOpen(false);
    },
    [onSave]
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
    <Select
      value={currentValue}
      onValueChange={handleChange}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger className="h-7 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
