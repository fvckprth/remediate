# remediate

feedback widget for react. screenshots, screen recordings, voice notes, element annotations. one component on the client, one helper on the server. no accounts, no saas, no storage.

## install

```bash
npm install remediate
```

## add the component

```tsx
import { Remediate } from "remediate";

export default function App() {
  return (
    <>
      <YourApp />
      <Remediate endpoint="/api/feedback" />
    </>
  );
}
```

a floating button appears in the corner. click it, capture, submit. styles inject themselves.

## add the server route

```ts
import { parseFeedback } from "remediate/server";

export async function POST(req: Request) {
  const { submission, files } = await parseFeedback(req);

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

  return Response.json({ ok: true, id: submission.id });
}
```

`submission.items` is the content — a mixed array of text notes, annotations, photos, videos, and voice notes. `files` is a `Map<string, ParsedFile>` keyed by field name.

works anywhere you have a web `Request`: next.js, remix, hono, bun, deno, cloudflare workers.

## try it without a backend

```tsx
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

## claude code

```bash
npx skills add fvckprth/remediate
```

then run `/remediate` in any react project. detects your framework, picks a backend, installs the package, scaffolds the server route, and wires the component into your layout.

works for any agent that reads agent skills — claude code, codex, cursor, opencode, and the rest.

## what gets captured

- screenshots: png from the dom. no permission prompt.
- screen recordings: real video via getDisplayMedia. desktop only. requires https.
- voice notes: microphone audio via getUserMedia. requires https.
- annotations: css selector, dom path, computed styles, bounding rect, nearby text.
- text notes: whatever the user types.
- environment: browser, os, viewport, screen, language, timezone, color scheme.

cross-origin images and iframes render blank in screenshots. video recording is not available on mobile safari.

## docs

[www.remediate.ski/docs](https://www.remediate.ski/docs)

- [getting started](https://www.remediate.ski/docs/install)
- [recipes](https://www.remediate.ski/docs/recipes): slack, discord, github issues, linear, email, postgres, vercel blob
- [payload](https://www.remediate.ski/docs/payload): what's in the json
- [privacy](https://www.remediate.ski/docs/privacy): what gets captured, masking, server-side handling
- [reference](https://www.remediate.ski/docs/reference): every prop, runtime support, cors, csp, bundle size
- [faq](https://www.remediate.ski/docs/faq)

## license

mit
