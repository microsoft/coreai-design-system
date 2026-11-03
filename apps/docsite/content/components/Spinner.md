---
id: spinner
title: Spinner
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '2070:49489'
summary: >-
  Spinners visually communicate that something is processing. They’re used for
  loading states that take more than a second.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=7234-133747
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/spinner/usage'
storybookTitles:
  - Components/Spinner
reference:
  component: components-spinner
---

## Best practices

### Do

- Use a spinner for processing or loading states lasting more than one second.
- Center it over the section that is loading.
- Add a label when the process is expected to exceed three seconds.

### Don't

- Let one loading section block interaction with unrelated sections.
- Use a spinner to communicate measurable progress; use a determinate progress bar.
- Use vague status labels.

## Behavior and states

- Center the spinner over the section of the page that’s loading.
- A spinner for one loading section shouldn’t block interaction with other sections.
- Use a label when a process will take longer than three seconds.
- Keep spinner labels brief, specific, and three words or less.
- Spinners don’t show how much time is left before the process is done.
- To communicate a more specific status, try a determinate progress bar instead.
