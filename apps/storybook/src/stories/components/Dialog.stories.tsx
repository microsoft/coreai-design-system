// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  type JSXElement,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (): JSXElement => {
  return (
    <Dialog>
      <DialogTrigger disableButtonEnhancement>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogContent>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam exercitationem cumque
            repellendus eaque est dolor eius expedita nulla ullam? Tenetur reprehenderit aut
            voluptatum impedit voluptates in natus iure cumque eaque?
          </DialogContent>
          <DialogActions>
            <Button appearance="primary">Do Something</Button>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

/**
 * `Dialog` is a window overlaid on either the primary window or another dialog window. Windows under a modal dialog are inert. That is, users cannot interact with content outside an active dialog window. Inert content outside an active dialog is typically visually obscured or dimmed so it is difficult to discern, and in some implementations, attempts to interact with the inert content cause the dialog to close.
 *
 * @summary Window overlaid on the page to focus a task or message. Subcomponents: DialogTrigger, DialogSurface, DialogTitle, DialogActions.
 */
export default {
  title: 'Components/Dialog',
  component: Dialog,
  subcomponents: { DialogTrigger, DialogSurface, DialogTitle, DialogActions },
  parameters: {
    ...figmaDesign('Dialog'),
  },
};
