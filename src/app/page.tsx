"use client";

import * as React from "react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
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
      <main className="flex-1 overflow-hidden flex flex-col">
        <div
          role="toolbar"
          aria-orientation="horizontal"
          className="flex items-center gap-2 border-b px-4 py-2"
        >
          <DataGridFilterMenu table={dataGrid.table} align="end" />
          <DataGridSortMenu table={dataGrid.table} align="end" />
          <DataGridRowHeightMenu table={dataGrid.table} align="end" />
          <DataGridViewMenu table={dataGrid.table} align="end" />
        </div>
        <div className="flex-1 overflow-hidden">
          <DataGrid {...dataGrid} height={0} className="h-full" />
        </div>
      </main>
    </div>
  );
}
