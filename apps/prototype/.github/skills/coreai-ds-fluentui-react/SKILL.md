---
name: coreai-ds-fluentui-react
description: 'Use only when editing ./apps/prototype/* with @coreai-ds/react-components; consult published CoreAI documentation before choosing components, props, templates, or patterns.'
---

Read and follow the canonical [coreai-ds-fluentui-react skill](../../../../../packages/react-components/agent/SKILL.md).

## Prototype-specific exceptions

- Use the HTTPS documentation and explicit offline fallback described in the canonical skill.
- Invoke `prototype-app-react-components` to classify the repository boundary. It owns
  prototype adapter and composition guidance; the canonical package skill owns CoreAI API
  questions.
- Resolve app-relative paths from `apps/prototype/`. Inspect local adapters and compositions
  under `app/components/common/**`; use the app-owned `Card`, `Image`, and `Link` adapters
  instead of importing those components directly from the CoreAI package.
