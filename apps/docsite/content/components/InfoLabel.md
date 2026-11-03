---
id: info-label
title: Info label
navigation:
  group: Components
  showInSidebar: true
status: complete
storybookTitles:
  - Components/InfoLabel
  - Components/InfoButton
figmaPageId: '77695:189232'
summary: >-
  InfoLabel is a combination of a label and info button. When people interact
  with the info button, the information is surfaced in a Popover.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=323059-758
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/infolabel/usage'
reference:
  component: components-infolabel
---

## Best practices

### Do

- Place critical information in a persistent location where people can easily find it.
- Keep the info button in the page tab order.
- Keep popover content brief and understandable at a glance.

### Don't

- Hide critical information in an info button.
- Use the info button for information required to complete a task.
- Repeat information already shown in visible labels.
- Include more than one link in an info-label popover.

## Behavior and states

- Applying the info button option places an info button next to the label.
- Selecting the info button opens a popover that remains visible until someone selects something else or presses Esc.
- The popover’s placement is determined programmatically to minimize blocking essential information.
- By default, popovers don’t trap focus.
- Because the popover isn’t always visible, don’t include information that people must know in order to complete the field.
- To give people a hint about how to fill in a field, or let them know what values can be entered, try placeholder or helper text instead.
