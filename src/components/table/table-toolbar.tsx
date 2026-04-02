"use client";

import { Filter, ArrowUpDown, Group } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TableToolbarProps {
  databaseName: string;
  rowCount: number;
  databaseIcon?: string;
}

export function TableToolbar({
  databaseName,
  rowCount,
  databaseIcon,
}: TableToolbarProps) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3")}>
      <div className="flex items-center gap-3">
        {databaseIcon && <span className="text-lg">{databaseIcon}</span>}
        <h1 className="text-lg font-semibold text-foreground">
          {databaseName}
        </h1>
        <Badge variant="secondary" className="tabular-nums">
          {rowCount} {rowCount === 1 ? "record" : "records"}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled>
          <Filter className="size-3.5" />
          Filter
        </Button>
        <Button variant="ghost" size="sm" disabled>
          <ArrowUpDown className="size-3.5" />
          Sort
        </Button>
        <Button variant="ghost" size="sm" disabled>
          <Group className="size-3.5" />
          Group
        </Button>
      </div>
    </div>
  );
}
