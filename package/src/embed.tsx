/**
 * Script-tag entry point for Remediate.
 *
 * Bundles React + ReactDOM + widget + CSS + fonts into a single
 * self-initializing IIFE. Usage:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/remediate/dist/widget.js"
 *           data-endpoint="/api/feedback"></script>
 *
 * Or with window config:
 *
 *   <script>
 *     window.remediateConfig = { endpoint: '/api/feedback' };
 *   </script>
 *   <script src="/widget.js" async></script>
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Remediate } from "./components";
import type { RemediateProps } from "./types";
import "./styles/widget.css";

interface EmbedConfig {
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

function getConfig(): EmbedConfig {
  // Priority: window.remediateConfig > data-* attributes on script tag
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
      ? (() => { try { return JSON.parse(script.getAttribute("data-metadata")!); } catch { console.warn("[Remediate] Invalid data-metadata JSON"); return undefined; } })()
      : undefined,
  };
}

function init() {
  try {
    const config = getConfig();

    const container = document.createElement("div");
    container.id = "remediate-embed-root";
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    const props: RemediateProps = {};
    if (config.endpoint) props.endpoint = config.endpoint;
    if (config.metadata) props.metadata = config.metadata;

    root.render(React.createElement(Remediate, props));
  } catch (err) {
    console.warn("[Remediate] Failed to initialize widget:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
