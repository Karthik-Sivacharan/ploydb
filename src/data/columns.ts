import type { ColumnDef } from "@tanstack/react-table";
import type { CrmRow } from "@/data/seed";
import { teamMembers } from "@/data/team-members";
import { deals } from "@/data/deals";

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
    id: "dealSize",
    accessorKey: "dealSize",
    header: "Deal Size",
    size: 140,
    meta: {
      label: "Deal Size",
      cell: { variant: "currency" },
    },
  },
  {
    id: "winProbability",
    accessorKey: "winProbability",
    header: "Win Prob.",
    size: 120,
    meta: {
      label: "Win Probability",
      cell: { variant: "percent" },
    },
  },
  {
    id: "stage",
    accessorKey: "stage",
    header: "Stage",
    size: 160,
    meta: {
      label: "Stage",
      cell: {
        variant: "status",
        options: [
          { value: "New", label: "New", color: "#64748b" },
          { value: "Contacted", label: "Contacted", color: "#3b82f6" },
          { value: "Qualified", label: "Qualified", color: "#22c55e" },
          { value: "Proposal", label: "Proposal", color: "#eab308" },
          { value: "Negotiation", label: "Negotiation", color: "#8b5cf6" },
          { value: "Won", label: "Won", color: "#10b981" },
          { value: "Lost", label: "Lost", color: "#ef4444" },
        ],
      },
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
    id: "labels",
    accessorKey: "labels",
    header: "Labels",
    size: 220,
    meta: {
      label: "Labels",
      cell: {
        variant: "tags",
        options: [
          { value: "Hot Lead", label: "Hot Lead" },
          { value: "Follow Up", label: "Follow Up" },
          { value: "Enterprise", label: "Enterprise" },
          { value: "SMB", label: "SMB" },
          { value: "Startup", label: "Startup" },
        ],
      },
    },
  },
  {
    id: "contactEmail",
    accessorKey: "contactEmail",
    header: "Email",
    size: 220,
    meta: {
      label: "Contact Email",
      cell: { variant: "email" },
    },
  },
  {
    id: "contactPhone",
    accessorKey: "contactPhone",
    header: "Phone",
    size: 160,
    meta: {
      label: "Contact Phone",
      cell: { variant: "phone" },
    },
  },
  {
    id: "companyHq",
    accessorKey: "companyHq",
    header: "HQ Location",
    size: 180,
    meta: {
      label: "Company HQ",
      cell: { variant: "location" },
    },
  },
  {
    id: "accountColor",
    accessorKey: "accountColor",
    header: "Color",
    size: 130,
    meta: {
      label: "Account Color",
      cell: { variant: "color" },
    },
  },
  {
    id: "customMetadata",
    accessorKey: "customMetadata",
    header: "Metadata",
    size: 200,
    meta: {
      label: "Custom Metadata",
      cell: { variant: "json" },
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
  {
    id: "nextFollowUp",
    accessorKey: "nextFollowUp",
    header: "Next Follow Up",
    size: 200,
    meta: {
      label: "Next Follow Up",
      cell: { variant: "datetime" },
    },
  },
  {
    id: "assignedTo",
    accessorKey: "assignedTo",
    header: "Assigned To",
    size: 180,
    meta: {
      label: "Assigned To",
      cell: { variant: "ref", refRecords: teamMembers },
    },
  },
  {
    id: "relatedDeals",
    accessorKey: "relatedDeals",
    header: "Related Deals",
    size: 280,
    meta: {
      label: "Related Deals",
      cell: { variant: "refs", refRecords: deals },
    },
  },
];
