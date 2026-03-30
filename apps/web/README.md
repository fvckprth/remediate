# web

Next.js application for the hosted Remediate product: marketing site, GitHub authentication, project and API key management, feedback ingestion API, and dashboard views. It depends on the workspace package `remediate`.

You only need this app if you are developing or deploying the hosted service. The widget library and demo app do not require this stack.

## Environment variables

Create `apps/web/.env.local` (or `.env`) with values appropriate for your environment. Turborepo passes through the variables listed in the root [`turbo.json`](../turbo.json) when you run `pnpm dev` from the repository root.

| Variable | Required for | Description |
|----------|----------------|-------------|
| `DATABASE_URL` | Database access | PostgreSQL connection string. The app uses Neon’s serverless driver ([`src/db/index.ts`](src/db/index.ts)); a [Neon](https://neon.tech) database is the straightforward choice. |
| `AUTH_SECRET` | Sign-in sessions | Secret for [Auth.js](https://authjs.dev/). Generate a random string (e.g. `openssl rand -base64 32`). |
| `AUTH_GITHUB_ID` | GitHub login | OAuth App client ID. |
| `AUTH_GITHUB_SECRET` | GitHub login | OAuth App client secret. |
| `R2_ENDPOINT` | Uploading feedback blobs | S3-compatible endpoint URL (e.g. Cloudflare R2). |
| `R2_ACCESS_KEY_ID` | Uploading feedback blobs | Access key. |
| `R2_SECRET_ACCESS_KEY` | Uploading feedback blobs | Secret key. |
| `R2_BUCKET` | Uploading feedback blobs | Bucket name. |

Without `DATABASE_URL`, pages that query the DB will fail. Without R2 variables, submissions that include files may fail at upload time.

## Database

1. Provision a Postgres instance and set `DATABASE_URL` (Neon provides a compatible connection string).

2. From `apps/web`, apply the schema with [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview):

   ```bash
   pnpm run db:push
   ```

   Ensure `DATABASE_URL` is available (for example in `.env` or `.env.local` in this directory; Drizzle Kit reads `.env` by default).

3. Optional: insert a test project and API key:

   ```bash
   pnpm run db:seed
   ```

   Loads `.env.local` and `.env` from this directory. The script prints a raw API key once; save it if you need to call the API.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Next.js dev server (port 3000 by default). |
| `pnpm build` | Production build. |
| `pnpm start` | Run the production server after `build`. |
| `pnpm run db:push` | Push [`src/db/schema.ts`](src/db/schema.ts) to the database. |
| `pnpm run db:seed` | Run [`seed.ts`](seed.ts) (test project + API key). |

## Running from the monorepo root

```bash
pnpm dev
```

starts `web` together with the `remediate` package and the demo app. To run only this app:

```bash
pnpm --filter web dev
```
