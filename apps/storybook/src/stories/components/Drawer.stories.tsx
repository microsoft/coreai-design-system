// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderNavigation,
  DrawerHeaderTitle,
  InlineDrawer,
  Label,
  OverlayDrawer,
  Radio,
  RadioGroup,
  ToggleButton,
  useId,
  useRestoreFocusSource,
  useRestoreFocusTarget,
  type DrawerProps,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';
import { Dismiss24Regular } from '@fluentui/react-icons';

/**
 * Switches between overlay and inline drawer behavior while restoring focus to the trigger.
 */
export const Default: StoryObj = {
  render: () => {
    type DrawerType = Required<DrawerProps>['type'];

    const labelId = useId('type-label');
    const [isOpen, setIsOpen] = React.useState(false);
    const [type, setType] = React.useState<DrawerType>('overlay');

    // all Drawers need manual focus restoration attributes
    // unless (as in the case of some inline drawers, you do not want automatic focus restoration)
    const restoreFocusTargetAttributes = useRestoreFocusTarget();
    const restoreFocusSourceAttributes = useRestoreFocusSource();

    const styles = /* css */ `
      .drawer-default-example {
        border: 2px solid #ccc;
        overflow: hidden;
        display: flex;
        height: 480px;
        background-color: #fff;
      }

      .drawer-default-example__content {
        flex: 1;
        padding: var(--spacingHorizontalL);
        display: grid;
        justify-content: flex-start;
        align-items: flex-start;
        row-gap: var(--spacingVerticalXXL);
        grid-auto-rows: max-content;
      }

      .drawer-default-example__field {
        display: grid;
        row-gap: var(--spacingVerticalS);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="drawer-default-example">
          <Drawer
            {...restoreFocusSourceAttributes}
            type={type}
            separator
            open={isOpen}
            onOpenChange={(_, { open }) => setIsOpen(open)}
          >
            <DrawerHeader>
              <DrawerHeaderTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="Close"
                    icon={<Dismiss24Regular />}
                    onClick={() => setIsOpen(false)}
                  />
                }
              >
                Default Drawer
              </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody>
              <p>Drawer content</p>
            </DrawerBody>
          </Drawer>

          <div className="drawer-default-example__content">
            {type === 'inline' ? (
              <ToggleButton
                {...restoreFocusTargetAttributes}
                appearance="primary"
                onClick={() => setIsOpen(!isOpen)}
                checked={isOpen}
              >
                Toggle
              </ToggleButton>
            ) : (
              <Button
                {...restoreFocusTargetAttributes}
                appearance="primary"
                onClick={() => setIsOpen(!isOpen)}
              >
                Open
              </Button>
            )}

            <div className="drawer-default-example__field">
              <Label id={labelId}>Type</Label>
              <RadioGroup
                value={type}
                onChange={(_, data) => setType(data.value as DrawerType)}
                aria-labelledby={labelId}
              >
                <Radio value="overlay" label="Overlay (Default)" />
                <Radio value="inline" label="Inline" />
              </RadioGroup>
            </div>
          </div>
        </div>
      </>
    );
  },
};

/**
 * The Drawer gives users a quick entry point to configuration and information. It should be used when retaining context is beneficial to users.
 *
 * There are three main components to represent a Drawer:
 *
 * - `OverlayDrawer`: An overlay Drawer renders on top of the whole page. By default blocks the screen and will require the user's full attention. Uses Dialog component under the hood.
 * - `InlineDrawer`: An inline Drawer renders within a container and can be placed next to any content.
 * - `Drawer`: A combination of OverlayDrawer and InlineDrawer. Used when toggling between the two modes is necessary. Often used for responsiveness.
 *
 * @summary Panel that slides in from a screen edge for navigation, configuration, or detail. Subcomponents: OverlayDrawer, InlineDrawer, DrawerHeader, DrawerHeaderTitle, DrawerHeaderNavigation, DrawerBody, DrawerFooter.
 */
export default {
  title: 'Components/Drawer',
  component: Drawer,
  subcomponents: {
    OverlayDrawer,
    InlineDrawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerHeaderNavigation,
    DrawerBody,
    DrawerFooter,
  },
  parameters: {
    ...figmaDesign('Drawer'),
  },
};
