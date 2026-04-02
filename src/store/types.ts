// ── Field Types ──

export const FIELD_TYPES = [
  "text",
  "rich_text",
  "number",
  "currency",
  "percent",
  "select",
  "multi_select",
  "status",
  "tags",
  "date",
  "datetime",
  "email",
  "phone",
  "url",
  "color",
  "json",
  "location",
  "checkbox",
  "ref",
  "refs",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

// ── Schema ──

export interface SelectOption {
  value: string;
  label: string;
  color: string;
}

export interface FieldDef {
  name: string;
  type: FieldType;
  label: string;
  required?: boolean;
  unique?: boolean;
  options?: SelectOption[]; // for select, multi_select, status, tags
  refTable?: string; // for ref, refs — which database to link
  currencyCode?: string; // for currency (e.g., "USD")
  defaultValue?: unknown;
}

// ── Row ──

export type CellValue =
  | string
  | number
  | boolean
  | string[] // multi_select, tags, refs
  | Record<string, unknown> // json
  | null;

export interface Row {
  id: string;
  data: Record<string, CellValue>;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// ── Filter ──

export type FilterOperator =
  // text
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  // number
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  // date
  | "before"
  | "after"
  | "between"
  // select
  | "is"
  | "is_not"
  | "is_any_of"
  // multi_select / tags
  | "contains_any"
  | "contains_all"
  // checkbox
  | "is_true"
  | "is_false";

export interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: CellValue;
}

export type FilterConjunction = "and" | "or";

// ── Sort ──

export interface SortRule {
  id: string;
  field: string;
  direction: "asc" | "desc";
}

// ── View ──

export type ViewType = "table" | "board";

export interface View {
  id: string;
  name: string;
  type: ViewType;
  filters: FilterRule[];
  filterConjunction: FilterConjunction;
  sorts: SortRule[];
  groupBy: string | null;
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
}

// ── Audit ──

export type AuditActor = "human" | "korra";

export interface AuditEntry {
  id: string;
  actor: AuditActor;
  action: string;
  timestamp: string; // ISO date
  diff?: {
    field?: string;
    rowId?: string;
    before?: unknown;
    after?: unknown;
  };
}

// ── Database ──

export interface Database {
  id: string;
  name: string;
  icon: string;
  schema: FieldDef[];
  rows: Row[];
  views: View[];
  activeViewId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Store ──

export interface DbState {
  databases: Database[];
  activeDbId: string | null;
  selectedRowIds: string[];
  auditLog: AuditEntry[];
  filters: FilterRule[];
  filterConjunction: FilterConjunction;
  sorts: SortRule[];
  groupBy: string | null;
}

export interface DbActions {
  // Database
  setActiveDb: (dbId: string) => void;
  addDatabase: (db: Database) => void;

  // Row CRUD
  addRow: (data: Record<string, CellValue>, actor?: AuditActor) => void;
  updateCell: (
    rowId: string,
    field: string,
    value: CellValue,
    actor?: AuditActor
  ) => void;
  deleteRows: (rowIds: string[], actor?: AuditActor) => void;
  duplicateRow: (rowId: string) => void;
  bulkUpdate: (
    rowIds: string[],
    field: string,
    value: CellValue,
    actor?: AuditActor
  ) => void;

  // Column CRUD
  addColumn: (fieldDef: FieldDef) => void;
  removeColumn: (fieldName: string) => void;
  renameColumn: (fieldName: string, newName: string) => void;
  reorderColumns: (newOrder: string[]) => void;

  // Selection
  setSelectedRowIds: (rowIds: string[]) => void;
  toggleRowSelection: (rowId: string) => void;
  selectAllRows: () => void;
  clearSelection: () => void;

  // Filter / Sort / Group
  setFilters: (filters: FilterRule[]) => void;
  setFilterConjunction: (conjunction: FilterConjunction) => void;
  setSorts: (sorts: SortRule[]) => void;
  setGroupBy: (field: string | null) => void;

  // Views
  saveView: (view: View) => void;
  switchView: (viewId: string) => void;
  deleteView: (viewId: string) => void;

  // Seed / Reset
  seedData: (databases: Database[]) => void;
  resetData: () => void;
}

export type DbStore = DbState & DbActions;
