import type { WidgetMode, WidgetAction } from "../types";
import { isCaptureMode, isNoteMode } from "../types";

/**
 * Installs the global Escape handler. Reads `mode`/`previewingItemId` live via
 * getters so a single install stays correct across state changes. Returns a
 * cleanup that removes the listener.
 */
export function installWidgetKeyboard({
  getMode,
  getPreviewingItemId,
  dispatch,
  cancelVideoRecording,
}: {
  getMode: () => WidgetMode;
  getPreviewingItemId: () => string | null;
  dispatch: (action: WidgetAction) => void;
  cancelVideoRecording: () => void;
}): () => void {
  function handleKeydown(e: KeyboardEvent) {
    const mode = getMode();
    const previewingItemId = getPreviewingItemId();
    if (e.key === "Escape" && mode !== "idle") {
      if (mode === "videoRecording") {
        cancelVideoRecording();
      } else if (mode === "captureMenu" || mode === "noteMenu") {
        dispatch({ type: "SET_MODE", mode: "active" });
      } else if (isCaptureMode(mode) || isNoteMode(mode) || mode === "reviewing") {
        dispatch({ type: "SET_MODE", mode: previewingItemId ? "reviewing" : "active" });
      } else if (mode === "annotating") {
        dispatch({ type: "SET_ACTIVE_POPOVER", id: null });
        dispatch({ type: "SET_MODE", mode: previewingItemId ? "reviewing" : "active" });
      } else {
        dispatch({ type: "CLOSE" });
      }
    }
  }

  window.addEventListener("keydown", handleKeydown);
  return () => window.removeEventListener("keydown", handleKeydown);
}
