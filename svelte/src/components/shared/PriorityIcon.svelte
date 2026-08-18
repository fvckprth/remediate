<script lang="ts" module>
  import type { AnnotationPriority } from "../../types";

  const DIM = "rgba(255,255,255,0.2)";
  export const BAR_COLORS: Record<string, [string, string, string]> = {
    none: [DIM, DIM, DIM],
    low: ["#45ff64", DIM, DIM],
    medium: ["#ffed2d", "#ffed2d", DIM],
    high: ["#ff882d", "#ff882d", "#ff882d"],
  };

  export const PRIORITY_OPTIONS: { value: AnnotationPriority; label: string }[] = [
    { value: "none", label: "Set priority" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];
</script>

<script lang="ts">
  interface Props {
    priority: AnnotationPriority;
  }
  let { priority }: Props = $props();

  const isUrgent = $derived(priority === "urgent");
  const colors = $derived(BAR_COLORS[priority] ?? BAR_COLORS.none);
</script>

<div class="rm-priority__icon-wrapper">
  <svg
    class="rm-priority__icon {!isUrgent ? 'rm-priority__icon--active' : ''}"
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
  >
    <rect x="3" y="10" width="3" height="4" rx="1.5" fill={colors[0]} style="transition: fill 200ms ease" />
    <rect x="7" y="6" width="3" height="8" rx="1.5" fill={colors[1]} style="transition: fill 200ms ease" />
    <rect x="11" y="2" width="3" height="12" rx="1.5" fill={colors[2]} style="transition: fill 200ms ease" />
  </svg>
  <svg
    class="rm-priority__icon {isUrgent ? 'rm-priority__icon--active' : ''}"
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
  >
    <circle cx="8" cy="8" r="7" fill="#ff4545" />
    <path d="M8 4.5v4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" />
    <circle cx="8" cy="11" r="0.9" fill="#fff" />
  </svg>
</div>
