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
  console.log(submission);
  return Response.json({ ok: true, id: submission.id });
}
```

`submission` is the structured json. `files` is a `Map<string, File>` of screenshots, recordings, and voice notes.

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
| `onError` | `(error: Error) => void` | called if the POST fails |

## claude code

```bash
claude plugin marketplace add fvckprth/remediate
claude plugin install remediate@fvckprth
```

then run `/remediate` in any react project. detects your framework, picks a backend, installs the package, scaffolds the server route, and wires the component into your layout.

## what gets captured

- screenshots: png from the dom. no permission prompt.
- screen recordings: real video via getDisplayMedia. desktop only. requires https.
- voice notes: microphone audio via getUserMedia. requires https.
- annotations: css selector, dom path, computed styles, bounding rect, nearby text.
- text notes: whatever the user types.
- environment: browser, os, viewport, screen, language, timezone, color scheme.

cross-origin images and iframes render blank in screenshots. video recording is not available on mobile safari.

## docs

[remediate.dev/docs](https://remediate.dev/docs)

- [getting started](https://remediate.dev/docs/install)
- [recipes](https://remediate.dev/docs/recipes): slack, discord, github issues, linear, email, postgres, vercel blob
- [payload](https://remediate.dev/docs/payload): what's in the json
- [privacy](https://remediate.dev/docs/privacy): what gets captured, masking, server-side handling
- [reference](https://remediate.dev/docs/reference): every prop, runtime support, cors, csp, bundle size
- [faq](https://remediate.dev/docs/faq)

## license

mit
