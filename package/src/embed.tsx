/**
 * Script-tag entry point for Remediate.
 *
 * Bundles React + ReactDOM + widget + CSS + fonts into a single
 * self-initializing IIFE. Usage:
 *
 *   <script src="https://cdn.remediate.dev/widget.js"
 *           data-project-key="pk_xxx"></script>
 *
 * Or with window config:
 *
 *   <script>
 *     window.remediateConfig = { projectKey: 'pk_xxx' };
 *   </script>
 *   <script src="/widget.js" async></script>
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Remediate } from "./components";
import type { RemediateProps } from "./types";
import "./styles/widget.css";

interface EmbedConfig {
  projectKey?: string;
  endpoint?: string;
  apiUrl?: string;
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
    document.querySelector("script[data-project-key]") ||
    document.querySelector('script[src*="widget"]');

  if (!script) return {};

  return {
    projectKey: script.getAttribute("data-project-key") || undefined,
    endpoint: script.getAttribute("data-endpoint") || undefined,
    apiUrl: script.getAttribute("data-api-url") || undefined,
    metadata: script.hasAttribute("data-metadata")
      ? JSON.parse(script.getAttribute("data-metadata")!)
      : undefined,
  };
}

function init() {
  const config = getConfig();

  const container = document.createElement("div");
  container.id = "remediate-embed-root";
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  const props: RemediateProps = {};
  if (config.projectKey) props.projectKey = config.projectKey;
  if (config.endpoint) props.endpoint = config.endpoint;
  if (config.apiUrl) props.apiUrl = config.apiUrl;
  if (config.metadata) props.metadata = config.metadata;

  root.render(React.createElement(Remediate, props));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
