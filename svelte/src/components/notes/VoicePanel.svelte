<script lang="ts" module>
  const BAR_COUNT = 22;

  function generateBars(active: boolean, seed: number): number[] {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      if (!active) return 4;
      const base = Math.sin((i + seed) * 0.7) * 0.5 + 0.5;
      const noise = Math.sin(i * 3.7 + seed * 2.3) * 0.3;
      return Math.max(4, Math.min(28, (base + noise) * 28));
    });
  }

  function waveformFromAnalyser(data: Uint8Array | null): number[] {
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
</script>

<script lang="ts">
  import type { WidgetMode, AnnotationPriority, VoiceNoteItem } from "../../types";
  import type { AudioRecorder } from "../../utils/capture-audio";
  import Icon from "../Icon.svelte";
  import { icons } from "../icons";
  import PriorityButton from "../shared/PriorityButton.svelte";
  import { getWidgetStore } from "../../state/widget-store.svelte";

  interface Props {
    mode: WidgetMode;
    recorder: AudioRecorder | null;
    onSetMode: (mode: WidgetMode) => void;
    onAdd: (duration: number, blob: Blob, text: string, priority: AnnotationPriority) => void;
    onCancel: () => void;
  }
  let { mode, recorder, onSetMode, onAdd, onCancel }: Props = $props();

  const store = getWidgetStore();
  const preview = store.preview<VoiceNoteItem>("voiceNote");
  const submitLabel = store.state.previewingItemId ? "Save" : "Add";

  const isRecording = $derived(mode === "voiceRecording");
  const isPreview = $derived(mode === "voicePreview");

  let time = $state(0);
  let bars = $state<number[]>(generateBars(false, 0));
  let isPlaying = $state(false);
  let finalDuration = $state(0);
  let previewBars = $state<number[]>([]);
  let text = $state(preview?.additionalText ?? "");
  let priority = $state<AnnotationPriority>(preview?.priority ?? "none");

  let timer: ReturnType<typeof setInterval> | null = null;
  let anim: ReturnType<typeof setInterval> | null = null;
  let seed = 0;
  let recorderRef: AudioRecorder | null = null;
  let audioBlobRef: Blob | null = null;
  let audioUrlRef: string | null = null;
  let audioElRef: HTMLAudioElement | null = null;

  // Accept recorder from parent (started in Remediate during voiceNote).
  $effect(() => {
    if (recorder) recorderRef = recorder;
  });

  $effect(() => {
    return () => {
      if (audioUrlRef) URL.revokeObjectURL(audioUrlRef);
    };
  });

  $effect(() => {
    if (isRecording) {
      time = 0;
      timer = setInterval(() => { time += 1; }, 1000);
      anim = setInterval(() => {
        seed += 1;
        const rec = recorderRef;
        if (rec) {
          const data = rec.getWaveformData();
          bars = data ? waveformFromAnalyser(data) : generateBars(true, seed);
        } else {
          bars = generateBars(true, seed);
        }
      }, 80);
    } else {
      if (timer) { clearInterval(timer); timer = null; }
      if (anim) { clearInterval(anim); anim = null; }
      bars = generateBars(false, 0);
    }
    return () => {
      if (timer) clearInterval(timer);
      if (anim) clearInterval(anim);
    };
  });

  async function handleStopRecording() {
    const rec = recorderRef;
    if (!rec) return;
    previewBars = [...bars];
    const blob = await rec.stop();
    audioBlobRef = blob;
    recorderRef = null;
    finalDuration = time;
    onSetMode("voicePreview");
  }

  function togglePlayback() {
    if (!audioBlobRef) return;

    if (isPlaying) {
      audioElRef?.pause();
      isPlaying = false;
    } else {
      if (audioUrlRef) URL.revokeObjectURL(audioUrlRef);
      const url = URL.createObjectURL(audioBlobRef);
      audioUrlRef = url;
      const audio = new Audio(url);
      audioElRef = audio;
      audio.onended = () => { isPlaying = false; };
      audio.play();
      isPlaying = true;
    }
  }

  $effect(() => {
    if (isPlaying && isPreview) {
      anim = setInterval(() => {
        seed += 1;
        previewBars = generateBars(true, seed);
      }, 80);
      return () => {
        if (anim) clearInterval(anim);
      };
    }
  });

  function handleCancel() {
    recorderRef?.cancel();
    recorderRef = null;
    audioBlobRef = null;
    onCancel();
  }
</script>

{#snippet waveform(barValues: number[], isAnimating: boolean)}
  <div class="rm-voice__waveform">
    {#each barValues as height, i (i)}
      <div
        class="rm-voice__bar"
        style:height="{height}px"
        style:transition={isAnimating ? "height 80ms ease" : "none"}
      ></div>
    {/each}
  </div>
{/snippet}

<div class="rm-voice" data-remediate-widget="">
  <!-- Recording State -->
  <div
    class="rm-voice__state rm-voice__state--recording {isRecording
      ? 'rm-voice__state--active'
      : 'rm-voice__state--inactive'}"
  >
    <div class="rm-voice__top-row">
      {@render waveform(bars, isRecording)}
      <span class="rm-voice__timer">{formatTime(time)}</span>
      <button
        class="rm-voice__stop"
        onclick={handleStopRecording}
        aria-label="Stop recording"
        tabindex={isRecording ? 0 : -1}
      >
        <Icon d={icons.StopFill} size={20} />
      </button>
    </div>
  </div>

  <!-- Preview State -->
  <div
    class="rm-voice__state rm-voice__state--preview {isPreview
      ? 'rm-voice__state--active'
      : 'rm-voice__state--inactive'}"
  >
    <div class="rm-voice__top-row">
      <button
        class="rm-voice__play"
        onclick={togglePlayback}
        aria-label={isPlaying ? "Pause playback" : "Play recording"}
        tabindex={isPreview ? 0 : -1}
      >
        <Icon d={isPlaying ? icons.PauseFill : icons.PlayFill} size={16} />
      </button>
      {@render waveform(previewBars.length > 0 ? previewBars : generateBars(true, 42), isPlaying)}
    </div>

    <div class="rm-input-group" style="margin-top: 10px">
      <textarea
        class="rm-input-group__textarea"
        placeholder="Add a note…"
        bind:value={text}
        rows={2}
        tabindex={isPreview ? 0 : -1}
      ></textarea>
      <div class="rm-input-group__footer">
        <PriorityButton {priority} onCycle={(p) => (priority = p)} />
      </div>
    </div>

    <div class="rm-voice__bottom-row">
      <div class="rm-voice__actions">
        <button class="rm-voice__cancel" onclick={handleCancel} tabindex={isPreview ? 0 : -1}>
          Cancel
        </button>
        <button
          class="rm-voice__add"
          tabindex={isPreview ? 0 : -1}
          onclick={() => {
            if (audioBlobRef) {
              onAdd(finalDuration, audioBlobRef, text.trim(), priority);
            } else {
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
