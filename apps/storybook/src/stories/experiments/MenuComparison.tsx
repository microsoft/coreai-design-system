// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Menu as LegacyMenu,
  MenuTrigger as LegacyMenuTrigger,
  MenuPopover as LegacyMenuPopover,
  MenuList as LegacyMenuList,
  MenuItem as LegacyMenuItem,
  MenuItemCheckbox as LegacyMenuItemCheckbox,
  MenuItemRadio as LegacyMenuItemRadio,
  MenuItemLink as LegacyMenuItemLink,
  MenuItemSwitch as LegacyMenuItemSwitch,
  MenuDivider as LegacyMenuDivider,
  MenuGroup as LegacyMenuGroup,
  MenuGroupHeader as LegacyMenuGroupHeader,
  MenuSplitGroup as LegacyMenuSplitGroup,
  MenuButton as LegacyMenuButton,
} from '@coreai-ds/react-components';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuItemCheckbox,
  MenuItemRadio,
  MenuItemLink,
  MenuItemSwitch,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuSplitGroup,
  MenuButton,
  type MenuProps,
} from '@coreai-ds/react-headless-components';
import { Checkmark16Filled } from '@fluentui/react-icons/headless/svg/checkmark';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import styles from './MenuComparison.module.css';

export type MenuImplementation = 'legacy' | 'headless';
export type MenuExampleKind =
  | 'default'
  | 'alignment'
  | 'multiline'
  | 'selection'
  | 'switch'
  | 'groups'
  | 'split'
  | 'link'
  | 'disabled';

export interface MenuExample {
  name: string;
  kind: MenuExampleKind;
  hasIcons?: boolean;
  hasCheckmarks?: boolean;
  consumer?: boolean;
}

export const menuExamples: readonly MenuExample[] = [
  { name: 'Default', kind: 'default' },
  { name: 'Icon and check columns', kind: 'alignment', hasIcons: true, hasCheckmarks: true },
  { name: 'Multiline and shortcut', kind: 'multiline' },
  { name: 'Checkbox and radio', kind: 'selection', hasCheckmarks: true },
  { name: 'Switch indicator', kind: 'switch' },
  { name: 'Groups and divider', kind: 'groups' },
  { name: 'Split actions', kind: 'split', hasIcons: true, hasCheckmarks: true },
  { name: 'Navigation link', kind: 'link' },
  { name: 'Disabled items', kind: 'disabled', hasIcons: true },
];

export const menuConsumerExample: MenuExample = {
  name: 'Consumer classes',
  kind: 'groups',
  consumer: true,
};

const converted = {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuItemCheckbox,
  MenuItemRadio,
  MenuItemLink,
  MenuItemSwitch,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuSplitGroup,
  MenuButton,
};
const legacy = {
  Menu: LegacyMenu,
  MenuTrigger: LegacyMenuTrigger,
  MenuPopover: LegacyMenuPopover,
  MenuList: LegacyMenuList,
  MenuItem: LegacyMenuItem,
  MenuItemCheckbox: LegacyMenuItemCheckbox,
  MenuItemRadio: LegacyMenuItemRadio,
  MenuItemLink: LegacyMenuItemLink,
  MenuItemSwitch: LegacyMenuItemSwitch,
  MenuDivider: LegacyMenuDivider,
  MenuGroup: LegacyMenuGroup,
  MenuGroupHeader: LegacyMenuGroupHeader,
  MenuSplitGroup: LegacyMenuSplitGroup,
  MenuButton: LegacyMenuButton,
};

export type MenuSpanFixtureProps = React.HTMLAttributes<HTMLSpanElement> & {
  as?: 'span';
  'data-menu-part': string;
};

export function menuFixtureSlot(name: string, children?: React.ReactNode): MenuSpanFixtureProps {
  return children === undefined ? { 'data-menu-part': name } : { 'data-menu-part': name, children };
}

export function MenuFixtureGlyph() {
  return <Checkmark16Filled className={styles.glyph} />;
}

function MenuFixtureContent({
  implementation,
  example,
}: {
  implementation: MenuImplementation;
  example: MenuExample;
}) {
  const {
    Menu: Root,
    MenuTrigger: Trigger,
    MenuPopover: Surface,
    MenuList: List,
    MenuItem: Item,
    MenuItemCheckbox: CheckboxItem,
    MenuItemRadio: RadioItem,
    MenuItemLink: LinkItem,
    MenuItemSwitch: SwitchItem,
    MenuDivider: Divider,
    MenuGroup: Group,
    MenuGroupHeader: Header,
    MenuSplitGroup: SplitGroup,
  } = implementation === 'legacy' ? legacy : converted;
  const content = menuFixtureSlot('content');
  const icon = menuFixtureSlot('icon', <MenuFixtureGlyph />);
  const itemClassName = example.consumer ? styles.consumerItem : undefined;

  switch (example.kind) {
    case 'alignment':
      return (
        <>
          <CheckboxItem
            name="view"
            value="grid"
            data-menu-part="item"
            content={content}
            icon={icon}
            checkmark={menuFixtureSlot('checkmark')}
          >
            Grid view
          </CheckboxItem>
          <Item
            data-menu-part="item"
            content={content}
            icon={menuFixtureSlot('icon')}
            checkmark={menuFixtureSlot('checkmark')}
          >
            Details
          </Item>
        </>
      );
    case 'multiline':
      return (
        <>
          <Item
            data-menu-part="item"
            content={content}
            icon={icon}
            subText={menuFixtureSlot('subText', 'Create a document')}
            secondaryContent={menuFixtureSlot('shortcut', 'Ctrl+N')}
          >
            New file
          </Item>
          <Item data-menu-part="item" content={content} subText="Open a recent project" disabled>
            Recent project
          </Item>
        </>
      );
    case 'selection':
      return (
        <>
          <Group data-menu-part="group">
            <Header data-menu-part="header">View options</Header>
            <CheckboxItem
              name="view"
              value="grid"
              data-menu-part="item"
              content={content}
              checkmark={menuFixtureSlot('checkmark')}
            >
              Grid view
            </CheckboxItem>
            <CheckboxItem
              name="view"
              value="details"
              data-menu-part="item"
              content={content}
              checkmark={menuFixtureSlot('checkmark')}
            >
              Show details
            </CheckboxItem>
          </Group>
          <Group data-menu-part="group">
            <Header data-menu-part="header">Sort</Header>
            <RadioItem
              name="sort"
              value="name"
              data-menu-part="item"
              content={content}
              checkmark={menuFixtureSlot('checkmark')}
              persistOnClick
            >
              Name
            </RadioItem>
            <RadioItem
              name="sort"
              value="date"
              data-menu-part="item"
              content={content}
              checkmark={menuFixtureSlot('checkmark')}
              persistOnClick
            >
              Date
            </RadioItem>
          </Group>
        </>
      );
    case 'switch':
      return (
        <>
          <SwitchItem
            name="settings"
            value="preview"
            data-menu-part="item"
            subText={menuFixtureSlot('subText', 'Use the new explorer')}
            switchIndicator={menuFixtureSlot('switch')}
          >
            Preview
          </SwitchItem>
          <SwitchItem
            name="settings"
            value="sync"
            data-menu-part="item"
            switchIndicator={menuFixtureSlot('switch')}
            disabled
          >
            Sync
          </SwitchItem>
        </>
      );
    case 'groups':
      return (
        <>
          <Group data-menu-part="group">
            <Header
              data-menu-part="header"
              className={example.consumer ? styles.consumerHeader : undefined}
            >
              Project
            </Header>
            <Item
              className={itemClassName}
              data-menu-part="item"
              content={content}
              icon={{
                ...icon,
                className: example.consumer ? styles.consumerIcon : undefined,
              }}
            >
              New file
            </Item>
            <Item
              className={itemClassName}
              data-menu-part="item"
              content={content}
              secondaryContent={menuFixtureSlot('shortcut', 'Ctrl+O')}
            >
              Open
            </Item>
          </Group>
          <Divider data-menu-part="divider" />
          <Group data-menu-part="group">
            <Header data-menu-part="header">Sharing</Header>
            <Item data-menu-part="item" content={content}>
              Share
            </Item>
          </Group>
        </>
      );
    case 'split':
      return (
        <Root hoverDelay={0} openOnHover={false}>
          <SplitGroup data-menu-part="splitGroup">
            <Item data-menu-part="item" content={content} subText="Open the project">
              Open
            </Item>
            <Trigger disableButtonEnhancement>
              <Item
                data-menu-part="item"
                aria-label="Open on platform"
                submenuIndicator={menuFixtureSlot('submenu')}
              />
            </Trigger>
          </SplitGroup>
          <Surface>
            <List>
              <Item>In browser</Item>
              <Item>In desktop app</Item>
            </List>
          </Surface>
        </Root>
      );
    case 'link':
      return (
        <LinkItem
          href="#menu-fixture-destination"
          data-menu-part="item"
          icon={icon}
          secondaryContent={menuFixtureSlot('shortcut', 'Alt+D')}
        >
          Documentation
        </LinkItem>
      );
    case 'disabled':
      return (
        <>
          <Item
            disabled
            data-menu-part="item"
            content={content}
            icon={icon}
            subText={menuFixtureSlot('subText', 'Permission required')}
            secondaryContent={menuFixtureSlot('shortcut', 'Ctrl+E')}
          >
            Edit project
          </Item>
          <Item data-menu-part="item" content={content}>
            View project
          </Item>
        </>
      );
    default:
      return (
        <>
          <Item
            className={itemClassName}
            data-menu-part="item"
            content={content}
            secondaryContent={menuFixtureSlot('shortcut', 'Ctrl+N')}
          >
            New file
          </Item>
          <Item data-menu-part="item" content={content}>
            Open
          </Item>
          <Item data-menu-part="item" content={content}>
            Share
          </Item>
        </>
      );
  }
}

export function MenuComparison({
  example,
  legacyPositioningRef,
  headlessPositioningRef,
}: {
  example: MenuExample;
  legacyPositioningRef?: React.Ref<PositioningImperativeRef>;
  headlessPositioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const fixtureId = React.useId();
  return (
    <div className={styles.comparison} data-menu-comparison={fixtureId}>
      {(['legacy', 'headless'] as const).map((implementation) => {
        const {
          Menu: Root,
          MenuTrigger: Trigger,
          MenuList: List,
          MenuPopover: Surface,
          MenuButton: TriggerButton,
        } = implementation === 'legacy' ? legacy : converted;
        const props = {
          open: true,
          hasIcons: example.hasIcons,
          hasCheckmarks: example.hasCheckmarks,
          defaultCheckedValues: {
            view: ['grid'],
            sort: ['name'],
            settings: ['preview'],
          },
          positioning: {
            position: 'below',
            align: 'start',
            positioningRef:
              implementation === 'legacy' ? legacyPositioningRef : headlessPositioningRef,
          },
        } satisfies Omit<MenuProps, 'children'>;
        const children: [React.ReactElement, React.ReactElement] = [
          <Trigger key="trigger" disableButtonEnhancement>
            <TriggerButton type="button" data-menu-trigger={implementation}>
              Project menu
            </TriggerButton>
          </Trigger>,
          <Surface
            key="surface"
            className={example.consumer ? styles.consumerSurface : undefined}
            data-menu-implementation={implementation}
            data-menu-fixture={fixtureId}
          >
            <List data-menu-part="list">
              <MenuFixtureContent implementation={implementation} example={example} />
            </List>
          </Surface>,
        ];
        return (
          <section className={styles.column} key={implementation}>
            <h2 className={styles.heading}>
              {implementation === 'legacy' ? 'Current CoreAI / Griffel' : 'Headless / CSS Modules'}
            </h2>
            {implementation === 'legacy' ? (
              <LegacyMenu {...props} surfaceMotion={null}>
                {children}
              </LegacyMenu>
            ) : (
              <Root {...props}>{children}</Root>
            )}
          </section>
        );
      })}
    </div>
  );
}
