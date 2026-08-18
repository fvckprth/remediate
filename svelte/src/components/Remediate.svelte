<script lang="ts">
  import { onMount } from "svelte";
  import { injectStyles } from "../inject-styles";
  import type {
    WidgetMode, FeedbackItem, AnnotationItem, AnnotationPriority, RemediateProps, CaptureType,
  } from "../types";
  import { isVideoRecordingSupported } from "../utils/capture-video";
  import { createItem } from "../utils/create-item";
  import { derivePanelKey, PANEL_WIDTHS } from "../state/panel-layout";
  import { WidgetStore, setWidgetStore } from "../state/widget-store.svelte";
  import { createCapture } from "../hooks/useCapture.svelte";
  import { createVoiceRecording } from "../hooks/useVoiceRecording.svelte";
  import { createSubmission } from "../hooks/useSubmission.svelte";
  import { createConsoleCapture } from "../hooks/useConsoleCapture.svelte";
  import { installWidgetKeyboard } from "../hooks/useWidgetKeyboard";
  import { createViewportTick } from "../hooks/useViewportTick.svelte";
  import { createPanelPositioner } from "../hooks/usePanelPosition.svelte";
  import FeedbackBar from "./toolbar/FeedbackBar.svelte";
  import SubMenu, { type SubMenuItem } from "./shared/SubMenu.svelte";
  import AnnotateMode from "./annotate/AnnotateMode.svelte";
  import AnnotationMarkers from "./annotate/AnnotationMarkers.svelte";
  import AnnotationPopover from "./annotate/AnnotationPopover.svelte";
  import AreaSelector from "./capture/AreaSelector.svelte";
  import CapturePanel from "./capture/CapturePanel.svelte";
  import VideoToolbar from "./capture/VideoToolbar.svelte";
  import VoicePanel from "./notes/VoicePanel.svelte";
  import TextNotePanel from "./notes/TextNotePanel.svelte";
  import ReviewPanel from "./review/ReviewPanel.svelte";
  import PanelHost from "./shared/PanelHost.svelte";
  import { icons } from "./icons";

  const ALL_CAPTURE_TYPES: CaptureType[] = ["photo", "video", "annotation", "textNote", "voiceNote"];

  const DEFAULT_MESSAGES = {
    submitButton: "Submit",
    submittingButton: "Sending…",
    cancelButton: "Cancel",
    successMessage: "Sent!",
  };

  let {
    endpoint,
    onSubmit,
    onError,
    metadata: extraMetadata,
    headers,
    captureTypes,
    open: controlledOpen,
    onOpenChange,
    debug,
    messages: messageOverrides,
  }: RemediateProps = $props();

  injectStyles();

  const store = new WidgetStore();
  setWidgetStore(store);
  const dispatch = store.dispatch;

  const enabledTypes = captureTypes ?? ALL_CAPTURE_TYPES;
  const msgs = { ...DEFAULT_MESSAGES, ...messageOverrides };

  // Hooks
  const capture = createCapture({
    getMode: () => store.state.mode,
    getPendingCapture: () => store.state.pendingCapture,
    dispatch,
  });

  const voice = createVoiceRecording({ dispatch });

  const consoleCapture = createConsoleCapture();

  const submission = createSubmission({
    getItems: () => store.state.items,
    dispatch,
    onSubmit,
    endpoint,
    extraMetadata,
    headers,
    onError,
    consoleCaptureRef: consoleCapture.ref,
    debug,
  });

  const viewportTick = createViewportTick();
  const positioner = createPanelPositioner(viewportTick);

  let barEl = $state<HTMLDivElement | null>(null);
  let anchorAriaLabel = $state<string | null>(null);

  // --- Derived state ---
  const markerColor = $derived(store.state.markerColor);
  const showAreaSelector = $derived(
    store.state.mode === "capturePhoto" ||
      store.state.mode === "captureVideo" ||
      store.state.mode === "captureDragging",
  );
  const isVideoFlow = $derived(store.state.mode === "videoRecording");
  const isIdle = $derived(store.state.mode === "idle");
  const isOpen = $derived(store.state.mode !== "idle");

  const panelKey = $derived(derivePanelKey(store.state));
  const panelWidth = $derived(panelKey ? PANEL_WIDTHS[panelKey] : 176);
  const hasContent = $derived(store.state.items.length > 0);
  const isPreviewing = $derived(!!store.state.previewingItemId);

  const annotations = $derived(
    store.state.items.filter((i): i is AnnotationItem => i.type === "annotation"),
  );

  const panel = $derived(
    positioner.compute({ panelKey, panelWidth, barEl, anchorAriaLabel }),
  );

  // --- Effects (mirror the React useEffects) ---

  // Controlled open state
  $effect(() => {
    if (controlledOpen === undefined) return;
    if (controlledOpen && store.state.mode === "idle") {
      dispatch({ type: "ACTIVATE" });
    } else if (!controlledOpen && store.state.mode !== "idle") {
      dispatch({ type: "CLOSE" });
    }
  });

  // Notify parent of open/close changes
  $effect(() => {
    void isOpen;
    onOpenChange?.(isOpen);
  });

  // Debug logging
  $effect(() => {
    if (debug) console.log("[Remediate] mode →", store.state.mode);
  });

  // Auto-reset after success/error
  $effect(() => {
    const mode = store.state.mode;
    if (mode === "success") {
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "active" }), 2000);
      return () => clearTimeout(timer);
    }
    if (mode === "submitError") {
      const timer = setTimeout(() => dispatch({ type: "SET_MODE", mode: "reviewing" }), 2000);
      return () => clearTimeout(timer);
    }
  });

  // Bounce out of review when the list empties (last item removed)
  $effect(() => {
    if (store.state.mode === "reviewing" && store.state.items.length === 0) {
      dispatch({ type: "SET_MODE", mode: "active" });
    }
  });

  // Console capture lifecycle
  $effect(() => {
    consoleCapture.sync(store.state.mode);
  });

  onMount(() => {
    const teardownKeyboard = installWidgetKeyboard({
      getMode: () => store.state.mode,
      getPreviewingItemId: () => store.state.previewingItemId,
      dispatch,
      cancelVideoRecording: capture.cancelVideoRecording,
    });
    const teardownViewport = viewportTick.install();
    return () => {
      teardownKeyboard();
      teardownViewport();
      consoleCapture.stop();
    };
  });

  // --- Handlers ---

  function handleAddAnnotation(ann: AnnotationItem) {
    dispatch({ type: "ADD_ITEM", item: ann });
  }

  function handleUpdateAnnotation(id: string, note: string, priority: AnnotationPriority) {
    dispatch({ type: "UPDATE_ANNOTATION", id, note, priority });
  }

  function handleAddTextNote(text: string, priority: AnnotationPriority) {
    dispatch({
      type: "ADD_ITEM",
      item: createItem("textNote", { text, additionalText: "", priority }),
    });
  }

  function previewSave(fields: Partial<FeedbackItem>) {
    dispatch({ type: "UPDATE_ITEM", id: store.state.previewingItemId!, item: fields });
    anchorAriaLabel = "Review and submit";
  }

  function previewCancel(cleanup?: () => void) {
    cleanup?.();
    if (isPreviewing) anchorAriaLabel = "Review and submit";
    dispatch({ type: "SET_MODE", mode: isPreviewing ? "reviewing" : "active" });
  }

  const captureMenuItems = $derived(
    [
      enabledTypes.includes("photo") && {
        id: "photo",
        label: "Screenshot",
        iconPath: icons.CameraFill,
        onClick: () => dispatch({ type: "SET_MODE", mode: "capturePhoto" }),
      },
      enabledTypes.includes("video") && {
        id: "video",
        label: "Record",
        iconPath: icons.CamcorderFill,
        onClick: () => dispatch({ type: "SET_MODE", mode: "captureVideo" }),
        disabled: !isVideoRecordingSupported(),
      },
    ].filter(Boolean) as SubMenuItem[],
  );

  const noteMenuItems = $derived(
    [
      enabledTypes.includes("textNote") && {
        id: "text",
        label: "Text",
        iconPath: icons.Message4Fill,
        onClick: () => dispatch({ type: "SET_MODE", mode: "textNote" }),
      },
      enabledTypes.includes("voiceNote") && {
        id: "voice",
        label: "Voice",
        iconPath: icons.VoiceFill,
        onClick: () => {
          dispatch({ type: "SET_MODE", mode: "voiceNote" });
          voice.startVoice();
        },
        disabled: store.state.mode === "voiceNote",
      },
    ].filter(Boolean) as SubMenuItem[],
  );

  // Active annotation popover (mirrors the React IIFE)
  const activePopover = $derived.by(() => {
    const id = store.state.activePopoverAnnotationId;
    if (!id) return null;
    const ann = annotations.find((a) => a.id === id);
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
    } catch {
      /* selector may not match */
    }
    if (!anchorRect) return null;
    return { ann, anchorRect };
  });
</script>

<div
  data-remediate-widget=""
  data-remediate-theme="dark"
  style:--rm-accent={markerColor}
>
  <AnnotationMarkers
    {annotations}
    {markerColor}
    activePopoverAnnotationId={store.state.activePopoverAnnotationId}
    onBadgeClick={(id) => dispatch({ type: "SET_ACTIVE_POPOVER", id: id || null })}
  />

  <FeedbackBar
    bind:barEl
    {isIdle}
    onActivate={() => dispatch({ type: "ACTIVATE" })}
    mode={store.state.mode}
    {markerColor}
    itemCount={store.state.items.length}
    {hasContent}
    onSetMode={(mode: WidgetMode) => dispatch({ type: "SET_MODE", mode })}
    onClose={() => dispatch({ type: "CLOSE" })}
    onReview={() => dispatch({ type: "REVIEW" })}
    onDeleteAll={() => dispatch({ type: "CLEAR_ALL" })}
    onAnchorAriaLabel={(label) => (anchorAriaLabel = label)}
    panelOpen={panelKey !== null}
  />

  <PanelHost
    {panelKey}
    position={panel.panelPosition}
    below={panel.panelBelow}
    pill={store.state.mode === "voiceRecording"}
  >
    {#snippet children(key)}
      {#if key === "captureMenu"}
        <SubMenu
          items={captureMenuItems}
          onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })}
        />
      {:else if key === "noteMenu"}
        <SubMenu
          items={noteMenuItems}
          onDismiss={() => dispatch({ type: "SET_MODE", mode: "active" })}
        />
      {:else if key === "capturePhoto"}
        <CapturePanel
          variant="photo"
          area={store.state.pendingCapture?.area ?? null}
          isRecording={false}
          screenshotBlob={capture.screenshotBlob.current}
          onStartRecording={() => {}}
          onStopRecording={() => {}}
          onAdd={isPreviewing
            ? (text, priority) => previewSave({ additionalText: text, priority })
            : capture.handleAddCapture}
          onCancel={() =>
            previewCancel(() => {
              capture.clearBlobs();
              dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
            })}
        />
      {:else if key === "captureVideo"}
        <CapturePanel
          variant="video"
          area={store.state.pendingCapture?.area ?? null}
          isRecording={false}
          screenshotBlob={capture.videoBlob.current}
          onStartRecording={() => {}}
          onStopRecording={() => {}}
          onAdd={isPreviewing
            ? (text, priority) => previewSave({ additionalText: text, priority })
            : capture.handleAddCapture}
          onCancel={() =>
            previewCancel(() => {
              capture.clearBlobs();
              dispatch({ type: "SET_PENDING_CAPTURE", capture: null });
            })}
        />
      {:else if key === "textNote"}
        <TextNotePanel
          onAdd={isPreviewing
            ? (text, priority) => previewSave({ text, priority })
            : handleAddTextNote}
          onCancel={() => previewCancel()}
        />
      {:else if key === "voicePanel"}
        <VoicePanel
          mode={store.state.mode}
          recorder={voice.voiceRecorder.current}
          onSetMode={(mode: WidgetMode) => dispatch({ type: "SET_MODE", mode })}
          onAdd={isPreviewing
            ? (_duration, _blob, text, priority) => previewSave({ additionalText: text, priority })
            : voice.handleAddVoiceNote}
          onCancel={() => previewCancel()}
        />
      {:else if key === "review"}
        <ReviewPanel
          items={store.state.items}
          isSubmitting={submission.isSubmitting}
          messages={msgs}
          onRemoveItem={(id) => dispatch({ type: "REMOVE_ITEM", id })}
          onPreviewItem={(id) => {
            const item = store.state.items.find((i) => i.id === id);
            if (!item) return;
            const label =
              item.type === "photo" || item.type === "video"
                ? "Capture mode"
                : item.type === "textNote" || item.type === "voiceNote"
                  ? "Note mode"
                  : item.type === "annotation"
                    ? "Annotate mode"
                    : null;
            if (label) anchorAriaLabel = label;
            capture.preparePreview(item);
            dispatch({ type: "PREVIEW_ITEM", id });
          }}
          onBack={() => dispatch({ type: "SET_MODE", mode: "active" })}
          onSubmit={submission.handleSubmit}
        />
      {/if}
    {/snippet}
  </PanelHost>

  {#if showAreaSelector}
    <AreaSelector
      onSelect={capture.handleAreaSelected}
      onCancel={() => dispatch({ type: "SET_MODE", mode: "captureMenu" })}
    />
  {/if}

  {#if isVideoFlow}
    <VideoToolbar
      area={store.state.pendingCapture?.area ?? null}
      isReady={capture.isVideoReady}
      onStopRecording={capture.handleStopVideoRecording}
      onCancel={capture.cancelVideoRecording}
    />
  {/if}

  {#if store.state.mode === "annotating"}
    <AnnotateMode
      {annotations}
      {markerColor}
      nextIndex={store.state.items.length + 1}
      onAddAnnotation={handleAddAnnotation}
    />
  {/if}

  {#if activePopover}
    <AnnotationPopover
      elementName={activePopover.ann.element.name}
      selector={activePopover.ann.element.selector}
      computedStyles={activePopover.ann.element.computedStyles}
      initialNote={activePopover.ann.note}
      initialPriority={activePopover.ann.priority}
      annotationIndex={activePopover.ann.index}
      anchorRect={activePopover.anchorRect}
      onSave={(note, priority) => {
        handleUpdateAnnotation(activePopover.ann.id, note, priority);
        dispatch({ type: "SET_ACTIVE_POPOVER", id: null });
        if (store.state.previewingItemId) {
          dispatch({ type: "SET_MODE", mode: "reviewing" });
        }
      }}
      onCancel={() => {
        dispatch({ type: "SET_ACTIVE_POPOVER", id: null });
        if (store.state.previewingItemId) {
          dispatch({ type: "SET_MODE", mode: "reviewing" });
        }
      }}
    />
  {/if}
</div>
