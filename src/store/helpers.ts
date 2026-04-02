import type { Database, DbState } from "./types";

/** Returns the active database or null. */
export function getActiveDb(state: DbState): Database | null {
  if (!state.activeDbId) return null;
  return state.databases.find((db) => db.id === state.activeDbId) ?? null;
}

/** Returns the index of the active database, or -1. */
export function getActiveDbIndex(state: DbState): number {
  if (!state.activeDbId) return -1;
  return state.databases.findIndex((db) => db.id === state.activeDbId);
}
