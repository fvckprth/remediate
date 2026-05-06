import { generateSelector } from "./selector";
import { identifyElement, getNearbyText, getElementClasses, getDetailedComputedStyles } from "./element-identify";
import { getReactComponentChain } from "./react-fiber";
import type { ElementCapture } from "../types";

const CAPTURE_ATTRIBUTES = [
  "id", "class", "role", "href", "src", "alt", "type", "name", "placeholder",
];

function filterAttributes(el: HTMLElement): Record<string, string> {
  const result: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (
      CAPTURE_ATTRIBUTES.includes(attr.name) ||
      attr.name.startsWith("data-") ||
      attr.name.startsWith("aria-")
    ) {
      result[attr.name] = attr.value;
    }
  }
  return result;
}

export function captureElement(el: HTMLElement): ElementCapture {
  const rect = el.getBoundingClientRect();
  const { name, path } = identifyElement(el);
  const { chain, sourceLocation } = getReactComponentChain(el);

  return {
    selector: generateSelector(el),
    name,
    elementPath: path,
    boundingRect: {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height,
    },
    nearbyText: getNearbyText(el),
    cssClasses: getElementClasses(el),
    attributes: filterAttributes(el),
    computedStyles: getDetailedComputedStyles(el),
    ...(chain.length > 0 && { componentChain: chain }),
    ...(sourceLocation && { sourceLocation }),
  };
}
