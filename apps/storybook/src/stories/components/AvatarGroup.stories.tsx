// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import {
  type JSXElement,
  type AvatarGroupProps,
  AvatarGroup,
  AvatarGroupItem,
  AvatarGroupPopover,
  partitionAvatarGroupItems,
} from '@coreai-ds/react-components';

// Inline wrapper so RCM resolves AvatarGroup (+ subcomponent) props and this
// meta owns `Default` (the fork-id dedup in main.ts drops the vendored duplicate).

const names = [
  'Johnie McConnell',
  'Allan Munger',
  'Erik Nason',
  'Kristin Patterson',
  'Daisy Phillips',
  'Carole Poland',
  'Carlos Slattery',
  'Robert Tolbert',
  'Kevin Sturgis',
  'Charlotte Waltson',
  'Elliot Woodward',
];

export const Default = (props: Partial<AvatarGroupProps>): JSXElement => {
  const { inlineItems, overflowItems } = partitionAvatarGroupItems({ items: names });

  return (
    <AvatarGroup {...props}>
      {inlineItems.map((name) => (
        <AvatarGroupItem name={name} key={name} />
      ))}
      {overflowItems && (
        <AvatarGroupPopover>
          {overflowItems.map((name) => (
            <AvatarGroupItem name={name} key={name} />
          ))}
        </AvatarGroupPopover>
      )}
    </AvatarGroup>
  );
};

/**
 * An AvatarGroup is a graphical representation of multiple people associated with a given entity. AvatarGroup leverages the Avatar component, with each Avatar representing a person and containing their image, initials, or an icon. An AvatarGroup can be represented
 * in a spread, stack, or pie layout.
 *
 * @summary Displays a collection of avatars for multiple people or entities, with overflow. Subcomponents: AvatarGroupItem, AvatarGroupPopover.
 */
export default {
  title: 'Components/AvatarGroup',
  component: AvatarGroup,
  parameters: { ...figmaDesign('Avatar group') },
  subcomponents: { AvatarGroupItem, AvatarGroupPopover },
};
