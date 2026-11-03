---
id: tooltip
title: Tooltip
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '1011:48417'
summary: >-
  A tooltip provides supplemental, contextual information elevated near its
  target component. Tooltips should be used to provide helpful but
  non-essential, plaintext information.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=168532-852
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/tooltip/usage'
storybookTitles:
  - Components/Tooltip
reference:
  component: components-tooltip
  omitDecorators: >-
    Storybook-only layout decorators are omitted. Examples use the documentation
    preview spacing instead.
---

## Best practices

### Do

- Use tooltips for helpful, non-essential, plaintext information.
- Provide additional information rather than repeating visible content.
- Position the tooltip so it does not obscure important information.

### Don't

- Use tooltips to communicate system feedback.
- Add end punctuation unless the tooltip contains a complete sentence.

## Behavior and states

- Tooltips open when the target receives hover or focus.
- They close on blur or when the pointer leaves the target or tooltip container.
- Tooltips appear 4 pixels from their target by default.
- The optional arrow always points to the target element.
- Don't use them to communicate system feedback.
- If you need to deliver robust, formatted information, use a popover instead.
