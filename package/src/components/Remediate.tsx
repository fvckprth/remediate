import { useReducer, useState, useEffect, useMemo, useRef } from "react";
import type {
  WidgetMode, FeedbackItem, AnnotationItem, AnnotationPriority, RemediateProps, CaptureType,
} from "../types";
import { isVideoRecordingSupported } from "../utils/capture-video";
import { createItem } from "../utils/create-item";
import { widgetReducer, getInitialState } from "../state/widget-reducer";
import { derivePanelKey, PANEL_ANCHORS, PANEL_WIDTHS } from "../state/panel-layout";
import { WidgetProvider } from "../state/WidgetContext";
import { useCapture } from "../hooks/useCapture";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import { useSubmission } from "../hooks/useSubmission";
import { useConsoleCapture } from "../hooks/useConsoleCapture";
import { useWidgetKeyboard } from "../hooks/useWidgetKeyboard";
import { usePanelPosition } from "../hooks/usePanelPosition";
import { FeedbackBar } from "./toolbar/FeedbackBar";
import { SubMenu, type SubMenuItem } from "./shared/SubMenu";
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
  submittingButton: "Sending…",
  cancelButton: "Cancel",
  successMessage: "Sent!",
};

/** Resolve the page element an annotation points at, as a 2×2 rect at the click point. */
function annotationAnchorRect(ann: AnnotationItem): DOMRect | null {
  try {
    const el = document.querySelector(ann.element.selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return new DOMRect(rect.left + ann.clickOffset.x - 1, rect.top + ann.clickOffset.y - 1, 2, 2);
  } catch {
    return null; // selector may not match
  }
}

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
    pendingBlobRef, isVideoReady, cancelVideoRecording,
    handleAreaSelected, handleStopVideoRecording, handleAddCapture,
    preparePreview, clearBlob,
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
  const isOpen = state.mode !== "idle";
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Debug logging
  useEffect(() => {
    if (debug) console.log("[Remediate] mode →", state.mode);
  }, [debug, state.mode]);

  // Auto-reset after success/error
  useEffect(() => {
    if (state.mode !== "success" && state.mode !== "submitError") return;
    const next: WidgetMode = state.mode === "success" ? "active" : "reviewing";
    const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: next }), 2000);
    return () => clearTimeout(timer);
  }, [state.mode]);

  // Bounce out of review when the list empties (last item removed)
  useEffect(() => {
    if (state.mode === "reviewing" && state.items.length === 0) {
      dispatch({ type: "SET_MODE", mode: "active" });
    }
  }, [state.mode, state.items.length]);

  useWidgetKeyboard({
    mode: state.mode,
    previewingItemId: state.previewingItemId,
    dispatch,
    cancelVideoRecording,
  });

  // usePanelPosition reads bar/button positions live from the DOM via this ref.
  const barRef = useRef<HTMLDivElement>(null);

  const showAreaSelector =
    state.mode === "capturePhoto" ||
    state.mode === "captureVideo" ||
    state.mode === "captureDragging";

  const panelKey = derivePanelKey(state);

  const { panelPosition, panelBelow } = usePanelPosition({
    panelKey,
    panelWidth: panelKey ? PANEL_WIDTHS[panelKey] : 176,
    barRef,
    anchor: panelKey ? PANEL_ANCHORS[panelKey] : null,
  });

  const annotations = state.items.filter((i): i is AnnotationItem => i.type === "annotation");

  // --- Preview (edit an existing item) helpers ---

  const isPreviewing = !!state.previewingItemId;

  function previewSave(fields: Partial<FeedbackItem>) {
    dispatch({ type: "UPDATE_ITEM", id: state.previewingItemId!, item: fields });
  }

  function previewCancel(cleanup?: () => void) {
    cleanup?.();
    dispatch({ type: "SET_MODE", mode: isPreviewing ? "reviewing" : "active" });
  }

  function closePopover() {
    dispatch({ type: "SET_ACTIVE_POPOVER", id: null });
    if (state.previewingItemId) dispatch({ type: "SET_MODE", mode: "reviewing" });
  }

  const captureMenuItems: SubMenuItem[] = [];
  if (enabledTypes.includes("photo")) {
    captureMenuItems.push({
      id: "photo", label: "Screenshot", icon: <CameraFill size={20} />,
      onClick: () => dispatch({ type: "SET_MODE", mode: "capturePhoto" }),
    });
  }
  if (enabledTypes.includes("video")) {
    captureMenuItems.push({
      id: "video", label: "Record", icon: <CamcorderFill size={20} />,
      onClick: () => dispatch({ type: "SET_MODE", mode: "captureVideo" }),
      disabled: !isVideoRecordingSupported(),
      disabledReason: "Desktop browsers only",
    });
  }

  const noteMenuItems: SubMenuItem[] = [];
  if (enabledTypes.includes("textNote")) {
    noteMenuItems.push({
      id: "text", label: "Text", icon: <Message4Fill size={20} />,
      onClick: () => dispatch({ type: "SET_MODE", mode: "textNote" }),
    });
  }
  if (enabledTypes.includes("voiceNote")) {
    noteMenuItems.push({
      id: "voice", label: "Voice", icon: <VoiceFill size={20} />,
      onClick: () => { dispatch({ type: "SET_MODE", mode: "voiceNote" }); startVoice(); },
      disabled: state.mode === "voiceNote",
    });
  }

  const activeAnnotation = state.activePopoverAnnotationId
    ? annotations.find((a) => a.id === state.activePopoverAnnotationId) ?? null
    : null;
  const activeAnnotationRect = activeAnnotation ? annotationAnchorRect(activeAnnotation) : null;

  return (
    <WidgetProvider value={ctxValue}>
      <div data-remediate-widget="" style={{ "--rm-accent": state.markerColor } as React.CSSProperties} suppressHydrationWarning>
        <AnnotationMarkers
          annotations={annotations}
          markerColor={state.markerColor}
          activePopoverAnnotationId={state.activePopoverAnnotationId}
          onBadgeClick={(id: string) => dispatch({ type: "SET_ACTIVE_POPOVER", id: id || null })}
        />

        <FeedbackBar
          mode={state.mode}
          markerColor={state.markerColor}
          itemCount={state.items.length}
          onActivate={() => dispatch({ type: "ACTIVATE" })}
          onSetMode={(mode: WidgetMode) => dispatch({ type: "SET_MODE", mode })}
          onClose={() => dispatch({ type: "CLOSE" })}
          onReview={() => dispatch({ type: "REVIEW" })}
          onDeleteAll={() => dispatch({ type: "CLEAR_ALL" })}
          panelOpen={panelKey !== null}
          barRef={barRef}
        />

        <PanelHost panelKey={panelKey} position={panelPosition} below={panelBelow} pill={state.mode === "voiceRecording"}>
          {panelKey === "captureMenu" && (
            <SubMenu items={captureMenuItems} onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })} />
          )}

          {panelKey === "noteMenu" && (
            <SubMenu items={noteMenuItems} onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })} />
          )}

          {panelKey === "capture" && state.pendingCapture && (
            <CapturePanel
              variant={state.pendingCapture.variant}
              area={state.pendingCapture.area}
              blob={pendingBlobRef.current}
              onAdd={isPreviewing
                ? (text, priority) => previewSave({ additionalText: text, priority })
                : handleAddCapture}
              onCancel={() => previewCancel(() => {
                clearBlob();
                dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
              })}
            />
          )}

          {panelKey === "textNote" && (
            <TextNotePanel
              onAdd={isPreviewing
                ? (text, priority) => previewSave({ text, priority })
                : (text, priority) => dispatch({ type: "ADD_ITEM", item: createItem("textNote", { text, additionalText: "", priority }) })}
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
                const item = state.items.find((i) => i.id === id);
                if (!item) return;
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

        {state.mode === "videoRecording" && (
          <VideoToolbar
            area={state.pendingCapture?.area ?? null}
            isReady={isVideoReady}
            onStopRecording={handleStopVideoRecording}
          />
        )}

        {state.mode === "annotating" && (
          <AnnotateMode
            annotations={annotations}
            markerColor={state.markerColor}
            onAddAnnotation={(ann: AnnotationItem) => dispatch({ type: "ADD_ITEM", item: ann })}
          />
        )}

        {activeAnnotation && activeAnnotationRect && (
          <AnnotationPopover
            elementName={activeAnnotation.element.name}
            initialNote={activeAnnotation.note}
            initialPriority={activeAnnotation.priority}
            anchorRect={activeAnnotationRect}
            submitLabel="Save"
            onSave={(note: string, priority: AnnotationPriority) => {
              dispatch({ type: "UPDATE_ANNOTATION", id: activeAnnotation.id, note, priority });
              closePopover();
            }}
            onCancel={closePopover}
          />
        )}
      </div>
    </WidgetProvider>
  );
}
