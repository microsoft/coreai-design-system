# Contributing to CoreAI Design System

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit
[Contributor License Agreements](https://cla.opensource.microsoft.com).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide a
CLA and decorate the pull request appropriately (for example, with a status check or comment).
Follow the instructions provided by the bot. You will only need to do this once across all
repositories using our CLA.

## Before contributing

- Search existing [issues](https://github.com/microsoft/coreai-design-system/issues) and pull
  requests before opening a new one.
- For substantial features or architectural changes, open an issue first so the approach can be
  discussed before implementation.
- Follow the [Microsoft Open Source Code of Conduct](CODE_OF_CONDUCT.md) in all project spaces.
- Report security vulnerabilities according to [SECURITY.md](SECURITY.md), not through a public
  issue.

## Development

This repository is an npm monorepo. Install Node.js 20.19 or later and run:

```bash
npm install
npm run type-check
npm run lint
```

Source files must include the Microsoft MIT license header. Run `npm run license:check` to verify
headers or `npm run license:fix` to add missing headers automatically.

Run the smallest relevant build or test while developing. Common commands include:

```bash
npm run build
npm run build:storybook
npm run build:docsite
npm test --workspace packages/react-components
```

See the root [README](README.md) for the repository layout and additional scripts. Changes to
`@coreai-ds/react-components` should also follow its package-specific
[contribution and governance guide](packages/react-components/CONTRIBUTING.md). Storybook
changes should follow the [Storybook authoring guide](apps/storybook/README.md).

## Pull requests

1. Create a focused branch and keep changes scoped to one problem.
2. Follow the existing code style and Fluent UI v9 patterns.
3. Add or update tests, stories, and documentation when behavior changes.
4. Run the relevant type checks, lint checks, builds, and tests.
5. Open a pull request with a clear description of the problem, solution, and validation performed.
6. Link related issues and complete the CLA check.

All required continuous integration checks and maintainer reviews must pass before a pull request
can be merged.
