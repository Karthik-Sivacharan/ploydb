// Converts PloyDB backend schema to TanStack Table ColumnDef[]
// Maps backend field types → frontend cell variants

import type { ColumnDef } from "@tanstack/react-table";
import type { FieldSchema, RowRecord } from "@/lib/ploydb-api";

interface SelectOption {
  id: string;
  label: string;
  color?: string;
}

interface StatusConfig {
  options: SelectOption[];
  groups?: Record<string, string[]>;
}

// ─── Field type → cell variant mapping ──────────────────────────────────────

function fieldToColumnDef(
  field: FieldSchema,
  refRecordsMap: Map<string, Array<{ id: string; name: string }>>
): ColumnDef<Record<string, unknown>> {
  const fieldId = field.id;
  const base: ColumnDef<Record<string, unknown>> = {
    id: fieldId,
    accessorKey: fieldId,
    accessorFn: (row) => row[fieldId],
    header: field.name,
    enableColumnFilter: true,
    enableSorting: true,
  };

  switch (field.type) {
    case "text":
      return {
        ...base,
        size: 200,
        meta: { label: field.name, cell: { variant: "short-text" } },
      };

    case "rich_text":
      return {
        ...base,
        size: 280,
        meta: { label: field.name, cell: { variant: "long-text" } },
      };

    case "url":
      return {
        ...base,
        size: 200,
        meta: { label: field.name, cell: { variant: "url" } },
      };

    case "email":
      return {
        ...base,
        size: 220,
        meta: { label: field.name, cell: { variant: "email" } },
      };

    case "phone":
      return {
        ...base,
        size: 160,
        meta: { label: field.name, cell: { variant: "phone" } },
      };

    case "select": {
      const options = (
        (field.config?.options as SelectOption[]) ?? []
      ).map((opt) => ({
        value: opt.id,
        label: opt.label,
      }));
      return {
        ...base,
        size: 160,
        meta: { label: field.name, cell: { variant: "select", options } },
      };
    }

    case "status": {
      const cfg = field.config as unknown as StatusConfig;
      const options = (cfg?.options ?? []).map((opt) => ({
        value: opt.id,
        label: opt.label,
        color: opt.color ?? "#64748b",
      }));
      return {
        ...base,
        size: 160,
        meta: { label: field.name, cell: { variant: "status", options } },
      };
    }

    case "tags":
      return {
        ...base,
        size: 220,
        meta: {
          label: field.name,
          cell: { variant: "tags", options: [] },
        },
      };

    case "date":
      return {
        ...base,
        size: 160,
        meta: { label: field.name, cell: { variant: "date" } },
      };

    case "datetime":
      return {
        ...base,
        size: 200,
        meta: { label: field.name, cell: { variant: "datetime" } },
      };

    case "currency":
      return {
        ...base,
        size: 140,
        meta: {
          label: field.name,
          cell: {
            variant: "currency",
            currencyCode:
              (field.config?.defaultCode as string) ?? "USD",
          },
        },
      };

    case "percent":
      return {
        ...base,
        size: 120,
        meta: { label: field.name, cell: { variant: "percent" } },
      };

    case "color":
      return {
        ...base,
        size: 130,
        meta: { label: field.name, cell: { variant: "color" } },
      };

    case "json":
      return {
        ...base,
        size: 200,
        meta: { label: field.name, cell: { variant: "json" } },
      };

    case "location":
      return {
        ...base,
        size: 180,
        meta: { label: field.name, cell: { variant: "location" } },
      };

    case "ref": {
      const targetSlug = field.config?.targetDatabase as string;
      const refRecords = refRecordsMap.get(targetSlug) ?? [];
      return {
        ...base,
        size: 180,
        meta: {
          label: field.name,
          cell: { variant: "ref", refRecords },
        },
      };
    }

    case "refs": {
      const targetSlug = field.config?.targetDatabase as string;
      const refRecords = refRecordsMap.get(targetSlug) ?? [];
      return {
        ...base,
        size: 280,
        meta: {
          label: field.name,
          cell: { variant: "refs", refRecords },
        },
      };
    }

    case "number":
      return {
        ...base,
        size: 130,
        meta: {
          label: field.name,
          cell: { variant: "number", min: 0, step: 1 },
        },
      };

    default:
      // Fallback: render as short-text
      return {
        ...base,
        size: 200,
        meta: { label: field.name, cell: { variant: "short-text" } },
      };
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function schemaToColumns(
  schema: FieldSchema[],
  fieldOrder: string[],
  refRecordsMap: Map<string, Array<{ id: string; name: string }>>
): ColumnDef<Record<string, unknown>>[] {
  // Build columns in field order
  const fieldMap = new Map(schema.map((f) => [f.id, f]));
  const ordered = fieldOrder
    .map((id) => fieldMap.get(id))
    .filter(Boolean) as FieldSchema[];

  return ordered.map((field) => fieldToColumnDef(field, refRecordsMap));
}

/**
 * Convert a backend row to a flat object the data grid expects.
 * Flattens properties to top-level keys, keeps _id for grid identity.
 * Normalizes values based on schema:
 *  - color: string → string[]
 *  - ref: UUID string → { id, name }
 *  - refs: UUID[] → { id, name }[]
 */
export function apiRowToFlat(
  row: RowRecord,
  schema?: FieldSchema[],
  refRecordsMap?: Map<string, Array<{ id: string; name: string }>>
): Record<string, unknown> {
  const props = { ...row.properties };

  if (schema) {
    for (const field of schema) {
      const val = props[field.id];
      if (val === undefined || val === null) continue;

      switch (field.type) {
        case "color":
          // Cell expects string[], backend sends a single string
          if (typeof val === "string") {
            props[field.id] = [val];
          }
          break;

        case "ref": {
          // Cell expects { id, name }, backend sends a UUID string
          if (typeof val === "string" && refRecordsMap) {
            const targetSlug = field.config?.targetDatabase as string;
            const records = refRecordsMap.get(targetSlug) ?? [];
            const match = records.find((r) => r.id === val);
            props[field.id] = match ?? { id: val, name: val.slice(0, 8) };
          }
          break;
        }

        case "refs": {
          // Cell expects { id, name }[], backend sends UUID[]
          if (Array.isArray(val) && refRecordsMap) {
            const targetSlug = field.config?.targetDatabase as string;
            const records = refRecordsMap.get(targetSlug) ?? [];
            props[field.id] = (val as string[]).map((uuid) => {
              const match = records.find((r) => r.id === uuid);
              return match ?? { id: uuid, name: uuid.slice(0, 8) };
            });
          }
          break;
        }
      }
    }
  }

  return {
    _id: row.id,
    _version: Number(row.version),
    _rowNumber: row.rowNumber,
    ...props,
  };
}

/**
 * Convert frontend cell values back to the format the backend API expects.
 *
 * The frontend uses rich objects for display (e.g. { id, name } for refs),
 * but the backend only understands lean primitives (e.g. plain UUID strings).
 *
 * This function reverses the transformations done by `apiRowToFlat`:
 *  - ref:   { id: "abc-123", name: "Acme" }  →  "abc-123"       (object → UUID string)
 *  - refs:  [{ id: "a", name: "X" }, ...]     →  ["a", ...]      (object[] → UUID string[])
 *  - color: ["#ff0000"]                        →  "#ff0000"       (string[] → single string)
 *
 * All other field types pass through unchanged — their frontend and
 * backend representations are already identical.
 */
export function flatPropsToApi(
  changedProps: Record<string, unknown>,
  schema: FieldSchema[]
): Record<string, unknown> {
  const apiProps = { ...changedProps };

  // Build a quick lookup: field ID → field schema
  const fieldMap = new Map(schema.map((f) => [f.id, f]));

  for (const [key, val] of Object.entries(apiProps)) {
    const field = fieldMap.get(key);
    if (!field || val === null || val === undefined) continue;

    switch (field.type) {
      case "ref": {
        // Frontend stores { id, name } for display → backend wants just the UUID
        if (typeof val === "object" && !Array.isArray(val) && (val as Record<string, unknown>).id) {
          apiProps[key] = (val as Record<string, unknown>).id;
        }
        break;
      }

      case "refs": {
        // Frontend stores [{ id, name }, ...] → backend wants ["uuid", ...]
        if (Array.isArray(val)) {
          apiProps[key] = val.map((item) =>
            typeof item === "object" && item !== null && "id" in item
              ? (item as Record<string, unknown>).id
              : item
          );
        }
        break;
      }

      case "color": {
        // Frontend stores string[] (array of hex) → backend wants a single hex string
        if (Array.isArray(val) && val.length > 0) {
          apiProps[key] = val[0];
        }
        break;
      }

      // All other field types (text, number, select, status, date, etc.)
      // have matching frontend/backend formats — no conversion needed.
    }
  }

  return apiProps;
}

/**
 * Extract the display name from a row's properties for ref lookups.
 * Tries common name fields in order.
 */
export function extractDisplayName(
  row: RowRecord
): string {
  const p = row.properties;
  return (
    (p.fld_name as string) ??
    (p.fld_title as string) ??
    (p.fld_alt_text as string) ??
    `Row ${row.rowNumber}`
  );
}
