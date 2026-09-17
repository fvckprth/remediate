import { useState, useRef, useEffect, useLayoutEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import type { AnnotationPriority } from "../../types";
import { NoteComposer } from "../shared/NoteComposer";
import { PanelActions } from "../shared/PanelActions";

interface AnnotationPopoverProps {
  elementName: string;
  initialNote: string;
  initialPriority: AnnotationPriority;
  anchorRect: DOMRect;
  onSave: (note: string, priority: AnnotationPriority) => void;
  onCancel: () => void;
  placeholder?: string;
  submitLabel?: string;
}

export interface AnnotationPopoverRef {
  shake: () => void;
}

const POPOVER_WIDTH = 280;
const GAP = 12;

export const AnnotationPopover = forwardRef<AnnotationPopoverRef, AnnotationPopoverProps>(function AnnotationPopover({
  elementName,
  initialNote,
  initialPriority,
  anchorRect,
  onSave,
  onCancel,
  placeholder,
  submitLabel = "Add",
}, ref) {
  const [note, setNote] = useState(initialNote);
  const [priority, setPriority] = useState<AnnotationPriority>(initialPriority);
  const [isShaking, setIsShaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [position, setPosition] = useState({ top: undefined as number | undefined, bottom: undefined as number | undefined, left: 0 });
  const placementRef = useRef<"above" | "below" | null>(null);

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
      placementRef.current = anchorRect.top - height - GAP < 10 ? "below" : "above";
    }

    let left = anchorRect.left + anchorRect.width / 2 - POPOVER_WIDTH / 2;
    if (left < 10) left = 10;
    if (left + POPOVER_WIDTH > window.innerWidth - 10) {
      left = window.innerWidth - POPOVER_WIDTH - 10;
    }

    if (placementRef.current === "below") {
      setPosition({ top: anchorRect.bottom + GAP, bottom: undefined, left });
    } else {
      setPosition({ top: undefined, bottom: window.innerHeight - anchorRect.top + GAP, left });
    }
  }, [anchorRect]);

  useLayoutEffect(() => {
    reposition();
  }, [reposition]);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => {
      clearTimeout(timer);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const hasContent = note.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (hasContent) onSave(note.trim(), priority);
  }, [hasContent, note, priority, onSave]);

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Annotate ${elementName}`}
      className={`rm-popover${isShaking ? " rm-popover--shake" : ""}`}
      data-remediate-widget=""
      data-placement={placementRef.current ?? undefined}
      style={{ top: position.top, bottom: position.bottom, left: position.left, width: POPOVER_WIDTH }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rm-popover__header">
        <span className="rm-popover__header-meta">{elementName}</span>
      </div>

      <NoteComposer
        ref={textareaRef}
        value={note}
        onChange={setNote}
        priority={priority}
        onPriorityChange={setPriority}
        placeholder={placeholder ?? "What should change?"}
        onSubmit={handleSubmit}
        maxLength={2000}
      />

      <div className="rm-popover__footer">
        <PanelActions onCancel={onCancel} onSubmit={handleSubmit} submitLabel={submitLabel} disabled={!hasContent} />
      </div>
    </div>
  );
});
