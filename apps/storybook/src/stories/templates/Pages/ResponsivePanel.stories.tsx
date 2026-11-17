// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button, Field, Input } from '@coreai-ds/react-components';
import { ResponsivePanel } from './ResponsivePanel';
import { LayoutContainer } from './LayoutContainer';
const meta = {
  title: 'Templates/Pages/Responsive Panel',
  component: ResponsivePanel,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof ResponsivePanel>;
/** Copy-paste template — not an importable component. Copy `templates-pages-responsive-panel--source-code` and its Layout Container dependency. Caller state survives panel unmounts; returnFocusRef restores the opener. @summary Controlled inline region or modal drawer, with consistent dismissal and focus return. */
export default meta;
/** Resize below 768px for an overlay; the field value persists across close and presentation changes. */
export const Default: StoryObj = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [notes, setNotes] = React.useState('Ready for review');
    const trigger = React.useRef<HTMLButtonElement>(null);
    const panelId = React.useId();
    const styles = /* css */ `.responsive-panel-example { display: flex; height: 100dvh; } .responsive-panel-example__main { flex: 1; padding: var(--spacingVerticalL); }`;
    return (
      <>
        <style>{styles}</style>
        <LayoutContainer className="responsive-panel-example">
          <div className="responsive-panel-example__main">
            <Button
              ref={trigger}
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              onClick={() => setOpen(true)}
            >
              Open details
            </Button>
          </div>
          <ResponsivePanel
            id={panelId}
            title="Details"
            open={open}
            onOpenChange={setOpen}
            position="end"
            returnFocusRef={trigger}
          >
            <Field label="Notes">
              <Input value={notes} onChange={(_, data) => setNotes(data.value)} />
            </Field>
          </ResponsivePanel>
        </LayoutContainer>
      </>
    );
  },
};
