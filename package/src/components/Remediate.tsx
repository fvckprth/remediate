import { useReducer, useCallback, useState, useEffect } from "react";
import type {
  WidgetState, WidgetAction, WidgetMode, FeedbackItem,
  AnnotationItem, AnnotationPriority, RemediateProps,
  TextNoteItem, VoiceNoteItem,
} from "../types";
import { DEFAULT_MARKER_COLOR } from "../types";
import type { OutputDetail } from "../types";
import { nanoid } from "../utils/nanoid";
import { isVideoRecordingSupported } from "../utils/capture-video";
import { useCapture } from "../hooks/useCapture";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import { useSubmission } from "../hooks/useSubmission";
import { useConsoleCapture } from "../hooks/useConsoleCapture";
import { useWidgetKeyboard } from "../hooks/useWidgetKeyboard";
import { usePanelPosition } from "../hooks/usePanelPosition";
import { FeedbackBar } from "./toolbar/FeedbackBar";
import { SettingsPanel } from "./settings/SettingsPanel";
import { SubMenu } from "./shared/SubMenu";
import { AnnotateMode } from "./annotate/AnnotateMode";
import { AnnotationMarkers } from "./annotate/AnnotationMarkers";
import { AnnotationPopover } from "./annotate/AnnotationPopover";
import { AreaSelector } from "./capture/AreaSelector";
import { CapturePanel } from "./capture/CapturePanel";
import { VideoToolbar } from "./capture/VideoToolbar";
import { VoicePanel } from "./notes/VoicePanel";
import { TextNotePanel } from "./notes/TextNotePanel";
import { ReviewPanel } from "./review/ReviewPanel";
import { PanelHost } from "./shared/PanelHost";
import { CheckLine, CameraFill, CamcorderFill, Message4Fill, VoiceFill } from "./icons";
import "../styles/widget.css";

const STORAGE_KEY_BLOCK = "rm_block_interactions";
const STORAGE_KEY_CLEAR = "rm_clear_after_send";
const STORAGE_KEY_OUTPUT = "rm_output_detail";
const STORAGE_KEY_THEME = "rm_theme";

function getInitialState(): WidgetState {
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

function widgetReducer(state: WidgetState, action: WidgetAction): WidgetState {
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

export function Remediate({ onSubmit, endpoint, metadata: extraMetadata, onError }: RemediateProps) {
  const [state, dispatch] = useReducer(widgetReducer, undefined, () => {
    return getInitialState();
  });

  // Hooks — useCapture before useWidgetKeyboard (keyboard receives cancelVideoRecording)
  const {
    screenshotBlob, setScreenshotBlob,
    videoBlob, setVideoBlob,
    isVideoReady,
    cancelVideoRecording,
    handleAreaSelected, handleStopVideoRecording, handleAddCapture,
  } = useCapture({ mode: state.mode, pendingCapture: state.pendingCapture, dispatch });

  const { voiceRecorderRef, startVoice, handleAddVoiceNote } = useVoiceRecording({ dispatch });

  const consoleCaptureRef = useConsoleCapture(state.mode);

  const { isSubmitting, handleSubmit } = useSubmission({
    state, dispatch, onSubmit, endpoint, extraMetadata, onError, consoleCaptureRef,
  });

  // Auto-reset after success/error
  useEffect(() => {
    if (state.mode === "success") {
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "active" }), 2000);
      return () => clearTimeout(timer);
    }
    if (state.mode === "submitError") {
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "reviewing" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.mode, state.clearAfterSend, dispatch]);

  useWidgetKeyboard({
    mode: state.mode,
    settingsOpen: state.settingsOpen,
    previewingItemId: state.previewingItemId,
    dispatch,
    cancelVideoRecording,
  });

  // Bar position (synced from FeedbackBar via callback)
  const [barPosition, setBarPosition] = useState<{ x: number; y: number } | null>(null);
  const [anchorX, setAnchorX] = useState<number | null>(null);

  const showCaptureMenu = state.mode === "captureMenu";
  const showNoteMenu = state.mode === "noteMenu" || state.mode === "voiceNote";
  const showAreaSelector =
    state.mode === "capturePhoto" ||
    state.mode === "captureVideo" ||
    state.mode === "captureDragging";
  const showTextNote = state.mode === "textNote";
  const showVoicePanel = state.mode === "voiceRecording" || state.mode === "voicePreview";

  const isPhotoFlow =
    state.mode === "capturePreview" && state.pendingCapture?.variant === "photo";
  const isVideoFlow = state.mode === "videoRecording";
  const isVideoPreview =
    state.mode === "capturePreview" && state.pendingCapture?.variant === "video";

  const isIdle = state.mode === "idle";
  const isSuccess = state.mode === "success";
  const isError = state.mode === "submitError";

  // Panel routing: derive active panel key and width from state.
  // Width is co-located with key so adding a panel is a single edit.
  const PANEL_CONFIG: Record<string, number> = {
    settings: 240, captureMenu: 176, noteMenu: 176,
    capturePhoto: 280, captureVideo: 280, textNote: 280,
    voicePanel: 240, review: 280, submitError: 200,
  };

  const panelKey = state.settingsOpen && !isIdle && !isSuccess && !isError
    ? "settings"
    : showCaptureMenu ? "captureMenu"
    : showNoteMenu ? "noteMenu"
    : isPhotoFlow ? "capturePhoto"
    : isVideoPreview ? "captureVideo"
    : showTextNote ? "textNote"
    : showVoicePanel ? "voicePanel"
    : state.mode === "reviewing" ? "review"
    : isError ? "submitError"
    : null;

  const hasContent = state.items.length > 0;

  const { panelPosition, panelBelow } = usePanelPosition({
    panelKey, panelWidth: PANEL_CONFIG[panelKey ?? ""] ?? 176, barPosition, anchorX,
  });

  const annotations = state.items.filter(
    (i): i is AnnotationItem => i.type === "annotation"
  );

  const handleAddAnnotation = useCallback((ann: AnnotationItem) => {
    dispatch({ type: "ADD_ITEM", item: ann });
  }, []);

  const handleUpdateAnnotation = useCallback(
    (id: string, note: string, priority: AnnotationPriority) => {
      dispatch({ type: "UPDATE_ANNOTATION", id, note, priority });
    },
    []
  );

  const handleAddTextNote = useCallback((text: string, priority: AnnotationPriority) => {
    const item: FeedbackItem = {
      id: `txt_${nanoid(8)}`,
      index: 0,
      type: "textNote",
      text,
      timestamp: Date.now(),
      additionalText: "",
      priority,
    };
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const anchorToButton = useCallback((ariaLabel: string) => {
    const btn = document.querySelector(`[data-remediate-widget] button[aria-label="${ariaLabel}"]`) as HTMLElement | null;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setAnchorX(rect.left + rect.width / 2);
    }
  }, []);

  // --- Preview wiring helpers (shared across panel branches) ---

  const isPreviewing = !!state.previewingItemId;
  const submitLabel = isPreviewing ? "Save" : "Add";

  function findPreview<T extends FeedbackItem>(type: T["type"]): T | undefined {
    if (!state.previewingItemId) return undefined;
    return state.items.find(i => i.id === state.previewingItemId && i.type === type) as T | undefined;
  }

  function previewSave(fields: Partial<FeedbackItem>) {
    dispatch({ type: "UPDATE_ITEM", id: state.previewingItemId!, item: fields });
    anchorToButton("Review and submit");
  }

  function previewCancel(cleanup?: () => void) {
    cleanup?.();
    if (isPreviewing) anchorToButton("Review and submit");
    dispatch({ type: "SET_MODE", mode: isPreviewing ? "reviewing" : "active" });
  }

  return (
    <div data-remediate-widget="" data-remediate-theme={state.widgetTheme} style={{ '--rm-accent': state.markerColor } as React.CSSProperties} suppressHydrationWarning>
      <AnnotationMarkers
        annotations={annotations}
        markerColor={state.markerColor}
        activePopoverAnnotationId={state.activePopoverAnnotationId}
        onBadgeClick={(id: string) => dispatch({ type: "SET_ACTIVE_POPOVER", id: id || null })}
      />

      {!isError && (
        <FeedbackBar
          isIdle={isIdle}
          onActivate={() => dispatch({ type: "ACTIVATE" })}
          mode={state.mode}
          markerColor={state.markerColor}
          itemCount={state.items.length}
          hasContent={hasContent}
          onSetMode={(mode: WidgetMode) => dispatch({ type: "SET_MODE", mode })}
          onClose={() => dispatch({ type: "CLOSE" })}
          onReview={() => dispatch({ type: "REVIEW" })}
          onDeleteAll={() => dispatch({ type: "CLEAR_ALL" })}
          onPositionChange={setBarPosition}
          onAnchorX={setAnchorX}
          panelOpen={panelKey !== null}
        />
      )}

      <PanelHost panelKey={panelKey} position={panelPosition} below={panelBelow} pill={state.mode === "voiceRecording"}>
        {panelKey === "settings" && (
          <SettingsPanel
            blockInteractions={state.blockInteractions}
            widgetTheme={state.widgetTheme}

            onSetBlock={(blocked: boolean) => dispatch({ type: "SET_BLOCK_INTERACTIONS", blocked })}
            onSetTheme={(theme: "light" | "dark") => dispatch({ type: "SET_THEME", theme })}
          />
        )}

        {panelKey === "captureMenu" && (
          <SubMenu
            items={[
              { id: "photo", label: "Screenshot", icon: <CameraFill size={20} />, onClick: () => dispatch({ type: "SET_MODE", mode: "capturePhoto" }) },
              { id: "video", label: "Record", icon: <CamcorderFill size={20} />, onClick: () => dispatch({ type: "SET_MODE", mode: "captureVideo" }), disabled: !isVideoRecordingSupported(), disabledReason: "Not supported in this browser" },
            ]}
            onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })}
          />
        )}

        {panelKey === "noteMenu" && (
          <SubMenu
            items={[
              { id: "text", label: "Text", icon: <Message4Fill size={20} />, onClick: () => dispatch({ type: "SET_MODE", mode: "textNote" }) },
              { id: "voice", label: "Voice", icon: <VoiceFill size={20} />, onClick: () => { dispatch({ type: "SET_MODE", mode: "voiceNote" }); startVoice(); }, disabled: state.mode === "voiceNote" },
            ]}
            onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })}
          />
        )}

        {panelKey === "capturePhoto" && (
          <CapturePanel
            variant="photo"
            area={state.pendingCapture?.area ?? null}
            isRecording={false}
            screenshotBlob={screenshotBlob}
            initialText={findPreview<import("../types").PhotoCapture>("photo")?.additionalText}
            initialPriority={findPreview<import("../types").PhotoCapture>("photo")?.priority}
            submitLabel={submitLabel}
            onStartRecording={() => {}}
            onStopRecording={() => {}}
            onAdd={isPreviewing
              ? (text, priority) => previewSave({ additionalText: text, priority })
              : handleAddCapture}
            onCancel={() => previewCancel(() => {
              setScreenshotBlob(null);
              dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
            })}
          />
        )}

        {panelKey === "captureVideo" && (
          <CapturePanel
            variant="video"
            area={state.pendingCapture?.area ?? null}
            isRecording={false}
            screenshotBlob={videoBlob}
            initialText={findPreview<import("../types").VideoCapture>("video")?.additionalText}
            initialPriority={findPreview<import("../types").VideoCapture>("video")?.priority}
            submitLabel={submitLabel}
            onStartRecording={() => {}}
            onStopRecording={() => {}}
            onAdd={isPreviewing
              ? (text, priority) => previewSave({ additionalText: text, priority })
              : handleAddCapture}
            onCancel={() => previewCancel(() => {
              setVideoBlob(null);
              dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
            })}
          />
        )}

        {panelKey === "textNote" && (
          <TextNotePanel
            initialText={findPreview<TextNoteItem>("textNote")?.text}
            initialPriority={findPreview<TextNoteItem>("textNote")?.priority}
            submitLabel={submitLabel}
            onAdd={isPreviewing
              ? (text, priority) => previewSave({ text, priority })
              : handleAddTextNote}
            onCancel={() => previewCancel()}
          />
        )}

        {panelKey === "voicePanel" && (
          <VoicePanel
            mode={state.mode}
            recorder={voiceRecorderRef.current}
            initialText={findPreview<VoiceNoteItem>("voiceNote")?.additionalText}
            initialPriority={findPreview<VoiceNoteItem>("voiceNote")?.priority}
            submitLabel={submitLabel}
            onSetMode={(mode: WidgetMode) => dispatch({ type: "SET_MODE", mode })}
            onAdd={isPreviewing
              ? (_duration, _blob, text, priority) => previewSave({ additionalText: text, priority })
              : handleAddVoiceNote}
            onCancel={() => previewCancel()}
          />
        )}

        {panelKey === "review" && (
          <ReviewPanel
            items={state.items}
            isSubmitting={isSubmitting}
            onRemoveItem={(id: string) => dispatch({ type: "REMOVE_ITEM", id })}
            onPreviewItem={(id: string) => {
              const item = state.items.find(i => i.id === id);
              if (!item) return;
              // Re-anchor panel to the relevant toolbar button
              const label =
                item.type === "photo" || item.type === "video" ? "Capture mode"
                : item.type === "textNote" || item.type === "voiceNote" ? "Note mode"
                : item.type === "annotation" ? "Annotate mode"
                : null;
              if (label) anchorToButton(label);
              if (item.type === "photo") setScreenshotBlob(item.blob ?? null);
              if (item.type === "video") setVideoBlob(item.blob ?? null);
              dispatch({ type: "PREVIEW_ITEM", id });
            }}
            onBack={() => dispatch({ type: "SET_MODE", mode: "active" })}
            onSubmit={handleSubmit}
          />
        )}

        {panelKey === "submitError" && (
          <div className="rm-success rm-submit-error">
            <div className="rm-success__icon rm-submit-error__icon">!</div>
            <span className="rm-success__text">Failed to send</span>
          </div>
        )}
      </PanelHost>

      {showAreaSelector && (
        <AreaSelector
          onSelect={handleAreaSelected}
          onCancel={() => dispatch({ type: "SET_MODE", mode: "captureMenu" })}
        />
      )}

      {isVideoFlow && (
        <VideoToolbar
          area={state.pendingCapture?.area ?? null}
          isReady={isVideoReady}
          onStopRecording={handleStopVideoRecording}
          onCancel={cancelVideoRecording}
        />
      )}

      {state.mode === "annotating" && (
        <AnnotateMode
          annotations={annotations}
          markerColor={state.markerColor}
          blockInteractions={state.blockInteractions}
          nextIndex={state.items.length + 1}
          onAddAnnotation={handleAddAnnotation}
        />
      )}

      {/* Edit popover for badge clicks (any mode) */}
      {(() => {
        const ann = state.activePopoverAnnotationId
          ? annotations.find((a) => a.id === state.activePopoverAnnotationId)
          : null;
        if (!ann) return null;
        let anchorRect: DOMRect | null = null;
        try {
          const el = document.querySelector(ann.element.selector);
          if (el) {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + ann.clickOffset.x;
            const cy = rect.top + ann.clickOffset.y;
            anchorRect = new DOMRect(cx - 1, cy - 1, 2, 2);
          }
        } catch { /* selector may not match */ }
        if (!anchorRect) return null;
        return (
          <AnnotationPopover
            elementName={ann.element.name}
            selector={ann.element.selector}
            computedStyles={ann.element.computedStyles}
            initialNote={ann.note}
            initialPriority={ann.priority}
            annotationIndex={ann.index}
            anchorRect={anchorRect}
            onSave={(note, priority) => {
              handleUpdateAnnotation(ann.id, note, priority);
              dispatch({ type: "SET_ACTIVE_POPOVER", id: null });
              if (state.previewingItemId) {
                dispatch({ type: "SET_MODE", mode: "reviewing" });
              }
            }}
            onCancel={() => {
              dispatch({ type: "SET_ACTIVE_POPOVER", id: null });
              if (state.previewingItemId) {
                dispatch({ type: "SET_MODE", mode: "reviewing" });
              }
            }}
          />
        );
      })()}
    </div>
  );
}
