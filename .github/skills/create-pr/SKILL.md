---
name: create-pr
description: 'Create a pull request for this repo. Use when asked to open/raise/make a PR. Reminds you to update changelogs'
argument-hint: 'e.g. "open a PR for my changes"'
---

# Creating a pull request

## PR scope and component verification

Before opening the PR, resolve its target and inspect all proposed changes, including staged,
unstaged, and relevant untracked files.

For consumer-visible CoreAI component changes, follow
[component-test](../component-test/SKILL.md) in `changed components` mode. Include its status in the
PR summary, and do not open the PR if verification is `Blocked` or `Unverified`.

## Documentation

Before opening a PR, make sure the docs are up to date where relevant:

- **Changelog** — if the change affects `@coreai-ds/react-components`, add an entry under `[Unreleased]` in [CHANGELOG.md](../../../packages/react-components/CHANGELOG.md).
- **Variations from Fluent** — if the change adds, removes, or alters how a component differs from stock Fluent, update [VariationsFromFluent.mdx](../../../apps/storybook/src/stories/docs/VariationsFromFluent.mdx).

Skip whichever doc doesn't apply (e.g. Storybook-only or docsite-only changes usually need neither).
Component-test may inspect these files as supporting evidence but does not edit them. If its handoff reports a documentation mismatch, resolve it through this create-pr documentation workflow.

## Quality checks

Before opening the PR, run this repository's license-header check, formatter, and linter from the
workspace root:

```sh
npm run license:check
npm run format
npm run lint
```

Resolve any missing license headers with `npm run license:fix`, then rerun the check. Resolve any
lint failures. If either fixer changes files, review and commit those changes before opening the PR.

Then open the PR with the `gh` CLI (`gh pr create`). Use only `gh` for this — if it isn't installed or the user isn't authenticated, prompt them to install it (https://cli.github.com) or run `gh auth login`, and stop until that's resolved.

## Assignee and reviewers

- **Assignee** — the author of the PR (assign it to themselves).
- **Reviewers** — everyone else on this team (exclude the author or the command will fail):
  - `arniebradfo` — James Bradford - UX Engineer
  - `Owen-Richard` — Owen Richard - UX Designer
  - `unthinkmedia` — Alex Britez - UX Engineer
  - `tinydinosaurs` — Dana Lachman - UI Engineer
  - `khamudom` — Kham Udom - UI Engineer
- **Optional reviewers** — add when the PR touches specific areas:
  - `weastler` — Will Eastler - UX Engineer - when updating anything related to build or deployment.

Set these with `gh pr create` (`--assignee`, `--reviewer`) or `gh pr edit` after creating the PR not inline as that will cause failures.

Assigning reviewers requires the `read:project` scope on the `gh` token. If it's missing, the command fails with a scope error. You can't complete the `gh` sign-in flow on the user's behalf, so prompt them to add the scope themselves by running:

```sh
gh auth refresh -s read:project
```

Then wait for them to confirm it's done before retrying.
