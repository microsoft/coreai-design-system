---
id: button
title: Button
reference:
  component: components-button-button
navigation:
  group: Components
  showInSidebar: true
status: complete
storybookTitles:
  - Components/Button/Button
  - Components/Button/CompoundButton
  - Components/Button/SplitButton
figmaPageId: '1:420'
summary: >-
  A button triggers an action or event. Use buttons for important actions like
  submitting a response, committing a change, or moving to the next step.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=160313-4460
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/button/usage'
---

## Best practices

### Do

- Use buttons for actions.
- Use the attention-grabbing primary button to communicate the most recommended action on the page.
- Always give the primary button action prominent placement, either on top of or to the left of other actions. In right-to-left languages, primary button placement will be on the right.
- Use active language that reflects the action that will happen next.
- Be brief. Usually a single verb is best, but include a noun if it increases clarity.
- Use sentence case and no end punctuation.
- Use only one primary button per page.

### Don't

- Hide buttons.
- Use articles such as “a,” “an,” or “the.”
- Use punctuation.
- Use an icon in a call-to-action button.

## Behavior and states

- A standard button initiates a single action or event.
- A toggle button switches a state between on and off. Its rest state indicates off, while its selected state indicates on.
- Button and compound button types can have toggle behavior.
- Toggle buttons are typically used in toolbars. In other scenarios like a settings panel, use a switch to let someone choose between two mutually exclusive options and trigger an immediate change.
- If you need to navigate to another place, try a link instead.
