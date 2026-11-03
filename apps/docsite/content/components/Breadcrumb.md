---
id: breadcrumb
title: Breadcrumb
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '133245:6128'
summary: >-
  A breadcrumb helps people quickly understand where they are within the
  hierarchy of a large and complex site or app.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=133494-14993
  - label: Fluent guidance
    url: >-
      https://fluent2.microsoft.design/components/web/react/core/breadcrumb/usage
storybookTitles:
  - Components/Breadcrumb
reference:
  component: components-breadcrumb
---

## Best practices

### Do

- The first, or logo, breadcrumb must always return the user to the homepage.
- Use breadcrumbs to reflect the information architecture of a project, not a historical trail.
- Truncate text over the character count limit of 30 characters.
- Expand on truncated breadcrumb items in a tooltip.
- Shorten names to avoid repetition or truncation.

### Don't

- Wrap long item names.
- Use a dropdown link for any breadcrumb item that isn’t a project.
- Repeat names in ways that make the breadcrumb harder to scan.
- Use breadcrumbs to track session history.

## Behavior and states

- Breadcrumbs never wrap, but they may scroll horizontally if not constrained.
- When the maximum width is exceeded, the breadcrumb collapses into an overflow menu, starting with the second item. The first and last items are always visible.
- Use a disabled breadcrumb item to indicate a step in the hierarchy with no associated landing page.
- By default, an interactive breadcrumb item label truncates when its name is longer than 30 characters, including spaces.
- A breadcrumb also may act as compact secondary navigation, providing one-click access to higher levels of the hierarchy, and back to the homepage.
