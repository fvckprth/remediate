import { forwardRef } from "react";
import type { AnnotationPriority } from "../../types";
import { PriorityButton } from "./PriorityButton";

interface NoteComposerProps {
  value: string;
  onChange: (value: string) => void;
  priority: AnnotationPriority;
  onPriorityChange: (priority: AnnotationPriority) => void;
  placeholder: string;
  /** Called on Enter (without Shift). */
  onSubmit?: () => void;
  rows?: number;
  maxLength?: number;
  tabIndex?: number;
  style?: React.CSSProperties;
}

/** Textarea + priority cycler. Shared by every panel that takes a note. */
export const NoteComposer = forwardRef<HTMLTextAreaElement, NoteComposerProps>(function NoteComposer(
  { value, onChange, priority, onPriorityChange, placeholder, onSubmit, rows = 3, maxLength, tabIndex, style },
  ref,
) {
  return (
    <div className="rm-input-group" style={style}>
      <textarea
        ref={ref}
        className="rm-input-group__textarea"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        tabIndex={tabIndex}
        aria-label={placeholder}
        onKeyDown={(e) => {
          if (!onSubmit || e.nativeEvent.isComposing) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="rm-input-group__footer">
        <PriorityButton priority={priority} onCycle={onPriorityChange} />
      </div>
    </div>
  );
});
