import { createContext, useContext } from "react";
import type { WidgetState, WidgetAction, FeedbackItem } from "../types";

interface WidgetContextValue {
  state: WidgetState;
  dispatch: React.Dispatch<WidgetAction>;
}

const WidgetContext = createContext<WidgetContextValue | null>(null);

export const WidgetProvider = WidgetContext.Provider;

export function useWidget(): WidgetContextValue {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error("useWidget must be used within WidgetProvider");
  return ctx;
}

export function usePreview<T extends FeedbackItem>(type: T["type"]): T | undefined {
  const { state } = useWidget();
  if (!state.previewingItemId) return undefined;
  return state.items.find(i => i.id === state.previewingItemId && i.type === type) as T | undefined;
}
