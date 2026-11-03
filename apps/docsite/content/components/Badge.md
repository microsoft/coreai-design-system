---
id: badge
title: Badge
navigation:
  group: Components
  showInSidebar: true
status: complete
storybookTitles:
  - Components/Badge/Badge
  - Components/Badge/PresenceBadge
figmaPageId: '1011:48411'
summary: >-
  A badge is a visual indicator that communicates a status or description of an
  associated component.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=151708-5234
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/badge/usage'
reference:
  component: components-badge-badge
  omitDecorators: >-
    Storybook-only layout decorators are omitted. Examples use the documentation
    preview spacing instead.
---

## Best practices

### Do

- Use badges to highlight status, notifications, or key information.
- Choose the appropriate badge appearance, such as status or severity, to match its meaning.
- Use clear, concise text within the badge.
- Place the badge in proximity to the item that it relates to.
- Use badge color coding consistently.

### Don't

- Use badges for purely decorative purposes.
- Overuse badges, as this can dilute their impact.
- Use excessively long text within a badge.
- Rely solely on color to convey meaning. Use text or icons as well.

## Behavior and states

- Badges don’t have a built-in maximum width and will keep growing.
- By default, badges don’t receive focus.
- If you build interaction into a badge, like including a tooltip for more context, make sure to include focus.
- They use short text, color, and icons for quick recognition and are placed near the relevant content.
