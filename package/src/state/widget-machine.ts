import type { WidgetMode, WidgetState } from "../types";

export type PanelKey =
  | "settings" | "captureMenu" | "noteMenu"
  | "capturePhoto" | "captureVideo" | "textNote"
  | "voicePanel" | "review" | "submitError";

export const PANEL_WIDTHS: Record<PanelKey, number> = {
  settings: 240, captureMenu: 176, noteMenu: 176,
  capturePhoto: 280, captureVideo: 280, textNote: 280,
  voicePanel: 240, review: 280, submitError: 200,
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
  submitError: "submitError",
};

/**
 * Derive the active panel key from widget state.
 *
 * Handles settings overlay priority and the capturePreview variant split.
 * Returns null when no panel should be shown.
 */
export function derivePanelKey(state: Pick<WidgetState, "mode" | "settingsOpen" | "pendingCapture">): PanelKey | null {
  const { mode, settingsOpen, pendingCapture } = state;

  // Settings overlay takes priority (except in terminal states)
  if (settingsOpen && mode !== "idle" && mode !== "success" && mode !== "submitError") {
    return "settings";
  }

  // capturePreview depends on the pending capture variant
  if (mode === "capturePreview") {
    return pendingCapture?.variant === "video" ? "captureVideo" : "capturePhoto";
  }

  return MODE_PANEL[mode] ?? null;
}
