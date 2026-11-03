---
id: popover
title: Popover
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '1011:48414'
summary: >-
  A popover is a small surface that appears when someone interacts with a
  component to give nonessential, contextual information without blocking them.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=167560-4316
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/popover/usage'
storybookTitles:
  - Components/Popover
reference:
  component: components-popover
---

## Best practices

### Do

- Use popovers for brief, nonessential contextual information.
- Limit dimensions so the popover does not obscure important UI.
- Position it so its relationship to the trigger or context is clear.

### Don't

- Nest popovers.
- Put task-essential or repeated information in a popover.
- Use a popover for a complex layout or blocking interaction; use a dialog.

## Behavior and states

- Popovers grow to accommodate their content by default.
- Set overflow to scroll when content exceeds the available dimensions.
- Position popovers so people can tell what the information relates to.
- Don’t nest popovers.
- Popovers can have structured content and interactive components.
- If you need to show a more complex layout or block the page behind, try a dialog.
- For unstructured plain text, try a tooltip.
