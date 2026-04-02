import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AuditActor,
  AuditEntry,
  CellValue,
  Database,
  DbStore,
  FieldDef,
  FilterConjunction,
  FilterRule,
  Row,
  SortRule,
  View,
} from "./types";
import { getActiveDb, getActiveDbIndex } from "./helpers";

// ── Helpers ──

function now(): string {
  return new Date().toISOString();
}

function auditEntry(
  actor: AuditActor,
  action: string,
  diff?: AuditEntry["diff"],
): AuditEntry {
  return {
    id: crypto.randomUUID(),
    actor,
    action,
    timestamp: now(),
    diff,
  };
}

function updateDbAt<T extends Partial<Database>>(
  databases: Database[],
  idx: number,
  patch: T,
): Database[] {
  return databases.map((db, i) =>
    i === idx ? { ...db, ...patch, updatedAt: now() } : db,
  );
}

// ── Initial state ──

const INITIAL_STATE = {
  databases: [] as Database[],
  activeDbId: null as string | null,
  selectedRowIds: [] as string[],
  auditLog: [] as AuditEntry[],
  filters: [] as FilterRule[],
  filterConjunction: "and" as FilterConjunction,
  sorts: [] as SortRule[],
  groupBy: null as string | null,
};

// ── Store ──

export const useDbStore = create<DbStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Database actions ──

      setActiveDb: (dbId: string) => {
        set({ activeDbId: dbId, selectedRowIds: [] });
      },

      addDatabase: (db: Database) => {
        set((s) => ({ databases: [...s.databases, db] }));
      },

      // ── Row CRUD ──

      addRow: (data: Record<string, CellValue>, actor?: AuditActor) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const newRow: Row = {
          id: crypto.randomUUID(),
          data,
          createdAt: now(),
          updatedAt: now(),
        };

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            rows: [...s.databases[idx].rows, newRow],
          }),
          auditLog: [
            ...s.auditLog,
            auditEntry(actor ?? "human", "addRow", {
              rowId: newRow.id,
              after: data,
            }),
          ],
        }));
      },

      updateCell: (
        rowId: string,
        field: string,
        value: CellValue,
        actor?: AuditActor,
      ) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];
        const row = db.rows.find((r) => r.id === rowId);
        if (!row) return;

        const before = row.data[field];

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            rows: db.rows.map((r) =>
              r.id === rowId
                ? { ...r, data: { ...r.data, [field]: value }, updatedAt: now() }
                : r,
            ),
          }),
          auditLog: [
            ...s.auditLog,
            auditEntry(actor ?? "human", "updateCell", {
              rowId,
              field,
              before,
              after: value,
            }),
          ],
        }));
      },

      deleteRows: (rowIds: string[], actor?: AuditActor) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];
        const idSet = new Set(rowIds);

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            rows: db.rows.filter((r) => !idSet.has(r.id)),
          }),
          selectedRowIds: s.selectedRowIds.filter((id) => !idSet.has(id)),
          auditLog: [
            ...s.auditLog,
            auditEntry(actor ?? "human", "deleteRows", {
              before: rowIds,
            }),
          ],
        }));
      },

      duplicateRow: (rowId: string) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];
        const source = db.rows.find((r) => r.id === rowId);
        if (!source) return;

        const newRow: Row = {
          id: crypto.randomUUID(),
          data: { ...source.data },
          createdAt: now(),
          updatedAt: now(),
        };

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            rows: [...db.rows, newRow],
          }),
          auditLog: [
            ...s.auditLog,
            auditEntry("human", "duplicateRow", {
              rowId: source.id,
              after: newRow.id,
            }),
          ],
        }));
      },

      bulkUpdate: (
        rowIds: string[],
        field: string,
        value: CellValue,
        actor?: AuditActor,
      ) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];
        const idSet = new Set(rowIds);

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            rows: db.rows.map((r) =>
              idSet.has(r.id)
                ? { ...r, data: { ...r.data, [field]: value }, updatedAt: now() }
                : r,
            ),
          }),
          auditLog: [
            ...s.auditLog,
            auditEntry(actor ?? "human", "bulkUpdate", {
              field,
              before: rowIds,
              after: value,
            }),
          ],
        }));
      },

      // ── Column CRUD ──

      addColumn: (fieldDef: FieldDef) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];
        const defaultVal = fieldDef.defaultValue ?? null;

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            schema: [...db.schema, fieldDef],
            rows: db.rows.map((r) => ({
              ...r,
              data: { ...r.data, [fieldDef.name]: defaultVal as CellValue },
              updatedAt: now(),
            })),
          }),
          auditLog: [
            ...s.auditLog,
            auditEntry("human", "addColumn", {
              field: fieldDef.name,
              after: fieldDef,
            }),
          ],
        }));
      },

      removeColumn: (fieldName: string) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            schema: db.schema.filter((f) => f.name !== fieldName),
            rows: db.rows.map((r) => {
              const { [fieldName]: _, ...rest } = r.data;
              return { ...r, data: rest, updatedAt: now() };
            }),
          }),
          auditLog: [
            ...s.auditLog,
            auditEntry("human", "removeColumn", {
              field: fieldName,
              before: db.schema.find((f) => f.name === fieldName),
            }),
          ],
        }));
      },

      renameColumn: (fieldName: string, newName: string) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            schema: db.schema.map((f) =>
              f.name === fieldName ? { ...f, name: newName } : f,
            ),
            rows: db.rows.map((r) => {
              const { [fieldName]: val, ...rest } = r.data;
              return {
                ...r,
                data: { ...rest, [newName]: val },
                updatedAt: now(),
              };
            }),
          }),
          auditLog: [
            ...s.auditLog,
            auditEntry("human", "renameColumn", {
              field: fieldName,
              before: fieldName,
              after: newName,
            }),
          ],
        }));
      },

      reorderColumns: (newOrder: string[]) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];
        const fieldMap = new Map(db.schema.map((f) => [f.name, f]));
        const reordered = newOrder
          .map((name) => fieldMap.get(name))
          .filter((f): f is FieldDef => f !== undefined);

        set((s) => ({
          databases: updateDbAt(s.databases, idx, { schema: reordered }),
        }));
      },

      // ── Selection ──

      setSelectedRowIds: (rowIds: string[]) => {
        set({ selectedRowIds: rowIds });
      },

      toggleRowSelection: (rowId: string) => {
        set((s) => ({
          selectedRowIds: s.selectedRowIds.includes(rowId)
            ? s.selectedRowIds.filter((id) => id !== rowId)
            : [...s.selectedRowIds, rowId],
        }));
      },

      selectAllRows: () => {
        const db = getActiveDb(get());
        if (!db) return;
        set({ selectedRowIds: db.rows.map((r) => r.id) });
      },

      clearSelection: () => {
        set({ selectedRowIds: [] });
      },

      // ── Filter / Sort / Group ──

      setFilters: (filters: FilterRule[]) => {
        set({ filters });
      },

      setFilterConjunction: (conjunction: FilterConjunction) => {
        set({ filterConjunction: conjunction });
      },

      setSorts: (sorts: SortRule[]) => {
        set({ sorts });
      },

      setGroupBy: (field: string | null) => {
        set({ groupBy: field });
      },

      // ── Views ──

      saveView: (view: View) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];
        const exists = db.views.some((v) => v.id === view.id);

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            views: exists
              ? db.views.map((v) => (v.id === view.id ? view : v))
              : [...db.views, view],
          }),
        }));
      },

      switchView: (viewId: string) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];
        const view = db.views.find((v) => v.id === viewId);
        if (!view) return;

        set((s) => ({
          databases: updateDbAt(s.databases, idx, { activeViewId: viewId }),
          filters: view.filters,
          filterConjunction: view.filterConjunction,
          sorts: view.sorts,
          groupBy: view.groupBy,
        }));
      },

      deleteView: (viewId: string) => {
        const state = get();
        const idx = getActiveDbIndex(state);
        if (idx === -1) return;

        const db = state.databases[idx];

        set((s) => ({
          databases: updateDbAt(s.databases, idx, {
            views: db.views.filter((v) => v.id !== viewId),
          }),
        }));
      },

      // ── Seed / Reset ──

      seedData: (databases: Database[]) => {
        set({ databases });
      },

      resetData: () => {
        set({ ...INITIAL_STATE });
      },
    }),
    {
      name: "ploydb-store",
    },
  ),
);
