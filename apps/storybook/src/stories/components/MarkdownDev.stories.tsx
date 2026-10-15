// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { type JSXElement, Markdown } from '@coreai-ds/react-components';

const headings = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
`;

export const Headings = (): JSXElement => <Markdown content={headings} />;

const bulletedListFormatting = `## Flat spaced list
This is a regular bulleted list without spacing between items.

- List item 1
- List item 2
- List item 3

1. First ordered item
    1. Sub-item 1
    2. Sub-item 2
2. Second ordered item
    - Sub-item 1
    - Sub-item 2
3. Third ordered item

---

## Paragraph spacing list
This is a spaced list with that should be rendered as paragraphs between items.

- Paragraph spacing list item 1

- Paragraph spacing list item 2

- Paragraph spacing list item 3

---

## Mixed paragraph list with sub-items
This is a spaced list with that should be rendered as paragraphs between primary items and not between sub-items.

1. **Planning the Presentation**
   - Identify your audience.
     - Who are they?
     - What do they care about?
   - Define your objectives.

2. **Designing Your Slides**

   1. Choose a professional template.
   2. Follow design principles:
      - Use consistent fonts and colors.
      - Avoid overcrowding slides with text.

By following these steps, you can ensure a smooth and professional presentation that leaves a lasting impact!`;

const formatting = `
## Inline Text Formatting
This is a paragraph with **bold**, *italic*, ***bold-italic***, and \`inline code\` text.

---

${bulletedListFormatting}

---

## Raw markdown of above lists 
\`\`\`markdown
${bulletedListFormatting}
\`\`\`
`;

export const Formatting = (): JSXElement => <Markdown content={formatting} />;

const tables = `
| Model   | Parameters | Year | Open Source | Training Data Size (TB) | Avg. Response Time (ms) | Languages Supported | Notable Use Case         | Accuracy (%) | License      |
|---------|:----------:|-----:|:-----------:|:-----------------------:|:----------------------:|:-------------------:|:-------------------------|:------------:|-------------:|
| GPT-3   | 175B       | 2020 |     No      |          45             |         120            |        20+          | Chatbots                 |     85       | Proprietary  |
| GPT-4   | 1T+        | 2023 |     No      |         100+            |         90             |        50+          | Code Generation          |     89       | Proprietary  |
| PaLM    | 540B       | 2022 |     No      |          780            |         110            |        100+         | Multilingual Translation |     87       | Proprietary  |
| LLaMA   | 65B        | 2023 |    Yes      |          1.4            |         150            |        20+          | Research                 |     82       | Open Source  |
| Falcon  | 40B        | 2023 |    Yes      |          3.5            |         130            |        10+          | Text Summarization       |     80       | Open Source  |
| BLOOM   | 176B       | 2022 |    Yes      |          1.6            |         140            |        40+          | Open Science             |     78       | Open Source  |
`;

export const Tables = (): JSXElement => <Markdown content={tables} />;

const codeBlock = `
Inline code: \`console.log('Hello, world!');\` example.

\`\`\`typescript
function greet(name: string): string {
  return 'Hello, ' + name;
}
\`\`\`

\`\`\`
Code without language
or syntax highlighting.
\`\`\`
`;

export const CodeBlock = (): JSXElement => <Markdown content={codeBlock} />;

const links = `
[Microsoft](https://www.microsoft.com)

[GitHub](https://github.com)
`;

export const Links = (): JSXElement => <Markdown content={links} />;

const anchorLinks = `
# Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3-with-code)

## Section 1
This is the first section. [Back to top](#table-of-contents)

## Section 2
This is the second section. [Back to top](#table-of-contents)

## **Section 3** with \`code\`
This is the third section. [Back to top](#table-of-contents)
`;

export const AnchorLinks = (): JSXElement => <Markdown content={anchorLinks} />;

const largeExample = `
#### Create Agent with Function Call

You can enhance your Agents by defining callback functions as function tools. These can be provided to \`createAgent\` via the combination of \`tools\` and \`toolResources\`. Only the function definitions and descriptions are provided to \`createAgent\`, without the implementations. The \`Run\` or \`event handler of stream\` will raise a \`requires_action\` status based on the function definitions. Your code must handle this status and call the appropriate functions.

Here is an example:

\`\`\`ts
import {
  FunctionToolDefinition,
  ToolUtility,
  RequiredToolCallOutput,
  FunctionToolDefinitionOutput,
  ToolOutput,
} from "@azure/ai-projects";

class FunctionToolExecutor {
  private functionTools: {
    func: Function;
    definition: FunctionToolDefinition;
  }[];
  constructor() {
    this.functionTools = [
      {
        func: this.getUserFavoriteCity,
        ...ToolUtility.createFunctionTool({
          name: "getUserFavoriteCity",
          description: "Gets the user's favorite city.",
          parameters: {},
        }),
      },
      {
        func: this.getCityNickname,
        ...ToolUtility.createFunctionTool({
          name: "getCityNickname",
          description: "Gets the nickname of a city, e.g. 'LA' for 'Los Angeles, CA'.",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "The city and state, e.g. Seattle, Wa" },
            },
          },
        }),
      },
      {
        func: this.getWeather,
        ...ToolUtility.createFunctionTool({
          name: "getWeather",
          description: "Gets the weather for a location.",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "The city and state, e.g. Seattle, Wa" },
              unit: { type: "string", enum: ["c", "f"] },
            },
          },
        }),
      },
    ];
  }
  private getUserFavoriteCity(): {} {
    return { location: "Seattle, WA" };
  }
  private getCityNickname(location: string): {} {
    return { nickname: "The Emerald City" };
  }
  private getWeather(location: string, unit: string): {} {
    return { weather: unit === "f" ? "72f" : "22c" };
  }
  public invokeTool(
    toolCall: RequiredToolCallOutput & FunctionToolDefinitionOutput,
  ): ToolOutput | undefined {
    console.log(\`Function tool call - \${toolCall.function.name}\`);
    const args = [];
    if (toolCall.function.parameters) {
      try {
        const params = JSON.parse(toolCall.function.parameters);
        for (const key in params) {
          if (Object.prototype.hasOwnProperty.call(params, key)) {
            args.push(params[key]);
          }
        }
      } catch (error) {
        console.error(\`Failed to parse parameters: \${toolCall.function.parameters}\`, error);
        return undefined;
      }
    }
    const result = this.functionTools
      .find((tool) => tool.definition.function.name === toolCall.function.name)
      ?.func(...args);
    return result
      ? {
          toolCallId: toolCall.id,
          output: JSON.stringify(result),
        }
      : undefined;
  }
  public getFunctionDefinitions(): FunctionToolDefinition[] {
    return this.functionTools.map((tool) => {
      return tool.definition;
    });
  }
}
const functionToolExecutor = new FunctionToolExecutor();
const functionTools = functionToolExecutor.getFunctionDefinitions();
const agent = await client.agents.createAgent("gpt-4o", {
  name: "my-agent",
  instructions:
    "You are a weather bot. Use the provided functions to help answer questions. Customize your responses to the user's preferences as much as possible and use friendly nicknames for cities whenever possible.",
  tools: functionTools,
});
console.log(\`Created agent, agent ID: \${agent.id}\`);
\`\`\`
`;

export const LargeExample = (): JSXElement => <Markdown content={largeExample} />;

export default {
  title: 'Components/Markdown',
  component: Markdown,
};
