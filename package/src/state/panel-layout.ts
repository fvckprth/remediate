import type { WidgetMode, WidgetState } from "../types";

export type PanelKey = "captureMenu" | "noteMenu" | "capture" | "textNote" | "voicePanel" | "review";

/** Toolbar button each panel hangs off (see data-rm-anchor in FeedbackBar). */
export type PanelAnchor = "capture" | "note" | "review";

export const PANEL_WIDTHS: Record<PanelKey, number> = {
  captureMenu: 176, noteMenu: 176,
  capture: 280, textNote: 280,
  voicePanel: 240, review: 280,
};

export const PANEL_ANCHORS: Record<PanelKey, PanelAnchor> = {
  captureMenu: "capture", capture: "capture",
  noteMenu: "note", textNote: "note", voicePanel: "note",
  review: "review",
};

/** Mode → panel key. Modes without a panel are absent. */
const MODE_PANEL: Partial<Record<WidgetMode, PanelKey>> = {
  captureMenu: "captureMenu",
  capturePreview: "capture",
  noteMenu: "noteMenu",
  voiceNote: "noteMenu",
  textNote: "textNote",
  voiceRecording: "voicePanel",
  voicePreview: "voicePanel",
  reviewing: "review",
};

export function derivePanelKey(state: Pick<WidgetState, "mode">): PanelKey | null {
  return MODE_PANEL[state.mode] ?? null;
}
