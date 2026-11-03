---
id: toast
title: Toast
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '49507:161985'
summary: >-
  A toast displays temporary content that can be dismissed by user action or an
  application timeout.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=49507-161985
storybookTitles:
  - Components/Toast
reference:
  component: components-toast
---

## Best practices

### Do

- Use toasts for non-critical messages.
- Configure defaults on the toaster.
- Let people view toast content in the application after the toast is dismissed.
- Create a keyboard shortcut to move focus to actionable toasts.

### Don't

- Render too many toasts at once.
- Use different positions for toasts.
- Use more than one toaster in an application.
- Make every toast use assertive politeness.

## Behavior and states

- Use toasts to communicate task status, progress, required actions, application updates, or errors.
- Make notifications available on a permanent surface so important information remains accessible.
