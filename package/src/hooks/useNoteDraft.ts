import { useState } from "react";
import type { AnnotationPriority, FeedbackItem } from "../types";
import { usePreview, useWidget } from "../state/WidgetContext";

/**
 * Local draft for a panel's note + priority, seeded from the item being
 * previewed (edit) when there is one. `submitLabel` flips to "Save" in that case.
 */
export function useNoteDraft<T extends FeedbackItem>(
  type: T["type"],
  initialText: (item: T) => string,
) {
  const { state } = useWidget();
  const preview = usePreview<T>(type);
  const [text, setText] = useState(preview ? initialText(preview) : "");
  const [priority, setPriority] = useState<AnnotationPriority>(preview?.priority ?? "none");
  return {
    text, setText,
    priority, setPriority,
    isEditing: state.previewingItemId !== null,
    submitLabel: state.previewingItemId ? "Save" : "Add",
  };
}
