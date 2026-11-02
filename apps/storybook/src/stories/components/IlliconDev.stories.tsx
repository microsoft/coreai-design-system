// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Button, Illicon, Link, makeStyles, Text, tokens } from '@coreai-ds/react-components';
import {
  Agents24Filled,
  Brain24Filled,
  CodeRegular,
  Cube24Filled,
  Database24Filled,
  Heart24Filled,
  Rocket24Filled,
  Shield24Filled,
  Star24Filled,
} from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from '../templates/EmptyState';

const iconOptions = {
  Brain: Brain24Filled,
  Cube: Cube24Filled,
  Database: Database24Filled,
  Heart: Heart24Filled,
  Rocket: Rocket24Filled,
  Shield: Shield24Filled,
  Star: Star24Filled,
};

type ComparisonProps = {
  icon: keyof typeof iconOptions;
  size: number;
};

const useComparisonStyles = makeStyles({
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  comparison: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, max-content)',
    columnGap: tokens.spacingHorizontalXXL,
    marginInline: 'auto',
    width: 'max-content',
    color: tokens.colorNeutralForeground1,
  },
  example: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalM,
  },
});

/**
 * Compares the same Fluent Filled icon and output size before and after
 * Illicon's dotted conversion. Use Controls to change both examples together.
 */
export const OriginalVsIlliconDev: StoryObj<ComparisonProps> = {
  name: 'Original vs. Illicon Dev',
  args: {
    icon: 'Rocket',
    size: 24 * 4,
  },
  argTypes: {
    icon: {
      description: 'Fluent Filled icon used for both examples.',
      control: 'select',
      options: Object.keys(iconOptions),
    },
    size: {
      description: 'Width and height in pixels for both examples.',
      control: 'select',
      options: [48, 96, 100, 140, 192],
    },
  },
  parameters: {
    controls: { disable: false, include: ['icon', 'size'] },
  },
  render: function Comparison({ icon, size }: ComparisonProps) {
    const styles = useComparisonStyles();
    const Icon = iconOptions[icon];

    return (
      <div className={styles.root}>
        <div className={styles.comparison}>
          <div className={styles.example}>
            <Text>Original</Text>
            <Icon style={{ width: size, height: size }} aria-label={`Original ${icon}`} />
          </div>
          <div className={styles.example}>
            <Text>Illicon</Text>
            <Illicon icon={Icon} size={size} aria-label={`Illicon ${icon}`} />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Uses an Illicon as the dotted illustration in an empty state.
 *
 * @summary Illicon used as an empty-state illustration.
 */
export const EmptyStateDev: StoryObj = {
  render: () => (
    <EmptyState
      illustration={<Illicon icon={Agents24Filled} size={24 * 4} />}
      header="Benefit from Action Artifact"
      description="Disambiguate with text or exclude entirely."
      actions={
        <>
          <Button appearance="primary">Create agent</Button>
          <Button icon={<CodeRegular />}>Code</Button>
        </>
      }
      links={<Link href="#">How to make the coolest artifact ever</Link>}
    />
  ),
};

export default {
  title: 'Components/Illicon',
  component: Illicon,
} satisfies Meta<typeof Illicon>;
