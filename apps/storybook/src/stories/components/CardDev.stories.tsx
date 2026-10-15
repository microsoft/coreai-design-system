// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Text, Checkbox, Card, CardHeader } from '@coreai-ds/react-components';

// ---------- OutlineInteractivity ----------

export const OutlineInteractivity = () => {
  const [selected, setSelected] = React.useState(false);

  const styles = /* css */ `
    .card-outline-interactivity-example {
      display: flex;
      flex-direction: column;
      gap: 36px;
    }

    .card-outline-interactivity-example__card {
      width: 100%;
      max-width: 480px;
      height: fit-content;
    }

    .card-outline-interactivity-example__caption {
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="card-outline-interactivity-example">
        {/* Static — no hover/active feedback */}
        <Card appearance="outline" className="card-outline-interactivity-example__card">
          <CardHeader
            header={<Text weight="semibold">Static</Text>}
            description={
              <Text preset="bodyS" className="card-outline-interactivity-example__caption">
                No onClick, no selection — remains visually inert on hover.
              </Text>
            }
          />
        </Card>

        {/* Interactive — hover/active feedback */}
        <Card
          appearance="outline"
          className="card-outline-interactivity-example__card"
          onClick={() => console.log('clicked')}
        >
          <CardHeader
            header={<Text weight="semibold">Interactive</Text>}
            description={
              <Text preset="bodyS" className="card-outline-interactivity-example__caption">
                Has onClick — shows hover and pressed background.
              </Text>
            }
          />
        </Card>

        {/* Selectable — hover/active feedback */}
        <Card
          appearance="outline"
          className="card-outline-interactivity-example__card"
          floatingAction={
            <Checkbox
              checked={selected}
              onChange={(_, data) => setSelected(!!data.checked)}
              aria-label="Select card"
            />
          }
          selected={selected}
          onSelectionChange={(_, data) => setSelected(data.selected)}
        >
          <CardHeader
            header={<Text weight="semibold">Selectable</Text>}
            description={
              <Text preset="bodyS" className="card-outline-interactivity-example__caption">
                Has selection — shows hover and pressed background.
              </Text>
            }
          />
        </Card>

        {/* Disabled — no hover/active feedback */}
        <Card
          appearance="outline"
          className="card-outline-interactivity-example__card"
          onClick={() => console.log('clicked')}
          disabled
        >
          <CardHeader
            header={<Text weight="semibold">Disabled</Text>}
            description={
              <Text preset="bodyS" className="card-outline-interactivity-example__caption">
                Has onClick but disabled — remains visually static.
              </Text>
            }
          />
        </Card>
      </div>
    </>
  );
};

export default {
  title: 'Components/Card/Card',
  component: Card,
};
