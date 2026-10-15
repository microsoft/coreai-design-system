// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Persona, type JSXElement, type PersonaProps } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<PersonaProps>): JSXElement => {
  return (
    <Persona
      name="Kevin Sturgis"
      secondaryText="Available"
      presence={{ status: 'available' }}
      avatar={{
        image: {
          src: 'https://res-1.cdn.office.net/files/fabric-cdn-prod_20230815.002/office-ui-fabric-react-assets/persona-male.png',
        },
      }}
      {...props}
    />
  );
};

/**
 * A Persona is a visual representation of a person or status that showcases an Avatar, PresenceBadge, or an Avatar with a PresenceBadge.
 *
 * @summary Visual representation of a person combining an avatar, presence, and text.
 */
export default {
  title: 'Components/Persona',
  component: Persona,
  parameters: {
    ...figmaDesign('Persona'),
  },
};
