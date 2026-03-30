# remediate

Drop-in feedback widget for React apps. Screenshot, video, voice, text, and element annotation.

## Install

```bash
npm install remediate
```

## Usage

```tsx
import { Remediate } from 'remediate'
import 'remediate/styles.css'

function App() {
  return (
    <>
      <YourApp />
      <Remediate
        onSubmit={(payload) => {
          // payload.items contains screenshots, recordings, annotations, notes
          console.log(payload)
        }}
      />
    </>
  )
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onSubmit` | `(payload: FeedbackSubmission) => void` | Called when the user submits feedback. Falls back to `console.log` if omitted. |

## What's in the payload

Each submission includes:

- **Screenshots** — PNG Blob captured from the DOM
- **Video recordings** — WebM Blob via screen share (`getDisplayMedia`)
- **Voice notes** — WebM audio Blob via microphone (`getUserMedia`)
- **Text notes** — Plain text string
- **Element annotations** — CSS selector, XPath, computed styles, bounding rect, tag attributes
- **Environment** — Browser, OS, viewport, screen dimensions, DPI, language, timezone, color scheme

## Feedback item types

```ts
type FeedbackItem =
  | PhotoCapture    // { type: 'photo', area, blob?, additionalText }
  | VideoCapture    // { type: 'video', area, duration, blob?, additionalText }
  | AnnotationItem  // { type: 'annotation', element, note }
  | TextNoteItem    // { type: 'textNote', text }
  | VoiceNoteItem   // { type: 'voiceNote', duration, blob? }
```

## Browser requirements

- **Screenshots**: Works in all modern browsers (uses DOM rendering)
- **Video recording**: Requires HTTPS. Shows a native screen-share permission prompt.
- **Voice recording**: Requires HTTPS. Shows a native microphone permission prompt.
- **Cross-origin note**: DOM-based screenshot capture cannot render cross-origin images or iframes (they appear blank).

## Contributing

This package is developed in the [Remediate monorepo](https://github.com/pxrth9/remediate); see [CONTRIBUTING.md](https://github.com/pxrth9/remediate/blob/main/CONTRIBUTING.md) for setup and pull requests, and the [repository README](https://github.com/pxrth9/remediate/blob/main/README.md) for layout and quick start.

## License

MIT
