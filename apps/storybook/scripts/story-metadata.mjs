// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { combineParameters } from 'storybook/preview-api';

const inheritedKeys = [
  'args',
  'argTypes',
  'decorators',
  'loaders',
  'beforeEach',
  'afterEach',
  'globals',
  'parameters',
  'tags',
  'render',
  'play',
];

export function componentMetadata(sources) {
  const result = Object.assign({}, ...sources);
  for (const key of inheritedKeys) delete result[key];
  delete result.includeStories;
  delete result.excludeStories;
  return result;
}

export function storyWithMetadata(meta, original, id) {
  const story = typeof original === 'function' ? { ...original, render: original } : original;
  if (!story || typeof story !== 'object') {
    throw new Error(`Invalid story definition for ${id}`);
  }
  const result = {};
  for (const key of inheritedKeys) {
    if (meta[key] !== undefined) result[key] = meta[key];
  }
  Object.assign(result, story);
  for (const key of ['args', 'argTypes', 'globals']) {
    if (meta[key] || story[key]) result[key] = { ...meta[key], ...story[key] };
  }
  for (const key of ['decorators', 'loaders', 'beforeEach', 'afterEach', 'tags']) {
    if (meta[key] || story[key]) {
      result[key] = [
        ...(Array.isArray(meta[key]) ? meta[key] : meta[key] ? [meta[key]] : []),
        ...(Array.isArray(story[key]) ? story[key] : story[key] ? [story[key]] : []),
      ];
    }
  }
  result.parameters = combineParameters(meta.parameters ?? {}, story.parameters ?? {}, {
    __id: id,
  });
  return result;
}
