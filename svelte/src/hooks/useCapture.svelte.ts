import type {
  WidgetMode, WidgetAction, FeedbackItem, AnnotationPriority, PendingCapture, SelectionArea,
} from "../types";
import { captureScreenshot } from "../utils/capture-screenshot";
import { createVideoRecorder } from "./useVideoRecorder.svelte";
import { createItem } from "../utils/create-item";

export interface Ref<T> { current: T; }

export function createCapture({
  getMode,
  getPendingCapture,
  dispatch,
}: {
  getMode: () => WidgetMode;
  getPendingCapture: () => PendingCapture | null;
  dispatch: (action: WidgetAction) => void;
}) {
  const screenshotBlob: Ref<Blob | null> = { current: null };
  const videoBlob: Ref<Blob | null> = { current: null };
  let pendingArea: SelectionArea | null = null;
  const video = createVideoRecorder();

  function cancelVideoRecording() {
    video.cancel();
    pendingArea = null;
    dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
    dispatch({ type: "SET_MODE", mode: "active" });
  }

  async function handleAreaSelected(area: SelectionArea) {
    const mode = getMode();
    const isPhoto = mode === "capturePhoto" || mode === "captureDragging";

    if (isPhoto) {
      const blob = await captureScreenshot(area);
      screenshotBlob.current = blob;
      const capture: PendingCapture = { area, variant: "photo" };
      dispatch({ type: "SET_PENDING_CAPTURE", capture });
      dispatch({ type: "SET_MODE", mode: "capturePreview" });
    } else {
      const capture: PendingCapture = { area, variant: "video" };
      pendingArea = area;
      dispatch({ type: "SET_PENDING_CAPTURE", capture });
      dispatch({ type: "SET_MODE", mode: "videoRecording" });

      try {
        await video.start(area, (blob) => {
          videoBlob.current = blob;
          const saved = pendingArea;
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
  }

  async function handleStopVideoRecording(duration: number) {
    const blob = await video.stop();
    if (!blob) return;
    videoBlob.current = blob;

    const area = pendingArea;
    if (area) {
      dispatch({
        type: "SET_PENDING_CAPTURE",
        capture: { area, variant: "video", recordingDuration: duration },
      });
    }
    dispatch({ type: "SET_MODE", mode: "capturePreview" });
  }

  function handleAddCapture(additionalText: string, priority: AnnotationPriority) {
    const pendingCapture = getPendingCapture();
    if (!pendingCapture) return;
    const item: FeedbackItem =
      pendingCapture.variant === "photo"
        ? createItem("photo", {
            area: pendingCapture.area,
            additionalText,
            priority,
            blob: screenshotBlob.current ?? undefined,
          })
        : createItem("video", {
            area: pendingCapture.area,
            duration: pendingCapture.recordingDuration ?? 0,
            additionalText,
            priority,
            blob: videoBlob.current ?? undefined,
          });
    dispatch({ type: "ADD_ITEM", item });
    screenshotBlob.current = null;
    videoBlob.current = null;
  }

  /** Set the appropriate blob ref for previewing an existing item from review. */
  function preparePreview(item: FeedbackItem) {
    if (item.type === "photo") screenshotBlob.current = item.blob ?? null;
    if (item.type === "video") videoBlob.current = item.blob ?? null;
  }

  /** Clear all blob refs (used when cancelling a capture). */
  function clearBlobs() {
    screenshotBlob.current = null;
    videoBlob.current = null;
  }

  return {
    screenshotBlob,
    videoBlob,
    get isVideoReady() { return video.isReady; },
    cancelVideoRecording,
    handleAreaSelected,
    handleStopVideoRecording,
    handleAddCapture,
    preparePreview,
    clearBlobs,
  };
}

export type Capture = ReturnType<typeof createCapture>;
