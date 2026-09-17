import { useState, useEffect, useRef, useCallback } from "react";
import type { WidgetMode, AnnotationPriority, VoiceNoteItem } from "../../types";
import type { AudioRecorder } from "../../utils/capture-audio";
import { StopFill, PlayFill, PauseFill } from "../icons";
import { NoteComposer } from "../shared/NoteComposer";
import { PanelActions } from "../shared/PanelActions";
import { useNoteDraft } from "../../hooks/useNoteDraft";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatClock } from "../../utils/time";
import { prefersReducedMotion } from "../../utils/reduced-motion";

interface VoicePanelProps {
  mode: WidgetMode;
  recorder: AudioRecorder | null;
  onSetMode: (mode: WidgetMode) => void;
  onAdd: (duration: number, blob: Blob, text: string, priority: AnnotationPriority) => void;
  onCancel: () => void;
}

const BAR_COUNT = 22;
const BAR_MAX = 28;
const BAR_MIN = 4;
const TICK_MS = 80;

function generateBars(active: boolean, seed: number): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    if (!active) return BAR_MIN;
    const base = Math.sin((i + seed) * 0.7) * 0.5 + 0.5;
    const noise = Math.sin(i * 3.7 + seed * 2.3) * 0.3;
    return Math.max(BAR_MIN, Math.min(BAR_MAX, (base + noise) * BAR_MAX));
  });
}

function waveformFromAnalyser(data: Uint8Array<ArrayBuffer>): number[] {
  const step = Math.floor(data.length / BAR_COUNT) || 1;
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const val = data[Math.min(i * step, data.length - 1)] / 255;
    return Math.max(BAR_MIN, val * BAR_MAX);
  });
}

/** Bars are a fixed height and scaled on the compositor, so the waveform never triggers layout. */
function Waveform({ bars, isAnimating }: { bars: number[]; isAnimating: boolean }) {
  return (
    <div className="rm-voice__waveform" aria-hidden="true">
      {bars.map((height, i) => (
        <div
          key={i}
          className="rm-voice__bar"
          style={{
            transform: `scaleY(${height / BAR_MAX})`,
            transition: isAnimating ? `transform ${TICK_MS}ms ease` : "none",
          }}
        />
      ))}
    </div>
  );
}

/** Drives decorative bar motion at TICK_MS while `active`; static under reduced motion. */
function useWaveform(active: boolean, source: () => number[]) {
  const [bars, setBars] = useState<number[]>(() => generateBars(false, 0));
  const sourceRef = useRef(source);
  sourceRef.current = source;

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setBars(generateBars(true, 42));
      return;
    }
    const id = setInterval(() => setBars(sourceRef.current()), TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  return [bars, setBars] as const;
}

export function VoicePanel({ mode, recorder, onSetMode, onAdd, onCancel }: VoicePanelProps) {
  const draft = useNoteDraft<VoiceNoteItem>("voiceNote", (item) => item.additionalText);
  const isRecording = mode === "voiceRecording";
  const isPreview = mode === "voicePreview";

  const time = useElapsedSeconds(isRecording);
  const [isPlaying, setIsPlaying] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);
  const seedRef = useRef(0);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const [bars, setBars] = useWaveform(isRecording, () => {
    seedRef.current += 1;
    const data = recorderRef.current?.getWaveformData();
    return data ? waveformFromAnalyser(data) : generateBars(true, seedRef.current);
  });
  const [previewBars, setPreviewBars] = useWaveform(isPlaying && isPreview, () => {
    seedRef.current += 1;
    return generateBars(true, seedRef.current);
  });

  // Accept recorder from parent (started in Remediate.tsx during voiceNote)
  useEffect(() => {
    if (recorder) recorderRef.current = recorder;
  }, [recorder]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const handleStopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setPreviewBars(bars);
    const blob = await recorder.stop();
    audioBlobRef.current = blob;
    recorderRef.current = null;
    setFinalDuration(time);
    setBars(generateBars(false, 0));
    onSetMode("voicePreview");
  }, [bars, time, onSetMode, setBars, setPreviewBars]);

  const togglePlayback = useCallback(() => {
    if (!audioBlobRef.current) return;

    if (isPlaying) {
      audioElRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(audioBlobRef.current);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioElRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleCancel = useCallback(() => {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    audioBlobRef.current = null;
    onCancel();
  }, [onCancel]);

  const handleAdd = useCallback(() => {
    // In edit mode the blob lives on the existing item; the parent only needs text/priority.
    onAdd(finalDuration, audioBlobRef.current ?? new Blob(), draft.text.trim(), draft.priority);
  }, [finalDuration, draft.text, draft.priority, onAdd]);

  const previewTabIndex = isPreview ? 0 : -1;

  return (
    <div className="rm-voice" data-remediate-widget="">
      {/* Recording State */}
      <div className={`rm-voice__state rm-voice__state--recording ${isRecording ? "rm-voice__state--active" : "rm-voice__state--inactive"}`}>
        <div className="rm-voice__top-row">
          <Waveform bars={bars} isAnimating={isRecording} />
          <span className="rm-voice__timer" aria-live="off">{formatClock(time)}</span>
          <button
            type="button"
            className="rm-voice__stop"
            onClick={handleStopRecording}
            aria-label="Stop recording"
            tabIndex={isRecording ? 0 : -1}
          >
            <StopFill size={20} />
          </button>
        </div>
      </div>

      {/* Preview State */}
      <div className={`rm-voice__state rm-voice__state--preview ${isPreview ? "rm-voice__state--active" : "rm-voice__state--inactive"}`}>
        <div className="rm-voice__top-row">
          <button
            type="button"
            className="rm-voice__play"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause playback" : "Play recording"}
            tabIndex={previewTabIndex}
          >
            {isPlaying ? <PauseFill size={16} /> : <PlayFill size={16} />}
          </button>
          <Waveform bars={previewBars} isAnimating={isPlaying} />
        </div>

        <NoteComposer
          value={draft.text}
          onChange={draft.setText}
          priority={draft.priority}
          onPriorityChange={draft.setPriority}
          placeholder="Add a note…"
          rows={2}
          tabIndex={previewTabIndex}
          style={{ marginTop: 10 }}
        />

        <div className="rm-voice__bottom-row">
          <PanelActions onCancel={handleCancel} onSubmit={handleAdd} submitLabel={draft.submitLabel} tabIndex={previewTabIndex} />
        </div>
      </div>
    </div>
  );
}
