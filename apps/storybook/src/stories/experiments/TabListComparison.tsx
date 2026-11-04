// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Tab as LegacyTab, TabList as LegacyTabList } from '@coreai-ds/react-components';
import {
  Tab,
  TabList,
  type TabListAppearance,
  type TabListProps,
} from '@coreai-ds/react-headless-components';
import {
  CalendarMonthFilled,
  CalendarMonthRegular,
} from '@fluentui/react-icons/headless/svg/calendar-month';
import styles from './TabListComparison.module.css';

export type TabListImplementation = 'legacy' | 'headless';
export interface TabListExample {
  name: string;
  appearance?: TabListAppearance;
  size?: TabListProps['size'];
  vertical?: boolean;
  icons?: boolean;
  iconOnly?: boolean;
  disabled?: boolean;
  selectedDisabled?: boolean;
  selected?: 'account' | 'activity' | null;
  reserveSelectedTabSpace?: boolean;
  consumer?: boolean;
}

export const tabListExamples: readonly TabListExample[] = [
  { name: 'Default' },
  { name: 'Small', size: 'small' },
  { name: 'Large', size: 'large' },
  { name: 'Subtle', appearance: 'subtle' },
  { name: 'Subtle circular', appearance: 'subtle-circular' },
  { name: 'Filled circular', appearance: 'filled-circular' },
  { name: 'Elevated', appearance: 'elevated' },
  { name: 'Small circular', appearance: 'subtle-circular', size: 'small', icons: true },
  { name: 'Large circular', appearance: 'filled-circular', size: 'large', icons: true },
  { name: 'Small elevated', appearance: 'elevated', size: 'small', icons: true },
  { name: 'Large elevated', appearance: 'elevated', size: 'large', icons: true },
  { name: 'Vertical small', size: 'small', vertical: true, icons: true },
  { name: 'Vertical medium', vertical: true, icons: true },
  { name: 'Vertical large', size: 'large', vertical: true, icons: true },
  { name: 'Vertical circular', appearance: 'subtle-circular', vertical: true },
  { name: 'Vertical elevated', appearance: 'elevated', vertical: true, icons: true },
  { name: 'Icon and text', icons: true, selected: 'activity' },
  { name: 'Icon only', icons: true, iconOnly: true },
  { name: 'Large icon only', size: 'large', icons: true, iconOnly: true },
  { name: 'Disabled list', disabled: true, icons: true },
  { name: 'Selected disabled', selectedDisabled: true, icons: true },
  {
    name: 'Selected disabled subtle circular',
    selectedDisabled: true,
    appearance: 'subtle-circular',
    icons: true,
  },
  {
    name: 'Selected disabled filled circular',
    selectedDisabled: true,
    appearance: 'filled-circular',
    icons: true,
  },
  {
    name: 'Selected disabled elevated',
    selectedDisabled: true,
    appearance: 'elevated',
    icons: true,
  },
  { name: 'No selection', selected: null, icons: true },
  { name: 'No reserved space', reserveSelectedTabSpace: false, icons: true },
  {
    name: 'Explicit undefined visual defaults',
    appearance: undefined,
    size: undefined,
    reserveSelectedTabSpace: undefined,
  },
];

export const tabListConsumerExample: TabListExample = {
  name: 'Consumer classes',
  appearance: 'subtle-circular',
  icons: true,
  consumer: true,
};

export function TabFixtureGlyph() {
  return (
    <>
      <CalendarMonthFilled
        aria-hidden="true"
        className="fui-Icon-filled"
        data-tablist-glyph="filled"
      />
      <CalendarMonthRegular
        aria-hidden="true"
        className="fui-Icon-regular"
        data-tablist-glyph="regular"
      />
    </>
  );
}

export function TabListFixture({
  implementation,
  example,
}: {
  implementation: TabListImplementation;
  example: TabListExample;
}) {
  const List = implementation === 'legacy' ? LegacyTabList : TabList;
  const Item = implementation === 'legacy' ? LegacyTab : Tab;
  const visualProps = {
    ...('appearance' in example ? { appearance: example.appearance } : {}),
    ...('size' in example ? { size: example.size } : {}),
    ...('reserveSelectedTabSpace' in example
      ? { reserveSelectedTabSpace: example.reserveSelectedTabSpace }
      : {}),
  };
  const selected = example.selected === null ? undefined : (example.selected ?? 'account');
  return (
    <List
      {...visualProps}
      aria-label={`${implementation} visual tabs`}
      data-tablist-implementation={implementation}
      defaultSelectedValue={selected}
      disabled={example.disabled}
      vertical={example.vertical}
      className={example.consumer ? styles.consumerList : undefined}
    >
      {[
        ['account', 'Account'],
        ['unavailable', 'Unavailable'],
        ['activity', 'Activity'],
      ].map(([value, label]) => (
        <Item
          key={value}
          value={value}
          aria-label={example.iconOnly ? label : undefined}
          disabled={value === 'unavailable' || (value === selected && example.selectedDisabled)}
          className={example.consumer ? styles.consumerTab : undefined}
          data-tablist-fixture-tab={value}
          icon={
            example.icons
              ? {
                  className: example.consumer ? styles.consumerIcon : undefined,
                  children: <TabFixtureGlyph />,
                }
              : undefined
          }
          content={{
            className: example.consumer ? styles.consumerContent : undefined,
          }}
        >
          {example.iconOnly ? undefined : label}
        </Item>
      ))}
    </List>
  );
}

export function TabListComparison({ example }: { example: TabListExample }) {
  return (
    <div className={styles.comparison}>
      <section className={styles.column}>
        <h3>Current CoreAI / Griffel</h3>
        <div className={styles.viewport}>
          <TabListFixture implementation="legacy" example={example} />
        </div>
      </section>
      <section className={styles.column}>
        <h3>Headless / CSS Modules</h3>
        <div className={styles.viewport}>
          <TabListFixture implementation="headless" example={example} />
        </div>
      </section>
    </div>
  );
}
