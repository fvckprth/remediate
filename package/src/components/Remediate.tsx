import { useReducer, useCallback, useState, useEffect, useMemo, useRef } from "react";
import type {
  WidgetMode, FeedbackItem,
  AnnotationItem, AnnotationPriority, RemediateProps, CaptureType,
} from "../types";
import { isVideoRecordingSupported } from "../utils/capture-video";
import { createItem } from "../utils/create-item";
import { widgetReducer, getInitialState } from "../state/widget-reducer";
import { derivePanelKey, PANEL_WIDTHS } from "../state/panel-layout";
import { WidgetProvider } from "../state/WidgetContext";
import { useCapture } from "../hooks/useCapture";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import { useSubmission } from "../hooks/useSubmission";
import { useConsoleCapture } from "../hooks/useConsoleCapture";
import { useWidgetKeyboard } from "../hooks/useWidgetKeyboard";
import { usePanelPosition } from "../hooks/usePanelPosition";
import { FeedbackBar } from "./toolbar/FeedbackBar";
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
import { CameraFill, CamcorderFill, Message4Fill, VoiceFill } from "./icons";
import "../styles/widget.css";

const ALL_CAPTURE_TYPES: CaptureType[] = ["photo", "video", "annotation", "textNote", "voiceNote"];

const DEFAULT_MESSAGES = {
  submitButton: "Submit",
  submittingButton: "Sending\u2026",
  cancelButton: "Cancel",
  successMessage: "Sent!",
};

export function Remediate({
  endpoint, onSubmit, onError, metadata: extraMetadata,
  headers, captureTypes, open: controlledOpen, onOpenChange, debug, messages: messageOverrides,
}: RemediateProps) {
  const [state, dispatch] = useReducer(widgetReducer, undefined, getInitialState);
  const enabledTypes = captureTypes ?? ALL_CAPTURE_TYPES;
  const msgs = { ...DEFAULT_MESSAGES, ...messageOverrides };

  const ctxValue = useMemo(() => ({ state, dispatch }), [state]);

  // Hooks
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
    state, dispatch, onSubmit, endpoint, extraMetadata, headers, onError, consoleCaptureRef, debug,
  });

  // Controlled open state
  useEffect(() => {
    if (controlledOpen === undefined) return;
    if (controlledOpen && state.mode === "idle") {
      dispatch({ type: "ACTIVATE" });
    } else if (!controlledOpen && state.mode !== "idle") {
      dispatch({ type: "CLOSE" });
    }
  }, [controlledOpen, state.mode]);

  // Notify parent of open/close changes
  useEffect(() => {
    onOpenChange?.(state.mode !== "idle");
  }, [state.mode !== "idle", onOpenChange]);

  // Debug logging
  useEffect(() => {
    if (debug) console.log("[Remediate] mode →", state.mode);
  }, [debug, state.mode]);

  // Auto-reset after success/error
  useEffect(() => {
    if (state.mode === "success") {
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "active" }), 2000);
      return () => clearTimeout(timer);
    }
    if (state.mode === "submitError") {
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "reviewing" }), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.mode, dispatch]);

  // Bounce out of review when the list empties (last item removed)
  useEffect(() => {
    if (state.mode === "reviewing" && state.items.length === 0) {
      dispatch({ type: "SET_MODE", mode: "active" });
    }
  }, [state.mode, state.items.length, dispatch]);

  useWidgetKeyboard({
    mode: state.mode,
    previewingItemId: state.previewingItemId,
    dispatch,
    cancelVideoRecording,
  });

  // Bar element ref + anchor button aria-label.
  // usePanelPosition reads positions live from the DOM via these — no cached
  // x/y state to go stale on viewport resize / browser zoom.
  const barRef = useRef<HTMLDivElement>(null);
  const [anchorAriaLabel, setAnchorAriaLabel] = useState<string | null>(null);

  const showAreaSelector =
    state.mode === "capturePhoto" ||
    state.mode === "captureVideo" ||
    state.mode === "captureDragging";
  const isVideoFlow = state.mode === "videoRecording";
  const isIdle = state.mode === "idle";

  const panelKey = derivePanelKey(state);
  const hasContent = state.items.length > 0;

  const { panelPosition, panelBelow } = usePanelPosition({
    panelKey, panelWidth: panelKey ? PANEL_WIDTHS[panelKey] : 176, barRef, anchorAriaLabel,
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
    dispatch({ type: "ADD_ITEM", item: createItem("textNote", { text, additionalText: "", priority }) });
  }, []);

  const anchorToButton = useCallback((ariaLabel: string) => {
    setAnchorAriaLabel(ariaLabel);
  }, []);

  // --- Preview helpers ---

  const isPreviewing = !!state.previewingItemId;

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
    <WidgetProvider value={ctxValue}>
      <div data-remediate-widget="" data-remediate-theme="dark" style={{ '--rm-accent': state.markerColor } as React.CSSProperties} suppressHydrationWarning>
        <AnnotationMarkers
          annotations={annotations}
          markerColor={state.markerColor}
          activePopoverAnnotationId={state.activePopoverAnnotationId}
          onBadgeClick={(id: string) => dispatch({ type: "SET_ACTIVE_POPOVER", id: id || null })}
        />

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
          onAnchorAriaLabel={setAnchorAriaLabel}
          panelOpen={panelKey !== null}
          barRef={barRef}
        />

        <PanelHost panelKey={panelKey} position={panelPosition} below={panelBelow} pill={state.mode === "voiceRecording"}>
          {panelKey === "captureMenu" && (
            <SubMenu
              items={[
                enabledTypes.includes("photo") && { id: "photo", label: "Screenshot", icon: <CameraFill size={20} />, onClick: () => dispatch({ type: "SET_MODE", mode: "capturePhoto" }) },
                enabledTypes.includes("video") && { id: "video", label: "Record", icon: <CamcorderFill size={20} />, onClick: () => dispatch({ type: "SET_MODE", mode: "captureVideo" }), disabled: !isVideoRecordingSupported() },
              ].filter(Boolean) as any[]}
              onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })}
            />
          )}

          {panelKey === "noteMenu" && (
            <SubMenu
              items={[
                enabledTypes.includes("textNote") && { id: "text", label: "Text", icon: <Message4Fill size={20} />, onClick: () => dispatch({ type: "SET_MODE", mode: "textNote" }) },
                enabledTypes.includes("voiceNote") && { id: "voice", label: "Voice", icon: <VoiceFill size={20} />, onClick: () => { dispatch({ type: "SET_MODE", mode: "voiceNote" }); startVoice(); }, disabled: state.mode === "voiceNote" },
              ].filter(Boolean) as any[]}
              onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })}
            />
          )}

          {panelKey === "capturePhoto" && (
            <CapturePanel
              variant="photo"
              area={state.pendingCapture?.area ?? null}
              isRecording={false}
              screenshotBlob={screenshotBlobRef.current}
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
              messages={msgs}
              onRemoveItem={(id: string) => dispatch({ type: "REMOVE_ITEM", id })}
              onPreviewItem={(id: string) => {
                const item = state.items.find(i => i.id === id);
                if (!item) return;
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
            nextIndex={state.items.length + 1}
            onAddAnnotation={handleAddAnnotation}
          />
        )}

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
    </WidgetProvider>
  );
}
