import { useState, useRef, useCallback } from "react";
import { startVideoRecording, type VideoRecorder } from "../utils/capture-video";
import type { SelectionArea } from "../types";

export interface VideoRecorderHandle {
  isReady: boolean;
  blob: Blob | null;
  setBlob: (blob: Blob | null) => void;
  start: (area: SelectionArea, onEnded: (blob: Blob) => void) => Promise<void>;
  stop: () => Promise<Blob | null>;
  cancel: () => void;
}

export function useVideoRecorder(): VideoRecorderHandle {
  const [isReady, setIsReady] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<VideoRecorder | null>(null);

  const start = useCallback(async (area: SelectionArea, onEnded: (blob: Blob) => void) => {
    const recorder = await startVideoRecording({
      area,
      onEnded: () => {
        const rec = recorderRef.current;
        if (!rec) return;
        setIsReady(false);
        rec.stop().then((b) => {
          recorderRef.current = null;
          setBlob(b);
          onEnded(b);
        });
      },
    });
    recorderRef.current = recorder;
    setIsReady(true);
  }, []);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder) return null;
    setIsReady(false);
    const b = await recorder.stop();
    recorderRef.current = null;
    setBlob(b);
    return b;
  }, []);

  const cancel = useCallback(() => {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setIsReady(false);
  }, []);

  return { isReady, blob, setBlob, start, stop, cancel };
}
