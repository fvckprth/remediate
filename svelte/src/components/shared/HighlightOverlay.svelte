<script lang="ts">
  interface Props {
    rect: DOMRect;
    color: string;
    variant: "hover" | "persistent" | "multi-pending";
  }
  let { rect, color, variant }: Props = $props();

  const fillOpacity = $derived(
    variant === "hover" ? 0.06 : variant === "multi-pending" ? 0.05 : 0.08,
  );
  const bgColor = $derived(
    `${color}${Math.round(fillOpacity * 255)
      .toString(16)
      .padStart(2, "0")}`,
  );
</script>

<div
  class="rm-highlight rm-highlight--{variant}"
  style:top="{rect.top}px"
  style:left="{rect.left}px"
  style:width="{rect.width}px"
  style:height="{rect.height}px"
  style:border-color={color}
  style:background-color={bgColor}
></div>
