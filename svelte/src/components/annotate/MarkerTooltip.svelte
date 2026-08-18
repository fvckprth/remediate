<script lang="ts">
  interface Props {
    descriptor: string;
    note: string;
    top: number;
    left: number;
  }
  let { descriptor, note, top, left }: Props = $props();
</script>

{#if note}
  <div
    class="rm-marker-tooltip"
    data-remediate-widget=""
    style:top="{top}px"
    style:left="{left}px"
  >
    <div class="rm-marker-tooltip__descriptor">{descriptor}</div>
    <div class="rm-marker-tooltip__note">{note}</div>
  </div>
{/if}
