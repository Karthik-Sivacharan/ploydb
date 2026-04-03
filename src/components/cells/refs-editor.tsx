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
import { Checkbox } from "@/components/ui/checkbox";
import { useDbStore } from "@/store";
import type { CellValue } from "@/store/types";

interface RefsEditorProps {
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

export function RefsEditor({
  value,
  refTable,
  onSave,
  onCancel,
}: RefsEditorProps) {
  const initial = Array.isArray(value) ? (value as string[]) : [];
  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(true);
  const records = useRefRecords(refTable);

  const toggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
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

  const displayLabels = initial
    .map((id) => records.find((r) => r.id === id)?.label ?? id)
    .slice(0, 2);
  const remaining = initial.length - 2;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="flex w-full items-center gap-1 text-left">
        {displayLabels.length > 0 ? (
          <>
            {displayLabels.map((label) => (
              <Badge key={label} variant="secondary" className="shrink-0">
                {label}
              </Badge>
            ))}
            {remaining > 0 && (
              <span className="text-xs text-muted-foreground">
                +{remaining}
              </span>
            )}
          </>
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
                onSelect={() => toggle(rec.id)}
                data-checked={selected.includes(rec.id) ? true : undefined}
              >
                <Checkbox
                  checked={selected.includes(rec.id)}
                  className="pointer-events-none"
                />
                {rec.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
