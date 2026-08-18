import type { WidgetAction, AnnotationPriority } from "../types";
import { startAudioRecording, type AudioRecorder } from "../utils/capture-audio";
import { createItem } from "../utils/create-item";
import type { Ref } from "./useCapture.svelte";

export function createVoiceRecording({
  dispatch,
}: {
  dispatch: (action: WidgetAction) => void;
}) {
  const voiceRecorder: Ref<AudioRecorder | null> = { current: null };

  function startVoice() {
    startAudioRecording()
      .then((recorder) => {
        voiceRecorder.current = recorder;
        dispatch({ type: "SET_MODE", mode: "voiceRecording" });
      })
      .catch((err) => {
        console.warn("[Remediate] Microphone access denied:", err);
        dispatch({ type: "SET_MODE", mode: "noteMenu" });
      });
  }

  function handleAddVoiceNote(
    duration: number,
    blob: Blob,
    text: string,
    priority: AnnotationPriority,
  ) {
    dispatch({
      type: "ADD_ITEM",
      item: createItem("voiceNote", { duration, additionalText: text, priority, blob }),
    });
  }

  return { voiceRecorder, startVoice, handleAddVoiceNote };
}
