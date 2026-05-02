import { useState, useRef, useEffect, useCallback } from "react";
import { PriorityButton } from "../shared/PriorityButton";
import { Delete2Fill } from "../icons";
import type { AnnotationPriority } from "../../types";

interface TextNotePanelProps {
  initialText?: string;
  initialPriority?: AnnotationPriority;
  submitLabel?: string;
  onAdd: (text: string, priority: AnnotationPriority) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function TextNotePanel({ initialText, initialPriority, submitLabel = "Add", onAdd, onCancel, onDelete }: TextNotePanelProps) {
  const [text, setText] = useState(initialText ?? "");
  const [priority, setPriority] = useState<AnnotationPriority>(initialPriority ?? "none");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    onAdd(text.trim(), priority);
  }, [text, priority, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="rm-text-panel" data-remediate-widget="">
      <p className="rm-text-panel__title">Text</p>

      <div className="rm-input-group">
        <textarea
          ref={textareaRef}
          className="rm-input-group__textarea"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          onKeyDown={handleKeyDown}
        />
        <div className="rm-input-group__footer">
          <PriorityButton priority={priority} onCycle={setPriority} />
        </div>
      </div>

      <div className="rm-text-panel__footer">
        {onDelete && (
          <button className="rm-text-panel__delete" onClick={onDelete} aria-label="Delete">
            <Delete2Fill size={20} />
          </button>
        )}
        <div className="rm-text-panel__actions">
          <button className="rm-text-panel__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="rm-text-panel__submit"
            style={{ opacity: text.trim() ? 1 : 0.4 }}
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
