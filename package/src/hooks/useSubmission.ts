import { useState, useRef, useEffect, useCallback } from "react";
import type { WidgetState, WidgetAction, FeedbackSubmission } from "../types";
import { collectEnvironment } from "../utils/metadata";
import { startConsoleCapture, type ConsoleCapture } from "../utils/console-capture";
import { serializeToFormData } from "../utils/serialize";
import { nanoid } from "../utils/nanoid";

const STORAGE_KEY_NAME = "rm_reporter_name";
const STORAGE_KEY_EMAIL = "rm_reporter_email";
const HOSTED_API_URL = "https://api.remediate.dev/v1/feedback";

function buildPayload(
  state: WidgetState,
  extraMetadata?: Record<string, unknown>,
  consoleCaptureRef?: React.RefObject<ConsoleCapture | null>,
) {
  const metadata: Record<string, unknown> = { ...extraMetadata };

  if (typeof window !== "undefined") {
    const name = localStorage.getItem(STORAGE_KEY_NAME)?.trim();
    const email = localStorage.getItem(STORAGE_KEY_EMAIL)?.trim();
    if (name || email) {
      metadata.reporter = { name: name || "", email: email || "" };
    }
  }

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
  projectKey,
  apiUrl,
  extraMetadata,
  onError,
}: {
  state: WidgetState;
  dispatch: React.Dispatch<WidgetAction>;
  onSubmit?: (payload: FeedbackSubmission) => void | Promise<void>;
  endpoint?: string;
  projectKey?: string;
  apiUrl?: string;
  extraMetadata?: Record<string, unknown>;
  onError?: (error: Error) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const consoleCaptureRef = useRef<ConsoleCapture | null>(null);

  // Console capture (always on when widget is active)
  useEffect(() => {
    if (state.mode !== "idle") {
      if (!consoleCaptureRef.current) {
        consoleCaptureRef.current = startConsoleCapture();
      }
    }
    return () => {
      if (state.mode === "idle" && consoleCaptureRef.current) {
        consoleCaptureRef.current.stop();
        consoleCaptureRef.current = null;
      }
    };
  }, [state.mode]);

  // Auto-reset after success/error
  useEffect(() => {
    if (state.mode === "success") {
      if (state.clearAfterSend) {
        const timer = setTimeout(() => dispatch({ type: "RESET" }), 2000);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "active" }), 2000);
      return () => clearTimeout(timer);
    }
    if (state.mode === "submitError") {
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "reviewing" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.mode, state.clearAfterSend, dispatch]);

  const handleSubmit = useCallback(async () => {
    const submission = buildPayload(state, extraMetadata, consoleCaptureRef);

    const targetUrl = projectKey
      ? (apiUrl ? `${apiUrl.replace(/\/$/, "")}/api/v1/feedback` : HOSTED_API_URL)
      : endpoint;

    if (targetUrl) {
      setIsSubmitting(true);
      try {
        const formData = serializeToFormData(submission);
        const headers: Record<string, string> = {};
        if (projectKey) {
          headers["Authorization"] = `Bearer ${projectKey}`;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        const res = await fetch(targetUrl, {
          method: "POST",
          body: formData,
          headers,
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
  }, [state, onSubmit, endpoint, extraMetadata, onError, projectKey, apiUrl, dispatch]);

  const handleCopy = useCallback(async () => {
    const payload = buildPayload(state, extraMetadata);
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedFlash(true);
      setTimeout(() => setCopiedFlash(false), 1500);
    } catch {
      console.warn("[Remediate] Clipboard write failed");
    }
  }, [state, extraMetadata]);

  return { isSubmitting, copiedFlash, handleSubmit, handleCopy };
}
