import { useReducer, useCallback, useState, useEffect } from "react";
import type {
  WidgetMode, FeedbackItem,
  AnnotationItem, AnnotationPriority, RemediateProps,
  TextNoteItem, VoiceNoteItem,
} from "../types";
import { nanoid } from "../utils/nanoid";
import { isVideoRecordingSupported } from "../utils/capture-video";
import { widgetReducer, getInitialState } from "../state/widget-reducer";
import { derivePanelKey, PANEL_WIDTHS } from "../state/widget-machine";
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

export function Remediate({ onSubmit, endpoint, metadata: extraMetadata, onError }: RemediateProps) {
  const [state, dispatch] = useReducer(widgetReducer, undefined, () => {
    return getInitialState();
  });

  // Hooks — useCapture before useWidgetKeyboard (keyboard receives cancelVideoRecording)
  const {
    screenshotBlobRef, videoBlobRef,
    isVideoReady,
    cancelVideoRecording,
    handleAreaSelected, handleStopVideoRecording, handleAddCapture,
    preparePreview, clearBlobs,
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

  const showAreaSelector =
    state.mode === "capturePhoto" ||
    state.mode === "captureVideo" ||
    state.mode === "captureDragging";
  const isVideoFlow = state.mode === "videoRecording";
  const isIdle = state.mode === "idle";
  const isError = state.mode === "submitError";

  const panelKey = derivePanelKey(state);
  const hasContent = state.items.length > 0;

  const { panelPosition, panelBelow } = usePanelPosition({
    panelKey, panelWidth: panelKey ? PANEL_WIDTHS[panelKey] : 176, barPosition, anchorX,
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
              { id: "video", label: "Record", icon: <CamcorderFill size={20} />, onClick: () => dispatch({ type: "SET_MODE", mode: "captureVideo" }), disabled: !isVideoRecordingSupported() },
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
            screenshotBlob={screenshotBlobRef.current}
            initialText={findPreview<import("../types").PhotoCapture>("photo")?.additionalText}
            initialPriority={findPreview<import("../types").PhotoCapture>("photo")?.priority}
            submitLabel={submitLabel}
            onStartRecording={() => {}}
            onStopRecording={() => {}}
            onAdd={isPreviewing
              ? (text, priority) => previewSave({ additionalText: text, priority })
              : handleAddCapture}
            onCancel={() => previewCancel(() => {
              clearBlobs();
              dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
            })}
          />
        )}

        {panelKey === "captureVideo" && (
          <CapturePanel
            variant="video"
            area={state.pendingCapture?.area ?? null}
            isRecording={false}
            screenshotBlob={videoBlobRef.current}
            initialText={findPreview<import("../types").VideoCapture>("video")?.additionalText}
            initialPriority={findPreview<import("../types").VideoCapture>("video")?.priority}
            submitLabel={submitLabel}
            onStartRecording={() => {}}
            onStopRecording={() => {}}
            onAdd={isPreviewing
              ? (text, priority) => previewSave({ additionalText: text, priority })
              : handleAddCapture}
            onCancel={() => previewCancel(() => {
              clearBlobs();
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
              preparePreview(item);
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
