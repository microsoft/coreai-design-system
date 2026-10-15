// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const expectedComponentErrors = new Map([
  ['components-portal-tomountnodeprops', 'No component found'],
  ['templates-shell-and-navigation', 'No component found'],
]);

export function assertExpectedManifestProblems(components) {
  const unexpected = [];
  let count = 0;
  for (const component of components) {
    if (component.error) {
      count++;
      if (expectedComponentErrors.get(component.id) !== component.error.name) {
        unexpected.push(`${component.id}: ${component.error.name}: ${component.error.message}`);
      }
    }
    for (const story of component.stories ?? []) {
      if (story.error || story.warning) {
        count++;
        unexpected.push(`${story.id}: ${JSON.stringify(story.error ?? story.warning)}`);
      }
    }
  }
  if (unexpected.length) {
    throw new Error(`Unexpected Storybook manifest problems:\n${unexpected.join('\n')}`);
  }
  return count;
}
