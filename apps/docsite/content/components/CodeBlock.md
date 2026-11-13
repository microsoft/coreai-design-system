---
id: codeblock
title: CodeBlock
reference:
  component: components-codeblock
summary: Display source code as plain text or with syntax highlighting.
resources: []
---

## Usage

`CodeBlock` is a CoreAI component. Import it from
`@coreai-ds/react-components`.

Pass the source string through `code`. Set `language`, such as `tsx` or `css`,
to enable syntax highlighting. Omit `language` to display plain text.

Use `header` for a title or related controls. The examples also demonstrate
appearance, loading, and fixed-height content.

Displaying source code does not execute it.
