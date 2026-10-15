---
name: component-test
description: >
  Analyze a requested CoreAI component test scope, add or update focused
  Vitest Browser Mode regression tests, run them in Playwright Chromium, and
  report product behavior problems without changing production code. IGNORE and DO NOT use when editing ./apps/prototype
argument-hint: 'component, behavior, file, GitHub issue number, or GitHub issue URL'
---

# Testing CoreAI components

Use this skill to:

Analyze a requested or changed CoreAI component scope, add or update focused regression tests when
needed, run them in Vitest Browser Mode, and report product behavior problems.

This skill manages component tests, not unrelated developer workflow or production fixes.

## Boundaries

- Work on the current branch. Never create, rename, or switch branches; stage, commit, or push; or
  create or update a PR. Issues define test scope, not Git workflow.
- Modify test files only unless the user explicitly requests production changes. A confirmed
  pre-existing CoreAI bug may receive this comment-only production TODO:

  ```ts
  // TODO: CoreAI bug — <brief description of the observed issue>.
  // Expected contract: <brief description of the intended behavior>.
  // Remove this TODO when the implementation is fixed.
  ```
  Do not add it for a current-change regression. It must not affect code, behavior, styles, props,
  exports, or runtime logic.
- Never weaken, remove, skip, or convert a valid regression test merely to make the suite pass.
- Do not delete or clean repository files or run cleanup commands such as `Remove-Item`, `rm`,
  `git clean`, or `git reset`. Leave generated artifacts unchanged and report them. Do not change
  repository or test configuration solely for cleanup.
- Inspect only the requested component scope and nearby implementation, public subcomponents,
  helpers, styles, tests, and relevant documentation. Do not perform a repository-wide audit.
- Do not edit documentation.

## 1. Resolve scope

Accepted scopes include:

```text
/component-test <Component>
/component-test add tests for <Component>
/component-test test <Component> <behavior>
/component-test <file>
/component-test #<issue-number>
/component-test https://github.com/microsoft/coreai-design-system/issues/<issue-number>
/component-test changed components
```

If no scope is supplied, ask the user. Do not infer one from the editor, alphabetical order, or
missing coverage.

For an issue number, read the issue from this repository:

```sh
gh issue view <issue-number> \
  --repo microsoft/coreai-design-system \
  --json number,title,body,url
```

For a full URL, pass it directly and request the same fields. Use the title, scope or description,
named components, requested tests, and completion criteria as the scope. Verify issue claims against
the current implementation; report stale criteria rather than encoding them. Ask if the issue is
unavailable or ambiguous, and never edit it.

For a named component or family, inspect its implementation, closely related public subcomponents,
helpers, styles, and existing tests. Put new coverage in the owning component's test file when
practical; a broader component may be a fixture only when it owns the behavior. For helpers and
styles, test their consumer-visible result rather than implementation details.

### Changed-components mode

- Resolve the intended PR target from an explicit user value or reliable PR metadata. Never infer it
  from the branch name or invent a base. If unresolved, ask for it and report committed branch scope
  as unverified; staged, unstaged, and relevant untracked changes may be assessed separately.
- With read-only Git, inspect the branch diff from the target merge base plus staged, unstaged, and
  relevant untracked changes.
- Use changed paths to locate affected contracts, then follow only directly relevant public
  subcomponents, wrappers, style hooks, helpers, providers, and shared dependencies.
- Implementation changes define scope. Documentation-only wording, moves, and unrelated tooling or
  configuration do not require regression tests unless they expose a contract discrepancy.
- A changed component file does not require a new test. Assess the consumer-visible CoreAI contract
  and existing focused coverage, not filenames.

## 2. Analyze

For each affected behavior, determine:

- what CoreAI implements, changes, transforms, defaults, or guarantees;
- what arrives unchanged from Fluent UI, the browser, React, Griffel, or another dependency;
- what consumers can observe; and
- whether a plausible CoreAI change could regress it and focused coverage already protects it.

Implementation is primary evidence. Cross-check only relevant entries in
`packages/react-components/CHANGELOG.md` and the relevant component section of
`apps/storybook/src/stories/docs/VariationsFromFluent.mdx`. Documentation supports intent but does
not create scope or require tests by itself. Report implementation/documentation mismatches with
both locations and interpretations; do not resolve them by editing docs or production code.

Reuse a previous result only when the contract and relevant implementation, tests, helpers,
providers, wrappers, style hooks, shared dependencies, and contract documentation have not
materially changed.

Reuse passing focused coverage when it protects the contract. Update a test only when the contract
intentionally changed, and add a test only when meaningful CoreAI-owned observable behavior lacks
coverage. No test change is a valid outcome. Do not duplicate unchanged dependency behavior.

Treat comments documenting dependency deviations, compatibility constraints, and bug workarounds as
strong regression signals. Prefer behavior-preserving tests:

- Assert exact values only when CoreAI guarantees them; otherwise assert stable relationships,
  precedence, absence of overrides, state transitions, accessible behavior, or callback results.
- Make branch tests distinguish each meaningful branch. A swapped branch implementation must fail
  at least one assertion; counts, existence, or generic non-equality alone are insufficient.
- For interactions, verify the transition and that disabled or non-interactive branches do not
  receive it.
- Parameterized cases must retain branch-specific expected outcomes.

Avoid coverage-only tests, exhaustive dependency matrices, private implementation assertions,
incidental DOM or classes, one assertion per CSS declaration, and unexplained snapshots.

## 3. Test

Component tests are `src/**/*.test.tsx` files run in Vitest Browser Mode through Playwright Chromium
and `vitest-browser-react`.

- Render with `renderCoreAIComponent` from `src/test-utils.tsx`.
- Prefer browser locators and consumer-visible assertions: roles, names, labels, values, callbacks,
  focus, and state.
- For dependency fallback, assert the CoreAI override is absent or disabled rather than hard-coding
  dependency internals.
- For warnings and errors, assert the meaningful condition with stable text unless exact wording is
  public API.
- Use `userEvent` from `vitest/browser` for keyboard, pointer, and upload interactions.
- Mock only the narrow external boundary with Vitest APIs; exercise CoreAI behavior normally.
- Register `cleanup` with `afterEach`, restore mocks when used, and await asynchronous work.
- Give tests behavioral, condition-specific names.

Run every added or updated test file and every existing focused file relied on as sufficient:

```sh
npm --workspace packages/react-components test -- src/components/<Component>.test.tsx
```

Install Chromium only when it is unavailable locally:

```sh
npm --workspace packages/react-components run test:install-browser
```

## 4. Verify

Focused Vitest Browser Mode is sufficient runtime verification when it exercises the requested
contract. Do not add a second workflow.

Verification must match the current relevant branch and worktree state. Rerun affected focused tests
after material changes to the contract, implementation, tests, helpers, providers, wrappers, style
hooks, shared dependencies, or contract documentation. Unrelated edits and wording, formatting, or
cleanup changes do not make it stale.

For shared changes, identify plausibly affected contracts and run their focused tests. Run the
broader package suite only when multiple component test files or shared test utilities changed, or
the behavior crosses shared integration boundaries:

```sh
npm --workspace packages/react-components test
```

Run type checking only when relevant:

```sh
npm --workspace packages/react-components run type-check
```

Do not run unrelated environments or automatically start Storybook, development servers, Storybook
MCP, or separate browser automation. Use interactive verification only when requested or Vitest
cannot reasonably prove the behavior, and explain why first.

## 5. Handoff

End every invocation with one concise handoff and no duplicate summary. Assign exactly one status:

- **Verified** — required contracts were assessed; current required verification passed; no
  current-change regression or unverified required scope remains. A confirmed pre-existing bug does
  not automatically fail current-change validation.
- **Blocked** — a regression introduced by the current branch or proposed changes remains.
- **Unverified** — required scope could not be verified, verification is stale and cannot be rerun,
  the PR target is unresolved, or a failure remains uncertain.

The status and supporting sections must agree.

```text
## Component-test handoff

### Status
- **<Verified | Blocked | Unverified>** — <brief reason>

### Contracts assessed
- <consumer-visible CoreAI-owned contract> — <why CoreAI owns it>
- Boundaries: <affected components or nearby integration boundaries>

### Coverage
- Reused: <existing tests or none>
- Changed: <tests added or updated, or none>
- Omitted: <intentional omissions and why, or none>

### Verification
- <command> — <focused or package verification result>
- Reused verification: <result and why it remained fresh, or none>
- Unverified: <relevant scope, including an undetermined PR target, or none>

### Documentation
- <relevant CHANGELOG.md or VariationsFromFluent.mdx evidence and whether it supports the contract>
- Mismatches: <implementation/documentation disagreement with locations and interpretations, or none>

### Issues
- Known bugs: <pre-existing or pending known bugs, evidence, test state, and next action, or none>
- Blockers: <introduced regressions with explicit blocker status, or none>
- Uncertain: <known facts, classification limits, and unverified scope, or none>
```

Keep entries compact and use `None` for empty sections. Include affected files, coverage decisions,
commands, results, target limitations, documentation evidence, and issues where relevant.

When no test edits are needed, state explicitly:

Existing regression coverage is sufficient. Focused tests passed. No new tests were needed.

Report only the requested scope. The handoff may say it is ready for PR preparation but must not
perform PR, Git write, or documentation actions.

## 6. Failure handling

Do not immediately change a failing test or production code. Determine whether ownership lies with
CoreAI, a dependency, browser behavior, infrastructure, or a stale expectation. Correct an invalid
expectation; otherwise use read-only diff and history evidence to classify the intended-contract
failure.

### Pre-existing known CoreAI bug

Use only when the intended contract is confirmed and evidence proves the bug predates current
changes. Leave behavior unchanged; the boundary's comment-only TODO may be added.

For a deterministic executable regression, preserve the correct expectation with `test.fails(...)`
and a short preceding explanation. Do not use `test.todo` to keep CI green. When fixed, remove
`.fails` and verify normal passage.

Report intended and observed behavior, failing test, pre-existing evidence, ownership and location,
production/TODO state, `test.fails` coverage, and next action.

### Pending known bug

Use `test.todo(...)` only when the intended test cannot run reliably or still needs implementation.
Describe the correct intended behavior and report why it is pending, ownership, location, and next
action.

```ts
// TODO: Known CoreAI bug — <brief reason this regression case is pending>.
test.todo('<describes the intended CoreAI behavior>');
```

### Regression introduced by current changes

Preserve the correct failing expectation and report `Blocked`. Do not weaken, delete, skip, or
convert it to `test.fails` or `test.todo`. Leave production unchanged unless explicitly requested.
A green suite produced by converting the regression is not successful validation.

Report intended and observed behavior, reproduction, current-change evidence, ownership and
location, unchanged production state, blocker status, and required next action.

### Uncertain failure

Report `Unverified`, including known facts, missing evidence, and affected scope. Do not convert it
to `test.fails`, `test.todo`, or `test.skip`.

### Passing regression coverage

Report passing coverage only when the intended contract passes normally. If production must change,
state that clearly and do not change it unless the user expands the request.