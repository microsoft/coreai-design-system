---
id: accordion
title: Accordion
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '292:48147'
summary: >-
  An accordion groups sections of related content that can be opened and closed.
  Accordions decrease cognitive load by letting people choose which sections
  they see, such as questions in an FAQ.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=113348-3337
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/accordion/usage'
storybookTitles:
  - Components/Accordion
reference:
  component: components-accordion
---

## Best practices

### Do

- Clearly label each section with a descriptive title that accurately reflects its content.
- Organize sections logically, grouping related actions or subject matter together.

### Don't

- Use vague or ambiguous section titles.
- Nest collapsible sections too deeply, which can create a confusing user experience.

## Behavior and states

- By default, accordion items are closed.
- Open a specific item by default only when that information needs immediate prominence.
- Use single-item expansion by default. Allow multiple open items only when the result will not feel overwhelming.
- Do not place information in one panel that must be referenced while using another panel.
