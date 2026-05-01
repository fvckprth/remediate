import { useState, useCallback, useRef } from "react";

interface AreaSelectorProps {
  onSelect: (area: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

function toRect(drag: DragState) {
  const x = Math.min(drag.startX, drag.currentX);
  const y = Math.min(drag.startY, drag.currentY);
  const width = Math.abs(drag.currentX - drag.startX);
  const height = Math.abs(drag.currentY - drag.startY);
  return { x, y, width, height };
}

export function AreaSelector({ onSelect, onCancel }: AreaSelectorProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDrag({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag) return;
    setDrag((prev) => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
  }, [drag]);

  const handleMouseUp = useCallback(() => {
    if (!drag) return;
    const rect = toRect(drag);
    if (rect.width < 10 || rect.height < 10) {
      setDrag(null);
      return;
    }
    setDrag(null);
    onSelect(rect);
  }, [drag, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDrag(null);
      onCancel();
    }
  }, [onCancel]);

  const rect = drag ? toRect(drag) : null;

  return (
    <div
      ref={overlayRef}
      className="rm-area-selector"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-remediate-widget=""
    >
      {/* Dim overlay with cutout */}
      {rect && rect.width > 0 && rect.height > 0 && (
        <div
          className="rm-area-selector__dim"
          style={{
            clipPath: `polygon(
              0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
              ${rect.x}px ${rect.y}px,
              ${rect.x}px ${rect.y + rect.height}px,
              ${rect.x + rect.width}px ${rect.y + rect.height}px,
              ${rect.x + rect.width}px ${rect.y}px,
              ${rect.x}px ${rect.y}px
            )`,
          }}
        />
      )}

      {/* Selection rectangle */}
      {rect && rect.width > 0 && rect.height > 0 && (
        <div
          className="rm-area-selector__rect"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        >
          <span className="rm-area-selector__size">
            {Math.round(rect.width)} &times; {Math.round(rect.height)}
          </span>
        </div>
      )}

    </div>
  );
}
