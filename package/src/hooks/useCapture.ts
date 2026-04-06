import { useState, useRef, useCallback } from "react";
import type { WidgetMode, WidgetAction, FeedbackItem, AnnotationPriority, PendingCapture, SelectionArea } from "../types";
import { captureScreenshot } from "../utils/capture-screenshot";
import { startVideoRecording, type VideoRecorder } from "../utils/capture-video";
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
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRecorderRef = useRef<VideoRecorder | null>(null);
  const pendingAreaRef = useRef<SelectionArea | null>(null);

  const cancelVideoRecording = useCallback(() => {
    videoRecorderRef.current?.cancel();
    videoRecorderRef.current = null;
    pendingAreaRef.current = null;
    setIsVideoReady(false);
    dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
    dispatch({ type: "SET_MODE", mode: "active" });
  }, [dispatch]);

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
        const recorder = await startVideoRecording({
          area,
          onEnded: () => {
            const rec = videoRecorderRef.current;
            if (!rec) return;
            setIsVideoReady(false);
            rec.stop().then((blob) => {
              videoRecorderRef.current = null;
              setVideoBlob(blob);
              const saved = pendingAreaRef.current;
              if (saved) {
                dispatch({ type: "SET_PENDING_CAPTURE", capture: { area: saved, variant: "video" } });
              }
              dispatch({ type: "SET_MODE", mode: "capturePreview" });
            });
          },
        });
        videoRecorderRef.current = recorder;
        setIsVideoReady(true);
      } catch (err) {
        console.warn("[Remediate] Video recording failed:", err);
        cancelVideoRecording();
      }
    }
  }, [mode, dispatch, cancelVideoRecording]);

  const handleStopVideoRecording = useCallback(async (duration: number) => {
    const recorder = videoRecorderRef.current;
    if (!recorder) return;

    setIsVideoReady(false);
    const blob = await recorder.stop();
    videoRecorderRef.current = null;
    setVideoBlob(blob);

    const area = pendingAreaRef.current;
    if (area) {
      dispatch({ type: "SET_PENDING_CAPTURE", capture: {
        area,
        variant: "video",
        recordingDuration: duration,
      }});
    }
    dispatch({ type: "SET_MODE", mode: "capturePreview" });
  }, [dispatch]);

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
          blob: videoBlob ?? undefined,
        };
    dispatch({ type: "ADD_ITEM", item });
    setScreenshotBlob(null);
    setVideoBlob(null);
  }, [pendingCapture, screenshotBlob, videoBlob, dispatch]);

  return {
    screenshotBlob,
    setScreenshotBlob,
    videoBlob,
    setVideoBlob,
    isVideoReady,
    cancelVideoRecording,
    handleAreaSelected,
    handleStopVideoRecording,
    handleAddCapture,
  };
}
