"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { CellValue } from "@/store/types";

type NumberVariant = "number" | "currency" | "percent";

interface NumberEditorProps {
  value: CellValue;
  onSave: (value: CellValue) => void;
  onCancel: () => void;
  variant: NumberVariant;
  currencyCode?: string;
}

export function NumberEditor({
  value,
  onSave,
  onCancel,
  variant,
  currencyCode,
}: NumberEditorProps) {
  const [draft, setDraft] = useState(
    value !== null && value !== undefined ? String(value) : ""
  );
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const save = useCallback(() => {
    if (draft === "") {
      onSave(null);
      return;
    }
    const num = parseFloat(draft);
    onSave(isNaN(num) ? null : num);
  }, [draft, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [save, onCancel]
  );

  const prefix = variant === "currency" ? (currencyCode === "EUR" ? "\u20AC" : "$") : undefined;
  const suffix = variant === "percent" ? "%" : undefined;

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-2 text-sm text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        ref={ref}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className={`h-7 w-full tabular-nums text-right ${
          prefix ? "pl-6" : ""
        } ${suffix ? "pr-6" : ""}`}
      />
      {suffix && (
        <span className="absolute right-2 text-sm text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}
