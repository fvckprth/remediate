import { useState, useCallback, useEffect } from "react";
import type { AnnotationItem } from "../../types";
import { AnnotationBadge } from "./AnnotationBadge";
import { MarkerTooltip } from "./MarkerTooltip";

interface AnnotationMarkersProps {
  annotations: AnnotationItem[];
  markerColor: string;
  activePopoverAnnotationId: string | null;
  onBadgeClick: (id: string) => void;
}

export function AnnotationMarkers({
  annotations,
  markerColor,
  activePopoverAnnotationId,
  onBadgeClick,
}: AnnotationMarkersProps) {
  const [rects, setRects] = useState<Map<string, DOMRect>>(new Map());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const recalcRects = useCallback(() => {
    const next = new Map<string, DOMRect>();
    for (const ann of annotations) {
      try {
        const el = document.querySelector(ann.element.selector);
        if (el) next.set(ann.id, el.getBoundingClientRect());
      } catch {
        /* selector may no longer match */
      }
    }
    setRects(next);
  }, [annotations]);

  // Only track the page while there is something to track; coalesce bursts of scroll events to one read per frame.
  const hasAnnotations = annotations.length > 0;
  useEffect(() => {
    if (!hasAnnotations) return;
    recalcRects();
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; recalcRects(); });
    };
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [hasAnnotations, recalcRects]);

  if (!hasAnnotations) return null;

  const hoveredAnn = hoveredId ? annotations.find((a) => a.id === hoveredId) : null;
  const hoveredRect = hoveredId ? rects.get(hoveredId) : null;

  return (
    <div data-remediate-widget="">
      {annotations.map((ann) => {
        const rect = rects.get(ann.id);
        if (!rect) return null;
        return (
          <div
            key={ann.id}
            data-remediate-widget=""
            onMouseEnter={() => setHoveredId(ann.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <AnnotationBadge
              index={ann.index}
              rect={rect}
              clickOffset={ann.clickOffset}
              color={markerColor}
              onClick={() => onBadgeClick(ann.id === activePopoverAnnotationId ? "" : ann.id)}
            />
          </div>
        );
      })}

      {/* Tooltip on hover */}
      {hoveredAnn && hoveredRect && hoveredAnn.note && hoveredId !== activePopoverAnnotationId && (
        <MarkerTooltip
          descriptor={hoveredAnn.element.name}
          note={hoveredAnn.note}
          top={hoveredRect.top + hoveredAnn.clickOffset.y + 16}
          left={hoveredRect.left + hoveredAnn.clickOffset.x - 11}
        />
      )}
    </div>
  );
}
