// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { parseComponentContent, type ComponentContent } from './component-content';
import generatedComponents from '../../content/generated/metadata.json';

export const componentContents: ComponentContent[] = generatedComponents
  .map((value, index) => parseComponentContent(value, `generated component ${index}`))
  .sort((left, right) => left.title.localeCompare(right.title));

const componentById = new Map(componentContents.map((component) => [component.id, component]));

export function getComponentContent(id: string): ComponentContent | undefined {
  return componentById.get(id);
}
