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

2. **bump version in `package/package.json`**
   - read the current version
   - bump it according to step 1
   - edit the file

3. **build the package**
   - run `pnpm run build` from the repo root
   - if it fails, stop and report the error

4. **publish to npm**
   - run `npm publish` from `package/`
   - if it fails, stop and report the error

5. **commit and push the version bump**
   - stage `package/package.json`
   - commit with message: `chore: bump to vX.Y.Z`
   - push to origin

6. **update the marketing site version display**
   - in `/Users/parthpatel/Desktop/Projects/remediate-mktg/src/components/nav-config.ts`, update the `VERSION` constant to the new version
   - commit with message: `chore: bump version display to vX.Y.Z`
   - push to origin (vercel auto-deploys from the push)

7. **confirm**
   - report the new version number
   - confirm npm publish succeeded
   - confirm marketing site push (auto-deploys)
