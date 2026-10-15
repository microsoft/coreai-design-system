// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  Popover,
  PopoverProvider,
  PopoverSurface,
  PopoverTrigger,
  type PopoverProps,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default: StoryObj<PopoverProps> = {
  render: (props: PopoverProps) => {
    const ExampleContent = (): React.JSX.Element => (
      <div className="popover-default-example__content">
        <h3 className="popover-default-example__content-header">Popover content</h3>

        <div>This is some popover content</div>
      </div>
    );

    const styles = /* css */ `
      .popover-default-example__content-header {
        margin-top: 0;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Popover {...props}>
          <PopoverTrigger disableButtonEnhancement>
            <Button>Popover trigger</Button>
          </PopoverTrigger>

          <PopoverSurface className="popover-default-example" tabIndex={-1}>
            <ExampleContent />
          </PopoverSurface>
        </Popover>
      </>
    );
  },
};

/**
 * A popover displays content on top of other content.
 *
 * @summary Displays content in a surface positioned on top of other content. Subcomponents: PopoverTrigger, PopoverSurface, PopoverProvider.
 */
export default {
  title: 'Components/Popover',
  component: Popover,
  subcomponents: { PopoverTrigger, PopoverSurface, PopoverProvider },
  parameters: {
    ...figmaDesign('Popover'),
  },
};
