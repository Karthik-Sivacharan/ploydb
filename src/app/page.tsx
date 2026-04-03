"use client";

import * as React from "react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { useDataGrid } from "@/hooks/use-data-grid";
import { generateSeedData, type CrmRow } from "@/data/seed";
import { columns } from "@/data/columns";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const [data, setData] = React.useState<CrmRow[]>(() => generateSeedData());

  const dataGrid = useDataGrid<CrmRow>({
    data,
    columns,
    onDataChange: setData,
    enableSearch: true,
    enablePaste: true,
  });

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <DataGrid {...dataGrid} className="h-full" />
      </main>
    </div>
  );
}
