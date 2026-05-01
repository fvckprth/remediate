import { useState, useRef, useEffect, useLayoutEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { PriorityButton } from "../shared/PriorityButton";
import type { AnnotationPriority } from "../../types";

interface AnnotationPopoverProps {
  elementName: string;
  selector: string;
  computedStyles: Record<string, string>;
  initialNote: string;
  initialPriority: AnnotationPriority;
  annotationIndex: number;
  anchorRect: DOMRect;
  onSave: (note: string, priority: AnnotationPriority) => void;
  onCancel: () => void;
  placeholder?: string;
}

export interface AnnotationPopoverRef {
  shake: () => void;
}

export const AnnotationPopover = forwardRef<AnnotationPopoverRef, AnnotationPopoverProps>(function AnnotationPopover({
  elementName,
  selector,
  computedStyles,
  initialNote,
  initialPriority,
  annotationIndex,
  anchorRect,
  onSave,
  onCancel,
  placeholder,
}, ref) {
  const [note, setNote] = useState(initialNote);
  const [priority, setPriority] = useState<AnnotationPriority>(initialPriority);
  const [isShaking, setIsShaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [position, setPosition] = useState({ top: undefined as number | undefined, bottom: undefined as number | undefined, left: 0 });
  const placementRef = useRef<"above" | "below" | null>(null);

  const popoverWidth = 280;
  const gap = 12;

  useImperativeHandle(ref, () => ({
    shake: () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      setIsShaking(true);
      shakeTimerRef.current = setTimeout(() => {
        setIsShaking(false);
        textareaRef.current?.focus();
      }, 250);
    },
  }));

  const reposition = useCallback(() => {
    const el = popoverRef.current;
    if (!el) return;
    const height = el.offsetHeight;

    // Lock placement side on first render
    if (placementRef.current === null) {
      placementRef.current = anchorRect.top - height - gap < 10 ? "below" : "above";
    }

    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
    if (left < 10) left = 10;
    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }

    if (placementRef.current === "below") {
      setPosition({ top: anchorRect.bottom + gap, bottom: undefined, left });
    } else {
      setPosition({ top: undefined, bottom: window.innerHeight - anchorRect.top + gap, left });
    }
  }, [anchorRect]);

  useLayoutEffect(() => {
    reposition();
  }, [reposition]);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (note.trim()) onSave(note.trim(), priority);
  }, [note, priority, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const hasContent = note.trim().length > 0;

  return (
    <div
      ref={popoverRef}
      className={`rm-popover${isShaking ? " rm-popover--shake" : ""}`}
      data-remediate-widget=""
      data-placement={placementRef.current ?? undefined}
      style={{ top: position.top, bottom: position.bottom, left: position.left, width: popoverWidth }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <div className="rm-popover__header">
        <span className="rm-popover__header-meta">
          {elementName}
        </span>
      </div>

      {/* Textarea + priority group */}
      <div className="rm-input-group">
        <textarea
          ref={textareaRef}
          className="rm-input-group__textarea"
          placeholder={placeholder ?? "What should change?"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <div className="rm-input-group__footer">
          <PriorityButton priority={priority} onCycle={setPriority} />
        </div>
      </div>

      {/* Actions footer */}
      <div className="rm-popover__footer">
        <div className="rm-popover__actions">
          <button className="rm-popover__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="rm-popover__submit"
            onClick={() => hasContent && onSave(note.trim(), priority)}
            disabled={!hasContent}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});
