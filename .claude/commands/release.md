---
description: Build, publish to npm, update version across repos, and deploy the site.
---

# Release

publish a new version of remediate.

## steps

1. **determine version bump**
   - if `$ARGUMENTS` is `patch`, `minor`, or `major`, use that
   - if `$ARGUMENTS` is a specific version like `0.2.0`, use that exactly
   - if `$ARGUMENTS` is empty, default to `patch`
   - if `package/package.json` is already at the target version (e.g. an earlier session bumped it), skip step 2

2. **bump version in `package/package.json`**

3. **build the package**
   - `pnpm run build` from the repo root
   - if it fails, stop and report

4. **publish to npm**
   - `npm publish` from `package/`
   - if it fails, stop and report
   - capture the integrity hash and tarball URL for step 6: `npm view remediate@X.Y.Z dist.integrity dist.tarball`

5. **commit + push the widget repo**
   - if the working tree has uncommitted source changes that belong in this release, commit them first as a separate `fix:` / `feat:` / `refactor:` commit (mirrors the project's history pattern: feature commit, then version-bump commit)
   - then commit the version bump alone with: `chore: bump to vX.Y.Z`
   - if you're on a worktree branch, push with `git push origin HEAD:main` (fast-forwards `origin/main` from the worktree HEAD)

6. **update the marketing site (single commit, three file edits)**
   - file 1: `/Users/parthpatel/Desktop/Projects/remediate-mktg/src/components/nav-config.tsx`
     - update the `VERSION` constant
   - file 2: `/Users/parthpatel/Desktop/Projects/remediate-mktg/package.json`
     - bump `"remediate": "^X.Y.Z"`
   - file 3: `/Users/parthpatel/Desktop/Projects/remediate-mktg/package-lock.json` — **hand-edit only, do NOT run npm install**
     - top-level dep range: `packages."".dependencies.remediate` → `^X.Y.Z`
     - lockfile block: `node_modules/remediate` → update `version`, `resolved`, `integrity` (use the integrity from step 4)
   - **CRITICAL — DO NOT run `npm install remediate@latest` (or similar) on macOS.** npm strips cross-platform `optionalDependencies` (e.g. `lightningcss-linux-x64-gnu`) from `package-lock.json` when run on a single platform, and Vercel's Linux build fails with a native binary load error. Hand-editing keeps the rest of the lockfile intact.
   - validate before committing:
     - `node -e "JSON.parse(require('fs').readFileSync('/Users/parthpatel/Desktop/Projects/remediate-mktg/package-lock.json'))"` exits 0
     - `grep -c "node_modules/lightningcss-linux" /Users/parthpatel/Desktop/Projects/remediate-mktg/package-lock.json` returns ≥ 2 (cross-platform deps still present)
   - commit message: `chore: bump version display + upgrade remediate to vX.Y.Z`
   - push to origin (Vercel auto-deploys)

7. **confirm**
   - report the new version
   - confirm npm publish succeeded
   - confirm both pushes (widget repo + mktg repo)
   - note: Vercel takes ~1-2 min; hard-reload remediate.ski once it finishes to clear cached HTML pointing at old chunk hashes
