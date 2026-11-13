// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import matter from 'gray-matter';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';

export function publicMarkdown(content, file) {
  if (file.replaceAll('\\', '/').includes('/apps/docsite/content/')) {
    const root = fileURLToPath(new URL('../../../../', import.meta.url));
    return matter(content)
      .content.replace(
        /<!-- example: ([\w-]+) -->/g,
        (_match, id) => `[Open live example](?path=/story/${id})`,
      )
      .replace(
        /<!-- include: agent-prompt -->/g,
        '[Read the starter prompt](https://microsoft.github.io/coreai-design-system/agent-prompt.txt)',
      )
      .replace(/\]\((\.\.?\/[^)]+)\)/g, (_match, target) => {
        const filename = path
          .relative(root, path.resolve(path.dirname(file), target))
          .replaceAll('\\', '/');
        return `](https://github.com/microsoft/coreai-design-system/blob/main/${filename})`;
      })
      .replace(
        /\]\(\/((?:guides|foundations|patterns|overview|components|templates)\/[^)]+\.md)\)/g,
        '](' +
          'https://github.com/microsoft/coreai-design-system/blob/main/apps/docsite/content/$1)',
      );
  }
  if (!file.replaceAll('\\', '/').includes('/fluent-stories/')) return content;
  const cleaned = content.replace(
    /\[([^\]]+)\]\(https?:\/\/(?:[^/)]+\.)?(?:visualstudio\.com|dev\.azure\.com)\/[^)]+\)/gi,
    '$1',
  );
  if (!cleaned.includes('?path=')) return cleaned;
  const parser = unified().use(remarkParse).use(remarkGfm).use(remarkStringify);
  const tree = parser.parse(cleaned);
  let changed = false;
  const visit = (node) => {
    if (['link', 'definition'].includes(node.type) && /^(?:\.\/|\/)?\?path=/.test(node.url)) {
      node.url = new URL(node.url, 'https://react.fluentui.dev/').href;
      changed = true;
    }
    node.children?.forEach(visit);
  };
  visit(tree);
  return changed ? parser.stringify(tree) : cleaned;
}
