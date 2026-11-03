---
id: data-grid-cell-medium
title: Data grid
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '298485:4122'
summary: >-
  Presents data in a two-dimensional DataGrid format, arranged in columns and
  rows in a rectangular form.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=298485-9476
storybookTitles:
  - Components/DataGrid
reference:
  component: components-datagrid
  aliases:
    - /data-grid-cell-action-header/
    - /data-grid-cell-large/
    - /data-grid-cell-small/
    - /data-grid-cell-smaller/
    - /data-grid-content-header/
---

### Best practices

### Do

- Use a hyphen (-) for any empty values.
- Left-align textual data within DataGrid cells.
- Left-align categorical numeric data within DataGrid cells.
- Use the cell link variant instead of the cell text variant to help users distinguish links from other text content in adjoining cells.
- Use a subtle badge with a status icon instead of an outline badge.
- Consider a sticky header when a DataGrid has more than 20 items per page.
- Consider a sticky header when values may be ambiguous without column headers.
- Consider a sticky header when users need to act on resources upon selection.
- Consider a sticky header when a DataGrid has more than five columns or sortable columns.

### Don't

- Allow text to wrap to more than three rows.
- Leave too much white space after cell content.
- Use a sticky header in DataGrids without actions in the header.
- Use a sticky header for continuous scrolling.
- Place interactive elements inside DataGrid header cells.

## Behavior and states

- DataGrids don’t require reflow by default, but designers can set column priorities for smaller screens.
- Less critical columns may be hidden first; essential ones should always remain visible.
- If all columns are important, keep them all and allow horizontal scrolling instead.
