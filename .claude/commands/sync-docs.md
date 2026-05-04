---
description: Sync docs, skill, and README after a feature or recipe change.
---

# Sync Docs

keep the docs site, agent skill, and package README in sync after changes.

## when to run

after any change to: recipes, props, payload shape, component API, capture types, or server helpers.

## sources of truth

- **docs site** (`/Users/parthpatel/Desktop/Projects/remediate-mktg/src/app/docs/`) — the canonical reference
- **agent skill** (`skills/remediate/SKILL.md`) — must match the docs recipes and component patterns
- **package README** (`README.md` at repo root) — quick-start subset of the docs

## steps

1. **identify what changed**
   - if `$ARGUMENTS` is provided, use it as the description of what changed
   - if empty, diff the docs site against the skill and README to find mismatches

2. **read current state of all three**
   - read the relevant docs pages (install, recipes, payload, reference)
   - read `skills/remediate/SKILL.md`
   - read `README.md`

3. **update the skill**
   - sync recipe templates to match docs (same code, same type narrowing, same file handling)
   - sync backend detection signals if new backends were added
   - sync component mounting instructions if props changed
   - sync notes section if capture types or API changed

4. **update the README**
   - sync the server route example to match the install page
   - sync the props table to match the reference page
   - sync capture type descriptions if they changed
   - keep the README minimal — it's a quick-start, not the full docs

5. **commit and push both repos**
   - skill + README changes in the package repo: `docs: sync skill and readme with docs site`
   - if docs site needed fixes too, commit those separately in remediate-mktg

6. **confirm**
   - list what was updated in each file
   - flag anything that looked inconsistent but wasn't clear how to resolve
