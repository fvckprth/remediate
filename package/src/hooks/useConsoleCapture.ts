import { useRef, useEffect } from "react";
import { startConsoleCapture, type ConsoleCapture } from "../utils/console-capture";
import type { WidgetMode } from "../types";

export function useConsoleCapture(mode: WidgetMode) {
  const ref = useRef<ConsoleCapture | null>(null);

  useEffect(() => {
    if (mode !== "idle") {
      if (!ref.current) {
        ref.current = startConsoleCapture();
      }
    }
    return () => {
      if (mode === "idle" && ref.current) {
        ref.current.stop();
        ref.current = null;
      }
    };
  }, [mode]);

  return ref;
}
