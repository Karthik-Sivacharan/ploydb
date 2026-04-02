"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIELD_TYPE_CONFIG } from "@/lib/field-types";
import type { FieldType, Row } from "@/store/types";

interface ColumnHeaderProps {
  column: Column<Row, unknown>;
  label: string;
  fieldType: FieldType;
}

export function ColumnHeader({ column, label, fieldType }: ColumnHeaderProps) {
  const config = FIELD_TYPE_CONFIG[fieldType];
  const Icon = config.icon;
  const sorted = column.getIsSorted();

  function handleClick() {
    if (sorted === "asc") {
      column.toggleSorting(true);
    } else if (sorted === "desc") {
      column.clearSorting();
    } else {
      column.toggleSorting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
        "hover:text-foreground transition-colors cursor-pointer select-none"
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      {sorted === "asc" && <ArrowUp className="size-3 shrink-0" />}
      {sorted === "desc" && <ArrowDown className="size-3 shrink-0" />}
    </button>
  );
}
