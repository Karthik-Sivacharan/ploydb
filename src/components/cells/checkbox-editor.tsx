"use client";

import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { CellValue } from "@/store/types";

interface CheckboxEditorProps {
  value: CellValue;
  onSave: (value: CellValue) => void;
}

export function CheckboxEditor({ value, onSave }: CheckboxEditorProps) {
  const checked = Boolean(value);

  const handleChange = useCallback(
    (next: boolean) => {
      onSave(next);
    },
    [onSave]
  );

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={handleChange}
      aria-label="Toggle checkbox"
    />
  );
}
