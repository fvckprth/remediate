import { getContext, setContext } from "svelte";
import type { WidgetState, WidgetAction, FeedbackItem } from "../types";
import { widgetReducer, getInitialState } from "./widget-reducer";

/**
 * Reactive replacement for the React `useReducer` + `WidgetContext` pair.
 *
 * Holds the widget state in a rune (`$state`) and exposes `dispatch`, which
 * runs the same pure `widgetReducer` used by the React version. Components read
 * `store.state.*` reactively and call `store.dispatch(action)`.
 */
export class WidgetStore {
  state = $state<WidgetState>(getInitialState());

  dispatch = (action: WidgetAction): void => {
    this.state = widgetReducer(this.state, action);
  };

  /** Mirror of the React `usePreview` hook. */
  preview<T extends FeedbackItem>(type: T["type"]): T | undefined {
    const { previewingItemId, items } = this.state;
    if (!previewingItemId) return undefined;
    return items.find((i) => i.id === previewingItemId && i.type === type) as
      | T
      | undefined;
  }
}

const KEY = Symbol("remediate-widget");

export function setWidgetStore(store: WidgetStore): void {
  setContext(KEY, store);
}

export function getWidgetStore(): WidgetStore {
  const store = getContext<WidgetStore | undefined>(KEY);
  if (!store) {
    throw new Error("getWidgetStore must be used within the Remediate widget");
  }
  return store;
}
