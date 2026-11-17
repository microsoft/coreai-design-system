// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from '@coreai-ds/react-components';
import { DetailsLayout } from './DetailsLayout';
import { PageLayout } from './PageLayout';
import { PageHeader } from './PageHeader';
import { DetailsList } from '../DetailsList';
const meta = {
  title: 'Templates/Pages/Details Layout',
  component: DetailsLayout,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof DetailsLayout>;
/** Copy-paste template — not an importable component. Copy `templates-pages-details-layout--source-code` and dependencies. Used by Grid Details Content; also supports arbitrary non-grid content. @summary Scrolling main content with optional responsive details. */
export default meta;
/** A custom action opens details and receives focus when they close. */
export const Default: StoryObj = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const trigger = React.useRef<HTMLButtonElement>(null);
    const styles = /* css */ `.details-layout-example { height: 100dvh; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="details-layout-example">
          <PageLayout header={<PageHeader title="Overview" />} scrollMode="panes">
            <DetailsLayout
              onClose={() => setOpen(false)}
              returnFocusRef={trigger}
              details={
                open
                  ? {
                      title: 'Item details',
                      content: (
                        <DetailsList
                          items={[
                            { key: 'name', label: 'Name', value: 'First item' },
                            { key: 'status', label: 'Status', value: 'Active' },
                          ]}
                        />
                      ),
                    }
                  : undefined
              }
            >
              <div>
                <Button ref={trigger} onClick={() => setOpen(true)}>
                  View first item
                </Button>
              </div>
            </DetailsLayout>
          </PageLayout>
        </div>
      </>
    );
  },
};
