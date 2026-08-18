import type {
  WidgetState, WidgetAction, FeedbackItem,
} from "../types";
import { DEFAULT_MARKER_COLOR } from "../types";

export function getInitialState(): WidgetState {
  return {
    mode: "idle",
    items: [],
    markerColor: DEFAULT_MARKER_COLOR,
    activePopoverAnnotationId: null,
    pendingCapture: null,
    previewingItemId: null,
  };
}

export function widgetReducer(state: WidgetState, action: WidgetAction): WidgetState {
  switch (action.type) {
    case "ACTIVATE":
      return { ...state, mode: "active" };

    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        activePopoverAnnotationId: null,
        previewingItemId: action.mode === "reviewing" || action.mode === "active" ? null : state.previewingItemId,
      };

    case "CLOSE":
      return {
        ...state,
        mode: "idle" as const,
        activePopoverAnnotationId: null,
        pendingCapture: null,
        previewingItemId: null,
      };

    case "ADD_ITEM": {
      const items = [...state.items, { ...action.item, index: state.items.length + 1 }];
      return {
        ...state,
        items,
        mode: action.item.type === "annotation" ? state.mode : "active",
        pendingCapture: null,
        activePopoverAnnotationId: null,
        previewingItemId: null,
      };
    }

    case "REMOVE_ITEM": {
      const filtered = state.items
        .filter((i) => i.id !== action.id)
        .map((i, idx) => ({ ...i, index: idx + 1 }));
      return {
        ...state,
        items: filtered,
        activePopoverAnnotationId: null,
        previewingItemId: state.previewingItemId === action.id ? null : state.previewingItemId,
      };
    }

    case "SET_ACTIVE_POPOVER":
      return { ...state, activePopoverAnnotationId: action.id };

    case "UPDATE_ANNOTATION": {
      const items = state.items.map((item) =>
        item.id === action.id && item.type === "annotation"
          ? { ...item, note: action.note, priority: action.priority }
          : item
      );
      return { ...state, items, activePopoverAnnotationId: null };
    }

    case "SET_PENDING_CAPTURE":
      return { ...state, pendingCapture: action.capture };

    case "REVIEW":
      return { ...state, mode: "reviewing", activePopoverAnnotationId: null };

    case "SUBMIT_SUCCESS":
      return { ...state, mode: "success", items: [], pendingCapture: null, previewingItemId: null };

    case "SUBMIT_ERROR":
      return { ...state, mode: "submitError" };

    case "CLEAR_ALL":
      return { ...state, items: [], mode: "active", activePopoverAnnotationId: null, pendingCapture: null, previewingItemId: null };

    case "UPDATE_ITEM": {
      const items = state.items.map(i =>
        i.id === action.id ? { ...i, ...action.item, id: i.id, index: i.index } as FeedbackItem : i
      );
      return { ...state, items, mode: "reviewing", pendingCapture: null, previewingItemId: null };
    }

    case "PREVIEW_ITEM": {
      const item = state.items.find(i => i.id === action.id);
      if (!item) return state;
      switch (item.type) {
        case "photo":
          return { ...state, mode: "capturePreview", previewingItemId: action.id,
            pendingCapture: { area: item.area, variant: "photo" } };
        case "video":
          return { ...state, mode: "capturePreview", previewingItemId: action.id,
            pendingCapture: { area: item.area, variant: "video", recordingDuration: item.duration } };
        case "textNote":
          return { ...state, mode: "textNote", previewingItemId: action.id };
        case "voiceNote":
          return { ...state, mode: "voicePreview", previewingItemId: action.id };
        case "annotation":
          return { ...state, mode: "annotating", previewingItemId: action.id,
            activePopoverAnnotationId: action.id };
        default:
          return state;
      }
    }

    case "RESET":
      return {
        ...getInitialState(),
        markerColor: state.markerColor,
      };

    default:
      return state;
  }
}
