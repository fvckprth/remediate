<script lang="ts" module>
  export interface SubMenuItem {
    id: string;
    label: string;
    /** SVG path data for the tile icon (rendered via Icon). */
    iconPath: string;
    onClick: () => void;
    disabled?: boolean;
    disabledReason?: string;
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "../Icon.svelte";

  interface Props {
    items: SubMenuItem[];
    onDismiss: () => void;
  }
  let { items, onDismiss }: Props = $props();

  let ref: HTMLDivElement;

  onMount(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        ref &&
        !ref.contains(target) &&
        !target.closest("[data-remediate-widget]")
      ) {
        onDismiss();
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  });
</script>

<div bind:this={ref} class="rm-submenu" data-remediate-widget="">
  {#each items as item, i (item.id)}
    <button
      class="rm-submenu__tile {item.disabled ? 'rm-submenu__tile--disabled' : ''}"
      onclick={item.disabled ? undefined : item.onClick}
      style="animation-delay: {50 + i * 50}ms"
      aria-label={item.label}
      aria-disabled={item.disabled || undefined}
    >
      <span class="rm-submenu__tile-icon"><Icon d={item.iconPath} size={20} /></span>
      <span class="rm-submenu__tile-label">{item.label}</span>
      {#if item.disabled && item.disabledReason}
        <span class="rm-submenu__tile-reason">{item.disabledReason}</span>
      {/if}
    </button>
  {/each}
</div>
