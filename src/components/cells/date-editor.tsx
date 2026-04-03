"use client";

import { useState, useCallback } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import type { CellValue } from "@/store/types";

interface DateEditorProps {
  value: CellValue;
  onSave: (value: CellValue) => void;
  onCancel: () => void;
  includeTime: boolean;
}

function parseDate(value: CellValue): Date | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? undefined : d;
}

function padTwo(n: number): string {
  return n.toString().padStart(2, "0");
}

export function DateEditor({
  value,
  onSave,
  onCancel,
  includeTime,
}: DateEditorProps) {
  const initial = parseDate(value);
  const [date, setDate] = useState<Date | undefined>(initial);
  const [hours, setHours] = useState(initial ? padTwo(initial.getHours()) : "12");
  const [minutes, setMinutes] = useState(
    initial ? padTwo(initial.getMinutes()) : "00"
  );
  const [open, setOpen] = useState(true);

  const formatDisplay = useCallback(() => {
    if (!value) return "";
    try {
      const d = new Date(String(value));
      if (includeTime) {
        return d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(value);
    }
  }, [value, includeTime]);

  const handleSelect = useCallback(
    (selected: Date | undefined) => {
      if (!selected) return;
      if (includeTime) {
        setDate(selected);
        return;
      }
      onSave(selected.toISOString());
      setOpen(false);
    },
    [includeTime, onSave]
  );

  const handleSaveWithTime = useCallback(() => {
    if (!date) {
      onSave(null);
      return;
    }
    const result = new Date(date);
    result.setHours(parseInt(hours, 10) || 0);
    result.setMinutes(parseInt(minutes, 10) || 0);
    result.setSeconds(0, 0);
    onSave(result.toISOString());
    setOpen(false);
  }, [date, hours, minutes, onSave]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        if (includeTime && date) {
          handleSaveWithTime();
        } else {
          onCancel();
        }
      }
      setOpen(next);
    },
    [includeTime, date, handleSaveWithTime, onCancel]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="w-full text-left text-sm whitespace-nowrap">
        {formatDisplay() || (
          <span className="text-muted-foreground/50">&mdash;</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date ?? initial}
          onSelect={handleSelect}
        />
        {includeTime && (
          <div className="flex items-center gap-1.5 border-t border-border px-3 py-2">
            <Input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="h-7 w-14 text-center tabular-nums"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="h-7 w-14 text-center tabular-nums"
            />
            <button
              type="button"
              onClick={handleSaveWithTime}
              className="ml-auto rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
