import type { WidgetMode, WidgetState } from "../types";

export type PanelKey =
  | "captureMenu" | "noteMenu"
  | "capturePhoto" | "captureVideo" | "textNote"
  | "voicePanel" | "review";

export const PANEL_WIDTHS: Record<PanelKey, number> = {
  captureMenu: 176, noteMenu: 176,
  capturePhoto: 280, captureVideo: 280, textNote: 280,
  voicePanel: 240, review: 280,
};

/** Mode → panel key for modes with a static mapping. */
const MODE_PANEL: Partial<Record<WidgetMode, PanelKey>> = {
  captureMenu: "captureMenu",
  noteMenu: "noteMenu",
  voiceNote: "noteMenu",
  textNote: "textNote",
  voiceRecording: "voicePanel",
  voicePreview: "voicePanel",
  reviewing: "review",
};

/**
 * Derive the active panel key from widget state.
 *
 * Handles the capturePreview variant split.
 * Returns null when no panel should be shown.
 */
export function derivePanelKey(state: Pick<WidgetState, "mode" | "pendingCapture">): PanelKey | null {
  const { mode, pendingCapture } = state;

  // capturePreview depends on the pending capture variant
  if (mode === "capturePreview") {
    return pendingCapture?.variant === "video" ? "captureVideo" : "capturePhoto";
  }

  return MODE_PANEL[mode] ?? null;
}
