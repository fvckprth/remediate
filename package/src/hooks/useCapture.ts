import { useState, useRef, useCallback } from "react";
import type { WidgetMode, WidgetAction, FeedbackItem, AnnotationPriority, PendingCapture, SelectionArea } from "../types";
import { captureScreenshot } from "../utils/capture-screenshot";
import { useVideoRecorder } from "./useVideoRecorder";
import { nanoid } from "../utils/nanoid";

export function useCapture({
  mode,
  pendingCapture,
  dispatch,
}: {
  mode: WidgetMode;
  pendingCapture: PendingCapture | null;
  dispatch: React.Dispatch<WidgetAction>;
}) {
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const pendingAreaRef = useRef<SelectionArea | null>(null);
  const video = useVideoRecorder();

  const cancelVideoRecording = useCallback(() => {
    video.cancel();
    pendingAreaRef.current = null;
    dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
    dispatch({ type: "SET_MODE", mode: "active" });
  }, [dispatch, video]);

  const handleAreaSelected = useCallback(async (area: { x: number; y: number; width: number; height: number }) => {
    const isPhoto = mode === "capturePhoto" || mode === "captureDragging";

    if (isPhoto) {
      const blob = await captureScreenshot(area);
      setScreenshotBlob(blob);
      const capture: PendingCapture = { area, variant: "photo" };
      dispatch({ type: "SET_PENDING_CAPTURE", capture });
      dispatch({ type: "SET_MODE", mode: "capturePreview" });
    } else {
      const capture: PendingCapture = { area, variant: "video" };
      pendingAreaRef.current = area;
      dispatch({ type: "SET_PENDING_CAPTURE", capture });
      dispatch({ type: "SET_MODE", mode: "videoRecording" });

      try {
        await video.start(area, () => {
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
    }
  }, [mode, dispatch, cancelVideoRecording, video]);

  const handleStopVideoRecording = useCallback(async (duration: number) => {
    const blob = await video.stop();
    if (!blob) return;

    const area = pendingAreaRef.current;
    if (area) {
      dispatch({ type: "SET_PENDING_CAPTURE", capture: {
        area,
        variant: "video",
        recordingDuration: duration,
      }});
    }
    dispatch({ type: "SET_MODE", mode: "capturePreview" });
  }, [dispatch, video]);

  const handleAddCapture = useCallback((additionalText: string, priority: AnnotationPriority) => {
    if (!pendingCapture) return;
    const item: FeedbackItem = pendingCapture.variant === "photo"
      ? {
          id: `cap_${nanoid(8)}`,
          index: 0,
          type: "photo",
          area: pendingCapture.area,
          timestamp: Date.now(),
          additionalText,
          priority,
          blob: screenshotBlob ?? undefined,
        }
      : {
          id: `cap_${nanoid(8)}`,
          index: 0,
          type: "video",
          area: pendingCapture.area,
          duration: pendingCapture.recordingDuration ?? 0,
          timestamp: Date.now(),
          additionalText,
          priority,
          blob: video.blob ?? undefined,
        };
    dispatch({ type: "ADD_ITEM", item });
    setScreenshotBlob(null);
    video.setBlob(null);
  }, [pendingCapture, screenshotBlob, video, dispatch]);

  return {
    screenshotBlob,
    setScreenshotBlob,
    videoBlob: video.blob,
    setVideoBlob: video.setBlob,
    isVideoReady: video.isReady,
    cancelVideoRecording,
    handleAreaSelected,
    handleStopVideoRecording,
    handleAddCapture,
  };
}
