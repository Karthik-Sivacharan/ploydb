"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useDbStore } from "@/store";
import type { CellValue } from "@/store/types";

interface RefEditorProps {
  value: CellValue;
  refTable?: string;
  onSave: (value: CellValue) => void;
  onCancel: () => void;
}

function useRefRecords(refTable?: string) {
  const databases = useDbStore((s) => s.databases);

  return useMemo(() => {
    if (!refTable) return [];
    const db = databases.find((d) => d.id === refTable || d.name === refTable);
    if (!db) return [];
    const textField = db.schema.find(
      (f) => f.type === "text" || f.type === "rich_text"
    );
    const nameKey = textField?.name ?? db.schema[0]?.name;
    if (!nameKey) return [];
    return db.rows.map((row) => ({
      id: row.id,
      label: String(row.data[nameKey] ?? row.id),
    }));
  }, [refTable, databases]);
}

export function RefEditor({
  value,
  refTable,
  onSave,
  onCancel,
}: RefEditorProps) {
  const [open, setOpen] = useState(true);
  const records = useRefRecords(refTable);
  const currentLabel = records.find((r) => r.id === value)?.label ?? String(value ?? "");

  const handleSelect = useCallback(
    (id: string) => {
      onSave(id);
      setOpen(false);
    },
    [onSave]
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) onCancel();
      setOpen(next);
    },
    [onCancel]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="w-full text-left">
        {currentLabel ? (
          <Badge variant="secondary">{currentLabel}</Badge>
        ) : (
          <span className="text-muted-foreground/50">&mdash;</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0">
        <Command>
          <CommandInput placeholder="Search records..." />
          <CommandList>
            <CommandEmpty>No records found.</CommandEmpty>
            {records.map((rec) => (
              <CommandItem
                key={rec.id}
                value={rec.label}
                onSelect={() => handleSelect(rec.id)}
                data-checked={rec.id === value ? true : undefined}
              >
                {rec.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
