import type {
  WidgetState, WidgetAction, FeedbackItem,
} from "../types";
import type { OutputDetail } from "../types";
import { DEFAULT_MARKER_COLOR } from "../types";

const STORAGE_KEY_BLOCK = "rm_block_interactions";
const STORAGE_KEY_CLEAR = "rm_clear_after_send";
const STORAGE_KEY_OUTPUT = "rm_output_detail";
const STORAGE_KEY_THEME = "rm_theme";

export function getInitialState(): WidgetState {
  const markerColor = DEFAULT_MARKER_COLOR;
  let blockInteractions = false;
  let clearAfterSend = false;
  let outputDetail: OutputDetail = "standard";
  let widgetTheme: "light" | "dark" = "dark";

  if (typeof window !== "undefined") {
    const savedBlock = localStorage.getItem(STORAGE_KEY_BLOCK);
    if (savedBlock === "true") blockInteractions = true;
    const savedClear = localStorage.getItem(STORAGE_KEY_CLEAR);
    if (savedClear === "true") clearAfterSend = true;
    const savedOutput = localStorage.getItem(STORAGE_KEY_OUTPUT);
    if (savedOutput === "detailed") outputDetail = "detailed";
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme === "light" || savedTheme === "dark") widgetTheme = savedTheme;
  }

  return {
    mode: "idle",
    items: [],
    markerColor,
    blockInteractions,
    clearAfterSend,
    outputDetail,
    widgetTheme,
    settingsOpen: false,
    activePopoverAnnotationId: null,
    pendingCapture: null,
    previewingItemId: null,
  };
}

export function widgetReducer(state: WidgetState, action: WidgetAction): WidgetState {
  switch (action.type) {
    case "ACTIVATE":
      return { ...state, mode: "active", settingsOpen: false };

    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        settingsOpen: false,
        activePopoverAnnotationId: null,
        previewingItemId: action.mode === "reviewing" || action.mode === "active" ? null : state.previewingItemId,
      };

    case "TOGGLE_SETTINGS":
      return {
        ...state,
        settingsOpen: !state.settingsOpen,
        mode: !state.settingsOpen ? "active" : state.mode,
      };

    case "CLOSE_SETTINGS":
      return { ...state, settingsOpen: false };

    case "CLOSE":
      return {
        ...state,
        mode: "idle" as const,
        settingsOpen: false,
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

    case "SET_BLOCK_INTERACTIONS":
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_BLOCK, String(action.blocked));
      return { ...state, blockInteractions: action.blocked };

    case "SET_THEME":
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_THEME, action.theme);
      return { ...state, widgetTheme: action.theme };

    case "SET_CLEAR_AFTER_SEND":
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_CLEAR, String(action.enabled));
      return { ...state, clearAfterSend: action.enabled };

    case "SET_OUTPUT_DETAIL":
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_OUTPUT, action.level);
      return { ...state, outputDetail: action.level };

    case "REVIEW":
      return { ...state, mode: "reviewing", settingsOpen: false, activePopoverAnnotationId: null };

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
        blockInteractions: state.blockInteractions,
        clearAfterSend: state.clearAfterSend,
        outputDetail: state.outputDetail,
        widgetTheme: state.widgetTheme,
      };

    default:
      return state;
  }
}
