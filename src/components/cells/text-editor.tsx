"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import type { CellValue } from "@/store/types";

interface TextEditorProps {
  value: CellValue;
  onSave: (value: CellValue) => void;
  onCancel: () => void;
  multiline?: boolean;
}

export function TextEditor({
  value,
  onSave,
  onCancel,
  multiline = false,
}: TextEditorProps) {
  if (multiline) {
    return (
      <RichTextEditor value={value} onSave={onSave} onCancel={onCancel} />
    );
  }

  return (
    <InlineTextInput value={value} onSave={onSave} onCancel={onCancel} />
  );
}

function InlineTextInput({
  value,
  onSave,
  onCancel,
}: Omit<TextEditorProps, "multiline">) {
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
      className="h-7 w-full"
    />
  );
}

function RichTextEditor({
  value,
  onSave,
  onCancel,
}: Omit<TextEditorProps, "multiline">) {
  const [draft, setDraft] = useState(String(value ?? ""));
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        onSave(draft);
      }
      setOpen(next);
    },
    [draft, onSave]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        setOpen(false);
      }
    },
    [onCancel]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="w-full text-left text-sm truncate">
        {String(value ?? "") || (
          <span className="text-muted-foreground/50">&mdash;</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
          className="min-h-24"
        />
      </PopoverContent>
    </Popover>
  );
}
