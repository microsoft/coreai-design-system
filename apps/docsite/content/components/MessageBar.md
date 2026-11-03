---
id: message-bar
title: Message bar
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '100180:181055'
summary: >-
  A message bar communicates important information about the state of the entire
  product or the surface where it appears, such as a page, drawer, dialog, or
  card.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=314567-157305
  - label: Fluent guidance
    url: >-
      https://fluent2.microsoft.design/components/web/react/core/messagebar/usage
storybookTitles:
  - Components/MessageBar
reference:
  component: components-messagebar
---

## Best practices

### Do

- Match intent to the situation: informational, success, warning, or error.
- Include an action or link in warning and error messages.
- Stack messages from most critical to least critical.

### Don't

- Use a message bar to prevent a destructive action; use a dialog.
- Use it for time-sensitive status originating elsewhere; use a toast.
- Overload the body with long explanations.

## Behavior and states

- Message bar content never truncates.
- After the second line, reflow pushes actions below the body.
- Message bars are dismissible with a Close button.
- A dismissed warning or error reappears in the next session until the problem is resolved.
- If the message is intended to prevent a destructive action, try a dialog instead.
- If the message is time-sensitive, but relates to an activity or status from a different location, try a toast notification instead.
