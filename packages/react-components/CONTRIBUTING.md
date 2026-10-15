# Contributing to `@coreai-ds/react-components`

This document covers how the library absorbs Fluent UI upstream changes, how to submit a
contribution, and how decisions/releases are governed. For what the library is and why it
exists, see the root [README.md](../../README.md). For the release process itself
(approval → version PR → manual publish), see [RELEASING.md](RELEASING.md).

## Roadmap

Source, planned work, issues, and pull requests target
[microsoft/coreai-design-system](https://github.com/microsoft/coreai-design-system).

## 1. Fluent UI Updates

> The GitHub Actions dependency check opens a weekly PR when new
> `@fluentui/*` versions are available. To check manually instead:
>
> ```bash
> npm outdated --workspace packages/react-components
> ```
>
> The Fluent UI releases RSS feed (`https://github.com/microsoft/fluentui/releases.atom`) is also a
> useful notification channel in the meantime.

The core team targets monthly merges for patch/minor updates. Critical security patches are
prioritized and merged as soon as validated.

When merging a Fluent UI update:

1. Create a branch (e.g. `feature/fluent-ui-update-vX.Y.Z`) and bump the outdated `@fluentui/*`
   package(s)
2. Check the [Fluent UI releases](https://github.com/microsoft/fluentui/releases) for breaking changes
3. Run `npm install` and verify the build
4. Check Storybook for visual regressions
5. Address any breaking changes in `@coreai-ds/react-components` components
6. Document significant changes in `RELEASING.md` or `CHANGELOG.md`
7. Follow the standard release process - bump version, open PR, merge to `main`

## 2. Contributing

Contributions from consuming teams are welcome. To submit a change:

1. Create a feature branch (e.g. `feature/my-component` or `bugfix/issue-123`)
2. Follow existing code style and conventions
3. Align with Fluent UI v9 patterns - avoid custom styling that conflicts with the CoreAI theme
4. Add or update Storybook stories for new components or props (see
   [apps/storybook/README.md](../../apps/storybook/README.md))
5. Open a PR to `main` with a clear description of the problem and solution (see the
   [`create-pr` skill](../../.github/skills/create-pr/SKILL.md))
6. Reference any related issues (e.g. `Fixes #123`)
7. All CI checks must pass and be approved by a core team reviewer before merging

## 3. Governance

- **Decision making:** Major architectural changes require core team approval. Bug fixes and minor
  enhancements can be approved by any designated reviewer.
- **Releases:** The core team manages version bumps (following [Semantic Versioning](https://semver.org/))
  and release timing. Publishing requires package/access review and manual dispatch
  through the protected `npm-production` environment. It never runs automatically on merge; see
  [RELEASING.md](RELEASING.md).
- **Automation:** GitHub Actions handles testing, building, and approved publishing.
  [Changesets](https://github.com/changesets/changesets) will be considered when
  a second publishable package is added.
- **Issues and discussion:** Use the repository's GitHub Issues for bug reports,
  feature requests, and maintainer discussion.
