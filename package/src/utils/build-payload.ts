import type { WidgetState, FeedbackSubmission } from "../types";
import type { ConsoleCapture } from "./console-capture";
import { collectEnvironment } from "./metadata";
import { nanoid } from "./nanoid";

/**
 * Build the feedback submission payload from widget state.
 * Pure function — no hooks, no side effects beyond reading window.location.
 */
export function buildPayload(
  state: WidgetState,
  extraMetadata?: Record<string, unknown>,
  consoleCaptureRef?: React.RefObject<ConsoleCapture | null>,
): FeedbackSubmission {
  const metadata: Record<string, unknown> = { ...extraMetadata };

  if (consoleCaptureRef?.current) {
    metadata.consoleLog = [...consoleCaptureRef.current.entries];
  }

  return {
    id: `fb_${nanoid(12)}`,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    environment: collectEnvironment(),
    items: state.items,
    metadata,
  };
}
