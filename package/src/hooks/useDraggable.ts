import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";

const DRAG_THRESHOLD = 5;
const VIEWPORT_PADDING = 20;
const STORAGE_KEY = "rm_bar_position";

interface DragPosition {
  x: number;
  y: number;
  r: number;
}

export function useDraggable({
  enabled,
  onPositionChange,
}: {
  enabled: boolean;
  onPositionChange?: (pos: { x: number; y: number } | null) => void;
}) {
  const [position, setPosition] = useState<DragPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; barX: number; barY: number } | null>(null);
  const didDragRef = useRef(false);
  const justFinishedDragRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  // Read saved position from localStorage before first paint
  useLayoutEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.r === undefined) {
          parsed.r = window.innerWidth - parsed.x - 90;
        }
        setPosition(parsed);
        onPositionChangeRef.current?.(parsed);
        return;
      } catch {}
    }
    requestAnimationFrame(() => {
      const bar = barRef.current;
      if (bar) {
        const rect = bar.getBoundingClientRect();
        onPositionChangeRef.current?.({ x: rect.left, y: rect.top });
      }
    });
  }, []);

  // Re-report position on viewport resize/zoom so the panel tracks the bar.
  // Skipped while dragging — the drag handler updates inline left/top directly.
  useEffect(() => {
    if (isDragging) return;

    let rafId: number | null = null;

    const reportPosition = () => {
      rafId = null;
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      onPositionChangeRef.current?.({ x: rect.left, y: rect.top });
    };

    const handleResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(reportPosition);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    const bar = barRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      barX: rect.left,
      barY: rect.top,
    };
    didDragRef.current = false;

    const handleMouseMove = (ev: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;

      const deltaX = ev.clientX - start.mouseX;
      const deltaY = ev.clientY - start.mouseY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (!didDragRef.current && distance < DRAG_THRESHOLD) return;

      if (!didDragRef.current) {
        didDragRef.current = true;
        setIsDragging(true);
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
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (didDragRef.current) {
        const rect = bar.getBoundingClientRect();
        const finalPos = { x: rect.left, y: rect.top, r: window.innerWidth - rect.right };

        setPosition(finalPos);
        setIsDragging(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPos));
        onPositionChangeRef.current?.(finalPos);

        justFinishedDragRef.current = true;
        requestAnimationFrame(() => {
          setTimeout(() => {
            justFinishedDragRef.current = false;
          }, 0);
        });
      }

      dragStartRef.current = null;
      dragCleanupRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    dragCleanupRef.current = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled]);

  // Clean up drag listeners on unmount
  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  return {
    barRef,
    position,
    isDragging,
    /** True for one frame after a drag ends — use to suppress click handlers */
    justDragged: justFinishedDragRef,
    handleMouseDown,
  };
}
