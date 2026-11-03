---
id: dialog
title: Dialog
reference:
  component: components-dialog
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '79014:189219'
summary: A dialog is a window overlaid on the page to focus a task or message.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=168998-1175
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/dialog/usage'
storybookTitles:
  - Components/Dialog
---

## Best practices

### Do

- Use an action button to act on the entire contents of a dialog.
- Use a toast notification to confirm the result of the dialog’s action.
- Keep the text short and interactions to a minimum.
- Try to avoid scrolling content.
- Always have the dialog hug content vertically.

### Don't

- Use tabs or expanded sections in a dialog that overload the interface.
- Launch another dialog from within a dialog.

## Behavior and states

- A modal dialog can be dismissed by selecting outside the container, using the Esc key, or selecting a footer button.
- A non-modal dialog can be dismissed with its Close button, the Esc key, or a footer button, but not by selecting outside the dialog.
- Alert dialogs can only be dismissed by selecting one of the available buttons in the footer.
- Headers and footers remain persistent while overflow body content scrolls behind.
- A checkbox can be included in a modal dialog, but this is a cumbersome interaction, so use it sparingly.
- A required checkbox is used to request more explicit confirmation or consent to something, for example, when there is a legal or privacy obligation to do so.
- In such cases, the primary action button is disabled until the checkbox is selected.
- An optional checkbox can be used to give people a way to prevent the dialog from reappearing every time they perform the same action.
- For this purpose, use “Don’t show this message again” as the checkbox label, and don’t disable the action buttons.
