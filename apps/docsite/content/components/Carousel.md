---
id: carousel
title: Carousel
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '213842:1919'
summary: >-
  A carousel is a dynamic user interface component that allows users to cycle
  through content both linearly and cyclically.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=322705-4097
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/carousel/usage'
storybookTitles:
  - Components/Carousel/Carousel
reference:
  component: components-carousel-carousel
---

## Best practices

### Do

- Include clear, visible arrows and pagination indicators.
- Support swipe gestures on mobile for intuitive control.
- Ensure keyboard navigation, focus management, and ARIA roles.
- Optimize the layout for multiple breakpoints, including mobile, tablet, and desktop.

### Don't

- Cycle slides faster than users can read them.
- Hide navigation controls or require hover to see them.
- Use carousels where simpler layout structures would work better.

## Behavior and states

- If there are clickable actions within the content area, the user may opt into interacting with it.
- If the carousel is on auto-play, the user must always have the option of pausing the auto-play feature.
- The carousel supports two navigation options: steps and image preview.
- Setting the navigation type to image gallery replaces the steps with image thumbnails.
- The carousel mechanism collects content in one component, providing an interactive and engaging way for users to interact with various pieces of content without leaving the current page.
- This design pattern is commonly used in web and mobile applications to highlight featured articles, products, or services.
- It can also be used to create a visual narrative by sequentially displaying related content, enhancing the user experience through a seamless and intuitive interface.
