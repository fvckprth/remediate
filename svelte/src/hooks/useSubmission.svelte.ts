import type { WidgetAction, FeedbackSubmission, FeedbackItem } from "../types";
import type { ConsoleCapture } from "../utils/console-capture";
import { collectEnvironment } from "../utils/metadata";
import { nanoid } from "../utils/nanoid";
import { serializeToFormData } from "../utils/serialize";
import type { Ref } from "./useCapture.svelte";

export function createSubmission({
  getItems,
  dispatch,
  onSubmit,
  endpoint,
  extraMetadata,
  headers,
  onError,
  consoleCaptureRef,
  debug,
}: {
  getItems: () => FeedbackItem[];
  dispatch: (action: WidgetAction) => void;
  onSubmit?: (payload: FeedbackSubmission) => void | Promise<void>;
  endpoint?: string;
  extraMetadata?: Record<string, unknown>;
  headers?: Record<string, string> | (() => Record<string, string>);
  onError?: (error: Error) => void;
  consoleCaptureRef: Ref<ConsoleCapture | null>;
  debug?: boolean;
}) {
  let isSubmitting = $state(false);

  async function handleSubmit() {
    const metadata: Record<string, unknown> = { ...extraMetadata };
    if (consoleCaptureRef?.current) {
      metadata.consoleLog = [...consoleCaptureRef.current.entries];
    }

    const submission: FeedbackSubmission = {
      id: `fb_${nanoid(12)}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      environment: collectEnvironment(),
      items: getItems(),
      metadata,
    };

    if (debug) {
      console.log("[Remediate] submitting", {
        endpoint,
        items: submission.items.length,
        metadata: submission.metadata,
      });
    }

    if (endpoint) {
      isSubmitting = true;
      try {
        const formData = serializeToFormData(submission);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        const extraHeaders = typeof headers === "function" ? headers() : headers;
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: extraHeaders,
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
        isSubmitting = false;
      }
      return;
    }

    if (onSubmit) {
      isSubmitting = true;
      try {
        await onSubmit(submission);
        dispatch({ type: "SUBMIT_SUCCESS" });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (onError) onError(error);
        else console.error("[Remediate] Submission failed:", error);
        dispatch({ type: "SUBMIT_ERROR" });
      } finally {
        isSubmitting = false;
      }
      return;
    }

    console.log(
      "%c[Remediate] Feedback Submission",
      "background: #3B82F6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;",
      submission,
    );
    console.warn(
      "[Remediate] No endpoint or onSubmit configured — feedback was logged to console only.",
    );
    dispatch({ type: "SUBMIT_SUCCESS" });
  }

  return {
    get isSubmitting() { return isSubmitting; },
    handleSubmit,
  };
}
