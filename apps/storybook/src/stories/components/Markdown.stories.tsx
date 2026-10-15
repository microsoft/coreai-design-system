// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { type JSXElement, Markdown } from '@coreai-ds/react-components';
// `Markdown` renders a Markdown string as themed Fluent UI content. Fenced code
// blocks render through CoreAI's `CodeBlock`; links through Fluent's `Link`.

const defaultContent = `
# The Power of Large Language Models (LLMs)

Large Language Models (LLMs) are revolutionizing the field of artificial intelligence. In this article, we'll explore their **capabilities**, _limitations_, and why they're _so_ important.

---

## What Are LLMs?

> "A Large Language Model is a type of AI trained on vast amounts of text to understand and generate human-like language."  
> — *AI Researcher, 2023*

LLMs, such as **GPT-4** and **PaLM**, use deep learning to process and generate text.

---

## Key Features

- **Text Generation**
- _Summarization_
- \`Code completion\`
- **Translation**
- *Conversational AI*

### Example Table

| Model   | Parameters | Year |
|---------|:----------:|-----:|
| GPT-3   | 175B       | 2020 |
| GPT-4   | 1T+        | 2023 |
| PaLM    | 540B       | 2022 |

---

## Sample Code

\`\`\`python
from transformers import pipeline
generator = pipeline("text-generation", model="gpt-4")
print(generator("LLMs are transforming", max_length=20))
\`\`\`

---

## Blockquote

> LLMs are not just tools; they are collaborators in creativity and productivity.

---

## Links

Learn more at [Microsoft Foundry](https://ai.azure.com/nextgen/) or [Hugging Face](https://huggingface.co/).

---

## Strikethrough

The original n-gram approach is ~~the state of the art~~ now largely obsolete for general language tasks.

---

## Image

![Diagram of a transformer-based language model](https://placehold.co/640x160?text=Transformer+Architecture)

---

## Text with footnotes

LLMs learn statistical patterns from massive text corpora[^corpus] and are often refined with human feedback[^rlhf].

[^corpus]: A *corpus* is a large, structured collection of text used for training.
[^rlhf]: Reinforcement Learning from Human Feedback — using human preferences to fine-tune model behavior.

---

## Conclusion

LLMs are **changing the world**. Whether you're a developer, writer, or researcher, _embracing_ LLMs can unlock new possibilities.

---

*Happy experimenting!* 🚀
`;

export const Default = (): JSXElement => <Markdown content={defaultContent} />;

/**
 * Renders a Markdown string as themed Fluent content — GitHub Flavored Markdown
 * (tables, task lists, …), fenced code blocks via `CodeBlock`, Fluent-styled
 * links.
 *
 * @summary Renders a Markdown string as themed Fluent content, including code, tables, and math.
 */
export default {
  title: 'Components/Markdown',
  component: Markdown,
};
