import { useState, useRef, useEffect, useLayoutEffect, useCallback, type RefObject } from "react";
import type { BarEdge } from "../types";
import { readBarState, patchBarState } from "../utils/bar-storage";

const DRAG_THRESHOLD = 5;
const VIEWPORT_PADDING = 20;
// Resting gap between a snapped bar and the docked edge. Must be < VIEWPORT_PADDING
// so a drop near a corner (drag-clamped to VIEWPORT_PADDING) still moves visibly.
const SNAP_GAP = 10;
const SNAP_DURATION = 380;
const SNAP_EASING = "cubic-bezier(0.19, 1, 0.22, 1)";
const DEFAULT_BAR_WIDTH = 90;
const DEFAULT_BAR_HEIGHT = 40;
// Throw horizon (react-grab style): on release the bar is projected from its
// release velocity to `pos + velocity * this`, then snaps to the edge nearest
// that projected point — so a fast flick lands on the edge it was thrown toward.
const VELOCITY_PROJECTION_MS = 150;

interface DragPosition {
  x: number;
  y: number;
  r: number;
  b?: number;
  edge?: BarEdge;
}

function nearestEdgeFromDistances({
  left,
  right,
  top,
  bottom,
}: {
  left: number;
  right: number;
  top: number;
  bottom: number;
}): BarEdge {
  const min = Math.min(left, right, top, bottom);
  if (min === left) return "left";
  if (min === right) return "right";
  if (min === top) return "top";
  return "bottom";
}

function getNearestEdgeFromRect(rect: DOMRect): BarEdge {
  return nearestEdgeFromDistances({
    left: rect.left,
    right: window.innerWidth - rect.right,
    top: rect.top,
    bottom: window.innerHeight - rect.bottom,
  });
}

function getNearestEdgeFromPosition(position: Pick<DragPosition, "x" | "y" | "r" | "b">): BarEdge {
  return nearestEdgeFromDistances({
    left: position.x,
    right: position.r,
    top: position.y,
    bottom: typeof position.b === "number" ? position.b : window.innerHeight - position.y - DEFAULT_BAR_HEIGHT,
  });
}

/**
 * react-grab-style throw snap. Projects the release point from velocity, picks
 * the edge nearest that projected center (ties resolve to horizontal), and
 * slides the bar along that edge to the projected coordinate (clamped). A slow
 * release has ~zero velocity, so it collapses to "nearest current edge".
 */
function getSnapTarget(
  rect: DOMRect,
  vx: number,
  vy: number,
): { edge: BarEdge; left: number; top: number } {
  const w = rect.width;
  const h = rect.height;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const projLeft = rect.left + vx * VELOCITY_PROJECTION_MS;
  const projTop = rect.top + vy * VELOCITY_PROJECTION_MS;
  const cx = projLeft + w / 2;
  const cy = projTop + h / 2;

  const distLeft = cx;
  const distRight = vw - cx;
  const distTop = cy;
  const distBottom = vh - cy;
  const min = Math.min(distLeft, distRight, distTop, distBottom);

  // Slide-along coordinate follows the throw, clamped away from the corners.
  const alongX = Math.max(VIEWPORT_PADDING, Math.min(vw - w - VIEWPORT_PADDING, projLeft));
  const alongY = Math.max(VIEWPORT_PADDING, Math.min(vh - h - VIEWPORT_PADDING, projTop));

  if (min === distLeft) return { edge: "left", left: SNAP_GAP, top: alongY };
  if (min === distRight) return { edge: "right", left: vw - w - SNAP_GAP, top: alongY };
  if (min === distTop) return { edge: "top", left: alongX, top: SNAP_GAP };
  return { edge: "bottom", left: alongX, top: vh - h - SNAP_GAP };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useDraggable({
  enabled,
  snapToEdge,
  barRef,
}: {
  enabled: boolean;
  snapToEdge: boolean;
  barRef: RefObject<HTMLDivElement | null>;
}) {
  const [position, setPosition] = useState<DragPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; barX: number; barY: number } | null>(null);
  const justFinishedDragRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Read saved position before first paint.
  useLayoutEffect(() => {
    const saved = readBarState();
    if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
      const r = typeof saved.r === "number" ? saved.r : window.innerWidth - saved.x - DEFAULT_BAR_WIDTH;
      const b = typeof saved.b === "number" ? saved.b : window.innerHeight - saved.y - DEFAULT_BAR_HEIGHT;
      setPosition({
        x: saved.x,
        y: saved.y,
        r,
        b,
        edge: saved.edge ?? getNearestEdgeFromPosition({ x: saved.x, y: saved.y, r, b }),
      });
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    if (e.button !== 0) return; // primary button / touch / pen only
    const bar = barRef.current;
    if (!bar) return;

    // Abort any drag whose pointerup was lost (rapid re-grab / stray events) so
    // listeners never stack up and a half-finished drag can't strand the bar.
    dragCleanupRef.current?.();
    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = undefined;
    }
    bar.style.transition = "";

    const rect = bar.getBoundingClientRect();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      barX: rect.left,
      barY: rect.top,
    };

    // Per-drag state, kept local (not a shared ref) so overlapping pointers or a
    // lost pointerup on one drag can't reset another drag's "did move" flag.
    let didDrag = false;
    // Single-sample release velocity (px/ms), tracked per move like react-grab.
    let velocity = { x: 0, y: 0 };
    let lastSample = { x: e.clientX, y: e.clientY, t: performance.now() };

    const handlePointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const start = dragStartRef.current;
      if (!start) return;

      const deltaX = ev.clientX - start.pointerX;
      const deltaY = ev.clientY - start.pointerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (!didDrag && distance < DRAG_THRESHOLD) return;

      if (!didDrag) {
        didDrag = true;
        setIsDragging(true);
        // Capture only once a real drag starts. Capturing on pointerdown would
        // route the pointerup to the bar and swallow the click on child buttons
        // (e.g. the collapse chevron). The document listeners already keep
        // move/up flowing once the pointer leaves the bar.
        try { bar.setPointerCapture(e.pointerId); } catch {}
      }

      const barWidth = bar.offsetWidth;
      const barHeight = bar.offsetHeight;
      const newX = Math.max(
        VIEWPORT_PADDING,
        Math.min(window.innerWidth - barWidth - VIEWPORT_PADDING, start.barX + deltaX)
      );
      const newY = Math.max(
        VIEWPORT_PADDING,
        Math.min(window.innerHeight - barHeight - VIEWPORT_PADDING, start.barY + deltaY)
      );

      bar.style.left = `${newX}px`;
      bar.style.top = `${newY}px`;
      bar.style.right = "auto";
      bar.style.bottom = "auto";

      const now = performance.now();
      const dt = now - lastSample.t;
      if (dt > 0) {
        velocity = { x: (ev.clientX - lastSample.x) / dt, y: (ev.clientY - lastSample.y) / dt };
      }
      lastSample = { x: ev.clientX, y: ev.clientY, t: now };
    };

    const cleanup = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      try { bar.releasePointerCapture(e.pointerId); } catch {}
      dragStartRef.current = null;
      dragCleanupRef.current = null;
    };

    // A drag ends identically whether the browser delivers pointerup or — on a
    // fast flick it reinterprets as a gesture — pointercancel. Both commit the
    // snap, so a throw always lands on an edge instead of being silently lost.
    const finishDrag = () => {
      if (didDrag) {
        const rect = bar.getBoundingClientRect();

        // Suppress the click that fires immediately after a drag.
        justFinishedDragRef.current = true;
        requestAnimationFrame(() => {
          setTimeout(() => {
            justFinishedDragRef.current = false;
          }, 0);
        });

        if (snapToEdge) {
          const { edge, left, top } = getSnapTarget(rect, velocity.x, velocity.y);
          const r = window.innerWidth - (left + rect.width);
          const b = window.innerHeight - (top + rect.height);
          const finalPos: DragPosition = { x: left, y: top, r, b, edge };
          const anchorRight = r < left; // mirror the render's nearer-side anchor
          const anchorBottom = edge === "bottom";

          // Seed baselines at the drag-end spot, reflow, then animate to the
          // snapped slot. The final styles are applied IMPERATIVELY (not only via
          // React state): dragging mutated bar.style directly, so if the snap
          // target equals the last committed position React would skip the DOM
          // update and leave the bar stranded where it was released.
          const applySnappedStyles = () => {
            if (anchorRight) {
              bar.style.right = `${r}px`;
              bar.style.left = "auto";
            } else {
              bar.style.left = `${left}px`;
              bar.style.right = "auto";
            }
            if (anchorBottom) {
              bar.style.bottom = `${b}px`;
              bar.style.top = "auto";
            } else {
              bar.style.top = `${top}px`;
              bar.style.bottom = "auto";
            }
          };

          if (prefersReducedMotion()) {
            applySnappedStyles();
          } else {
            bar.style.left = `${rect.left}px`;
            bar.style.right = `${window.innerWidth - rect.right}px`;
            bar.style.top = `${rect.top}px`;
            bar.style.bottom = `${window.innerHeight - rect.bottom}px`;
            bar.style.transition =
              `left ${SNAP_DURATION}ms ${SNAP_EASING}, right ${SNAP_DURATION}ms ${SNAP_EASING}, top ${SNAP_DURATION}ms ${SNAP_EASING}, bottom ${SNAP_DURATION}ms ${SNAP_EASING}`;
            void bar.offsetWidth; // reflow -> transition baseline = current (drag-end) position
            applySnappedStyles();

            snapTimerRef.current = setTimeout(() => {
              const b = barRef.current;
              if (b) b.style.transition = ""; // restore base CSS transitions
              snapTimerRef.current = undefined;
            }, SNAP_DURATION + 40);
          }

          patchBarState(finalPos);
          setPosition(finalPos);
        } else {
          // Free-drop: keep current behavior, but clear any stale snapped edge.
          const finalPos: DragPosition = {
            x: rect.left,
            y: rect.top,
            r: window.innerWidth - rect.right,
            b: window.innerHeight - rect.bottom,
            edge: getNearestEdgeFromRect(rect),
          };
          patchBarState(finalPos);
          setPosition(finalPos);
        }
      }

      setIsDragging(false);
      cleanup();
    };

    const handlePointerCancel = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      finishDrag();
    };

    const handlePointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      finishDrag();
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);

    dragCleanupRef.current = cleanup;
  }, [enabled, snapToEdge, barRef]);

  // Clean up listeners + pending snap timer on unmount.
  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      const bar = barRef.current;
      if (bar) bar.style.transition = "";
    };
  }, [barRef]);

  return {
    position,
    isDragging,
    /** Docked edge of the current position (set only after a snap). */
    edge: position?.edge,
    /** True for one frame after a drag ends — use to suppress click handlers. */
    justDragged: justFinishedDragRef,
    handlePointerDown,
  };
}
