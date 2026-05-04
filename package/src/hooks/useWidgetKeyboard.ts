import { useEffect } from "react";
import type { WidgetMode, WidgetAction } from "../types";
import { isCaptureMode, isNoteMode } from "../types";

export function useWidgetKeyboard({
  mode,
  previewingItemId,
  dispatch,
  cancelVideoRecording,
}: {
  mode: WidgetMode;
  previewingItemId: string | null;
  dispatch: React.Dispatch<WidgetAction>;
  cancelVideoRecording: () => void;
}) {
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
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
  }, [mode, previewingItemId, dispatch, cancelVideoRecording]);
}
