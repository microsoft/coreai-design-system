// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  type MenuItemProps,
  type SelectTabData,
  type SelectTabEvent,
  type TabValue,
  TabList,
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Overflow,
  OverflowItem,
  Tab,
  useIsOverflowItemVisible,
  useOverflowMenu,
} from '@coreai-ds/react-components';

import {
  Calendar3DayFilled,
  Calendar3DayRegular,
  CalendarAgendaFilled,
  CalendarAgendaRegular,
  CalendarChatFilled,
  CalendarChatRegular,
  CalendarDayFilled,
  CalendarDayRegular,
  CalendarMonthFilled,
  CalendarMonthRegular,
  CalendarSearchFilled,
  CalendarSearchRegular,
  CalendarTodayFilled,
  CalendarTodayRegular,
  CalendarWeekStartFilled,
  CalendarWeekStartRegular,
  CalendarWorkWeekFilled,
  CalendarWorkWeekRegular,
  MoreHorizontalFilled,
  MoreHorizontalRegular,
  bundleIcon,
} from '@fluentui/react-icons';

// ---------- Icons ----------
const CalendarMonth = bundleIcon(CalendarMonthFilled, CalendarMonthRegular);
const Calendar3Day = bundleIcon(Calendar3DayFilled, Calendar3DayRegular);
const CalendarAgenda = bundleIcon(CalendarAgendaFilled, CalendarAgendaRegular);
const CalendarChat = bundleIcon(CalendarChatFilled, CalendarChatRegular);
const CalendarDay = bundleIcon(CalendarDayFilled, CalendarDayRegular);
const CalendarSearch = bundleIcon(CalendarSearchFilled, CalendarSearchRegular);
const CalendarToday = bundleIcon(CalendarTodayFilled, CalendarTodayRegular);
const CalendarWeekStart = bundleIcon(CalendarWeekStartFilled, CalendarWeekStartRegular);
const CalendarWorkWeek = bundleIcon(CalendarWorkWeekFilled, CalendarWorkWeekRegular);
const MoreHorizontal = bundleIcon(MoreHorizontalFilled, MoreHorizontalRegular);

// ---------- Default + Panels (combined) ----------
const DefaultWithPanels = () => {
  const [selectedValue, setSelectedValue] = React.useState<TabValue>('conditions');

  const onTabSelect = (_e: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value);
  };

  return (
    <>
      <TabList appearance="elevated" selectedValue={selectedValue} onTabSelect={onTabSelect}>
        <Tab id="Arrivals" icon={<CalendarDay />} value="arrivals">
          Arrivals
        </Tab>
        <Tab id="Departures" icon={<CalendarAgenda />} value="departures">
          Departures
        </Tab>
        <Tab id="Conditions" icon={<CalendarToday />} value="conditions">
          Conditions
        </Tab>
      </TabList>
      <div className="tab-list-elevated-example__panels">
        {selectedValue === 'arrivals' && (
          <div role="tabpanel" aria-labelledby="Arrivals">
            <table>
              <thead>
                <th>Origin</th>
                <th>Gate</th>
                <th>ETA</th>
              </thead>
              <tbody>
                <tr>
                  <td>DEN</td>
                  <td>C3</td>
                  <td>12:40 PM</td>
                </tr>
                <tr>
                  <td>SMF</td>
                  <td>D1</td>
                  <td>1:18 PM</td>
                </tr>
                <tr>
                  <td>SFO</td>
                  <td>E18</td>
                  <td>1:42 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {selectedValue === 'departures' && (
          <div role="tabpanel" aria-labelledby="Departures">
            <table>
              <thead>
                <th>Destination</th>
                <th>Gate</th>
                <th>ETD</th>
              </thead>
              <tbody>
                <tr>
                  <td>MSP</td>
                  <td>A7</td>
                  <td>8:26 AM</td>
                </tr>
                <tr>
                  <td>DCA</td>
                  <td>N2</td>
                  <td>9:03 AM</td>
                </tr>
                <tr>
                  <td>LAS</td>
                  <td>E15</td>
                  <td>2:36 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {selectedValue === 'conditions' && (
          <div role="tabpanel" aria-labelledby="Conditions">
            <table className="tab-list-elevated-example__props-table">
              <tbody>
                <tr>
                  <td>Time</td>
                  <td>6:45 AM</td>
                </tr>
                <tr>
                  <td>Temperature</td>
                  <td>68F / 20C</td>
                </tr>
                <tr>
                  <td>Forecast</td>
                  <td>Overcast</td>
                </tr>
                <tr>
                  <td>Visibility</td>
                  <td>0.5 miles, 1800 ft runway visual range</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

// ---------- Simple tab set used across sections ----------
const renderSimpleTabs = (disabledValue?: string) => (
  <>
    <Tab value="tab1">First Tab</Tab>
    <Tab value="tab2" disabled={disabledValue === 'tab2'}>
      Second Tab
    </Tab>
    <Tab value="tab3">Third Tab</Tab>
    <Tab value="tab4">Fourth Tab</Tab>
  </>
);

const renderIconTabs = (iconOnly?: boolean) => (
  <>
    <Tab icon={<CalendarMonth />} value="tab1" {...(iconOnly ? { 'aria-label': 'First Tab' } : {})}>
      {iconOnly ? undefined : 'First Tab'}
    </Tab>
    <Tab
      icon={<CalendarMonth />}
      value="tab2"
      {...(iconOnly ? { 'aria-label': 'Second Tab' } : {})}
    >
      {iconOnly ? undefined : 'Second Tab'}
    </Tab>
    <Tab icon={<CalendarMonth />} value="tab3" {...(iconOnly ? { 'aria-label': 'Third Tab' } : {})}>
      {iconOnly ? undefined : 'Third Tab'}
    </Tab>
    <Tab
      icon={<CalendarMonth />}
      value="tab4"
      {...(iconOnly ? { 'aria-label': 'Fourth Tab' } : {})}
    >
      {iconOnly ? undefined : 'Fourth Tab'}
    </Tab>
  </>
);

// ---------- Overflow plumbing (adapted from TabListWithOverflow.stories) ----------
type ExampleTab = { id: string; name: string; icon: React.ReactElement };

const overflowTabs: ExampleTab[] = [
  { id: 'today', name: 'Today', icon: <CalendarToday /> },
  { id: 'agenda', name: 'Agenda', icon: <CalendarAgenda /> },
  { id: 'day', name: 'Day', icon: <CalendarDay /> },
  { id: 'threeDay', name: 'Three Day', icon: <Calendar3Day /> },
  { id: 'workWeek', name: 'Work Week', icon: <CalendarWorkWeek /> },
  { id: 'week', name: 'Week', icon: <CalendarWeekStart /> },
  { id: 'month', name: 'Month', icon: <CalendarMonth /> },
  { id: 'search', name: 'Search', icon: <CalendarSearch /> },
  { id: 'chat', name: 'Conversations', icon: <CalendarChat /> },
];

type OverflowMenuItemProps = {
  tab: ExampleTab;
  onClick: MenuItemProps['onClick'];
};

const OverflowMenuItem = ({ tab, onClick }: OverflowMenuItemProps) => {
  const isVisible = useIsOverflowItemVisible(tab.id);
  if (isVisible) {
    return null;
  }
  return (
    <MenuItem key={tab.id} icon={tab.icon} onClick={onClick}>
      <div>{tab.name}</div>
    </MenuItem>
  );
};

type OverflowMenuProps = {
  onTabSelect?: (tabId: string) => void;
};

const OverflowMenu = ({ onTabSelect }: OverflowMenuProps) => {
  const { ref, isOverflowing, overflowCount } = useOverflowMenu<HTMLButtonElement>();

  if (!isOverflowing) {
    return null;
  }

  return (
    <Menu hasIcons>
      <MenuTrigger disableButtonEnhancement>
        <Button
          appearance="transparent"
          className="tab-list-elevated-example__menu-button"
          ref={ref}
          icon={<MoreHorizontal />}
          aria-label={`${overflowCount} more tabs`}
          role="tab"
        />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {overflowTabs.map((tab) => (
            <OverflowMenuItem key={tab.id} tab={tab} onClick={() => onTabSelect?.(tab.id)} />
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

const OverflowHorizontal = () => {
  const [selectedTabId, setSelectedTabId] = React.useState<string>('today');

  return (
    <div className="tab-list-elevated-example__overflow tab-list-elevated-example__overflow--horizontal">
      <Overflow minimumVisible={2}>
        <TabList
          appearance="elevated"
          selectedValue={selectedTabId}
          onTabSelect={(_, d) => setSelectedTabId(d.value as string)}
        >
          {overflowTabs.map((tab) => (
            <OverflowItem key={tab.id} id={tab.id} priority={tab.id === selectedTabId ? 2 : 1}>
              <Tab value={tab.id} icon={<span>{tab.icon}</span>}>
                {tab.name}
              </Tab>
            </OverflowItem>
          ))}
          <OverflowMenu onTabSelect={setSelectedTabId} />
        </TabList>
      </Overflow>
    </div>
  );
};

const OverflowVertical = () => {
  const [selectedTabId, setSelectedTabId] = React.useState<string>('today');

  return (
    <div className="tab-list-elevated-example__overflow tab-list-elevated-example__overflow--vertical">
      <Overflow minimumVisible={2} overflowAxis="vertical">
        <TabList
          appearance="elevated"
          vertical
          selectedValue={selectedTabId}
          onTabSelect={(_, d) => setSelectedTabId(d.value as string)}
        >
          {overflowTabs.map((tab) => (
            <OverflowItem key={tab.id} id={tab.id} priority={tab.id === selectedTabId ? 2 : 1}>
              <Tab value={tab.id} icon={<span>{tab.icon}</span>}>
                {tab.name}
              </Tab>
            </OverflowItem>
          ))}
          <OverflowMenu onTabSelect={setSelectedTabId} />
        </TabList>
      </Overflow>
    </div>
  );
};

// ---------- The story ----------
export const CustomAppearanceElevated = () => {
  const styles = /* css */ `
    .tab-list-elevated-example {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      row-gap: var(--spacingVerticalXXXL);
      padding: var(--spacingVerticalXXXL) var(--spacingHorizontalXL);
    }

    .tab-list-elevated-example__section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      row-gap: var(--spacingVerticalS);
    }

    .tab-list-elevated-example__section-heading {
      margin: 0;
      color: var(--colorNeutralForeground1);
      font-size: var(--fontSizeBase400);
      font-weight: var(--fontWeightSemibold);
    }

    .tab-list-elevated-example__section-subheading {
      margin: 0;
      color: var(--colorNeutralForeground3);
      font-size: var(--fontSizeBase200);
    }

    .tab-list-elevated-example__row {
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      column-gap: var(--spacingHorizontalXXL);
    }

    .tab-list-elevated-example__panels {
      padding: var(--spacingVerticalS) 0 0;
    }

    .tab-list-elevated-example__panels th {
      padding: 0 30px 0 0;
      text-align: left;
    }

    .tab-list-elevated-example__props-table td {
      padding: 0 30px 0 0;
    }

    .tab-list-elevated-example__props-table td:first-child {
      font-weight: var(--fontWeightSemibold);
    }

    .tab-list-elevated-example__overflow {
      z-index: 0;
      overflow: hidden;
      padding: 5px;
      background-color: var(--colorNeutralBackground2);
    }

    .tab-list-elevated-example__overflow--horizontal {
      width: 600px;
      min-width: 150px;
      height: fit-content;
      resize: horizontal;
    }

    .tab-list-elevated-example__overflow--vertical {
      display: flex;
      align-content: stretch;
      align-items: stretch;
      justify-content: stretch;
      justify-items: stretch;
      width: fit-content;
      height: 250px;
      min-height: 100px;
      resize: vertical;
    }

    .tab-list-elevated-example__menu-button {
      align-self: center;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="tab-list-elevated-example">
        {/* 1. Default — appearance + panels combined */}
        <section className="tab-list-elevated-example__section">
          <h3 className="tab-list-elevated-example__section-heading">Default (with panels)</h3>
          <p className="tab-list-elevated-example__section-subheading">
            Selectable tabs that drive a panel below the strip.
          </p>
          <DefaultWithPanels />
        </section>

        {/* 2. Vertical */}
        <section className="tab-list-elevated-example__section">
          <h3 className="tab-list-elevated-example__section-heading">Vertical</h3>
          <TabList appearance="elevated" defaultSelectedValue="tab3" vertical>
            {renderSimpleTabs()}
          </TabList>
        </section>

        {/* 3. Disabled */}
        <section className="tab-list-elevated-example__section">
          <h3 className="tab-list-elevated-example__section-heading">Disabled tab</h3>
          <TabList appearance="elevated" defaultSelectedValue="tab3">
            {renderSimpleTabs('tab2')}
          </TabList>
        </section>

        {/* 4. Sizes — horizontal: small, medium, large stacked */}
        <section className="tab-list-elevated-example__section">
          <h3 className="tab-list-elevated-example__section-heading">Sizes (horizontal)</h3>
          <TabList appearance="elevated" defaultSelectedValue="tab3" size="small">
            {renderSimpleTabs()}
          </TabList>
          <TabList appearance="elevated" defaultSelectedValue="tab3" size="medium">
            {renderSimpleTabs()}
          </TabList>
          <TabList appearance="elevated" defaultSelectedValue="tab3" size="large">
            {renderSimpleTabs()}
          </TabList>
        </section>

        {/* 5. Sizes vertical — laid out in a horizontal row: small, medium, large */}
        <section className="tab-list-elevated-example__section">
          <h3 className="tab-list-elevated-example__section-heading">
            Sizes (vertical, side-by-side)
          </h3>
          <div className="tab-list-elevated-example__row">
            <TabList appearance="elevated" defaultSelectedValue="tab3" vertical size="small">
              {renderSimpleTabs()}
            </TabList>
            <TabList appearance="elevated" defaultSelectedValue="tab3" vertical size="medium">
              {renderSimpleTabs()}
            </TabList>
            <TabList appearance="elevated" defaultSelectedValue="tab3" vertical size="large">
              {renderSimpleTabs()}
            </TabList>
          </div>
        </section>

        {/* 6. With icon */}
        <section className="tab-list-elevated-example__section">
          <h3 className="tab-list-elevated-example__section-heading">With icon</h3>
          <TabList appearance="elevated" defaultSelectedValue="tab2">
            {renderIconTabs()}
          </TabList>
          <TabList appearance="elevated" defaultSelectedValue="tab2" vertical>
            {renderIconTabs()}
          </TabList>
        </section>

        {/* 7. Icon only */}
        <section className="tab-list-elevated-example__section">
          <h3 className="tab-list-elevated-example__section-heading">Icon only</h3>
          <TabList appearance="elevated" defaultSelectedValue="tab2">
            {renderIconTabs(true)}
          </TabList>
          <TabList appearance="elevated" defaultSelectedValue="tab2" vertical>
            {renderIconTabs(true)}
          </TabList>
        </section>

        {/* 8. With overflow */}
        <section className="tab-list-elevated-example__section">
          <h3 className="tab-list-elevated-example__section-heading">With overflow</h3>
          <p className="tab-list-elevated-example__section-subheading">
            Drag the resize handles to shrink the container and trigger the overflow menu.
          </p>
          <OverflowHorizontal />
          <OverflowVertical />
        </section>
      </div>
    </>
  );
};

export default {
  title: 'Components/TabList',
  component: TabList,
};
