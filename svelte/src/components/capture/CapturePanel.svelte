<script lang="ts">
  import type { SelectionArea, AnnotationPriority, PhotoCapture, VideoCapture } from "../../types";
  import Icon from "../Icon.svelte";
  import { icons } from "../icons";
  import PriorityButton from "../shared/PriorityButton.svelte";
  import { getWidgetStore } from "../../state/widget-store.svelte";

  interface Props {
    variant: "photo" | "video";
    area: SelectionArea | null;
    isRecording: boolean;
    screenshotBlob: Blob | null;
    onStartRecording: () => void;
    onStopRecording: (duration: number) => void;
    onAdd: (additionalText: string, priority: AnnotationPriority) => void;
    onCancel: () => void;
  }
  let {
    variant,
    area,
    isRecording,
    screenshotBlob,
    onStopRecording,
    onAdd,
    onCancel,
  }: Props = $props();

  const store = getWidgetStore();
  const preview =
    variant === "photo"
      ? store.preview<PhotoCapture>("photo")
      : store.preview<VideoCapture>("video");
  const submitLabel = store.state.previewingItemId ? "Save" : "Add";

  let additionalText = $state(preview?.additionalText ?? "");
  let priority = $state<AnnotationPriority>(preview?.priority ?? "none");
  let recordingTime = $state(0);
  let previewUrl = $state<string | null>(null);
  let isPlaying = $state(false);
  let videoRef = $state<HTMLVideoElement>();
  let timer: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    if (isRecording) {
      recordingTime = 0;
      timer = setInterval(() => { recordingTime += 1; }, 1000);
    } else if (timer) {
      clearInterval(timer);
      timer = null;
    }
    return () => { if (timer) clearInterval(timer); };
  });

  $effect(() => {
    if (screenshotBlob) {
      const url = URL.createObjectURL(screenshotBlob);
      previewUrl = url;
      return () => URL.revokeObjectURL(url);
    } else {
      previewUrl = null;
    }
  });

  function handleSubmit() {
    onAdd(additionalText, priority);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function togglePlayback() {
    const video = videoRef;
    if (!video) return;
    if (video.paused) {
      video.play();
      isPlaying = true;
    } else {
      video.pause();
      isPlaying = false;
    }
  }

  const areaLabel = $derived(
    area
      ? `${Math.round(area.width)} × ${Math.round(area.height)} at (${Math.round(area.x)}, ${Math.round(area.y)})`
      : "No area selected",
  );

  const previewHeight = $derived(
    area ? Math.min(200, 252 * (area.height / Math.max(1, area.width))) : undefined,
  );
</script>

<div class="rm-capture-panel" data-remediate-widget="">
  <div class="rm-popover__header">
    <span class="rm-popover__header-meta">{areaLabel}</span>
  </div>

  <div
    class="rm-capture-panel__preview"
    style:height={previewHeight != null ? `${previewHeight}px` : undefined}
  >
    {#if variant === "photo" && previewUrl}
      <img src={previewUrl} alt="Screenshot preview" class="rm-capture-panel__preview-img" />
    {:else if variant === "video" && previewUrl}
      <video
        bind:this={videoRef}
        src={previewUrl}
        class="rm-capture-panel__preview-img"
        playsinline
        onended={() => (isPlaying = false)}
      ><track kind="captions" /></video>
      <button
        class="rm-video-play-btn"
        onclick={togglePlayback}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        <Icon d={isPlaying ? icons.PauseFill : icons.PlayFill} size={16} />
      </button>
    {:else}
      <div class="rm-capture-panel__placeholder">
        <span class="rm-capture-panel__placeholder-text">
          {variant === "photo" ? "Screenshot captured" : "Recording captured"}
        </span>
      </div>
    {/if}
  </div>

  <div class="rm-input-group">
    <textarea
      class="rm-input-group__textarea"
      placeholder="Add a note (optional)"
      bind:value={additionalText}
      rows={3}
      onkeydown={handleKeyDown}
    ></textarea>
    <div class="rm-input-group__footer">
      <PriorityButton {priority} onCycle={(p) => (priority = p)} />
    </div>
  </div>

  <div class="rm-capture-panel__footer">
    {#if isRecording}
      <button
        class="rm-btn rm-btn--primary rm-btn--stop"
        onclick={() => onStopRecording(recordingTime)}
      >
        <Icon d={icons.StopLine} size={20} />
        Stop
      </button>
    {:else}
      <div class="rm-capture-panel__actions">
        <button class="rm-capture-panel__cancel" onclick={onCancel}>Cancel</button>
        <button class="rm-capture-panel__submit" onclick={handleSubmit}>{submitLabel}</button>
      </div>
    {/if}
  </div>
</div>
