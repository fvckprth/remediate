import { useState, useCallback } from "react";
import type { WidgetState, WidgetAction, FeedbackSubmission } from "../types";
import type { ConsoleCapture } from "../utils/console-capture";
import { collectEnvironment } from "../utils/metadata";
import { serializeToFormData } from "../utils/serialize";
import { nanoid } from "../utils/nanoid";

function buildPayload(
  state: WidgetState,
  extraMetadata?: Record<string, unknown>,
  consoleCaptureRef?: React.RefObject<ConsoleCapture | null>,
) {
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

export function useSubmission({
  state,
  dispatch,
  onSubmit,
  endpoint,
  extraMetadata,
  onError,
  consoleCaptureRef,
}: {
  state: WidgetState;
  dispatch: React.Dispatch<WidgetAction>;
  onSubmit?: (payload: FeedbackSubmission) => void | Promise<void>;
  endpoint?: string;
  extraMetadata?: Record<string, unknown>;
  onError?: (error: Error) => void;
  consoleCaptureRef: React.RefObject<ConsoleCapture | null>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const submission = buildPayload(state, extraMetadata, consoleCaptureRef);

    if (endpoint) {
      setIsSubmitting(true);
      try {
        const formData = serializeToFormData(submission);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          throw new Error(`Feedback submission failed: ${res.status} ${res.statusText}`);
        }
        onSubmit?.(submission);
        dispatch({ type: "SUBMIT_SUCCESS" });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (onError) {
          onError(error);
        } else {
          console.error("[Remediate] Submission failed:", error);
        }
        dispatch({ type: "SUBMIT_ERROR" });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (onSubmit) {
      onSubmit(submission);
    } else {
      console.log(
        "%c[Remediate] Feedback Submission",
        "background: #3B82F6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;",
        submission
      );
    }
    dispatch({ type: "SUBMIT_SUCCESS" });
  }, [state, onSubmit, endpoint, extraMetadata, onError, dispatch, consoleCaptureRef]);

  return { isSubmitting, handleSubmit };
}
