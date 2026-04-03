"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ChevronDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIELD_TYPE_CONFIG } from "@/lib/field-types";
import { ColumnHeaderMenu } from "@/components/table/column-header-menu";
import { useDragHandle } from "@/components/table/drag-handle-context";
import type { FieldDef, FieldType, Row } from "@/store/types";

interface ColumnHeaderProps {
  column: Column<Row, unknown>;
  label: string;
  fieldType: FieldType;
  fieldDef: FieldDef;
}

export function ColumnHeader({
  column,
  label,
  fieldType,
  fieldDef,
}: ColumnHeaderProps) {
  const config = FIELD_TYPE_CONFIG[fieldType];
  const Icon = config.icon;
  const sorted = column.getIsSorted();
  const { listeners, attributes } = useDragHandle();

  return (
    <ColumnHeaderMenu
      column={column}
      fieldName={fieldDef.name}
      fieldType={fieldType}
      fieldDef={fieldDef}
    >
      <div
        className={cn(
          "group/header flex w-full items-center gap-1 text-xs font-medium",
          "text-muted-foreground hover:text-foreground",
          "transition-colors cursor-pointer select-none"
        )}
      >
        {listeners && (
          <span
            className="opacity-0 group-hover/header:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-3.5 text-muted-foreground" />
          </span>
        )}
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        {sorted === "asc" && <ArrowUp className="size-3 shrink-0" />}
        {sorted === "desc" && <ArrowDown className="size-3 shrink-0" />}
        <ChevronDown className="ml-auto size-3 shrink-0 opacity-0 group-hover/header:opacity-100 transition-opacity" />
      </div>
    </ColumnHeaderMenu>
  );
}
