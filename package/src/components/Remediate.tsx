import { useReducer, useCallback, useEffect, useState, useRef } from "react";
import type {
  WidgetState, WidgetAction, WidgetMode, FeedbackItem,
  AnnotationItem, AnnotationPriority, PendingCapture, RemediateProps,
  SelectionArea, TextNoteItem,
} from "../types";
import {
  DEFAULT_MARKER_COLOR, isCaptureMode, isNoteMode,
} from "../types";
import type { OutputDetail } from "../types";
import { collectEnvironment } from "../utils/metadata";
import { startConsoleCapture, type ConsoleCapture } from "../utils/console-capture";
import { nanoid } from "../utils/nanoid";
import { captureScreenshot } from "../utils/capture-screenshot";
import { serializeToFormData } from "../utils/serialize";
import { startVideoRecording, isVideoRecordingSupported, type VideoRecorder } from "../utils/capture-video";
import { startAudioRecording, type AudioRecorder } from "../utils/capture-audio";
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

const STORAGE_KEY_COLOR = "rm_marker_color";
const STORAGE_KEY_BLOCK = "rm_block_interactions";
const STORAGE_KEY_CLEAR = "rm_clear_after_send";
const STORAGE_KEY_OUTPUT = "rm_output_detail";
const STORAGE_KEY_NAME = "rm_reporter_name";
const STORAGE_KEY_EMAIL = "rm_reporter_email";

function getInitialState(): WidgetState {
  let markerColor = DEFAULT_MARKER_COLOR;
  let blockInteractions = false;
  let clearAfterSend = false;
  let outputDetail: OutputDetail = "standard";

  if (typeof window !== "undefined") {
    const savedColor = localStorage.getItem(STORAGE_KEY_COLOR);
    if (savedColor) markerColor = savedColor;
    const savedBlock = localStorage.getItem(STORAGE_KEY_BLOCK);
    if (savedBlock === "true") blockInteractions = true;
    const savedClear = localStorage.getItem(STORAGE_KEY_CLEAR);
    if (savedClear === "true") clearAfterSend = true;
    const savedOutput = localStorage.getItem(STORAGE_KEY_OUTPUT);
    if (savedOutput === "detailed") outputDetail = "detailed";
  }

  return {
    mode: "idle",
    items: [],
    markerColor,
    blockInteractions,
    clearAfterSend,
    outputDetail,
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
      return { ...state, items: filtered, activePopoverAnnotationId: null };
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

    case "SET_MARKER_COLOR":
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_COLOR, action.color);
      return { ...state, markerColor: action.color };

    case "SET_BLOCK_INTERACTIONS":
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_BLOCK, String(action.blocked));
      return { ...state, blockInteractions: action.blocked };

    case "SET_CLEAR_AFTER_SEND":
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_CLEAR, String(action.enabled));
      return { ...state, clearAfterSend: action.enabled };

    case "SET_OUTPUT_DETAIL":
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_OUTPUT, action.level);
      return { ...state, outputDetail: action.level };

    case "REVIEW":
      return { ...state, mode: "reviewing", settingsOpen: false, activePopoverAnnotationId: null };

    case "SUBMIT_SUCCESS":
      return { ...state, mode: "success" };

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
      };

    default:
      return state;
  }
}

function buildPayload(
  state: WidgetState,
  extraMetadata?: Record<string, unknown>,
  consoleCaptureRef?: React.RefObject<ConsoleCapture | null>,
) {
  const metadata: Record<string, unknown> = { ...extraMetadata };

  // Reporter identity from localStorage
  if (typeof window !== "undefined") {
    const name = localStorage.getItem(STORAGE_KEY_NAME)?.trim();
    const email = localStorage.getItem(STORAGE_KEY_EMAIL)?.trim();
    if (name || email) {
      metadata.reporter = { name: name || "", email: email || "" };
    }
  }

  // Console logs (always captured)
  if (consoleCaptureRef?.current) {
    metadata.consoleLog = [...consoleCaptureRef.current.entries];
  }

  return {
    id: `fb_${nanoid(12)}`,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    environment: collectEnvironment(),
    items: state.items,
    metadata,
  };
}

const HOSTED_API_URL = "https://api.remediate.dev/v1/feedback";

export function Remediate({ onSubmit, endpoint, projectKey, apiUrl, metadata: extraMetadata, onError }: RemediateProps) {
  const [state, dispatch] = useReducer(widgetReducer, undefined, getInitialState);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRecorderRef = useRef<VideoRecorder | null>(null);
  const pendingAreaRef = useRef<SelectionArea | null>(null);
  const consoleCaptureRef = useRef<ConsoleCapture | null>(null);

  // Console capture (always on when widget is active)
  useEffect(() => {
    if (state.mode !== "idle") {
      if (!consoleCaptureRef.current) {
        consoleCaptureRef.current = startConsoleCapture();
      }
    }
    return () => {
      if (state.mode === "idle" && consoleCaptureRef.current) {
        consoleCaptureRef.current.stop();
        consoleCaptureRef.current = null;
      }
    };
  }, [state.mode]);

  const cancelVideoRecording = useCallback(() => {
    videoRecorderRef.current?.cancel();
    videoRecorderRef.current = null;
    pendingAreaRef.current = null;
    setIsVideoReady(false);
    dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
    dispatch({ type: "SET_MODE", mode: "active" });
  }, []);

  const handleSubmit = useCallback(async () => {
    const submission = buildPayload(state, extraMetadata, consoleCaptureRef);

    // Resolve target: projectKey → apiUrl or hosted API, endpoint → custom URL, else callback-only
    const targetUrl = projectKey
      ? (apiUrl ? `${apiUrl.replace(/\/$/, "")}/api/v1/feedback` : HOSTED_API_URL)
      : endpoint;

    if (targetUrl) {
      setIsSubmitting(true);
      try {
        const formData = serializeToFormData(submission);
        const headers: Record<string, string> = {};
        if (projectKey) {
          headers["Authorization"] = `Bearer ${projectKey}`;
        }
        // 30s timeout to avoid hanging on dead endpoints
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        const res = await fetch(targetUrl, {
          method: "POST",
          body: formData,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          throw new Error(`Feedback submission failed: ${res.status} ${res.statusText}`);
        }
        onSubmit?.(submission);
        dispatch({ type: "SUBMIT_SUCCESS" });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (onError) {
          onError(error);
        } else {
          console.error("[Remediate] Submission failed:", error);
        }
        dispatch({ type: "SUBMIT_ERROR" });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (onSubmit) {
      onSubmit(submission);
    } else {
      console.log(
        "%c[Remediate] Feedback Submission",
        "background: #3B82F6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;",
        submission
      );
    }
    dispatch({ type: "SUBMIT_SUCCESS" });
  }, [state, onSubmit, endpoint, extraMetadata, onError]);

  const handleCopy = useCallback(async () => {
    const payload = buildPayload(state, extraMetadata);
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedFlash(true);
      setTimeout(() => setCopiedFlash(false), 1500);
    } catch {
      console.warn("[Remediate] Clipboard write failed");
    }
  }, [state, extraMetadata]);

  useEffect(() => {
    if (state.mode === "success") {
      if (state.clearAfterSend) {
        const timer = setTimeout(() => dispatch({ type: "RESET" }), 2000);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "active" }), 2000);
      return () => clearTimeout(timer);
    }
    if (state.mode === "submitError") {
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "reviewing" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.mode]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" && state.mode !== "idle") {
        if (state.settingsOpen) {
          dispatch({ type: "CLOSE_SETTINGS" });
        } else if (state.mode === "videoRecording") {
          cancelVideoRecording();
        } else if (state.mode === "captureMenu" || state.mode === "noteMenu") {
          dispatch({ type: "SET_MODE", mode: "active" });
        } else if (isCaptureMode(state.mode) || isNoteMode(state.mode) || state.mode === "reviewing") {
          dispatch({ type: "SET_MODE", mode: state.previewingItemId ? "reviewing" : "active" });
        } else {
          dispatch({ type: "CLOSE" });
        }
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [state.mode, state.settingsOpen]);

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

  const panelKey = state.settingsOpen && !isIdle && !isSuccess && !isError
    ? "settings"
    : showCaptureMenu ? "captureMenu"
    : showNoteMenu ? "noteMenu"
    : isPhotoFlow ? "capturePhoto"
    : isVideoPreview ? "captureVideo"
    : showTextNote ? "textNote"
    : showVoicePanel ? "voicePanel"
    : state.mode === "reviewing" ? "review"
    : isSuccess ? "success"
    : isError ? "submitError"
    : null;

  const hasContent = state.items.length > 0;
  
  // Calculate panel width based on type
  let panelWidth = 176; // default (submenu)
  if (panelKey === "settings") panelWidth = 240;
  else if (panelKey === "textNote") panelWidth = 280;
  else if (panelKey === "capturePhoto" || panelKey === "captureVideo") panelWidth = 280;
  else if (panelKey === "voicePanel") panelWidth = 240;
  else if (panelKey === "review") panelWidth = 280;
  else if (panelKey === "success") panelWidth = 200;

  // Calculate position centered on the triggering button, clamped to viewport
  const PADDING = 20;
  const isBrowser = typeof window !== "undefined";
  let panelLeft = barPosition ? barPosition.x : (isBrowser ? window.innerWidth - 20 - panelWidth : 0);

  if (anchorX !== null && isBrowser) {
    const desiredLeft = anchorX - (panelWidth / 2);
    panelLeft = Math.max(PADDING, Math.min(window.innerWidth - panelWidth - PADDING, desiredLeft));
  }

  const BAR_HEIGHT = 40;
  const GAP = 4;
  const panelBelow = barPosition ? barPosition.y < window.innerHeight / 2 : false;

  const panelPosition = barPosition
    ? panelBelow
      ? { top: barPosition.y + BAR_HEIGHT + GAP, left: panelLeft }
      : { bottom: isBrowser ? window.innerHeight - barPosition.y + GAP : 0, left: panelLeft }
    : { bottom: 72, right: 20 }; // Default when no position is set

  // Freeze panel position, direction & width during exit so panels don't shift while fading out
  const lastPanelPosition = useRef(panelPosition);
  const lastPanelBelow = useRef(panelBelow);
  const lastPanelWidth = useRef(panelWidth);
  if (panelKey !== null) {
    lastPanelPosition.current = panelPosition;
    lastPanelBelow.current = panelBelow;
    lastPanelWidth.current = panelWidth;
  }

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

  const handleAreaSelected = useCallback(async (area: { x: number; y: number; width: number; height: number }) => {
    const isPhoto = state.mode === "capturePhoto" || state.mode === "captureDragging";

    if (isPhoto) {
      const blob = await captureScreenshot(area);
      setScreenshotBlob(blob);
      const capture: PendingCapture = { area, variant: "photo" };
      dispatch({ type: "SET_PENDING_CAPTURE", capture });
      dispatch({ type: "SET_MODE", mode: "capturePreview" });
    } else {
      const capture: PendingCapture = { area, variant: "video" };
      pendingAreaRef.current = area;
      dispatch({ type: "SET_PENDING_CAPTURE", capture });
      dispatch({ type: "SET_MODE", mode: "videoRecording" });

      try {
        const recorder = await startVideoRecording({
          area,
          onEnded: () => {
            const rec = videoRecorderRef.current;
            if (!rec) return;
            setIsVideoReady(false);
            rec.stop().then((blob) => {
              videoRecorderRef.current = null;
              setVideoBlob(blob);
              const saved = pendingAreaRef.current;
              if (saved) {
                dispatch({ type: "SET_PENDING_CAPTURE", capture: { area: saved, variant: "video" } });
              }
              dispatch({ type: "SET_MODE", mode: "capturePreview" });
            });
          },
        });
        videoRecorderRef.current = recorder;
        setIsVideoReady(true);
      } catch (err) {
        console.warn("[Remediate] Video recording failed:", err);
        cancelVideoRecording();
      }
    }
  }, [state.mode]);

  const handleStopVideoRecording = useCallback(async (duration: number) => {
    const recorder = videoRecorderRef.current;
    if (!recorder) return;

    setIsVideoReady(false);
    const blob = await recorder.stop();
    videoRecorderRef.current = null;
    setVideoBlob(blob);

    const area = pendingAreaRef.current;
    if (area) {
      dispatch({ type: "SET_PENDING_CAPTURE", capture: {
        area,
        variant: "video",
        recordingDuration: duration,
      }});
    }
    dispatch({ type: "SET_MODE", mode: "capturePreview" });
  }, []);

  const handleAddCapture = useCallback((additionalText: string, priority: AnnotationPriority) => {
    if (!state.pendingCapture) return;
    const item: FeedbackItem = state.pendingCapture.variant === "photo"
      ? {
          id: `cap_${nanoid(8)}`,
          index: 0,
          type: "photo",
          area: state.pendingCapture.area,
          timestamp: Date.now(),
          additionalText,
          priority,
          blob: screenshotBlob ?? undefined,
        }
      : {
          id: `cap_${nanoid(8)}`,
          index: 0,
          type: "video",
          area: state.pendingCapture.area,
          duration: state.pendingCapture.recordingDuration ?? 0,
          timestamp: Date.now(),
          additionalText,
          priority,
          blob: videoBlob ?? undefined,
        };
    dispatch({ type: "ADD_ITEM", item });
    setScreenshotBlob(null);
    setVideoBlob(null);
  }, [state.pendingCapture, screenshotBlob, videoBlob]);

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

  const handleAddVoiceNote = useCallback((duration: number, blob: Blob, text: string, priority: AnnotationPriority) => {
    const item: FeedbackItem = {
      id: `voc_${nanoid(8)}`,
      index: 0,
      type: "voiceNote",
      duration,
      timestamp: Date.now(),
      additionalText: text,
      priority,
      blob,
    };
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  // Voice recording: start mic when voiceNote mode is entered, hand recorder to VoicePanel
  const voiceRecorderRef = useRef<AudioRecorder | null>(null);
  useEffect(() => {
    if (state.mode !== "voiceNote") return;
    let cancelled = false;
    startAudioRecording()
      .then((recorder) => {
        if (cancelled) {
          recorder.cancel();
          return;
        }
        voiceRecorderRef.current = recorder;
        dispatch({ type: "SET_MODE", mode: "voiceRecording" });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[Remediate] Microphone access denied:", err);
        dispatch({ type: "SET_MODE", mode: "noteMenu" });
      });
    return () => { cancelled = true; };
  }, [state.mode]);

  const anchorToButton = useCallback((ariaLabel: string) => {
    const btn = document.querySelector(`[data-remediate-widget] button[aria-label="${ariaLabel}"]`) as HTMLElement | null;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setAnchorX(rect.left + rect.width / 2);
    }
  }, []);

  return (
    <div data-remediate-widget="" style={{ '--rm-accent': state.markerColor } as React.CSSProperties} suppressHydrationWarning>
      <AnnotationMarkers
        annotations={annotations}
        markerColor={state.markerColor}
        activePopoverAnnotationId={state.activePopoverAnnotationId}
        onBadgeClick={(id: string) => dispatch({ type: "SET_ACTIVE_POPOVER", id: id || null })}
      />

      {!isSuccess && !isError && !isVideoFlow && (
        <FeedbackBar
          isIdle={isIdle}
          onActivate={() => dispatch({ type: "ACTIVATE" })}
          mode={state.mode}
          settingsOpen={state.settingsOpen}
          markerColor={state.markerColor}
          itemCount={state.items.length}
          hasContent={hasContent}
          copiedFlash={copiedFlash}
          onSetMode={(mode: WidgetMode) => dispatch({ type: "SET_MODE", mode })}
          onToggleSettings={() => dispatch({ type: "TOGGLE_SETTINGS" })}
          onClose={() => dispatch({ type: "CLOSE" })}
          onReview={() => dispatch({ type: "REVIEW" })}
          onCopy={handleCopy}
          onDeleteAll={() => dispatch({ type: "CLEAR_ALL" })}
          onPositionChange={setBarPosition}
          onAnchorX={setAnchorX}
          panelOpen={panelKey !== null}
        />
      )}

      <PanelHost panelKey={panelKey} position={lastPanelPosition.current} below={lastPanelBelow.current} maxWidth={lastPanelWidth.current} pill={state.mode === "voiceRecording"}>
        {panelKey === "settings" && (
          <SettingsPanel
            markerColor={state.markerColor}
            blockInteractions={state.blockInteractions}
            onSetColor={(color: string) => dispatch({ type: "SET_MARKER_COLOR", color })}
            onSetBlock={(blocked: boolean) => dispatch({ type: "SET_BLOCK_INTERACTIONS", blocked })}
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
              { id: "voice", label: "Voice", icon: <VoiceFill size={20} />, onClick: () => dispatch({ type: "SET_MODE", mode: "voiceNote" }), disabled: state.mode === "voiceNote" },
            ]}
            onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })}
          />
        )}

        {panelKey === "capturePhoto" && (() => {
          const previewingPhoto = state.previewingItemId
            ? state.items.find(i => i.id === state.previewingItemId && i.type === "photo") as import("../types").PhotoCapture | undefined
            : undefined;
          return (
            <CapturePanel
              variant="photo"
              area={state.pendingCapture?.area ?? null}
              isRecording={false}
              screenshotBlob={screenshotBlob}
              initialText={previewingPhoto?.additionalText}
              initialPriority={previewingPhoto?.priority}
              submitLabel={state.previewingItemId ? "Save" : "Add"}
              onStartRecording={() => {}}
              onStopRecording={() => {}}
              onAdd={state.previewingItemId
                ? (text, priority) => {
                    dispatch({ type: "UPDATE_ITEM", id: state.previewingItemId!, item: { additionalText: text, priority } });
                    anchorToButton("Review and submit");
                  }
                : handleAddCapture
              }
              onCancel={() => {
                setScreenshotBlob(null);
                dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
                if (state.previewingItemId) anchorToButton("Review and submit");
                dispatch({ type: "SET_MODE", mode: state.previewingItemId ? "reviewing" : "active" });
              }}
            />
          );
        })()}

        {panelKey === "captureVideo" && (() => {
          const previewingVideo = state.previewingItemId
            ? state.items.find(i => i.id === state.previewingItemId && i.type === "video") as import("../types").VideoCapture | undefined
            : undefined;
          return (
            <CapturePanel
              variant="video"
              area={state.pendingCapture?.area ?? null}
              isRecording={false}
              screenshotBlob={videoBlob}
              initialText={previewingVideo?.additionalText}
              initialPriority={previewingVideo?.priority}
              submitLabel={state.previewingItemId ? "Save" : "Add"}
              onStartRecording={() => {}}
              onStopRecording={() => {}}
              onAdd={state.previewingItemId
                ? (text, priority) => {
                    dispatch({ type: "UPDATE_ITEM", id: state.previewingItemId!, item: { additionalText: text, priority } });
                    anchorToButton("Review and submit");
                  }
                : handleAddCapture
              }
              onCancel={() => {
                setVideoBlob(null);
                dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
                if (state.previewingItemId) anchorToButton("Review and submit");
                dispatch({ type: "SET_MODE", mode: state.previewingItemId ? "reviewing" : "active" });
              }}
            />
          );
        })()}

        {panelKey === "textNote" && (() => {
          const previewingTextNote = state.previewingItemId
            ? state.items.find(i => i.id === state.previewingItemId && i.type === "textNote") as TextNoteItem | undefined
            : undefined;
          return (
            <TextNotePanel
              initialText={previewingTextNote?.text}
              initialPriority={previewingTextNote?.priority}
              submitLabel={state.previewingItemId ? "Save" : "Add"}
              onAdd={state.previewingItemId
                ? (text, priority) => {
                    dispatch({ type: "UPDATE_ITEM", id: state.previewingItemId!, item: { text, priority } });
                    anchorToButton("Review and submit");
                  }
                : handleAddTextNote
              }
              onCancel={() => {
                if (state.previewingItemId) anchorToButton("Review and submit");
                dispatch({ type: "SET_MODE", mode: state.previewingItemId ? "reviewing" : "active" });
              }}
            />
          );
        })()}

        {panelKey === "voicePanel" && (
          <VoicePanel
            mode={state.mode}
            recorder={voiceRecorderRef.current}
            onSetMode={(mode: WidgetMode) => dispatch({ type: "SET_MODE", mode })}
            onAdd={handleAddVoiceNote}
            onCancel={() => {
              if (state.previewingItemId) anchorToButton("Review and submit");
              dispatch({ type: "SET_MODE", mode: state.previewingItemId ? "reviewing" : "active" });
            }}
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

        {panelKey === "success" && (
          <div className="rm-success">
            <div className="rm-success__icon">
              <CheckLine size={20} />
            </div>
            <span className="rm-success__text"></span>
          </div>
        )}

        {panelKey === "submitError" && (
          <div className="rm-success rm-submit-error">
            <div className="rm-success__icon rm-submit-error__icon">!</div>
            <span className="rm-success__text">Failed to send. Retrying...</span>
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
          activePopoverAnnotationId={state.activePopoverAnnotationId}
          nextIndex={state.items.length + 1}
          onAddAnnotation={handleAddAnnotation}
          onUpdateAnnotation={(id: string, note: string, priority: AnnotationPriority) => {
            handleUpdateAnnotation(id, note, priority);
            if (state.previewingItemId) {
              dispatch({ type: "SET_MODE", mode: "reviewing" });
            }
          }}
          onRemoveAnnotation={(id: string) => dispatch({ type: "REMOVE_ITEM", id })}
          onSetActivePopover={(id: string | null) => {
            dispatch({ type: "SET_ACTIVE_POPOVER", id });
            if (id === null && state.previewingItemId) {
              dispatch({ type: "SET_MODE", mode: "reviewing" });
            }
          }}
        />
      )}

      {/* Edit popover for badge clicks outside annotating mode */}
      {state.mode !== "annotating" && (() => {
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
            }}
            onCancel={() => dispatch({ type: "SET_ACTIVE_POPOVER", id: null })}
          />
        );
      })()}
    </div>
  );
}
