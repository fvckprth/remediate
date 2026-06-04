import type { BarEdge } from "../types";

const STORAGE_KEY = "rm_bar_position";

export interface BarState {
  x: number;
  y: number;
  r: number;
  b?: number;
  edge?: BarEdge;
  collapsed?: boolean;
}

/** Read the persisted bar state. Returns a partial object (may lack position) or null. */
export function readBarState(): Partial<BarState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Partial<BarState>) : null;
  } catch {
    return null;
  }
}

/** Merge a partial update into the persisted bar state. */
export function patchBarState(patch: Partial<BarState>): void {
  try {
    const current = readBarState() ?? {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    /* storage unavailable (private mode, quota) — non-fatal */
  }
}
