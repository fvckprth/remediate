---
name: remediate
description: Set up and manage the Remediate feedback widget in a React project. Install, add integrations, wire auth, test the endpoint, upgrade, scaffold a feedback dashboard, configure capture types, or cleanly uninstall.
---

## tool index

use this section to decide which tool to run. if the user's intent is ambiguous, ask.

| tool | trigger | section |
|---|---|---|
| setup | first-time install of remediate in a project | [remediate setup](#remediate-setup) |
| add integration | add or replace a backend integration in an existing setup | [add integration](#add-integration) |
| wire auth | add user identity (clerk/nextauth/supabase) to the widget | [wire auth](#wire-auth) |
| test endpoint | send a synthetic submission to verify the route works | [test endpoint](#test-endpoint) |
| upgrade | check for updates and upgrade to latest version | [upgrade](#upgrade) |
| scaffold dashboard | create an admin page to view submitted feedback | [scaffold feedback dashboard](#scaffold-feedback-dashboard) |
| capture gating | configure which capture modes are available | [add capture type gating](#add-capture-type-gating) |
| remove | clean uninstall of remediate from the project | [remove remediate](#remove-remediate) |

if `remediate` is not yet in `package.json`, always run **setup** first. if it is already installed, route to the matching tool above.

---

# Remediate Setup

set up the remediate feedback widget in this project. one component on the client, one route on the server. the route content depends on which backend the project already uses.

## steps

1. **detect package manager**
   - check for `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, or `package-lock.json`
   - use the matching package manager for install commands
   - default to npm if none found

2. **check if already installed**
   - look for `remediate` in `package.json` dependencies
   - if not found, install it: `pnpm add remediate` (or the matching `npm`/`yarn`/`bun` command)
   - if found, skip install and continue

3. **check if already configured**
   - search for `<Remediate`, `import { Remediate }`, or `from "remediate"` in `src/` or `app/`
   - if found, report that remediate is already set up and exit (don't double-mount)

4. **detect framework** (in this order)
   - **next.js app router**: has `app/layout.tsx` or `app/layout.js` (and no `pages/_app`)
   - **next.js pages router**: has `pages/_app.tsx` or `pages/_app.js`
   - **remix**: has `app/root.tsx` and `remix.config` or `@remix-run` in `package.json`
   - **vite + react**: has `vite.config.ts` and `react` in `package.json`
   - **other**: none of the above matched

5. **detect backend, then ask**
   check the project for these signals (in priority order). if exactly one matches strongly, propose it as the default. if more than one, list the matches and ask. if none, ask which backend the user wants.
   - **convex** — `convex/` directory exists, or `convex` in `package.json` dependencies
   - **vercel blob** — `@vercel/blob` in dependencies, or `BLOB_READ_WRITE_TOKEN` in `.env*`
   - **postgres + drizzle** — `drizzle-orm` in dependencies
   - **slack webhook** — `SLACK_WEBHOOK_URL` in `.env*`, or `@slack/webhook` in dependencies
   - **discord webhook** — `DISCORD_WEBHOOK_URL` in `.env*`
   - **github issues** — `GITHUB_TOKEN` in `.env*`, or `@octokit` in dependencies
   - **email (resend)** — `resend` in dependencies, or `RESEND_API_KEY` in `.env*`
   - **none of the above** — offer the full list (`convex`, `vercel blob`, `postgres + drizzle`, `slack webhook`, `discord webhook`, `github issues`, `email`, `local disk`) and ask the user to pick. if they're unsure, default to `local disk` so they can see submissions immediately.

   ask the user something like: "i found `convex` in your project — scaffold the convex recipe? (yes / pick another)". don't pick silently.

5b. **detect auth, then suggest metadata + headers**
   check the project for auth libraries:
   - `next-auth` or `@auth/core` in dependencies
   - `@clerk/nextjs` in dependencies
   - `@supabase/auth-helpers-nextjs` or `@supabase/ssr` in dependencies

   if found, suggest wiring user context:
   - ask: "i see `@clerk/nextjs` — want me to pass the user id and email via metadata and auth token via headers?"
   - if yes, add `metadata={{ userId: user.id, email: user.email }}` and `headers={{ Authorization: \`Bearer ${token}\` }}` to the component mount, with the appropriate auth hook imports for the detected library
   - if no, skip — the user can add it later

6. **create the server route**
   pick the path based on framework:
   - next.js app router → `app/api/feedback/route.ts`
   - next.js pages router → `pages/api/feedback.ts`
   - remix → `app/routes/api.feedback.ts`
   - vite / other → `src/api/feedback.ts` (and tell the user to wire it into their server)

   write the route body using the backend chosen in step 5. use the templates below as the starting point. they target next.js app router; for other frameworks, the body is the same — only the export wrapper changes.

   ### template: convex

   ```ts
   import { parseFeedback } from "remediate/server";
   import { ConvexHttpClient } from "convex/browser";
   import { api } from "../../../convex/_generated/api";
   import type { Id } from "../../../convex/_generated/dataModel";

   const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

   export const runtime = "nodejs";

   export async function POST(req: Request) {
     const { submission, files } = await parseFeedback(req);

     const uploaded: Array<{
       filename: string;
       storageId: Id<"_storage">;
       contentType: string;
       size: number;
     }> = [];

     for (const [, file] of files) {
       const uploadUrl = await convex.mutation(api.feedback.generateUploadUrl, {});
       const res = await fetch(uploadUrl, {
         method: "POST",
         headers: { "Content-Type": file.type },
         body: file.blob,
       });
       if (!res.ok) throw new Error(`convex upload failed: ${res.status}`);
       const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
       uploaded.push({
         filename: file.filename,
         storageId,
         contentType: file.type,
         size: file.blob.size,
       });
     }

     const id = await convex.mutation(api.feedback.insert, {
       submissionId: submission.id,
       url: submission.url,
       timestamp: submission.timestamp,
       itemCount: submission.items.length,
       metadata: submission.metadata,
       payload: submission,
       files: uploaded,
     });

     return Response.json({ ok: true, id });
   }
   ```

   also create or extend `convex/schema.ts` with a `feedback` table and `convex/feedback.ts` with `generateUploadUrl` and `insert` mutations — see [recipes › convex](https://www.remediate.ski/docs/recipes#convex) for the full schema and mutation files. remind the user to run `npx convex dev` once so the codegen is current.

   ### template: vercel blob

   ```ts
   import { parseFeedback } from "remediate/server";
   import { put } from "@vercel/blob";

   export async function POST(req: Request) {
     const { submission, files } = await parseFeedback(req);
     const urls: Record<string, string> = {};
     for (const [name, file] of files) {
       const blob = await put(
         `feedback/${submission.id}/${file.filename}`,
         file.blob,
         { access: "public", contentType: file.type },
       );
       urls[name] = blob.url;
     }
     console.log("[feedback]", submission.id, urls);
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   if `@vercel/blob` is missing, install it. tell the user to set `BLOB_READ_WRITE_TOKEN` in `.env`.

   ### template: postgres + drizzle

   ```ts
   import { parseFeedback } from "remediate/server";
   import { db } from "@/db";
   import { feedback } from "@/db/schema";
   import { writeFile, mkdir } from "node:fs/promises";
   import { join } from "node:path";

   export async function POST(req: Request) {
     const { submission, files } = await parseFeedback(req);

     const dir = join(process.cwd(), "uploads", submission.id);
     await mkdir(dir, { recursive: true });
     for (const [, file] of files) {
       await writeFile(join(dir, file.filename), Buffer.from(await file.blob.arrayBuffer()));
     }

     await db.insert(feedback).values({
       id: submission.id,
       url: submission.url,
       payload: submission,
       createdAt: new Date(),
     });

     return Response.json({ ok: true, id: submission.id });
   }
   ```

   the import paths (`@/db`, `@/db/schema`) assume the project's existing convention — adjust to match. tell the user they may need to add a `feedback` table to their schema.

   ### template: slack webhook

   ```ts
   import { parseFeedback } from "remediate/server";

   export async function POST(req: Request) {
     const { submission } = await parseFeedback(req);
     const lines = submission.items.map((item) => {
       const tag = item.priority !== "none" ? ` *[${item.priority}]*` : "";
       const text =
         item.type === "textNote" ? item.text :
         item.type === "annotation" ? item.note :
         item.additionalText || "";
       return `• ${item.type}${tag} — ${text}`;
     });
     try {
       await fetch(process.env.SLACK_WEBHOOK_URL!, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ text: [`*feedback on ${submission.url}*`, "", ...lines].join("\n") }),
       });
     } catch (err) {
       console.error("[feedback] slack delivery failed:", err);
     }
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   tell the user to set `SLACK_WEBHOOK_URL` in `.env`.

   ### template: discord webhook

   ```ts
   import { parseFeedback } from "remediate/server";

   export async function POST(req: Request) {
     const { submission, files } = await parseFeedback(req);

     const body = submission.items
       .map((item) => {
         if (item.type === "textNote") return item.text;
         if (item.type === "annotation") return `${item.note} (${item.element.selector})`;
         return item.additionalText;
       })
       .filter(Boolean)
       .join("\n");

     const form = new FormData();
     form.append(
       "payload_json",
       JSON.stringify({
         content: `**feedback on ${submission.url}** — ${submission.items.length} items`,
         embeds: body ? [{ description: body }] : [],
       }),
     );

     let i = 0;
     for (const [, file] of files) {
       form.append(`files[${i}]`, file.blob, file.filename);
       i++;
     }

     try {
       await fetch(process.env.DISCORD_WEBHOOK_URL!, {
         method: "POST",
         body: form,
       });
     } catch (err) {
       console.error("[feedback] discord delivery failed:", err);
     }
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   tell the user to set `DISCORD_WEBHOOK_URL` in `.env`. screenshots and recordings attach inline. discord allows up to 10 files per message.

   ### template: github issues

   ```ts
   import { parseFeedback } from "remediate/server";

   export async function POST(req: Request) {
     const { submission } = await parseFeedback(req);
     const body = submission.items
       .map((item) => {
         if (item.type === "textNote") return item.text;
         if (item.type === "annotation") return `${item.note} (${item.element.selector})`;
         return item.additionalText;
       })
       .filter(Boolean)
       .join("\n\n");

     try {
       await fetch(
         `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/issues`,
         {
           method: "POST",
           headers: {
             Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             title: `feedback on ${submission.url}`,
             body: body || "no text content",
             labels: ["feedback"],
           }),
         },
       );
     } catch (err) {
       console.error("[feedback] github issue creation failed:", err);
     }
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   tell the user to set `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` in `.env`.

   ### template: email (resend)

   ```ts
   import { parseFeedback } from "remediate/server";
   import { Resend } from "resend";

   const resend = new Resend(process.env.RESEND_API_KEY);

   export async function POST(req: Request) {
     const { submission, files } = await parseFeedback(req);

     const attachments = [];
     for (const [, file] of files) {
       const buffer = Buffer.from(await file.blob.arrayBuffer());
       attachments.push({ filename: file.filename, content: buffer });
     }

     try {
       await resend.emails.send({
         from: "feedback@yourdomain.com",
         to: "you@yourdomain.com",
         subject: `feedback on ${submission.url}`,
         text: JSON.stringify(submission, null, 2),
         attachments,
       });
     } catch (err) {
       console.error("[feedback] email delivery failed:", err);
     }
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   if `resend` is missing, install it. tell the user to set `RESEND_API_KEY` and update the `from`/`to` addresses. screenshots and recordings arrive as email attachments.

   ### template: local disk (default for local-only setups)

   ```ts
   import { parseFeedback } from "remediate/server";
   import { writeFile, mkdir } from "node:fs/promises";
   import { join } from "node:path";

   export async function POST(req: Request) {
     const { submission, files } = await parseFeedback(req);
     const dir = join(process.cwd(), ".feedback", submission.id);
     await mkdir(dir, { recursive: true });
     await writeFile(join(dir, "submission.json"), JSON.stringify(submission, null, 2));
     for (const [, file] of files) {
       await writeFile(join(dir, file.filename), Buffer.from(await file.blob.arrayBuffer()));
     }
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   add `.feedback/` to `.gitignore`.

   ### formatting with `toMarkdown()`

   all the templates above handle storage and delivery. for destinations that display text (slack, discord, github issues, linear, email), use `toMarkdown()` to format the submission as structured markdown instead of hand-building it:

   ```ts
   import { parseFeedback, toMarkdown } from "remediate/server";

   const { submission, files } = await parseFeedback(req);
   const body = toMarkdown(submission);
   // body is structured markdown: grouped by type, numbered items, priority badges, environment line
   ```

   if files were uploaded to a public URL first, pass them in to get inline images and download links:

   ```ts
   const body = toMarkdown(submission, {
     fileUrls: {
       "screenshot-cap_abc123": "https://storage.example.com/screenshot-cap_abc123.png",
       "voice-voc_def456": "https://storage.example.com/voice-voc_def456.webm",
     },
   });
   ```

   `toMarkdown()` works directly for github issues, linear, discord embeds, and email (as plain text). for slack, the output is readable as plain text but doesn't use slack's `mrkdwn` syntax — use the hand-built slack template above if you want native slack formatting.

   options:
   - `fileUrls` — map of file key → public URL (screenshots render as inline images, recordings/voice as links)
   - `environment` — include the browser/os/viewport line (default: `true`)
   - `metadata` — include the metadata as a fenced JSON block (default: `false`)

7. **add the component**

   `Remediate` is a client component. in next.js app router, `layout.tsx` is a server component by default — you can't add `<Remediate>` directly. create a wrapper:

   **next.js app router:**
   1. create `app/components/feedback-widget.tsx` (or wherever the project keeps components):
      ```tsx
      "use client";
      import { Remediate } from "remediate";

      export function FeedbackWidget() {
        return <Remediate endpoint="/api/feedback" />;
      }
      ```
   2. import and render `<FeedbackWidget />` in `app/layout.tsx`, inside `<body>`, after `{children}`

   if step 5b detected auth and the user said yes, add `metadata` and `headers` props to the `<Remediate>` call inside the wrapper, with the appropriate auth hook (e.g. `useUser()` from clerk, `useSession()` from next-auth).

   **next.js pages router** → `pages/_app.tsx`, after the `<Component>` (no wrapper needed, pages router is client by default)

   **remix** → `app/root.tsx`, inside `<body>` (remix components are client-capable)

   **vite / other** → root app component

   ```tsx
   import { Remediate } from "remediate";

   <Remediate endpoint="/api/feedback" />
   ```

   do NOT gate it behind `NODE_ENV` or any conditional. remediate is meant for production use. if the developer wants to gate it (beta testers, staging only), they can add that themselves.

8. **confirm setup**
   - tell the user remediate is configured with the backend they chose
   - tell them to start their dev server and look for the floating button in the bottom corner
   - if env vars were added (e.g. `SLACK_WEBHOOK_URL`, `RESEND_API_KEY`), remind the user to **restart the dev server** — next.js and most frameworks don't hot-reload `.env` changes
   - if backend is `convex`, also tell them to run `npx convex dev` in another terminal
   - if backend is `local disk`, confirm `.feedback/` was added to `.gitignore`
   - if auth was detected and wired, confirm which user fields are being passed via `metadata` and that the auth token is sent via `headers`
   - mention that submissions land via the route they just created
   - mention `submission.items` is where the content lives (text notes, annotations, photos, videos, voice notes) and `files` is a `Map<string, ParsedFile>` of blobs
   - point them to the docs:
     - [recipes](https://www.remediate.ski/docs/recipes) — copy-pasteable backends (slack, github issues, discord, email, convex, postgres, vercel blob, local disk)
     - [payload](https://www.remediate.ski/docs/payload) — what's in the json
     - [privacy](https://www.remediate.ski/docs/privacy) — what gets captured and what doesn't

## notes

- remediate requires react 18+
- `Remediate` is a client component — in next.js app router it must be inside a `"use client"` boundary
- styles inject automatically, no css import needed
- video and voice recording require https (localhost is fine for dev)
- video recording is desktop-only (no mobile safari support)
- the `metadata` prop attaches user context (userId, email, etc.) to every submission — arrives as `submission.metadata` on the server
- the `headers` prop sends custom headers on the POST (e.g. `Authorization: Bearer ...`) — cleaner than putting auth tokens in metadata
- `parseFeedback` works with any web-standard `Request` object — app router, remix, hono, bun, deno, cloudflare workers
- `submission.items` is the actual content array (not `submission.body`) — narrow on `item.type` to get type-specific fields
- `files` is a `Map<string, ParsedFile>` (not an array) — iterate with `for (const [, file] of files)`
- `toMarkdown(submission)` formats a submission as structured markdown (grouped sections, numbered items, priority badges, environment). pass `fileUrls` to embed screenshots inline. works for github issues, linear, discord, email.
- if the project uses typescript, the types ship with the package
- if the user already has a `<Remediate>` mount, do NOT add a second one — the widget assumes a single instance per app

---

# Add Integration

add or replace a backend integration in an existing remediate setup. use this when the user wants to send feedback to a new destination (e.g. "add slack", "switch to convex", "also send to discord").

## steps

1. **confirm remediate is installed**
   - check `package.json` for `remediate` in dependencies
   - if not found, tell the user to run setup first and exit

2. **find the existing route file**
   - search for files containing `parseFeedback` in `app/`, `pages/`, `src/`
   - this is the definitive signal that a remediate server route exists
   - record the file path

3. **identify the current backend**
   read the route file and look for these signals:
   - `ConvexHttpClient` or `convex` imports → convex
   - `@vercel/blob` or `put(` → vercel blob
   - `drizzle` or `db.insert` → postgres + drizzle
   - `SLACK_WEBHOOK_URL` → slack webhook
   - `DISCORD_WEBHOOK_URL` → discord webhook
   - `api.github.com` or `GITHUB_TOKEN` → github issues
   - `Resend` or `RESEND_API_KEY` → email (resend)
   - `.feedback/` or `submission.json` → local disk
   - if none match, treat it as a custom route

4. **ask the user**
   present two choices:
   - "replace the current `{detected backend}` integration with a new one?"
   - "add a new integration alongside `{detected backend}` (fan-out: both run on every submission)?"

   then list the available backends (same list as setup step 5, excluding ones already present).

5. **replace path**
   - read the existing route file
   - replace the POST handler body with the new backend template from the setup section's templates
   - keep the same export wrapper (app router / pages router / remix / vite)
   - if the new backend needs a package not yet installed, install it
   - if the new backend needs env vars, tell the user
   - do NOT auto-uninstall the old backend's dependencies — warn the user they may want to remove them manually

6. **fan-out path**
   - read the existing route file
   - restructure the POST handler so both backends share the same `submission` and `files` variables
   - **critical:** `parseFeedback(req)` consumes the request body — it can only be called once. both backends must use the same parsed result.

   pattern:
   ```ts
   export async function POST(req: Request) {
     const { submission, files } = await parseFeedback(req);

     // --- existing: {old backend} ---
     {existing backend logic, refactored to use the shared submission/files}

     // --- new: {new backend} ---
     {new backend logic from the template}

     return Response.json({ ok: true, id: submission.id });
   }
   ```

   if the new backend needs additional imports, add them at the top. if it needs a package, install it. if it needs env vars, tell the user.

7. **backend-specific side effects** — same as setup:
   - convex: create or extend `convex/schema.ts` and `convex/feedback.ts`, remind about `npx convex dev`
   - postgres + drizzle: remind about the feedback table
   - local disk: add `.feedback/` to `.gitignore`
   - others: remind about env vars

8. **confirm**
   tell the user what was added, which env vars to set, and to restart their dev server.

## edge cases

- if the route file has been heavily customized (doesn't match any known template), warn the user and suggest adding the new integration manually, or show the template code for them to paste in
- if the user wants 3+ backends, the fan-out pattern still works — add another section under the same handler
- if adding alongside a custom route that doesn't use `parseFeedback`, flag the incompatibility

---

# Wire Auth

add user identity to the remediate widget after initial setup. use this when the user wants to pass userId, email, or auth tokens with feedback submissions.

## steps

1. **find the existing mount**
   - search for `<Remediate` or imports from `"remediate"` in `app/`, `src/`, `pages/`
   - record the file path and component name

2. **check if auth is already wired**
   - look for `metadata={{` containing `userId` or `email`
   - look for `headers={{` containing `Authorization`
   - if both present, report that auth is already configured and exit
   - if only one is present, offer to add the missing one

3. **detect auth library**
   check `package.json` dependencies:
   - `@clerk/nextjs` → clerk
   - `next-auth` or `@auth/core` → nextauth
   - `@supabase/auth-helpers-nextjs` or `@supabase/ssr` → supabase
   - if none found, ask the user which auth system they use
   - if custom or none, add placeholder props with comments and skip hook wiring

4. **verify client boundary**
   - auth hooks only work in client components
   - check if the mount file has `"use client"` at the top
   - if it's a server component (e.g. `layout.tsx`), look for a `"use client"` wrapper file that renders `<Remediate>`
   - if no wrapper exists, create one (same pattern as setup step 7) and add the auth hook there

5. **add the auth hook** based on detected library:

   **clerk:**
   ```tsx
   import { useUser, useAuth } from "@clerk/nextjs";

   // inside the component:
   const { user } = useUser();
   const { getToken } = useAuth();
   ```

   **nextauth:**
   ```tsx
   import { useSession } from "next-auth/react";

   // inside the component:
   const { data: session } = useSession();
   ```

   **supabase:**
   ```tsx
   import { createBrowserClient } from "@supabase/ssr";

   // inside the component:
   const supabase = createBrowserClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   // + useEffect to fetch session
   ```

6. **add metadata and headers props**

   **clerk:**
   ```tsx
   <Remediate
     endpoint="/api/feedback"
     metadata={{ userId: user?.id, email: user?.primaryEmailAddress?.emailAddress }}
   />
   ```
   note: clerk's `getToken()` is async. the `headers` prop accepts a sync function. two options:
   - cache the token in a `useEffect` + state, then pass via `headers`
   - skip the client-side header and validate server-side using clerk's `auth()` in the route handler

   ask the user which they prefer. if server-side, add the `auth()` check to the route file instead.

   **nextauth:**
   ```tsx
   <Remediate
     endpoint="/api/feedback"
     metadata={{ userId: session?.user?.id, email: session?.user?.email }}
   />
   ```
   the session cookie is sent automatically with same-origin requests — no explicit `headers` prop needed unless they want a JWT.

   **supabase:**
   ```tsx
   <Remediate
     endpoint="/api/feedback"
     metadata={{ userId: session?.user?.id, email: session?.user?.email }}
     headers={{ Authorization: `Bearer ${session?.access_token}` }}
   />
   ```

7. **merge, don't overwrite**
   if the `<Remediate>` component already has a `metadata` prop with other fields, merge the auth fields into the existing object — don't replace it.

8. **confirm**
   tell the user which fields are being passed and remind them that `submission.metadata.userId` and `submission.metadata.email` is where the data lands server-side. note that if the user isn't logged in, these will be `undefined` and won't appear in the submission (JSON.stringify strips undefined values).

---

# Test Endpoint

send a synthetic feedback submission to verify the server route works. use this when the user wants to test the endpoint without manually clicking through the widget.

## steps

1. **find the endpoint URL**
   - search for `<Remediate` with an `endpoint` prop — extract the path (e.g. `/api/feedback`)
   - if not found, check standard route file locations: `app/api/feedback/route.ts`, `pages/api/feedback.ts`, `app/routes/api.feedback.ts`, `src/api/feedback.ts`
   - if nothing found, ask the user for the endpoint path

2. **determine the base URL**
   - check `package.json` scripts for the dev port (next.js defaults to 3000, vite to 5173)
   - base URL is `http://localhost:{port}`
   - tell the user to make sure their dev server is running

3. **construct the synthetic payload**
   build a valid `FeedbackSubmission` JSON object:
   ```json
   {
     "id": "fb_test000000",
     "url": "http://localhost:3000/test",
     "timestamp": "{current ISO string}",
     "environment": {
       "userAgent": "remediate-test/1.0",
       "browser": { "name": "Test", "version": "1.0" },
       "os": { "name": "Test", "version": "1.0" },
       "viewport": { "width": 1920, "height": 1080 },
       "screen": { "width": 1920, "height": 1080 },
       "devicePixelRatio": 1,
       "language": "en-US",
       "timezone": "UTC",
       "colorScheme": "light"
     },
     "items": [
       {
         "id": "txt_test0001",
         "index": 1,
         "timestamp": {current epoch ms},
         "type": "textNote",
         "text": "this is a test submission from the remediate skill",
         "additionalText": "",
         "priority": "none"
       }
     ],
     "metadata": { "_test": true }
   }
   ```

4. **send as multipart/form-data**
   use curl with `-F` to match the real widget wire format:
   ```bash
   curl -s -w "\n%{http_code}" \
     -X POST \
     -F "metadata={json string}" \
     http://localhost:{port}/api/feedback
   ```

5. **report the result**
   - HTTP 200 + response contains `"ok": true` → success, show the returned `id`
   - HTTP 200 but no `ok` → route responded but response format is unexpected
   - HTTP 4xx/5xx → show status code and response body, suggest checking the route file
   - connection refused → dev server isn't running

6. **optional: test with a file attachment**
   if the user asks for a more thorough test, create a 1x1 transparent PNG and attach it:
   ```bash
   echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" \
     | base64 -d > /tmp/remediate-test-screenshot.png

   curl -s -w "\n%{http_code}" \
     -X POST \
     -F "metadata={json string}" \
     -F "screenshot-txt_test0001=@/tmp/remediate-test-screenshot.png;type=image/png;filename=screenshot-txt_test0001.png" \
     http://localhost:{port}/api/feedback

   rm /tmp/remediate-test-screenshot.png
   ```
   the file key format is `screenshot-{itemId}` and filename is `screenshot-{itemId}.png` — this matches the real widget wire format from `file-keys.ts`.

## edge cases

- if the route uses auth checks (look for `auth()`, `getToken`, `Authorization` in the route file), warn the user the test will likely return 401 without a valid token
- if the backend is convex and `NEXT_PUBLIC_CONVEX_URL` isn't set, the test will fail at the convex client — flag this
- if the backend is local disk, after a successful test, tell the user to check `.feedback/fb_test000000/submission.json`

---

# Upgrade

check for updates and upgrade remediate to the latest version.

## steps

1. **read the installed version**
   - check `node_modules/remediate/package.json` for the `version` field
   - also note the version spec in the project's `package.json` dependencies (e.g. `^0.1.2`)

2. **check the latest version**
   ```bash
   npm view remediate version
   ```

3. **compare**
   if the installed version matches the latest, report "already on the latest version (v{x})" and exit.

4. **detect package manager** (same as setup step 1)

5. **run the upgrade**
   - pnpm: `pnpm update remediate --latest`
   - npm: `npm install remediate@latest`
   - yarn: `yarn add remediate@latest`
   - bun: `bun add remediate@latest`

6. **check for breaking changes**
   consult this migration map:

   ```
   0.1.0 → 0.1.1: no breaking changes
   0.1.1 → 0.1.2: no breaking changes
   0.1.2 → 0.1.3: no breaking changes
   0.1.3 → 0.1.4: new optional props added (captureTypes, open, onOpenChange, debug, messages) — no breaks
   ```

   if the upgrade crosses a known breaking boundary (none yet):
   - list the breaking changes
   - search the project for affected patterns
   - offer to auto-fix or provide instructions

7. **verify the upgrade**
   read `node_modules/remediate/package.json` again to confirm the new version.

8. **confirm**
   report the version change (e.g. "upgraded from v0.1.2 to v0.1.4") and mention any new features the user might want to use.

## edge cases

- if `npm view` fails (offline, registry down), tell the user to check manually
- if the project uses a monorepo with multiple `package.json` files, check which one has the dependency
- if the upgrade fails (version conflict, peer dependency), report the error and suggest manual resolution

---

# Scaffold Feedback Dashboard

create a simple admin page to view submitted feedback. use this when the user wants to see what feedback has been submitted.

## steps

1. **identify the backend**
   find the existing route file (search for `parseFeedback` in `app/`, `pages/`, `src/`) and identify the backend using the same signals as the add integration tool.

2. **check if the backend is queryable**
   - **queryable:** local disk, convex, postgres + drizzle, vercel blob
   - **send-only:** slack webhook, discord webhook, github issues, email (resend)

   if the backend is send-only, tell the user: "your current backend ({name}) sends feedback out but doesn't store it queryably. add a storage backend alongside it first using the add integration tool." then exit.

3. **detect framework** for the page path (same as setup step 4):
   - next.js app router → `app/admin/feedback/page.tsx`
   - next.js pages router → `pages/admin/feedback.tsx`
   - remix → `app/routes/admin.feedback.tsx`
   - vite / other → `src/pages/admin-feedback.tsx` (tell the user to wire routing)

4. **generate the dashboard page** based on the backend:

   ### template: local disk

   ```tsx
   import { readdir, readFile } from "node:fs/promises";
   import { join } from "node:path";

   export default async function FeedbackDashboard() {
     const base = join(process.cwd(), ".feedback");
     let entries: string[] = [];
     try {
       entries = await readdir(base);
     } catch {
       /* no submissions yet */
     }

     const submissions = await Promise.all(
       entries.map(async (id) => {
         const raw = await readFile(join(base, id, "submission.json"), "utf-8");
         return JSON.parse(raw);
       })
     );

     submissions.sort(
       (a: any, b: any) =>
         new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
     );

     return (
       <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
         <h1>feedback ({submissions.length})</h1>
         <table style={{ width: "100%", borderCollapse: "collapse" }}>
           <thead>
             <tr>
               {["id", "url", "time", "items", "types"].map((h) => (
                 <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>
                   {h}
                 </th>
               ))}
             </tr>
           </thead>
           <tbody>
             {submissions.map((s: any) => (
               <tr key={s.id}>
                 <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontFamily: "monospace", fontSize: "0.85em" }}>{s.id}</td>
                 <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{s.url}</td>
                 <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{new Date(s.timestamp).toLocaleString()}</td>
                 <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{s.items.length}</td>
                 <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                   {[...new Set(s.items.map((i: any) => i.type))].join(", ")}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
         {submissions.length === 0 && (
           <p style={{ color: "#888" }}>no feedback yet. submit something through the widget first.</p>
         )}
       </div>
     );
   }
   ```

   ### template: convex

   create the dashboard as a client component using `useQuery`:
   ```tsx
   "use client";
   import { useQuery } from "convex/react";
   import { api } from "../../../convex/_generated/api";

   export default function FeedbackDashboard() {
     const submissions = useQuery(api.feedback.list) ?? [];

     return (
       <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
         <h1>feedback ({submissions.length})</h1>
         {/* same table structure as local disk template */}
         {submissions.length === 0 && (
           <p style={{ color: "#888" }}>no feedback yet.</p>
         )}
       </div>
     );
   }
   ```

   also add a `list` query to `convex/feedback.ts`:
   ```ts
   import { query } from "./_generated/server";

   export const list = query({
     handler: async (ctx) => {
       return await ctx.db.query("feedback").order("desc").take(100);
     },
   });
   ```

   check that a `ConvexClientProvider` wrapper exists in the layout — convex queries won't work without it.

   ### template: postgres + drizzle

   ```tsx
   import { db } from "@/db";
   import { feedback } from "@/db/schema";
   import { desc } from "drizzle-orm";

   export default async function FeedbackDashboard() {
     const submissions = await db
       .select()
       .from(feedback)
       .orderBy(desc(feedback.createdAt))
       .limit(100);

     return (
       <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
         <h1>feedback ({submissions.length})</h1>
         {/* same table structure — adapt column access to the drizzle schema */}
       </div>
     );
   }
   ```

   adjust import paths to match the project's conventions.

   ### template: vercel blob

   ```tsx
   import { list } from "@vercel/blob";

   export default async function FeedbackDashboard() {
     const { blobs } = await list({ prefix: "feedback/" });

     return (
       <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
         <h1>feedback blobs ({blobs.length})</h1>
         <ul>
           {blobs.map((b) => (
             <li key={b.pathname} style={{ fontFamily: "monospace", fontSize: "0.85em", padding: "4px 0" }}>
               {b.pathname} — {b.size} bytes — {new Date(b.uploadedAt).toLocaleString()}
             </li>
           ))}
         </ul>
         {blobs.length === 0 && (
           <p style={{ color: "#888" }}>no feedback yet.</p>
         )}
       </div>
     );
   }
   ```

5. **warn about auth**
   add a comment at the top of the file:
   ```tsx
   // WARNING: this page has no authentication.
   // add auth middleware before deploying to production.
   ```
   and tell the user: "this dashboard has no authentication. anyone who knows the URL can see all feedback. add auth before exposing it in production."

6. **confirm**
   tell the user the page path and URL (e.g. `http://localhost:3000/admin/feedback`), and remind them about the auth warning.

## edge cases

- if the dashboard page already exists, ask before overwriting
- if `.feedback/` directory doesn't exist yet (no submissions), the local disk template renders the empty state gracefully
- for convex, if no `ConvexClientProvider` wrapper exists in the layout, warn that queries won't work without it

---

# Add Capture Type Gating

configure which capture modes the widget exposes. use this when the user wants to limit feedback types (e.g. "only annotations and text notes") or conditionally enable them based on user role.

## steps

1. **find the existing mount**
   search for `<Remediate` or the wrapper component that renders it.

2. **check if `captureTypes` is already set**
   look for the `captureTypes` prop on the component. if present, report what it's currently set to and ask: "replace the current list or modify it?"

3. **ask the user**
   - "which capture types do you want enabled?" — present the list: `photo`, `video`, `annotation`, `textNote`, `voiceNote`
   - "should this be static (always the same) or conditional (different for different users/roles)?"

4. **static path**
   add or modify the `captureTypes` prop:
   ```tsx
   <Remediate
     endpoint="/api/feedback"
     captureTypes={["annotation", "textNote"]}
   />
   ```

5. **conditional path**
   this requires logic in the wrapper component. check if the mount is in a `"use client"` wrapper. if not, create one (same pattern as setup step 7).

   ask what the condition is. common patterns:

   **role-based (e.g. with clerk):**
   ```tsx
   "use client";
   import { Remediate, type CaptureType } from "remediate";
   import { useUser } from "@clerk/nextjs";

   const ADMIN_TYPES: CaptureType[] = ["photo", "video", "annotation", "textNote", "voiceNote"];
   const USER_TYPES: CaptureType[] = ["annotation", "textNote"];

   export function FeedbackWidget() {
     const { user } = useUser();
     const isAdmin = user?.publicMetadata?.role === "admin";
     return (
       <Remediate
         endpoint="/api/feedback"
         captureTypes={isAdmin ? ADMIN_TYPES : USER_TYPES}
       />
     );
   }
   ```

   **environment-based:**
   ```tsx
   import { Remediate, type CaptureType } from "remediate";

   const captureTypes: CaptureType[] =
     process.env.NODE_ENV === "development"
       ? ["photo", "video", "annotation", "textNote", "voiceNote"]
       : ["annotation", "textNote"];

   export function FeedbackWidget() {
     return <Remediate endpoint="/api/feedback" captureTypes={captureTypes} />;
   }
   ```

   **feature flag:**
   ask the user for the flag variable name and build accordingly.

6. **import `CaptureType`** if the project uses typescript:
   ```tsx
   import { Remediate, type CaptureType } from "remediate";
   ```

7. **confirm**
   tell the user which capture types are enabled and under what conditions.

## edge cases

- if the user specifies an empty array, warn that the widget will have no capture options
- if the user wants only `video`, note that video recording isn't supported on mobile safari (the widget handles this gracefully by disabling the button)
- preserve any other existing props on the `<Remediate>` component when adding `captureTypes`

---

# Remove Remediate

cleanly uninstall remediate from the project. use this when the user wants to remove the widget entirely.

## steps

1. **confirm intent**
   this is destructive. ask: "this will remove the remediate widget, its server route, and the npm package from this project. data already captured (`.feedback/` directory, convex records, database rows) will NOT be deleted. proceed?"

   do NOT proceed until the user confirms.

2. **inventory all artifacts**
   find everything remediate-related and present the list before any deletion:
   - `remediate` in `package.json` dependencies
   - `<Remediate>` or `<FeedbackWidget>` component mount(s) — file path and line
   - wrapper component file (e.g. `app/components/feedback-widget.tsx`)
   - API route file (e.g. `app/api/feedback/route.ts`)
   - `.gitignore` entry for `.feedback/`
   - convex schema/mutation files referencing feedback (if convex backend)
   - any other files importing from `"remediate"` or `"remediate/server"`

3. **remove the component mount**
   in the file that contains `<FeedbackWidget />` or `<Remediate />`:
   - remove the JSX element
   - remove the corresponding import statement
   - if this leaves an import with no specifiers, remove the import entirely

4. **remove the wrapper component file**
   if a dedicated file like `app/components/feedback-widget.tsx` exists that only contains the remediate wrapper, delete it. if the file contains other components too, only remove the remediate-related code.

5. **remove the API route file**
   delete the route file (e.g. `app/api/feedback/route.ts`). if the parent directory is now empty (e.g. `app/api/feedback/` has no other files), delete the directory too.

6. **handle backend-specific artifacts — DO NOT auto-delete data**
   - **convex:** warn that `convex/feedback.ts` and the `feedback` table in `convex/schema.ts` still exist. tell the user: "the convex feedback table and mutations are still in your project. remove them manually if you don't need the data."
   - **local disk:** warn that `.feedback/` directory may contain submitted feedback. tell the user: "`.feedback/` still contains submitted feedback. delete it manually if you don't need it."
   - **postgres + drizzle:** warn about the feedback table in their schema
   - **vercel blob:** warn about uploaded blobs in their vercel blob store
   - **webhook-only backends** (slack, discord, github, email): nothing to clean up beyond the route file

7. **uninstall the package**
   detect the package manager (same as setup step 1) and run:
   - pnpm: `pnpm remove remediate`
   - npm: `npm uninstall remediate`
   - yarn: `yarn remove remediate`
   - bun: `bun remove remediate`

8. **clean up `.gitignore`**
   if `.feedback/` was added to `.gitignore`, remove that line.

9. **check for remaining references**
   search the entire project for `from "remediate"`, `from 'remediate'`, `remediate/server`, `parseFeedback`. if any are found, report them as leftover references that need manual cleanup.

10. **confirm**
    report everything that was removed and everything that was intentionally left (data directories, convex tables, etc.).
