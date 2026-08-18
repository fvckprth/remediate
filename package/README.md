# remediate Svelte

feedback widget for svelte. screenshots, screen recordings, voice notes, element annotations. one component on the client, one helper on the server. no accounts, no saas, no storage.

ported to svelte by [Nidheesh Vakharia](https://github.com/nidheesh-m-vakharia).

## install

```bash
npm install remediate-svelte
```

## add the component

```svelte
<script>
  import { Remediate } from "remediate-svelte";
</script>

<YourApp />
<Remediate endpoint="/api/feedback" />
```

> **sveltekit:** `Remediate` is a browser-only widget — it no-ops during SSR and renders on the client. drop it once in your root `+layout.svelte`.

a floating button appears in the corner. click it, capture, submit. styles inject themselves.

## add the server route

```ts
import { parseFeedback } from "remediate-svelte/server";
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  const { submission, files } = await parseFeedback(request);

  // submission.items is the actual content
  const body = submission.items
    .map((item) => {
      if (item.type === "textNote") return item.text;
      if (item.type === "annotation") return item.note;
      return item.additionalText;
    })
    .filter(Boolean)
    .join("\n");

  // files is a Map<string, ParsedFile>, not an array
  for (const [, file] of files) {
    console.log(file.filename, file.category, file.blob.size);
  }

  return json({ ok: true, id: submission.id });
}
```

`submission.items` is the content — a mixed array of text notes, annotations, photos, videos, and voice notes. `files` is a `Map<string, ParsedFile>` keyed by field name.

`parseFeedback` takes any web `Request`, so the same route works in sveltekit, hono, bun, deno, and cloudflare workers.

## try it without a backend

```svelte
<Remediate onSubmit={(payload) => console.log(payload)} />
```

open devtools, capture something, watch the payload.

## props

| prop | type | description |
|---|---|---|
| `endpoint` | `string` | url to POST feedback as FormData |
| `onSubmit` | `(payload: FeedbackSubmission) => void` | called on submit with the full payload |
| `metadata` | `Record<string, unknown>` | extra data merged into the submission |
| `headers` | `Record<string, string> \| () => Record<string, string>` | custom headers on the POST (e.g. auth tokens) |
| `onError` | `(error: Error) => void` | called if the POST fails |
| `captureTypes` | `CaptureType[]` | which capture modes to expose (defaults to all) |
| `open` | `boolean` | controlled open state. pair with `onOpenChange` |
| `onOpenChange` | `(open: boolean) => void` | called when the user opens or closes the widget |
| `debug` | `boolean` | log lifecycle events to the console |
| `messages` | `Partial<WidgetMessages>` | override any user-visible string |

## script tag

no build step? drop in the self-contained widget and point it at your endpoint:

```html
<script
  src="https://cdn.jsdelivr.net/npm/remediate-svelte/dist/widget.js"
  data-endpoint="/api/feedback"
></script>
```

## what gets captured

- **photo** — screenshot of a selected region, rendered from the dom. no permission prompt.
- **video** — screen recording via getDisplayMedia. desktop only. requires https.
- **voiceNote** — microphone audio via getUserMedia. requires https.
- **annotation** — pin on a dom element. captures css selector, dom path, computed styles, bounding rect, nearby text.
- **textNote** — whatever the user types.
- **environment** — browser, os, viewport, screen, language, timezone, color scheme (auto-captured).

cross-origin images and iframes render blank in screenshots. video recording is not available on mobile safari.

## about this port

`remediate-svelte` is a faithful svelte 5 port of [remediate](https://www.remediate.ski) — same widget, same capture flows, same server helpers, rebuilt with runes. the upstream docs describe the shared api and payload shape:

- [payload](https://www.remediate.ski/docs/payload): what's in the json
- [privacy](https://www.remediate.ski/docs/privacy): what gets captured, masking, server-side handling
- [reference](https://www.remediate.ski/docs/reference): every prop, runtime support, cors, csp, bundle size

## license

mit
