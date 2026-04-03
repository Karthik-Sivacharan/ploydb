import type { ColumnDef } from "@tanstack/react-table";
import type { CrmRow } from "@/data/seed";

export const columns: ColumnDef<CrmRow>[] = [
  {
    id: "companyName",
    accessorKey: "companyName",
    header: "Company Name",
    size: 200,
    meta: {
      label: "Company Name",
      cell: { variant: "short-text" },
    },
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    size: 280,
    meta: {
      label: "Description",
      cell: { variant: "long-text" },
    },
  },
  {
    id: "employeeCount",
    accessorKey: "employeeCount",
    header: "Employees",
    size: 130,
    meta: {
      label: "Employees",
      cell: { variant: "number", min: 1, max: 100000, step: 1 },
    },
  },
  {
    id: "leadSource",
    accessorKey: "leadSource",
    header: "Lead Source",
    size: 160,
    meta: {
      label: "Lead Source",
      cell: {
        variant: "select",
        options: [
          { value: "Referral", label: "Referral" },
          { value: "Website", label: "Website" },
          { value: "Cold Call", label: "Cold Call" },
          { value: "Event", label: "Event" },
          { value: "Partner", label: "Partner" },
        ],
      },
    },
  },
  {
    id: "industries",
    accessorKey: "industries",
    header: "Industries",
    size: 220,
    meta: {
      label: "Industries",
      cell: {
        variant: "multi-select",
        options: [
          { value: "SaaS", label: "SaaS" },
          { value: "Fintech", label: "Fintech" },
          { value: "Healthcare", label: "Healthcare" },
          { value: "E-commerce", label: "E-commerce" },
          { value: "AI/ML", label: "AI/ML" },
        ],
      },
    },
  },
  {
    id: "hasNda",
    accessorKey: "hasNda",
    header: "NDA",
    size: 100,
    meta: {
      label: "NDA",
      cell: { variant: "checkbox" },
    },
  },
  {
    id: "lastContacted",
    accessorKey: "lastContacted",
    header: "Last Contacted",
    size: 160,
    meta: {
      label: "Last Contacted",
      cell: { variant: "date" },
    },
  },
  {
    id: "website",
    accessorKey: "website",
    header: "Website",
    size: 200,
    meta: {
      label: "Website",
      cell: { variant: "url" },
    },
  },
];
