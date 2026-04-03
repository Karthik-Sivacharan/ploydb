"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CellValue } from "@/store/types";

interface JsonEditorProps {
  value: CellValue;
  onSave: (value: CellValue) => void;
  onCancel: () => void;
}

function prettyPrint(value: CellValue): string {
  if (value === null || value === undefined) return "{}";
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  try {
    return JSON.stringify(JSON.parse(String(value)), null, 2);
  } catch {
    return String(value);
  }
}

export function JsonEditor({ value, onSave, onCancel }: JsonEditorProps) {
  const [draft, setDraft] = useState(() => prettyPrint(value));
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const trySave = useCallback(() => {
    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      setError(false);
      onSave(parsed);
      setOpen(false);
    } catch {
      setError(true);
    }
  }, [draft, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        setOpen(false);
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        trySave();
      }
    },
    [onCancel, trySave]
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        trySave();
      }
      setOpen(next);
    },
    [trySave]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="font-mono text-xs text-muted-foreground">
        {"{ ... }"}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Textarea
          ref={ref}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(false);
          }}
          onKeyDown={handleKeyDown}
          rows={8}
          className={cn(
            "font-mono text-xs",
            error && "border-destructive ring-destructive/20"
          )}
        />
        {error && (
          <p className="mt-1 text-xs text-destructive">Invalid JSON</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
