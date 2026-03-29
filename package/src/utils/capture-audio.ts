/**
 * Audio capture using getUserMedia + MediaRecorder.
 * Provides a controller for start/stop/cancel and optional waveform analysis.
 */

export interface AudioRecorder {
  /** Stop recording and return the audio blob */
  stop(): Promise<Blob>;
  /** Cancel recording without producing a blob */
  cancel(): void;
  /** Get current waveform frequency data (0-255 per bin). Returns null if no analyser. */
  getWaveformData(): Uint8Array<ArrayBuffer> | null;
}

/**
 * Start an audio recording using the browser's getUserMedia API.
 * Shows a native microphone permission prompt.
 * Returns an AudioRecorder to stop/cancel and read waveform data.
 */
export async function startAudioRecording(): Promise<AudioRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const chunks: Blob[] = [];
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: getSupportedAudioMimeType(),
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Set up AnalyserNode for waveform visualization
  let analyser: AnalyserNode | null = null;
  let dataArray: Uint8Array<ArrayBuffer> | null = null;
  try {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  } catch {
    // AnalyserNode not critical — waveform will be simulated
  }

  mediaRecorder.start(100);

  return {
    stop(): Promise<Blob> {
      return new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
          resolve(blob);
        };
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        } else {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
          resolve(blob);
        }
      });
    },
    cancel() {
      if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      stream.getTracks().forEach((t) => t.stop());
    },
    getWaveformData(): Uint8Array<ArrayBuffer> | null {
      if (!analyser || !dataArray) return null;
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
    },
  };
}

function getSupportedAudioMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "audio/webm";
}
