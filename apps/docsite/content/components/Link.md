---
id: link
title: Link
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '2070:49491'
summary: >-
  Link component does not support breaking and wrapping onto the next line. In
  that case, use another Link component.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=6401-122467
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/link/usage'
storybookTitles:
  - Components/Link
reference:
  component: components-link
---

## Best practices

### Do

- Use links for navigation.
- Use the default link style most of the time.
- Make link text understandable out of context.

### Don't

- Use links to trigger non-navigation actions.
- Label links with URLs or generic phrases such as “Click here.”
- Open a new tab or window without warning.

## Behavior and states

- By default, links show an underline in hover, focus, and pressed states.
- Inline link behavior also adds an underline in rest and visited states.
- Use inline behavior to maximize visual cues when a link appears next to body text.
