import { startConsoleCapture, type ConsoleCapture } from "../utils/console-capture";
import type { WidgetMode } from "../types";
import type { Ref } from "./useCapture.svelte";

/**
 * Starts capturing console.error/warn when the widget leaves idle, and stops +
 * restores the originals when it returns to idle. Call `sync(mode)` from a
 * $effect keyed on the widget mode, and `stop()` on teardown.
 */
export function createConsoleCapture() {
  const ref: Ref<ConsoleCapture | null> = { current: null };

  function sync(mode: WidgetMode) {
    if (mode !== "idle") {
      if (!ref.current) {
        ref.current = startConsoleCapture();
      }
    } else if (ref.current) {
      ref.current.stop();
      ref.current = null;
    }
  }

  function stop() {
    if (ref.current) {
      ref.current.stop();
      ref.current = null;
    }
  }

  return { ref, sync, stop };
}
