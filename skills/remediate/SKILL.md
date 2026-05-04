---
name: remediate
description: Add the Remediate feedback widget to a React project. Detects the framework and backend, installs the package, scaffolds a real server route for the chosen backend, and wires the component into the layout.
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
     await fetch(process.env.SLACK_WEBHOOK_URL!, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ text: [`*feedback on ${submission.url}*`, "", ...lines].join("\n") }),
     });
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   tell the user to set `SLACK_WEBHOOK_URL` in `.env`.

   ### template: discord webhook

   ```ts
   import { parseFeedback } from "remediate/server";

   export async function POST(req: Request) {
     const { submission } = await parseFeedback(req);
     const body = submission.items
       .map((item) => {
         if (item.type === "textNote") return item.text;
         if (item.type === "annotation") return item.note;
         return item.additionalText;
       })
       .filter(Boolean)
       .join("\n");

     await fetch(process.env.DISCORD_WEBHOOK_URL!, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         content: `**feedback on ${submission.url}** — ${submission.items.length} items`,
         embeds: body ? [{ description: body }] : [],
       }),
     });
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   tell the user to set `DISCORD_WEBHOOK_URL` in `.env`.

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
     const { submission } = await parseFeedback(req);
     await resend.emails.send({
       from: "feedback@yourdomain.com",
       to: "you@yourdomain.com",
       subject: `feedback on ${submission.url}`,
       text: JSON.stringify(submission, null, 2),
     });
     return Response.json({ ok: true, id: submission.id });
   }
   ```

   if `resend` is missing, install it. tell the user to set `RESEND_API_KEY` and update the `from`/`to` addresses.

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
- if the project uses typescript, the types ship with the package
- if the user already has a `<Remediate>` mount, do NOT add a second one — the widget assumes a single instance per app
