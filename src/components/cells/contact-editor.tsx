"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { CellValue } from "@/store/types";

type ContactVariant = "email" | "phone" | "url";

interface ContactEditorProps {
  value: CellValue;
  onSave: (value: CellValue) => void;
  onCancel: () => void;
  variant: ContactVariant;
}

const INPUT_TYPES: Record<ContactVariant, string> = {
  email: "email",
  phone: "tel",
  url: "url",
};

export function ContactEditor({
  value,
  onSave,
  onCancel,
  variant,
}: ContactEditorProps) {
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
      type={INPUT_TYPES[variant]}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onSave(draft)}
      onKeyDown={handleKeyDown}
      className="h-7 w-full"
    />
  );
}
