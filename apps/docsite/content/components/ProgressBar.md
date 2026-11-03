---
id: animated-progress-bar
title: Progress bar
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '39768:210991'
summary: >-
  Progress bars communicate system information, like how much cloud storage
  someone is using in OneDrive, or task information, like how long until a
  download is complete.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=40327-211385
  - label: Fluent guidance
    url: >-
      https://fluent2.microsoft.design/components/web/react/core/progressbar/usage
storybookTitles:
  - Components/ProgressBar
reference:
  component: components-progressbar
  aliases: [/static-progress-bar/]
---

### Best practices

### Do

- Use determinate progress bars whenever progress can be measured.
- Combine related steps into one continuously advancing progress bar.
- Use brief, descriptive -ing verbs followed by an ellipsis in status text.

### Don't

- Interrupt an indeterminate progress bar in the middle of an animation.
- Include time estimates unless they are reliable.
- Add a period to the progress label.

## Behavior and states

- Progress bars can be either determinate or indeterminate, depending on the needs of your app and the capabilities of the technology you’re building on.
- Use determinate progress bars whenever possible. They communicate status and assure people things are still working.
- Only use indeterminate progress bars for short tasks.
- If enough data is gathered after a task starts and it becomes possible to communicate how much time is left, switch to a determinate progress bar.
- Progress bars should only be used for tasks that take longer than a second.
- If you’re loading new content with a known structure that doesn’t block the UI, try a skeleton.
