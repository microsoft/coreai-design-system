---
id: tag-picker
title: Tag picker
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '304788:6799'
summary: >-
  A TagPicker combines a text field and a dropdown giving people a way to select
  an option from a list or enter their own choice, these selections are
  represented as Tags.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=304788-13375
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/tagpicker/usage'
storybookTitles:
  - Components/TagPicker
reference:
  component: components-tagpicker
  aliases: [/tag-picker-dropdown/, /tag-picker-item/, /tag-picker-secondary-action/]
---

## Behavior and states

- Focusing the tag picker invokes a dropdown of available items.
- Selecting a dropdown item closes the dropdown and inserts a tag into the input.
- Typing in the input filters the list, with the closest match active first.
- Pressing Enter selects the first item unless arrow keys move the active descendant.
- The dropdown can show system-provided items that represent files, people, or meetings.
- Arrow keys move through the filtered list.
- Inserted tags wrap by default and increase the input height.
- Pressing Backspace while the input is focused removes the last tag.
- A tag picker provides a secondary action slot for extra functionality when needed, such as clearing all tags.
