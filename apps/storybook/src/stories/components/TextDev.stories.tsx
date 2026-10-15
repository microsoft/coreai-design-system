// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Text, type TextPreset } from '@coreai-ds/react-components';

export const Foreground = () => {
  const styles = /* css */ `
    .text-foreground-example {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="text-foreground-example">
        <Text foreground={1}>Foreground 1 — heading</Text>
        <Text foreground={2}>Foreground 2 — body (default)</Text>
        <Text foreground={3}>Foreground 3 — subtle</Text>
        <Text foreground={4}>Foreground 4 — muted</Text>
        <Text foreground={'disabled'}>Foreground Disabled — disabled</Text>
      </div>
    </>
  );
};

/** The `size`/`weight` each preset corresponds to, and the CoreAI `preset` (if any) that reproduces it. */
const presets: Array<{
  render: (label: string) => React.JSX.Element;
  name: string;
  coreAI?: string;
  coreAIPreset?: TextPreset;
  size: number;
  weight: string;
}> = [
  {
    render: (l) => <Text preset="bodyXS">{l}</Text>,
    name: 'Caption2',
    coreAI: 'Body XS',
    coreAIPreset: 'bodyXS',
    size: 100,
    weight: 'regular',
  },
  {
    render: (l) => <Text preset="bodyXSStrong">{l}</Text>,
    name: 'Caption2Strong',
    coreAI: 'Body XS Strong',
    coreAIPreset: 'bodyXSStrong',
    size: 100,
    weight: 'semibold',
  },
  {
    render: (l) => <Text preset="bodyS">{l}</Text>,
    name: 'Caption1',
    coreAI: 'Body S',
    coreAIPreset: 'bodyS',
    size: 200,
    weight: 'regular',
  },
  {
    render: (l) => <Text preset="bodySStrong">{l}</Text>,
    name: 'Caption1Strong',
    coreAI: 'Body S Strong',
    coreAIPreset: 'bodySStrong',
    size: 200,
    weight: 'semibold',
  },
  {
    render: (l) => (
      <Text size={200} weight="bold">
        {l}
      </Text>
    ),
    name: 'Caption1Stronger',
    size: 200,
    weight: 'bold',
  },
  {
    render: (l) => <Text preset="body">{l}</Text>,
    name: 'Body1',
    coreAI: 'Body',
    coreAIPreset: 'body',
    size: 300,
    weight: 'regular',
  },
  {
    render: (l) => <Text preset="bodyStrong">{l}</Text>,
    name: 'Body1Strong',
    coreAI: 'Body Strong',
    coreAIPreset: 'bodyStrong',
    size: 300,
    weight: 'semibold',
  },
  {
    render: (l) => (
      <Text size={300} weight="bold">
        {l}
      </Text>
    ),
    name: 'Body1Stronger',
    size: 300,
    weight: 'bold',
  },
  {
    render: (l) => (
      <Text size={400} weight="regular">
        {l}
      </Text>
    ),
    name: 'Body2',
    size: 400,
    weight: 'regular',
  },
  {
    render: (l) => <Text preset="heading4">{l}</Text>,
    name: 'Subtitle2',
    coreAI: 'Heading 4',
    coreAIPreset: 'heading4',
    size: 400,
    weight: 'semibold',
  },
  {
    render: (l) => (
      <Text size={400} weight="bold">
        {l}
      </Text>
    ),
    name: 'Subtitle2Stronger',
    size: 400,
    weight: 'bold',
  },
  {
    render: (l) => <Text preset="heading3">{l}</Text>,
    name: 'Subtitle1',
    coreAI: 'Heading 3',
    coreAIPreset: 'heading3',
    size: 500,
    weight: 'semibold',
  },
  {
    render: (l) => (
      <Text size={600} weight="semibold">
        {l}
      </Text>
    ),
    name: 'Title3',
    size: 600,
    weight: 'semibold',
  },
  {
    render: (l) => <Text preset="heading2">{l}</Text>,
    name: 'Title2',
    coreAI: 'Heading 2',
    coreAIPreset: 'heading2',
    size: 700,
    weight: 'semibold',
  },
  {
    render: (l) => (
      <Text size={800} weight="semibold">
        {l}
      </Text>
    ),
    name: 'Title1',
    size: 800,
    weight: 'semibold',
  },
  {
    render: (l) => <Text preset="heading1">{l}</Text>,
    name: 'LargeTitle',
    coreAI: 'Heading 1',
    coreAIPreset: 'heading1',
    size: 900,
    weight: 'semibold',
  },
  {
    render: (l) => (
      <Text size={1000} weight="semibold">
        {l}
      </Text>
    ),
    name: 'Display',
    size: 1000,
    weight: 'semibold',
  },
];

export const PresetCompatibility = () => {
  // Group presets by size, then list largest size first.
  const groups = Array.from(
    presets.reduce((map, preset) => {
      const group = map.get(preset.size) ?? [];
      group.push(preset);
      map.set(preset.size, group);
      return map;
    }, new Map<number, typeof presets>()),
  ).sort(([a], [b]) => b - a);

  // Render every preset in a group with its own styling, separated by a '/'.
  const renderGroup = (group: typeof presets) => (
    <div className="text-preset-compatibility-example__cell text-preset-compatibility-example__cell--preset">
      {group.map((preset, index) => (
        <React.Fragment key={preset.name}>
          {index > 0 && (
            <Text foreground={4} size={200}>
              /
            </Text>
          )}
          {preset.render(preset.name)}
        </React.Fragment>
      ))}
    </div>
  );

  // Render the same group with the CoreAI `Text` component's `preset` prop,
  // separated by a '/'.
  const renderCoreAIGroup = (group: typeof presets) => (
    <div className="text-preset-compatibility-example__cell">
      {group.map((preset, index) => (
        <React.Fragment key={preset.name}>
          {index > 0 && (
            <Text foreground={4} size={200}>
              /
            </Text>
          )}
          <Text
            preset={preset.coreAIPreset}
            foreground={
              !preset.coreAIPreset ? 'disabled' : preset.weight !== 'regular' ? 1 : undefined
            }
          >
            {preset.coreAI || '---'}
          </Text>
        </React.Fragment>
      ))}
    </div>
  );

  const styles = /* css */ `
    .text-preset-compatibility-example {
      display: grid;
      grid-template-columns: max-content max-content max-content;
      align-items: baseline;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalM);
    }

    .text-preset-compatibility-example__cell {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: var(--spacingHorizontalS);
    }

    .text-preset-compatibility-example__cell--preset {
      color: var(--colorNeutralForegroundDisabled);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="text-preset-compatibility-example">
        <Text foreground={4} size={100} uppercase weight="bold">
          CoreAI
        </Text>
        <Text foreground={4} size={100} uppercase weight="bold">
          preset
        </Text>
        <Text foreground={4} size={100} uppercase weight="bold">
          size / weight
        </Text>
        {groups.map(([size, group]) => (
          <React.Fragment key={size}>
            {renderCoreAIGroup(group)}
            {renderGroup(group)}
            <Text foreground={3} size={200}>
              {size} / {group.map((preset) => preset.weight).join(' / ')}
            </Text>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default {
  title: 'Components/Text',
  component: Text,
};
