/**
 * Script-tag entry point for Remediate (Svelte).
 *
 * Bundles Svelte + the widget + CSS + fonts (via CDN) into a single
 * self-initializing IIFE. Usage:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/remediate-svelte/dist/widget.js"
 *           data-endpoint="/api/feedback"></script>
 *
 * Or with window config:
 *
 *   <script>
 *     window.remediateConfig = { endpoint: '/api/feedback' };
 *   </script>
 *   <script src="/widget.js" async></script>
 */

import { mount } from "svelte";
import Remediate from "./components/Remediate.svelte";
import type { RemediateProps } from "./types";
import { injectStyles } from "./inject-styles";

interface EmbedConfig {
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

function getConfig(): EmbedConfig {
  if (
    typeof window !== "undefined" &&
    (window as unknown as Record<string, unknown>).remediateConfig
  ) {
    return (window as unknown as Record<string, unknown>)
      .remediateConfig as EmbedConfig;
  }

  const script =
    document.currentScript ||
    document.querySelector("script[data-endpoint]") ||
    document.querySelector('script[src*="widget"]');

  if (!script) return {};

  return {
    endpoint: script.getAttribute("data-endpoint") || undefined,
    metadata: script.hasAttribute("data-metadata")
      ? (() => {
          try {
            return JSON.parse(script.getAttribute("data-metadata")!);
          } catch {
            console.warn("[Remediate] Invalid data-metadata JSON");
            return undefined;
          }
        })()
      : undefined,
  };
}

function init() {
  try {
    injectStyles();
    const config = getConfig();

    const container = document.createElement("div");
    container.id = "remediate-embed-root";
    document.body.appendChild(container);

    const props: RemediateProps = {};
    if (config.endpoint) props.endpoint = config.endpoint;
    if (config.metadata) props.metadata = config.metadata;

    mount(Remediate, { target: container, props });
  } catch (err) {
    console.warn("[Remediate] Failed to initialize widget:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
