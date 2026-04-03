"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { CellValue } from "@/store/types";

interface LocationEditorProps {
  value: CellValue;
  onSave: (value: CellValue) => void;
  onCancel: () => void;
}

export function LocationEditor({
  value,
  onSave,
  onCancel,
}: LocationEditorProps) {
  const [draft, setDraft] = useState(String(value ?? ""));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSave(draft);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [draft, onSave, onCancel]
  );

  return (
    <Input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onSave(draft)}
      onKeyDown={handleKeyDown}
      placeholder="City, Country"
      className="h-7 w-full"
    />
  );
}
