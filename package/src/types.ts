export interface ElementCapture {
  selector: string;
  name: string;
  elementPath: string;
  boundingRect: { x: number; y: number; width: number; height: number };
  nearbyText: string;
  cssClasses: string;
  attributes: Record<string, string>;
  computedStyles: Record<string, string>;
}

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- Feedback items (unified numbering) ---

export type AnnotationPriority = "none" | "low" | "medium" | "high" | "urgent";

interface FeedbackItemBase {
  id: string;
  index: number;
  timestamp: number;
  additionalText: string;
  priority: AnnotationPriority;
}

export interface PhotoCapture extends FeedbackItemBase {
  type: "photo";
  area: SelectionArea;
  blob?: Blob;
}

export interface VideoCapture extends FeedbackItemBase {
  type: "video";
  duration: number;
  area: SelectionArea;
  blob?: Blob;
}

export interface AnnotationItem extends FeedbackItemBase {
  type: "annotation";
  element: ElementCapture;
  note: string;
  clickOffset: { x: number; y: number };
}

export interface TextNoteItem extends FeedbackItemBase {
  type: "textNote";
  text: string;
}

export interface VoiceNoteItem extends FeedbackItemBase {
  type: "voiceNote";
  duration: number;
  blob?: Blob;
}

export type FeedbackItem =
  | PhotoCapture
  | VideoCapture
  | AnnotationItem
  | TextNoteItem
  | VoiceNoteItem;

// --- Widget modes ---

export type WidgetMode =
  | "idle"
  | "active"
  | "captureMenu"
  | "capturePhoto"
  | "captureDragging"
  | "capturePreview"
  | "captureVideo"
  | "videoRecording"
  | "videoPreview"
  | "videoNoteEntry"
  | "annotating"
  | "noteMenu"
  | "textNote"
  | "voiceNote"
  | "voiceRecording"
  | "voicePreview"
  | "reviewing"
  | "success"
  | "submitError";

const CAPTURE_MODES: WidgetMode[] = [
  "captureMenu", "capturePhoto", "captureDragging", "capturePreview",
  "captureVideo", "videoRecording", "videoPreview", "videoNoteEntry",
];
const NOTE_MODES: WidgetMode[] = [
  "noteMenu", "textNote", "voiceNote", "voiceRecording", "voicePreview",
];

export function isCaptureMode(m: WidgetMode) { return CAPTURE_MODES.includes(m); }
export function isNoteMode(m: WidgetMode) { return NOTE_MODES.includes(m); }

// --- Widget state ---

export interface PendingCapture {
  area: SelectionArea;
  variant: "photo" | "video";
  recordingDuration?: number;
}

export interface WidgetState {
  mode: WidgetMode;
  items: FeedbackItem[];
  markerColor: string;
  activePopoverAnnotationId: string | null;
  pendingCapture: PendingCapture | null;
  previewingItemId: string | null;
}

export type WidgetAction =
  | { type: "ACTIVATE" }
  | { type: "SET_MODE"; mode: WidgetMode }
  | { type: "CLOSE" }
  | { type: "ADD_ITEM"; item: FeedbackItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "SET_ACTIVE_POPOVER"; id: string | null }
  | { type: "SET_PENDING_CAPTURE"; capture: PendingCapture | null }
  | { type: "UPDATE_ANNOTATION"; id: string; note: string; priority: AnnotationPriority }
  | { type: "UPDATE_ITEM"; id: string; item: Partial<FeedbackItem> }
  | { type: "PREVIEW_ITEM"; id: string }
  | { type: "REVIEW" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR" }
  | { type: "RESET" }
  | { type: "CLEAR_ALL" };

// --- Legacy compat (used by AnnotateMode internals) ---

export interface Annotation {
  id: string;
  index: number;
  element: ElementCapture;
  note: string;
  timestamp: number;
}

// --- Submission ---

export interface FeedbackSubmission {
  id: string;
  url: string;
  timestamp: string;
  environment: {
    userAgent: string;
    browser: { name: string; version: string };
    os: { name: string; version: string };
    viewport: { width: number; height: number };
    screen: { width: number; height: number };
    devicePixelRatio: number;
    language: string;
    timezone: string;
    colorScheme: "light" | "dark";
  };
  items: FeedbackItem[];
  metadata: Record<string, unknown>;
}

// --- Constants ---

export const DEFAULT_MARKER_COLOR = "#3B82F6";

// --- Props ---

export interface RemediateProps {
  /** Called when the user submits feedback. Receives the full payload including any captured blobs. */
  onSubmit?: (payload: FeedbackSubmission) => void | Promise<void>;
  /** URL to POST feedback as FormData. If set, the widget auto-submits to this endpoint. */
  endpoint?: string;
  /** Extra metadata merged into the submission (e.g. project ID, user info). */
  metadata?: Record<string, unknown>;
  /** Called if the endpoint POST fails. */
  onError?: (error: Error) => void;
}
