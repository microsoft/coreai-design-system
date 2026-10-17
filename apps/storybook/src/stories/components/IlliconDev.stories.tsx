// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Button, Illicon, Link, makeStyles, Text, tokens } from '@coreai-ds/react-components';
import {
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
    size: 100,
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

const agentIcon = (
  <svg viewBox="0 0 100 90" fill="currentColor">
    <path d="M25 0h25v5h-25zM60 0h15v5h-15zM20 5h30v5h-30zM55 5h25v5h-25zM15 10h35v5h-35zM55 10h5v5h-5zM65 10h20v5h-20zM15 15h35v5h-35zM55 15h5v5h-5zM65 15h25v5h-25zM10 20h35v5h-35zM50 20h10v5h-10zM65 20h25v5h-25zM5 25h40v5h-40zM50 25h5v5h-5zM60 25h35v5h-35zM5 30h40v5h-40zM50 30h5v5h-5zM60 30h35v5h-35zM0 35h40v5h-40zM50 35h5v5h-5zM60 35h40v5h-40zM0 40h40v5h-40zM45 40h10v5h-10zM60 40h40v5h-40zM0 45h40v5h-40zM45 45h5v5h-5zM55 45h45v5h-45zM0 50h40v5h-40zM45 50h5v5h-5zM55 50h45v5h-45zM5 55h30v5h-30zM45 55h5v5h-5zM55 55h40v5h-40zM5 60h30v5h-30zM40 60h10v5h-10zM55 60h40v5h-40zM10 65h25v5h-25zM40 65h5v5h-5zM50 65h40v5h-40zM15 70h20v5h-20zM40 70h5v5h-5zM50 70h35v5h-35zM15 75h15v5h-15zM35 75h10v5h-10zM50 75h35v5h-35zM20 80h20v5h-20zM50 80h30v5h-30zM25 85h10v5h-10zM45 85h30v5h-30z" />
  </svg>
);

/**
 * Uses an Illicon as the dotted illustration in an empty state.
 *
 * @summary Illicon used as an empty-state illustration.
 */
export const EmptyStateDev: StoryObj = {
  render: () => (
    <EmptyState
      illustration={<Illicon icon={agentIcon} size={100} />}
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
