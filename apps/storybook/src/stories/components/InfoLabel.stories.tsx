// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { InfoLabel, Link, type InfoLabelProps, type JSXElement } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<InfoLabelProps>): JSXElement => (
  <InfoLabel
    info={
      <>
        This is example information for an InfoLabel.{' '}
        <Link href="https://react.fluentui.dev">Learn more</Link>
      </>
    }
    {...props}
  >
    Example label
  </InfoLabel>
);

/**
 * An InfoLabel is a Label with an InfoButton at the end, properly handling layout and accessibility properties.
 * It can be used as a drop-in replacement for Label when an InfoButton is also needed.
 *
 * @summary Label with a trailing InfoButton, handling layout and accessibility.
 */
export default {
  title: 'Components/InfoLabel',
  component: InfoLabel,
  parameters: {
    ...figmaDesign('InfoLabel'),
  },
};
