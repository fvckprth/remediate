import { startVideoRecording, type VideoRecorder } from "../utils/capture-video";
import type { SelectionArea } from "../types";

export interface VideoRecorderHandle {
  readonly isReady: boolean;
  start: (area: SelectionArea, onEnded: (blob: Blob) => void) => Promise<void>;
  stop: () => Promise<Blob | null>;
  cancel: () => void;
}

export function createVideoRecorder(): VideoRecorderHandle {
  let isReady = $state(false);
  let recorder: VideoRecorder | null = null;

  async function start(area: SelectionArea, onEnded: (blob: Blob) => void) {
    const rec = await startVideoRecording({
      area,
      onEnded: () => {
        const r = recorder;
        if (!r) return;
        isReady = false;
        r.stop().then((b) => {
          recorder = null;
          onEnded(b);
        });
      },
    });
    recorder = rec;
    isReady = true;
  }

  async function stop(): Promise<Blob | null> {
    if (!recorder) return null;
    isReady = false;
    const b = await recorder.stop();
    recorder = null;
    return b;
  }

  function cancel() {
    recorder?.cancel();
    recorder = null;
    isReady = false;
  }

  return {
    get isReady() { return isReady; },
    start,
    stop,
    cancel,
  };
}
