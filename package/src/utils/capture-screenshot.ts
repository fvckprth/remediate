import { toBlob } from "html-to-image";
import type { SelectionArea } from "../types";

/**
 * Captures a screenshot of the specified area of the page as a PNG Blob.
 * Uses html-to-image to render the DOM, filtering out the Remediate widget.
 */
export async function captureScreenshot(area: SelectionArea): Promise<Blob | null> {
  try {
    const blob = await toBlob(document.documentElement, {
      width: area.width,
      height: area.height,
      canvasWidth: area.width,
      canvasHeight: area.height,
      pixelRatio: window.devicePixelRatio,
      style: {
        transform: `translate(-${area.x}px, -${area.y}px)`,
        transformOrigin: "top left",
      },
      filter: (node: HTMLElement) => {
        // Hide the remediate widget during capture
        if (node?.hasAttribute?.("data-remediate-widget")) {
          return false;
        }
        return true;
      },
    });
    return blob;
  } catch (err) {
    console.warn("[Remediate] Screenshot capture failed:", err);
    return null;
  }
}
