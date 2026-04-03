"use client";

import { useEffect, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/table/data-table";
import { TableToolbar } from "@/components/table/table-toolbar";
import { ColumnHeader } from "@/components/table/column-header";
import { EditableCell } from "@/components/cells/editable-cell";
import { useDbStore } from "@/store";
import { generateSeedData } from "@/data/seed";
import type { Row, FieldDef } from "@/store/types";

function buildColumns(schema: FieldDef[]): ColumnDef<Row, unknown>[] {
  const checkboxColumn: ColumnDef<Row, unknown> = {
    id: "select",
    size: 40,
    minSize: 40,
    maxSize: 40,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(!!checked)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
  };

  const dataColumns: ColumnDef<Row, unknown>[] = schema.map((fieldDef) => ({
    id: fieldDef.name,
    accessorFn: (row: Row) => row.data[fieldDef.name],
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        label={fieldDef.label}
        fieldType={fieldDef.type}
        fieldDef={fieldDef}
      />
    ),
    cell: ({ row }) => (
      <EditableCell
        rowId={row.original.id}
        fieldDef={fieldDef}
        value={row.original.data[fieldDef.name]}
      />
    ),
    size: getDefaultSize(fieldDef.type),
    minSize: 80,
    enableResizing: true,
  }));

  return [checkboxColumn, ...dataColumns];
}

function getDefaultSize(type: string): number {
  switch (type) {
    case "text":
      return 180;
    case "email":
      return 200;
    case "currency":
      return 120;
    case "number":
    case "percent":
      return 100;
    case "date":
      return 130;
    case "datetime":
      return 180;
    case "select":
    case "status":
      return 130;
    case "tags":
    case "multi_select":
      return 200;
    case "url":
    case "phone":
      return 160;
    case "checkbox":
      return 80;
    case "color":
      return 120;
    default:
      return 150;
  }
}

export default function Home() {
  const databases = useDbStore((s) => s.databases);
  const activeDbId = useDbStore((s) => s.activeDbId);
  const seedData = useDbStore((s) => s.seedData);
  const setActiveDb = useDbStore((s) => s.setActiveDb);

  // Seed on first load if store is empty
  useEffect(() => {
    if (databases.length === 0) {
      const seeded = generateSeedData();
      seedData(seeded);
      setActiveDb(seeded[0].id);
    } else if (!activeDbId) {
      setActiveDb(databases[0].id);
    }
  }, [databases.length, activeDbId, seedData, setActiveDb]);

  const activeDb = databases.find((db) => db.id === activeDbId);

  const columns = useMemo(
    () => (activeDb ? buildColumns(activeDb.schema) : []),
    [activeDb]
  );

  if (!activeDb) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TableToolbar
        databaseName={activeDb.name}
        rowCount={activeDb.rows.length}
        databaseIcon={activeDb.icon}
      />
      <div className="flex-1 overflow-hidden border-t border-border">
        <DataTable columns={columns} data={activeDb.rows} />
      </div>
    </div>
  );
}
