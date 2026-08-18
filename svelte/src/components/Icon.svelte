<script lang="ts">
  interface Props {
    size?: number;
    d: string;
  }
  let { size = 24, d }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
  <path {d} />
</svg>
