import { useRef, useEffect, useCallback } from "react";
import type { AnnotationPriority, TextNoteItem } from "../../types";
import { NoteComposer } from "../shared/NoteComposer";
import { PanelActions } from "../shared/PanelActions";
import { useNoteDraft } from "../../hooks/useNoteDraft";

interface TextNotePanelProps {
  onAdd: (text: string, priority: AnnotationPriority) => void;
  onCancel: () => void;
}

export function TextNotePanel({ onAdd, onCancel }: TextNotePanelProps) {
  const draft = useNoteDraft<TextNoteItem>("textNote", (item) => item.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus after the panel's entrance animation has started (two frames).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => textareaRef.current?.focus());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const hasContent = draft.text.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (hasContent) onAdd(draft.text.trim(), draft.priority);
  }, [hasContent, draft.text, draft.priority, onAdd]);

  return (
    <div className="rm-text-panel" data-remediate-widget="">
      <p className="rm-text-panel__title">Text</p>

      <NoteComposer
        ref={textareaRef}
        value={draft.text}
        onChange={draft.setText}
        priority={draft.priority}
        onPriorityChange={draft.setPriority}
        placeholder="What's on your mind?"
        onSubmit={handleSubmit}
      />

      <div className="rm-text-panel__footer">
        <PanelActions onCancel={onCancel} onSubmit={handleSubmit} submitLabel={draft.submitLabel} disabled={!hasContent} />
      </div>
    </div>
  );
}
