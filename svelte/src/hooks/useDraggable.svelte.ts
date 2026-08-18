const DRAG_THRESHOLD = 5;
const VIEWPORT_PADDING = 20;
const STORAGE_KEY = "rm_bar_position";

export interface DragPosition {
  x: number;
  y: number;
  r: number;
}

/**
 * Draggable behaviour for the feedback bar. `handleMouseDown` starts a drag;
 * `position` holds the persisted placement; `justDragged.current` is true for
 * one frame after a drag so a trailing click can be suppressed. Call `init()`
 * on mount to load the saved position and get a teardown cleanup.
 */
export function createDraggable({
  getEnabled,
  getBar,
}: {
  getEnabled: () => boolean;
  getBar: () => HTMLDivElement | null;
}) {
  let position = $state<DragPosition | null>(null);
  let isDragging = $state(false);
  let dragStart: { mouseX: number; mouseY: number; barX: number; barY: number } | null = null;
  let didDrag = false;
  const justDragged = { current: false };
  let dragCleanup: (() => void) | null = null;

  function init(): () => void {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.r === undefined) {
            parsed.r = window.innerWidth - parsed.x - 90;
          }
          position = parsed;
        } catch {
          /* ignore malformed saved position */
        }
      }
    }
    return () => {
      dragCleanup?.();
    };
  }

  function handleMouseDown(e: MouseEvent) {
    if (!getEnabled()) return;
    const bar = getBar();
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    dragStart = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      barX: rect.left,
      barY: rect.top,
    };
    didDrag = false;

    const handleMouseMove = (ev: MouseEvent) => {
      const start = dragStart;
      if (!start) return;

      const deltaX = ev.clientX - start.mouseX;
      const deltaY = ev.clientY - start.mouseY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (!didDrag && distance < DRAG_THRESHOLD) return;

      if (!didDrag) {
        didDrag = true;
        isDragging = true;
      }

      const barWidth = bar.offsetWidth;
      const barHeight = bar.offsetHeight;
      const newX = Math.max(
        VIEWPORT_PADDING,
        Math.min(window.innerWidth - barWidth - VIEWPORT_PADDING, start.barX + deltaX),
      );
      const newY = Math.max(
        VIEWPORT_PADDING,
        Math.min(window.innerHeight - barHeight - VIEWPORT_PADDING, start.barY + deltaY),
      );

      bar.style.left = `${newX}px`;
      bar.style.top = `${newY}px`;
      bar.style.right = "auto";
      bar.style.bottom = "auto";
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (didDrag) {
        const r = bar.getBoundingClientRect();
        const finalPos = { x: r.left, y: r.top, r: window.innerWidth - r.right };

        position = finalPos;
        isDragging = false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPos));

        justDragged.current = true;
        requestAnimationFrame(() => {
          setTimeout(() => {
            justDragged.current = false;
          }, 0);
        });
      }

      dragStart = null;
      dragCleanup = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    dragCleanup = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }

  return {
    get position() { return position; },
    get isDragging() { return isDragging; },
    /** True for one frame after a drag ends — use to suppress click handlers. */
    justDragged,
    handleMouseDown,
    init,
  };
}
