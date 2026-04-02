"use client";

import { useEffect, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/table/data-table";
import { TableToolbar } from "@/components/table/table-toolbar";
import { ColumnHeader } from "@/components/table/column-header";
import { CellRenderer } from "@/components/table/cell-renderer";
import { useDbStore } from "@/store";
import { generateSeedData } from "@/data/seed";
import type { Row, FieldDef } from "@/store/types";

function buildColumns(schema: FieldDef[]): ColumnDef<Row, unknown>[] {
  const checkboxColumn: ColumnDef<Row, unknown> = {
    id: "select",
    size: 40,
    minSize: 40,
    maxSize: 40,
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
      />
    ),
    cell: ({ row }) => (
      <CellRenderer
        value={row.original.data[fieldDef.name]}
        fieldDef={fieldDef}
      />
    ),
    size:
      fieldDef.type === "text" ? 180 :
      fieldDef.type === "email" ? 200 :
      fieldDef.type === "currency" ? 120 :
      fieldDef.type === "number" ? 100 :
      fieldDef.type === "percent" ? 100 :
      fieldDef.type === "date" ? 130 :
      fieldDef.type === "datetime" ? 180 :
      fieldDef.type === "select" || fieldDef.type === "status" ? 130 :
      fieldDef.type === "tags" || fieldDef.type === "multi_select" ? 200 :
      fieldDef.type === "url" ? 160 :
      fieldDef.type === "phone" ? 160 :
      fieldDef.type === "checkbox" ? 80 :
      fieldDef.type === "color" ? 120 :
      150,
    minSize: 80,
  }));

  return [checkboxColumn, ...dataColumns];
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
