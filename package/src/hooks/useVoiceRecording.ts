import { useRef, useCallback } from "react";
import type { WidgetAction, FeedbackItem, AnnotationPriority } from "../types";
import { startAudioRecording, type AudioRecorder } from "../utils/capture-audio";
import { nanoid } from "../utils/nanoid";

export function useVoiceRecording({
  dispatch,
}: {
  dispatch: React.Dispatch<WidgetAction>;
}) {
  const voiceRecorderRef = useRef<AudioRecorder | null>(null);

  /** Explicitly start voice recording. Requests mic permission and transitions mode. */
  const startVoice = useCallback(() => {
    startAudioRecording()
      .then((recorder) => {
        voiceRecorderRef.current = recorder;
        dispatch({ type: "SET_MODE", mode: "voiceRecording" });
      })
      .catch((err) => {
        console.warn("[Remediate] Microphone access denied:", err);
        dispatch({ type: "SET_MODE", mode: "noteMenu" });
      });
  }, [dispatch]);

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

  return { voiceRecorderRef, startVoice, handleAddVoiceNote };
}
