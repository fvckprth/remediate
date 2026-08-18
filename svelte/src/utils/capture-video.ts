/**
 * Screen recording via getDisplayMedia + canvas crop + MediaRecorder.
 * Captures the current browser tab at native framerate, crops to the
 * user-selected area in real time, and produces a WebM blob.
 */

import type { SelectionArea } from "../types";

export interface VideoRecorder {
  stop(): Promise<Blob>;
  cancel(): void;
  canvas: HTMLCanvasElement;
}

interface RecordingOptions {
  area: SelectionArea;
  onEnded?: () => void;
}

const CANVAS_FPS = 30;

export async function startVideoRecording({
  area,
  onEnded,
}: RecordingOptions): Promise<VideoRecorder> {
  // Acquire tab capture stream — triggers one-time browser permission prompt
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "browser" } as MediaTrackConstraints,
    audio: true,
    // @ts-expect-error -- preferCurrentTab is Chrome 109+, not yet in all TS lib types
    preferCurrentTab: true,
  });

  const videoTrack = displayStream.getVideoTracks()[0];

  // Hidden video element receives the raw tab stream
  const video = document.createElement("video");
  video.srcObject = displayStream;
  video.muted = true;
  video.playsInline = true;
  await video.play();

  // Wait one frame for videoWidth/videoHeight to populate
  await new Promise((r) => requestAnimationFrame(r));

  const scaleX = video.videoWidth / window.innerWidth;
  const scaleY = video.videoHeight / window.innerHeight;

  // Canvas sized to the crop area — this is what gets recorded
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * scaleX);
  canvas.height = Math.round(area.height * scaleY);
  const ctx = canvas.getContext("2d")!;

  // Draw loop: crop the tab capture to the selected rectangle
  let stopped = false;
  let frameId = 0;

  function drawFrame() {
    if (stopped) return;
    ctx.drawImage(
      video,
      Math.round(area.x * scaleX),
      Math.round(area.y * scaleY),
      Math.round(area.width * scaleX),
      Math.round(area.height * scaleY),
      0,
      0,
      canvas.width,
      canvas.height,
    );
    frameId = requestAnimationFrame(drawFrame);
  }
  drawFrame();

  // Record the cropped canvas stream + tab audio (if available)
  const croppedStream = canvas.captureStream(CANVAS_FPS);
  const combinedStream = new MediaStream([
    ...croppedStream.getVideoTracks(),
    ...displayStream.getAudioTracks(),
  ]);
  const chunks: Blob[] = [];
  const mimeType = getSupportedMimeType();
  // Codec params (e.g. ";codecs=vp9,opus") embed a comma — some storage
  // backends reject Content-Type with commas (Convex returns 400 BadHeader).
  // Drop the parameters from the blob's type so consumers get a header-safe
  // value; codec info is still encoded inside the WebM container.
  const blobType = mimeType.split(";")[0];
  const recorder = new MediaRecorder(combinedStream, { mimeType });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start(100);

  // If the user clicks the browser's "Stop sharing" badge, treat as stop
  videoTrack.addEventListener("ended", () => {
    if (!stopped) onEnded?.();
  });

  function teardown() {
    stopped = true;
    cancelAnimationFrame(frameId);
    displayStream.getTracks().forEach((t) => t.stop());
    croppedStream.getTracks().forEach((t) => t.stop());
    combinedStream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
    video.remove();
  }

  return {
    canvas,

    stop(): Promise<Blob> {
      return new Promise((resolve) => {
        if (stopped) {
          resolve(new Blob(chunks, { type: blobType }));
          return;
        }

        recorder.onstop = () => {
          teardown();
          resolve(new Blob(chunks, { type: blobType }));
        };

        if (recorder.state !== "inactive") {
          recorder.stop();
        } else {
          teardown();
          resolve(new Blob(chunks, { type: blobType }));
        }
      });
    },

    cancel() {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      teardown();
    },
  };
}

function getSupportedMimeType(): string {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "video/webm";
}

/** Check if this browser supports video recording (MediaRecorder + a usable codec). */
export function isVideoRecordingSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  if (!navigator.mediaDevices?.getDisplayMedia) return false;
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  return types.some((t) => MediaRecorder.isTypeSupported(t));
}
