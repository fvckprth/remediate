import { useState, useEffect, useRef, useCallback } from "react";
import type { WidgetMode, AnnotationPriority } from "../../types";
import type { AudioRecorder } from "../../utils/capture-audio";
import { StopFill, PlayFill, PauseFill } from "../icons";
import { PriorityButton } from "../shared/PriorityButton";

interface VoicePanelProps {
  mode: WidgetMode;
  recorder: AudioRecorder | null;
  initialText?: string;
  initialPriority?: AnnotationPriority;
  submitLabel?: string;
  onSetMode: (mode: WidgetMode) => void;
  onAdd: (duration: number, blob: Blob, text: string, priority: AnnotationPriority) => void;
  onCancel: () => void;
}

const BAR_COUNT = 22;

function generateBars(active: boolean, seed: number): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    if (!active) return 4;
    const base = Math.sin((i + seed) * 0.7) * 0.5 + 0.5;
    const noise = Math.sin((i * 3.7 + seed * 2.3)) * 0.3;
    return Math.max(4, Math.min(28, (base + noise) * 28));
  });
}

function waveformFromAnalyser(data: Uint8Array<ArrayBuffer> | null): number[] {
  if (!data) return generateBars(true, 0);
  const step = Math.floor(data.length / BAR_COUNT) || 1;
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const val = data[Math.min(i * step, data.length - 1)] / 255;
    return Math.max(4, val * 28);
  });
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Waveform({ bars, isAnimating }: { bars: number[]; isAnimating: boolean }) {
  return (
    <div className="rm-voice__waveform">
      {bars.map((height, i) => (
        <div
          key={i}
          className="rm-voice__bar"
          style={{
            height,
            transition: isAnimating ? "height 80ms ease" : "none",
          }}
        />
      ))}
    </div>
  );
}

export function VoicePanel({ mode, recorder, initialText, initialPriority, submitLabel = "Add", onSetMode, onAdd, onCancel }: VoicePanelProps) {
  const isRecording = mode === "voiceRecording";
  const isPreview = mode === "voicePreview";

  const [time, setTime] = useState(0);
  const [bars, setBars] = useState<number[]>(() => generateBars(false, 0));
  const [isPlaying, setIsPlaying] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);
  const [previewBars, setPreviewBars] = useState<number[]>([]);
  const [text, setText] = useState(initialText ?? "");
  const [priority, setPriority] = useState<AnnotationPriority>(initialPriority ?? "none");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seedRef = useRef(0);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Accept recorder from parent (started in Remediate.tsx during voiceNote)
  useEffect(() => {
    if (recorder) recorderRef.current = recorder;
  }, [recorder]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      setTime(0);
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
      animRef.current = setInterval(() => {
        seedRef.current += 1;
        const recorder = recorderRef.current;
        if (recorder) {
          const data = recorder.getWaveformData();
          setBars(data ? waveformFromAnalyser(data) : generateBars(true, seedRef.current));
        } else {
          setBars(generateBars(true, seedRef.current));
        }
      }, 80);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
      if (!isRecording) setBars(generateBars(false, 0));
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [isRecording]);

  const handleStopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setBars((current) => { setPreviewBars([...current]); return current; });
    const blob = await recorder.stop();
    audioBlobRef.current = blob;
    recorderRef.current = null;
    setFinalDuration(time);
    onSetMode("voicePreview");
  }, [time, onSetMode]);

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

  useEffect(() => {
    if (isPlaying && isPreview) {
      animRef.current = setInterval(() => {
        seedRef.current += 1;
        setPreviewBars(generateBars(true, seedRef.current));
      }, 80);
      return () => {
        if (animRef.current) clearInterval(animRef.current);
      };
    }
  }, [isPlaying, isPreview]);

  const handleCancel = useCallback(() => {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    audioBlobRef.current = null;
    onCancel();
  }, [onCancel]);

  return (
    <div className="rm-voice" data-remediate-widget="">
      {/* Recording State */}
      <div className={`rm-voice__state rm-voice__state--recording ${isRecording ? "rm-voice__state--active" : "rm-voice__state--inactive"}`}>
        <div className="rm-voice__top-row">
          <Waveform bars={bars} isAnimating={isRecording} />
          <span className="rm-voice__timer">{formatTime(time)}</span>
          <button
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
            className="rm-voice__play"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause playback" : "Play recording"}
            tabIndex={isPreview ? 0 : -1}
          >
            {isPlaying ? <PauseFill size={16} /> : <PlayFill size={16} />}
          </button>
          <Waveform 
            bars={previewBars.length > 0 ? previewBars : generateBars(true, 42)} 
            isAnimating={isPlaying} 
          />
        </div>

        <div className="rm-input-group" style={{ marginTop: 10 }}>
          <textarea
            className="rm-input-group__textarea"
            placeholder="Add a note…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            tabIndex={isPreview ? 0 : -1}
          />
          <div className="rm-input-group__footer">
            <PriorityButton priority={priority} onCycle={setPriority} />
          </div>
        </div>

        <div className="rm-voice__bottom-row">
          <div className="rm-voice__actions">
            <button className="rm-voice__cancel" onClick={handleCancel} tabIndex={isPreview ? 0 : -1}>
              Cancel
            </button>
            <button
              className="rm-voice__add"
              tabIndex={isPreview ? 0 : -1}
              onClick={() => {
                if (audioBlobRef.current) {
                  onAdd(finalDuration, audioBlobRef.current, text.trim(), priority);
                } else {
                  // Save mode — blob lives on the existing item, parent only needs text/priority
                  onAdd(finalDuration, new Blob(), text.trim(), priority);
                }
              }}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
