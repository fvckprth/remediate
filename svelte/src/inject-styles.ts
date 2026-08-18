import cssRaw from "./styles/widget.css?raw";

// jsDelivr serves the font from the published `remediate` package. The injected
// CSS points font url()s at the CDN so the widget stays self-contained.
const CDN_FONT_URL =
  "https://cdn.jsdelivr.net/npm/remediate@latest/dist/OpenRunde-Medium.woff2";

function rewriteFontUrls(css: string): string {
  return css.replace(
    /url\([^)]*OpenRunde-Medium[^)]*\.woff2[^)]*\)/g,
    `url("${CDN_FONT_URL}")`,
  );
}

let injected = false;

/**
 * Inject the widget stylesheet into <head>. SSR-safe and idempotent — mirrors
 * the React package's auto-injecting behaviour so consumers don't import a
 * stylesheet. Called from the widget root, so it runs on first mount.
 */
export function injectStyles(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const id = "remediate-widget-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = rewriteFontUrls(cssRaw);
  document.head.appendChild(style);
}
