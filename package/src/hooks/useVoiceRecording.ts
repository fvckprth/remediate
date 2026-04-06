import { useEffect, useRef, useCallback } from "react";
import type { WidgetMode, WidgetAction, FeedbackItem, AnnotationPriority } from "../types";
import { startAudioRecording, type AudioRecorder } from "../utils/capture-audio";
import { nanoid } from "../utils/nanoid";

export function useVoiceRecording({
  mode,
  dispatch,
}: {
  mode: WidgetMode;
  dispatch: React.Dispatch<WidgetAction>;
}) {
  const voiceRecorderRef = useRef<AudioRecorder | null>(null);

  useEffect(() => {
    if (mode !== "voiceNote") return;
    let cancelled = false;
    startAudioRecording()
      .then((recorder) => {
        if (cancelled) {
          recorder.cancel();
          return;
        }
        voiceRecorderRef.current = recorder;
        dispatch({ type: "SET_MODE", mode: "voiceRecording" });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[Remediate] Microphone access denied:", err);
        dispatch({ type: "SET_MODE", mode: "noteMenu" });
      });
    return () => { cancelled = true; };
  }, [mode, dispatch]);

  const handleAddVoiceNote = useCallback((duration: number, blob: Blob, text: string, priority: AnnotationPriority) => {
    const item: FeedbackItem = {
      id: `voc_${nanoid(8)}`,
      index: 0,
      type: "voiceNote",
      duration,
      timestamp: Date.now(),
      additionalText: text,
      priority,
      blob,
    };
    dispatch({ type: "ADD_ITEM", item });
  }, [dispatch]);

  return { voiceRecorderRef, handleAddVoiceNote };
}
