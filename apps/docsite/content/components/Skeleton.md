---
id: skeleton
title: Skeleton
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '74734:188193'
summary: >-
  A skeleton lets people know that a section of content is loading without
  blocking other parts of the page.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=114502-121706
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/skeleton/usage'
storybookTitles:
  - Components/Skeleton
reference:
  component: components-skeleton
---

## Best practices

### Do

- Use skeletons for gradually loading structured content that takes longer than one second.
- Prefer the wave animation in most cases.
- Keep the placeholder simple and represent only consistent, high-level content structure.

### Don't

- Use skeletons for fixed layout elements.
- Use skeletons for long-running processes.
- Use a skeleton when the eventual content structure is unknown; use a progress bar or spinner.

## Behavior and states

- Skeletons have wave and pulse animation styles.
- Wave is the default animation and provides the smoothest transition.
- Keep skeleton animations in sync when staggered loading is unavoidable.
- Use skeletons for dynamic content, not fixed parts of a layout.
