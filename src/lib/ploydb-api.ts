// PloyDB API Client
// Connects to the PloyDB standalone backend (Docker)

const API_BASE = process.env.NEXT_PUBLIC_PLOYDB_API_URL || "http://localhost:4318";
const API_TOKEN = process.env.NEXT_PUBLIC_PLOYDB_TOKEN || "";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FieldSchema {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  required?: boolean;
  constraints?: { unique?: boolean; indexed?: boolean };
}

export interface DatabaseRecord {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  schema: FieldSchema[];
  fieldOrder: string[];
  version: string;
  auditEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RowRecord {
  id: string;
  databaseId: string;
  workspaceId: string;
  properties: Record<string, unknown>;
  rowNumber: number;
  version: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueryRowsResponse {
  rows: RowRecord[];
  total: number;
}

// ─── Fetch helper ───────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PloyDB API ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── Database endpoints ─────────────────────────────────────────────────────

export async function listDatabases(): Promise<DatabaseRecord[]> {
  return apiFetch<DatabaseRecord[]>("/api/databases");
}

export async function getDatabase(id: string): Promise<DatabaseRecord> {
  return apiFetch<DatabaseRecord>(`/api/databases/${id}`);
}

// ─── Row endpoints ──────────────────────────────────────────────────────────

export async function queryRows(
  databaseId: string,
  options: {
    filter?: unknown;
    sort?: unknown[];
    limit?: number;
    offset?: number;
  } = {}
): Promise<QueryRowsResponse> {
  return apiFetch<QueryRowsResponse>(
    `/api/databases/${databaseId}/rows/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: options.filter ?? null,
        sort: options.sort ?? [],
        limit: options.limit ?? 500,
        offset: options.offset ?? 0,
      }),
    }
  );
}

export async function createRow(
  databaseId: string,
  properties: Record<string, unknown>
): Promise<RowRecord> {
  return apiFetch<RowRecord>(`/api/databases/${databaseId}/rows`, {
    method: "POST",
    body: JSON.stringify({ properties }),
  });
}

export async function updateRow(
  databaseId: string,
  rowId: string,
  properties: Record<string, unknown>,
  baseVersion: number
): Promise<RowRecord> {
  return apiFetch<RowRecord>(
    `/api/databases/${databaseId}/rows/${rowId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ properties, baseVersion }),
    }
  );
}

export async function archiveRow(
  databaseId: string,
  rowId: string
): Promise<void> {
  await apiFetch(`/api/databases/${databaseId}/rows/archive`, {
    method: "POST",
    body: JSON.stringify({ rowId }),
  });
}
