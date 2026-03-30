# Remediate

Monorepo for **Remediate**, a drop-in feedback widget for React apps: screenshots, screen recording, voice, text notes, and element annotation. The publishable library lives under [`package/`](package/); [`apps/web`](apps/web) is the optional hosted product (marketing, dashboard, API, auth).

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) 10.x (see [`packageManager`](package.json) in the root `package.json`)

## Quick start

```bash
pnpm install
pnpm dev
```

This runs [Turborepo](https://turbo.build/) tasks for:

- **`remediate`** — the npm package (watch build)
- **`web`** — Next.js app at [http://localhost:3000](http://localhost:3000)
- **`remediate-demo`** — example app at [http://localhost:3002](http://localhost:3002)

You do **not** need Postgres or object storage to work on the widget or the demo. The full `apps/web` dashboard and feedback API need a database and other env vars; see [`apps/web/README.md`](apps/web/README.md).

## Repository layout

| Path | Description |
|------|-------------|
| [`package/`](package/) | `remediate` npm package: `<Remediate />`, `remediate/server`, integrations, styles. |
| [`package/example/`](package/example/) | Next.js demo that consumes the workspace package. |
| [`apps/web`](apps/web) | Next.js site: landing, login, projects, feedback ingestion API, widget script route. |

Library usage and API details: [`package/README.md`](package/README.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

The `remediate` package is released under the [MIT License](package/LICENSE).
