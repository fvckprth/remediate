# Contributing

Thank you for helping improve Remediate. This document covers developing **in the monorepo**. The published package API is documented in [`package/README.md`](package/README.md).

## License

By contributing, you agree that your contributions are licensed under the same terms as the project (see [`package/LICENSE`](package/LICENSE)).

## Development setup

1. Install [pnpm](https://pnpm.io/installation) and a current [Node.js](https://nodejs.org/) LTS release.
2. Clone the repository and install dependencies:

   ```bash
   pnpm install
   ```

3. Start the dev stack:

   ```bash
   pnpm dev
   ```

   This builds and watches the `remediate` package and runs:

   - **`web`** — [http://localhost:3000](http://localhost:3000) (hosted app; needs env for full features)
   - **`remediate-demo`** — [http://localhost:3002](http://localhost:3002) (widget demo)

## Where to make changes

- **Widget UI, capture logic, types** — [`package/src/`](package/src/). Styles for the widget chrome live in [`package/src/styles/widget.css`](package/src/styles/widget.css).
- **Hosted dashboard / API** — [`apps/web/src/`](apps/web/src/).
- **Small integration example** — [`package/example/`](package/example/).

Conventions for the widget (dark chrome, animation rules, offline retry, presigned uploads) are summarized in [`AGENTS.md`](AGENTS.md). Panel morphing patterns are described in [`ANIMATION_PATTERN.md`](ANIMATION_PATTERN.md).

## Full `apps/web` stack

Running login, projects, and file uploads locally requires Postgres (the app targets [Neon](https://neon.tech)), S3-compatible storage (e.g. Cloudflare R2), and GitHub OAuth. Environment variables and database steps are documented in [`apps/web/README.md`](apps/web/README.md).

## Before you open a pull request

- Run a production build from the repo root: `pnpm build` (or scope to the packages you changed).
- Keep changes focused on the issue or feature you are addressing.

## Publishing

Release and versioning for the `remediate` package are maintained by the maintainers; publishing is not required for normal contributions.
