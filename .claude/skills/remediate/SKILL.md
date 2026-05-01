---

## name: remediate
description: Add the Remediate feedback widget to a React project. Installs the package, creates the server route, wires the component into your layout.

# Remediate Setup

set up the remediate feedback widget in this project. one component on the client, one route on the server.

## steps

1. **detect package manager**
  - check for `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, or `package-lock.json`
  - use the matching package manager for install commands
  - default to npm if none found
2. **check if already installed**
  - look for `remediate` in package.json dependencies
  - if not found, install it: `pnpm add remediate` (or npm/yarn/bun equivalent)
  - if found, skip install and continue
3. **check if already configured**
  - search for `<Remediate` or `import { Remediate }` or `from "remediate"` in src/ or app/
  - if found, report that remediate is already set up and exit
4. **detect framework**
  check in this order:
  - **next.js app router**: has `app/layout.tsx` or `app/layout.js` (and no `pages/_app`)
  - **next.js pages router**: has `pages/_app.tsx` or `pages/_app.js`
  - **remix**: has `app/root.tsx` and `remix.config` or `@remix-run` in package.json
  - **vite + react**: has `vite.config.ts` and `react` in package.json
  - **other**: none of the above matched
5. **create the server route**
  for next.js app router, create `app/api/feedback/route.ts`:
   for next.js pages router, create `pages/api/feedback.ts`:
   for remix, create `app/routes/api.feedback.ts`:
   for vite or other frameworks, create `src/api/feedback.ts` (or wherever the user keeps server code) and tell them to wire it into their server:
6. **add the component**
  for next.js app router, add to root `app/layout.tsx` inside the body, after children:
   for next.js pages router, add to `pages/_app.tsx` after the Component:
   for remix, add to `app/root.tsx` inside the body:
   for vite/other, add to the root app component:
   do NOT gate behind NODE_ENV or any conditional. remediate is meant for production use. if the developer wants to gate it (beta testers, staging only, etc.), they can add that themselves.
7. **confirm setup**
  - tell the user remediate is configured
  - tell them to run their dev server and look for the floating button in the bottom corner
  - mention that clicking it opens the feedback panel where they can capture screenshots, record screen, drop annotations, leave voice notes, and submit
  - mention the server route logs submissions to the console
  - point them to the docs for next steps:
    - recipes: copy-pasteable backends for slack, github issues, discord, email, postgres
    - payload: what's in the json
    - privacy: what gets captured and what doesn't
  - docs url: [https://remediate.ski/docs](https://remediate.ski/docs)

## notes

- remediate requires react 18+
- styles inject automatically, no css import needed
- video and voice recording require https (localhost is fine for dev)
- video recording is desktop-only (no mobile safari support)
- the `metadata` prop lets developers attach user context (userId, email, etc.) to submissions
- `parseFeedback` works with any web-standard `Request` object
- if the project uses typescript, the types ship with the package