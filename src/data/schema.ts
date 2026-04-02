import type { FieldDef, SelectOption } from "@/store/types";

// ── Color palette for select options ──
// Muted, distinct hues that work in both light/dark mode

const COLORS = {
  slate: "#64748b",
  blue: "#3b82f6",
  sky: "#0ea5e9",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  emerald: "#10b981",
  green: "#22c55e",
  lime: "#84cc16",
  yellow: "#eab308",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  rose: "#f43f5e",
  pink: "#ec4899",
  fuchsia: "#d946ef",
  purple: "#a855f7",
  violet: "#8b5cf6",
  indigo: "#6366f1",
} as const;

// ── Option builders ──

function opts(
  pairs: [string, string][]
): SelectOption[] {
  return pairs.map(([value, color]) => ({
    value,
    label: value,
    color,
  }));
}

// ── Source options ──

const SOURCE_OPTIONS: SelectOption[] = opts([
  ["Referral", COLORS.emerald],
  ["Website", COLORS.blue],
  ["Cold Call", COLORS.amber],
  ["LinkedIn", COLORS.indigo],
  ["Conference", COLORS.purple],
  ["Partner", COLORS.teal],
]);

// ── Products options ──

const PRODUCT_OPTIONS: SelectOption[] = opts([
  ["Analytics", COLORS.violet],
  ["CRM", COLORS.blue],
  ["Marketing", COLORS.pink],
  ["Automation", COLORS.amber],
  ["API", COLORS.cyan],
  ["Support", COLORS.emerald],
]);

// ── Status options ──

const STATUS_OPTIONS: SelectOption[] = opts([
  ["New", COLORS.slate],
  ["Contacted", COLORS.blue],
  ["Qualified", COLORS.yellow],
  ["Proposal", COLORS.purple],
  ["Negotiation", COLORS.orange],
  ["Won", COLORS.green],
  ["Lost", COLORS.red],
]);

// ── Tag options ──

const TAG_OPTIONS: SelectOption[] = opts([
  ["Hot", COLORS.red],
  ["Enterprise", COLORS.indigo],
  ["Startup", COLORS.lime],
  ["SMB", COLORS.sky],
  ["Churned", COLORS.slate],
  ["VIP", COLORS.fuchsia],
  ["Renewal", COLORS.teal],
]);

// ── Pipeline schema (all 20 field types) ──

export const PIPELINE_SCHEMA: FieldDef[] = [
  { name: "company_name", type: "text", label: "Company Name", required: true, unique: true },
  { name: "notes", type: "rich_text", label: "Notes" },
  { name: "employee_count", type: "number", label: "Employee Count" },
  { name: "deal_size", type: "currency", label: "Deal Size", currencyCode: "USD" },
  { name: "win_probability", type: "percent", label: "Win Probability" },
  { name: "source", type: "select", label: "Source", options: SOURCE_OPTIONS },
  { name: "products_interested", type: "multi_select", label: "Products Interested", options: PRODUCT_OPTIONS },
  { name: "status", type: "status", label: "Status", options: STATUS_OPTIONS },
  { name: "tags", type: "tags", label: "Tags", options: TAG_OPTIONS },
  { name: "created_date", type: "date", label: "Created Date" },
  { name: "last_contacted", type: "datetime", label: "Last Contacted" },
  { name: "contact_email", type: "email", label: "Contact Email" },
  { name: "phone", type: "phone", label: "Phone" },
  { name: "website", type: "url", label: "Website" },
  { name: "brand_color", type: "color", label: "Brand Color" },
  { name: "metadata", type: "json", label: "Metadata" },
  { name: "location", type: "location", label: "Location" },
  { name: "has_nda", type: "checkbox", label: "Has NDA" },
  { name: "assigned_to", type: "ref", label: "Assigned To", refTable: "team" },
  { name: "related_deals", type: "refs", label: "Related Deals", refTable: "deals" },
];

// ── Team schema ──

export const TEAM_SCHEMA: FieldDef[] = [
  { name: "name", type: "text", label: "Name", required: true },
  { name: "email", type: "email", label: "Email" },
  {
    name: "role",
    type: "select",
    label: "Role",
    options: opts([
      ["Sales Rep", COLORS.blue],
      ["Account Exec", COLORS.purple],
      ["SDR", COLORS.amber],
      ["Manager", COLORS.emerald],
    ]),
  },
  {
    name: "department",
    type: "select",
    label: "Department",
    options: opts([
      ["Sales", COLORS.indigo],
      ["Marketing", COLORS.pink],
      ["Support", COLORS.teal],
    ]),
  },
  { name: "phone", type: "phone", label: "Phone" },
  { name: "location", type: "location", label: "Location" },
  { name: "active", type: "checkbox", label: "Active" },
];

// ── Deals schema ──

export const DEALS_SCHEMA: FieldDef[] = [
  { name: "deal_name", type: "text", label: "Deal Name", required: true },
  { name: "value", type: "currency", label: "Value", currencyCode: "USD" },
  {
    name: "stage",
    type: "select",
    label: "Stage",
    options: opts([
      ["Discovery", COLORS.sky],
      ["Proposal", COLORS.purple],
      ["Negotiation", COLORS.orange],
      ["Closed Won", COLORS.green],
      ["Closed Lost", COLORS.red],
    ]),
  },
  { name: "company", type: "ref", label: "Company", refTable: "pipeline" },
  { name: "close_date", type: "date", label: "Close Date" },
  { name: "probability", type: "percent", label: "Probability" },
];

// Re-export for convenience
export { SOURCE_OPTIONS, PRODUCT_OPTIONS, STATUS_OPTIONS, TAG_OPTIONS };
