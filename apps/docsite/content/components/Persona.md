---
id: persona
title: Persona
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '56607:166099'
summary: >-
  A persona is a representation of a person with additional contextual
  information.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=316233-1823
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/persona/usage'
storybookTitles:
  - Components/Persona
reference:
  component: components-persona
---

## Best practices

### Do

- Use a persona for brief, at-a-glance information about a person.
- Use presence-only presentation when layout space is confined.
- Add explicit states and keyboard behavior when adding interactions.

### Don't

- Overload text slots with detailed information.
- Assume a persona has interaction states by default.
- Add periods to persona text slots.

## Behavior and states

- Text slots wrap to the next line when the container becomes too small.
- Use presenceOnly in confined layouts to remove the avatar and show the presence badge near the person’s name.
- Personas are static by default and don’t have states built in.
- Personas usually include an avatar, a presence badge, and up to four lines of text content that provide additional data about that person.
