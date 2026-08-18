<script lang="ts">
  import { onMount } from "svelte";
  import type { SelectionArea } from "../../types";
  import Icon from "../Icon.svelte";
  import { icons } from "../icons";

  interface Props {
    area: SelectionArea | null;
    isReady: boolean;
    onStopRecording: (duration: number) => void;
    onCancel: () => void;
  }
  let { area, isReady, onStopRecording, onCancel }: Props = $props();

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  let recordingTime = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    if (!isReady) {
      recordingTime = 0;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return;
    }
    recordingTime = 0;
    timer = setInterval(() => { recordingTime += 1; }, 1000);
    return () => { if (timer) clearInterval(timer); };
  });

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const clipPath = $derived(
    area
      ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${area.x}px ${area.y}px,
        ${area.x}px ${area.y + area.height}px,
        ${area.x + area.width}px ${area.y + area.height}px,
        ${area.x + area.width}px ${area.y}px,
        ${area.x}px ${area.y}px
      )`
      : "",
  );
</script>

{#if isReady}
  <div data-remediate-widget="" style="pointer-events: none">
    {#if area}
      <div class="rm-video-area-dim" style:clip-path={clipPath}></div>
    {/if}

    <div
      class="rm-video-recording-bar"
      style="position: fixed; z-index: 999999; pointer-events: auto;
        {area
          ? `left: ${area.x + area.width / 2}px; top: ${area.y + area.height + 12}px; transform: translateX(-50%);`
          : `bottom: 40px; left: 50%; transform: translateX(-50%);`}"
    >
      <span class="rm-video-recording-bar__timer">{formatDuration(recordingTime)}</span>
      <button
        class="rm-video-recording-bar__stop"
        aria-label="Stop recording"
        onclick={() => onStopRecording(recordingTime)}
      >
        <Icon d={icons.StopLine} size={20} />
      </button>
    </div>
  </div>
{/if}
