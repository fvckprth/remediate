import { useRef, useCallback } from "react";
import type { WidgetAction, AnnotationPriority } from "../types";
import { startAudioRecording, type AudioRecorder } from "../utils/capture-audio";
import { createItem } from "../utils/create-item";

export function useVoiceRecording({
  dispatch,
}: {
  dispatch: React.Dispatch<WidgetAction>;
}) {
  const voiceRecorderRef = useRef<AudioRecorder | null>(null);

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
    dispatch({ type: "ADD_ITEM", item: createItem("voiceNote", { duration, additionalText: text, priority, blob }) });
  }, [dispatch]);

  return { voiceRecorderRef, startVoice, handleAddVoiceNote };
}
