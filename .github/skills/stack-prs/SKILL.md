---
name: stack-prs
description: 'Create or reorganize a native GitHub stack of existing PRs, resolve overlapping changes before review, and prepare an ordered approval and merge handoff.'
---

# Stack pull requests

Use native GitHub stacked pull requests, not just linked descriptions or chained
base branches. A stack moves integration work ahead of review; it does not
guarantee that arbitrary changes are compatible or remove required approvals.

## Plan the tranche

1. Follow the user's GitHub account instructions before using `gh`. Check
   `git status --short --branch`, worktrees, repository, default branch, and remote.
   Preserve unrelated work. Do not switch a dirty worktree or alter another
   worktree's branch.
2. Inspect the selected open PRs: author, repository, draft state, head/base names
   and OIDs, existing stack membership, commits, files, reviews, and check results.
   Do not assume every open PR belongs in the tranche. Native stacks require all
   branches in the same repository.
3. Fetch the remote and inspect ancestry. Record each original head and the
   original base/merge-base before changing anything. A PR targeting a previously
   merged feature branch must contribute only its own changes, not replay the
   old feature or unrelated commits from `main`.
4. Choose a bottom-to-top order. Put real dependencies before their consumers.
   For independent PRs, prefer a stable order, such as oldest first, and inspect
   shared files for semantic dependencies. Shared changelogs, tests, manifests,
   lockfiles, generated files, and release metadata need particular care.
5. Explain the order, conflict strategy, and validation to the user. Get approval
   before rewriting existing branches or changing PR bases. Coordinate with
   other authors; do not overwrite concurrent work.

For example:

```text
main <- workflow-skill <- markdown-discovery <- page-titles <- remove-old-tooling
```

The arrow points from a PR's head toward its base. Each layer should contain only
its own change when compared with the layer immediately below it.

## Prepare a linear stack before review

- Save the original branch tips under named local backup refs and record the
  original PR bases. Keep these until the tranche has landed. Stop if remote
  heads change during preparation.
- Prefer preparing on temporary branches so published PRs remain unchanged while
  conflicts and validation are in progress.
- Rebase each layer onto its predecessor, starting from the current trunk. Do
  not merge `main` or sibling branches repeatedly into the stack. Native merging
  requires linear ancestry between layers.
- For existing merge-heavy PRs, inspect merge-resolution changes before choosing
  a strategy. Replaying only non-merge commits can lose those resolutions. With
  the user's permission to rewrite history, an alternative is to apply each PR's
  complete net diff from its recorded original base onto its new parent and
  commit it as one layer. Preserve binary patches and file modes; never import a
  whole old branch snapshot over the new parent.
- Resolve conflicts deliberately. Preserve every PR's dated changelog section,
  avoid duplicate entries and version bumps, and retain unrelated notes. Preserve
  both behaviors when tests or source overlap. Regenerate derived files with
  existing tooling when necessary; do not blindly take `ours` or `theirs`.
- Inspect every parent-to-child diff and the cumulative trunk-to-top diff.
  Compare the new layer with its original net diff, explaining integration
  adjustments. Check for accidentally omitted changes, inherited changes shown
  twice, stale metadata, conflict markers, and unrelated edits.
- Verify direct ancestry with `git merge-base --is-ancestor PARENT CHILD` and
  inspect `git log --merges PARENT..CHILD` for unexpected merge commits.
- Run focused tests for overlapping behavior and the cumulative result. Run the
  existing formatter, license check, lint, and relevant type/build/browser checks.
  A conflict-free Git operation is not evidence that behavior is correct.

Do not request the review tranche until the final branch content and order are
stable. Initial restacking can invalidate earlier approvals.

## Publish and register the native stack

Check installed command help first:

```sh
gh stack --help
gh stack link --help
gh stack init --help
gh stack submit --help
```

Do not assume the extension is installed or that flags from another version
exist. If unavailable, use GitHub's documented native website or Stacks REST API;
do not silently substitute ordinary base retargeting.

1. Follow [create-pr](../create-pr/SKILL.md) for a new bottom PR. Follow
   [update-docs-changelog](../update-docs-changelog/SKILL.md) for each layer,
   including layers whose direct base is another PR branch rather than `main`.
   Preserve existing PR numbers, titles, descriptions, issue links, and notes.
2. Recheck remote heads, then push prepared branches using explicit destinations
   and `--force-with-lease=refs/heads/BRANCH:EXPECTED_OLD_OID`. Prefer an atomic
   multi-ref push when publishing an existing tranche. Never use plain `--force`.
   A failed lease means stop and inspect concurrent changes, not fetch and retry
   with an updated lease without reconciling them.
3. Register the ordered PRs as a native stack. With the installed extension
   supporting this syntax, an existing-PR example is:

   ```sh
   gh stack link 101 102 103 104 --base main
   ```

   PR 101 is the bottom and PR 104 is the top. This command mutates GitHub.
   Branch arguments may also push branches and create missing PRs; use existing
   PR numbers when that is the intent.
4. For ongoing local development, `gh stack init --base main BRANCH1 BRANCH2`
   can adopt local branches in bottom-to-top order. `gh stack submit` publishes
   and creates or updates PRs; it is not a dry run. Avoid creating a second stack
   or replacing existing PR metadata accidentally.
5. Read back the PRs and native stack through GitHub. Verify the shared stack
   identity, size, trunk, positions, head OIDs, and direct bases. A chain of PR
   bases or a diagram in a description alone is not sufficient.
6. Confirm CI actually runs for every layer and all required checks are reported
   for the new heads. Pending, missing, skipped, and failed checks are not passes.
   Do not bypass protections or fabricate approvals.

Native stacks evaluate reviews, CODEOWNERS, and checks against the stack trunk.
GitHub documents that `pull_request` workflows filtered to `main` run for every
layer of a native stack; verify that this happens rather than weakening filters.

## Review and merge handoff

Provide a compact table with each PR link, position, base, purpose, current checks,
and review state. Identify the top PR and any remaining blockers. State which
local validations ran and whether GitHub checks are still pending.

- Ask reviewers to inspect the focused layers bottom-to-top and approve each PR.
  Each layer still has to satisfy the trunk's rules.
- Once every layer qualifies, selecting the top PR's native stack merge can land
  the full contiguous tranche atomically, in order. A lower PR merges only the
  prefix through that PR. A middle PR cannot merge in isolation.
- Use GitHub's native stack merge UI, a supported `gh stack merge` command, or the
  documented asynchronous merge API. Do not use the legacy synchronous merge API
  for stacks. Do not merge, enable auto-merge, or bypass rules without the user's
  explicit instruction.
- Avoid editing lower layers after approval. If necessary, cascade the rebase
  upward, resolve conflicts, rerun affected checks, and update the handoff.
- For tracked local stacks, use `gh stack rebase` and `gh stack push` according to
  installed help. GitHub documents retained approvals when a native stack rebase
  leaves the review diff unchanged; changed content can still need fresh review.
  Do not promise that arbitrary rebases or conflict resolutions retain approval.
- If `main` moves before merging, recheck stack linearity and integration. The
  native **Rebase stack** operation can update the stack, but actual conflicts
  still require resolution. Stacking does not reserve `main`.
- After a partial merge, inspect automatic rebasing and retargeting before
  continuing. Review `gh stack sync` help before using it: syncing can rebase and
  push, not merely fetch. Do not prune branches or remove backups prematurely.

## GitHub references

- [Stack rules and requirements](https://docs.github.com/en/pull-requests/reference/stacked-pull-requests)
- [Managing and rebasing stacks](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/managing-stacked-pull-requests)
- [Merging a stack](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-stacked-pull-requests)
- [Stack APIs and webhooks](https://docs.github.com/en/pull-requests/reference/stacked-pull-requests-apis-and-webhooks)
