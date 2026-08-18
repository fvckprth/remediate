<script lang="ts">
  import type { AnnotationPriority } from "../../types";
  import PriorityIcon, { PRIORITY_OPTIONS } from "./PriorityIcon.svelte";

  interface Props {
    priority: AnnotationPriority;
    onCycle: (next: AnnotationPriority) => void;
  }
  let { priority, onCycle }: Props = $props();

  function cyclePriority() {
    const currentIdx = PRIORITY_OPTIONS.findIndex((p) => p.value === priority);
    const nextIdx = (currentIdx + 1) % PRIORITY_OPTIONS.length;
    onCycle(PRIORITY_OPTIONS[nextIdx].value);
  }
</script>

<button
  class="rm-priority rm-priority--{priority}"
  onclick={cyclePriority}
  type="button"
>
  <PriorityIcon {priority} />
  <div class="rm-priority__labels">
    {#each PRIORITY_OPTIONS as p (p.value)}
      <span
        class="rm-priority__label {p.value === priority ? 'rm-priority__label--active' : ''}"
      >
        {p.label}
      </span>
    {/each}
  </div>
</button>
