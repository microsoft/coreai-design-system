// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { appRoot, generatedRoot } from './generate-component-stories.mjs';
import { extractStorySource } from './story-source.mjs';
import { readStoryDescriptions } from './story-descriptions.mjs';

export function componentStoryDocsProvider(nextStoryDocs) {
  if (!nextStoryDocs) throw new Error('Component story docs require the built-in provider');
  return async (input) => {
    const generated = path
      .resolve(appRoot, input.entry.importPath)
      .startsWith(`${generatedRoot}${path.sep}`);
    if (!generated) return nextStoryDocs(input);
    const inventory = JSON.parse(
      await fs.readFile(path.join(generatedRoot, 'inventory.json'), 'utf8'),
    );
    const component = inventory.components.find((item) => item.title === input.entry.title);
    if (!component)
      throw new Error(`Generated story owner missing from inventory: ${input.entry.title}`);
    const cache = new Map();
    const stories = {};
    for (const story of component.stories) {
      const result = await extractStorySource(story, { root: appRoot, cache });
      const documentation = await readStoryDescriptions(
        path.join(appRoot, story.implementationFile),
        story.implementationExport,
      );
      stories[story.id] = {
        id: story.id,
        name: story.name,
        snippet: result.snippet,
        summary: documentation.summary || undefined,
        description: [
          documentation.description,
          `Source: ${story.origin === 'local' ? 'local CoreAI override' : 'Fluent upstream'} - ${story.implementationFile}`,
          result.description,
          `Required packages: ${result.requirements.join(', ')}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      };
    }
    return {
      id: component.id,
      name: component.title.split('/').at(-1),
      path: input.entry.importPath,
      stories,
    };
  };
}
