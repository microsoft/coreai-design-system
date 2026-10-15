---
name: create-template
description: >
  Create a new copy-paste template in the CoreAI Design System Storybook.
  Use when asked to add a new template, pattern, or page scaffold under
  Templates/ in Storybook. ALWAYS read apps/storybook/README.md's
  "Creating a template" section first. IGNORE and DO NOT use when editing ./apps/prototype
argument-hint: 'e.g. "create a Detail Page template"'
---

# Creating a Storybook template

Before writing any files, read
[apps/storybook/README.md#creating-a-template](../../../apps/storybook/README.md#creating-a-template) —
it's the source of truth for the file convention (`{Name}.tsx` +
`{Name}.stories.tsx` + generated `{Name}.mdx`), the CSF3 story rules, the
JSDoc→MCP mapping, and the quality checklist. Follow it exactly; don't
improvise a different file layout.

## Steps

1. Create `{Name}.tsx` under `apps/storybook/src/stories/templates/` — the
   self-contained copy-paste component (no Storybook imports).
2. Create `{Name}.stories.tsx` next to it — minimal meta + `Default` story +
   JSDoc, per the README convention.
3. Run `npm --workspace apps/storybook run docs:templates` (or just save —
   the dev-server watcher regenerates it) to produce `{Name}.mdx`. Never
   hand-author or edit that file.
4. Work through the Quality checklist in the README section before
   committing.

## Commit and PR conventions

### Commits

One commit per logical unit:

```
feat(storybook): add {Name} copy-paste template
```

Fix commits that arise during review:

```
fix(storybook): {short description}
refactor(storybook): {short description}
```

### PR title

```
feat(storybook): {Name} copy-paste template
```

### PR body sections

```md
Closes #{issue}

## What
One paragraph — what was built and why.

## Changes
### Storybook — {Name}
- `{Name}.tsx` — the copy-paste component (single source of truth)
- `{Name}.stories.tsx` — Storybook meta, stories, JSDoc for MCP

## Features
### {Key decision 1}
Explain the non-obvious design choice and why it was made.
```

Reference the existing templates (`EmptyState`, `FilterableList`,
`ShellAndNavigation`) as style examples. See also the
[`create-pr` skill](../create-pr/SKILL.md) for changelog/reviewer conventions
once the template is ready to ship.

