import { useRef, useCallback } from "react";
import type { WidgetMode, WidgetAction, FeedbackItem, AnnotationPriority, PendingCapture, SelectionArea } from "../types";
import { captureScreenshot } from "../utils/capture-screenshot";
import { useVideoRecorder } from "./useVideoRecorder";
import { createItem } from "../utils/create-item";

export function useCapture({
  mode,
  pendingCapture,
  dispatch,
}: {
  mode: WidgetMode;
  pendingCapture: PendingCapture | null;
  dispatch: React.Dispatch<WidgetAction>;
}) {
  // Only one capture (photo or video) is ever pending, so one blob slot is enough.
  const pendingBlobRef = useRef<Blob | null>(null);
  const pendingAreaRef = useRef<SelectionArea | null>(null);
  const video = useVideoRecorder();

  const cancelVideoRecording = useCallback(() => {
    video.cancel();
    pendingAreaRef.current = null;
    dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
    dispatch({ type: "SET_MODE", mode: "active" });
  }, [dispatch, video]);

  const handleAreaSelected = useCallback(async (area: SelectionArea) => {
    const isPhoto = mode === "capturePhoto" || mode === "captureDragging";

    if (isPhoto) {
      pendingBlobRef.current = await captureScreenshot(area);
      dispatch({ type: "SET_PENDING_CAPTURE", capture: { area, variant: "photo" } });
      dispatch({ type: "SET_MODE", mode: "capturePreview" });
      return;
    }

    pendingAreaRef.current = area;
    dispatch({ type: "SET_PENDING_CAPTURE", capture: { area, variant: "video" } });
    dispatch({ type: "SET_MODE", mode: "videoRecording" });

    try {
      await video.start(area, (blob) => {
        pendingBlobRef.current = blob;
        const saved = pendingAreaRef.current;
        if (saved) {
          dispatch({ type: "SET_PENDING_CAPTURE", capture: { area: saved, variant: "video" } });
        }
        dispatch({ type: "SET_MODE", mode: "capturePreview" });
      });
    } catch (err) {
      console.warn("[Remediate] Video recording failed:", err);
      cancelVideoRecording();
    }
  }, [mode, dispatch, cancelVideoRecording, video]);

  const handleStopVideoRecording = useCallback(async (duration: number) => {
    const blob = await video.stop();
    if (!blob) return;
    pendingBlobRef.current = blob;

    const area = pendingAreaRef.current;
    if (area) {
      dispatch({ type: "SET_PENDING_CAPTURE", capture: { area, variant: "video", recordingDuration: duration } });
    }
    dispatch({ type: "SET_MODE", mode: "capturePreview" });
  }, [dispatch, video]);

  const handleAddCapture = useCallback((additionalText: string, priority: AnnotationPriority) => {
    if (!pendingCapture) return;
    const blob = pendingBlobRef.current ?? undefined;
    const item: FeedbackItem = pendingCapture.variant === "photo"
      ? createItem("photo", { area: pendingCapture.area, additionalText, priority, blob })
      : createItem("video", {
          area: pendingCapture.area,
          duration: pendingCapture.recordingDuration ?? 0,
          additionalText,
          priority,
          blob,
        });
    dispatch({ type: "ADD_ITEM", item });
    pendingBlobRef.current = null;
  }, [pendingCapture, dispatch]);

  /** Load an existing item's blob for previewing from review. */
  const preparePreview = useCallback((item: FeedbackItem) => {
    if (item.type === "photo" || item.type === "video") pendingBlobRef.current = item.blob ?? null;
  }, []);

  const clearBlob = useCallback(() => {
    pendingBlobRef.current = null;
  }, []);

  return {
    pendingBlobRef,
    isVideoReady: video.isReady,
    cancelVideoRecording,
    handleAreaSelected,
    handleStopVideoRecording,
    handleAddCapture,
    preparePreview,
    clearBlob,
  };
}
