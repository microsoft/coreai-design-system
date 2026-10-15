// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';
import {
  TabList,
  Text,
  Tab,
  type SelectTabData,
  type SelectTabEvent,
  type TabValue,
} from '@coreai-ds/react-components';

// ---------- Shared layout ----------

// ---------- Default (canonical Fluent story) ----------
export const Default: StoryObj = {
  render: () => {
    return (
      <TabList>
        <Tab value="tab1">First Tab</Tab>
        <Tab value="tab2">Second Tab</Tab>
        <Tab value="tab3">Third Tab</Tab>
        <Tab value="tab4">Fourth Tab</Tab>
      </TabList>
    );
  },
};

/**
 * `TabList`'s `appearance` prop is widened with a CoreAI-only `"elevated"`
 * value. It keeps the stock `subtle` tab styling (active indicator, hover)
 * but wraps the whole strip in a raised, rounded, background-filled
 * container — like a `Card` — so it reads as a distinct surface rather than
 * sitting flush with the page. Every other appearance (`transparent`,
 * `subtle`, `subtle-circular`, `filled-circular`) is passed straight through
 * to the stock Fluent `TabList` unchanged.
 */
export const ElevatedAppearance: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .tab-list-elevated-example {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding: var(--spacingVerticalXXL) var(--spacingHorizontalL);
        row-gap: var(--spacingVerticalXXL);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="tab-list-elevated-example">
          <Text as="p" block>
            The <code>elevated</code> appearance raises the tab strip onto its own background with
            rounded corners and padding around every tab, instead of the flat underline/indicator
            styling the other appearances use.
          </Text>
          <TabList appearance="elevated" defaultSelectedValue="tab2">
            <Tab value="tab1">First Tab</Tab>
            <Tab value="tab2">Second Tab</Tab>
            <Tab value="tab3">Third Tab</Tab>
          </TabList>
        </div>
      </>
    );
  },
};

// ---------- LeftAlignTabText ----------
export const LeftAlignTabText: StoryObj = {
  render: () => {
    const tabContent: Record<string, { heading: string; body: string }> = {
      overview: {
        heading: 'Overview',
        body: 'A high-level summary of the project, its goals, and current status.',
      },
      activity: {
        heading: 'Activity',
        body: 'A chronological feed of recent changes, comments, and status updates.',
      },
      settings: {
        heading: 'Settings',
        body: 'Configuration options such as notifications, access, and integrations.',
      },
    };
    const [selectedValue, setSelectedValue] = React.useState<TabValue>('overview');
    const onTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
      setSelectedValue(data.value);
    };
    const { heading, body } = tabContent[selectedValue as string];
    const styles = /* css */ `
      .tab-list-left-align-example {
        display: flex;
        flex-direction: column;
        max-width: 480px;
        row-gap: var(--spacingVerticalXXS);
      }

      .tab-list-left-align-example__title {
        margin: 0;
      }

      .tab-list-left-align-example__tab-list {
        margin-inline: calc(-1 * var(--spacingHorizontalM));
      }

      .tab-list-left-align-example__content {
        color: var(--colorNeutralForeground1);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="tab-list-left-align-example">
          <Text
            as="h2"
            size={500}
            weight="semibold"
            block
            className="tab-list-left-align-example__title"
          >
            Left-align tab content
          </Text>

          <TabList
            selectedValue={selectedValue}
            onTabSelect={onTabSelect}
            appearance="subtle"
            className="tab-list-left-align-example__tab-list"
          >
            <Tab value="overview">Overview</Tab>
            <Tab value="activity">Activity</Tab>
            <Tab value="settings">Settings</Tab>
          </TabList>

          <div
            className="tab-list-left-align-example__content"
            role="tabpanel"
            aria-labelledby={selectedValue as string}
          >
            <Text as="h3" size={300} weight="semibold" block>
              {heading}
            </Text>
            <Text as="p" size={200} weight="regular" block>
              {body}
            </Text>
          </div>
        </div>
      </>
    );
  },
};

/**
 * A tab list provides single selection from tabs. When a tab is selected, the application displays content associated with the selected tab and hides other content.
 *
 * Each tab typically contains a text header and often includes an icon.
 *
 * @summary Row of tabs for single selection that swaps the displayed content.
 */
export default {
  title: 'Components/TabList',
  component: TabList,
  parameters: { ...figmaDesign('TabList') },
};
