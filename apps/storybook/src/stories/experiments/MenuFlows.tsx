// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
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
  useMenuContext,
  type MenuProps,
} from '@coreai-ds/react-headless-components';
import { MenuFixtureGlyph } from './MenuComparison.js';
import { FocusgroupConsumer as MenuFocusgroupConsumer } from './FocusgroupConsumer.js';
import styles from './MenuComparison.module.css';

const initialChecked = {
  view: ['grid'],
  sort: ['name'],
  settings: [],
};

function CurrentMenuState() {
  const open = useMenuContext((context) => context.open);
  const checkedValues = useMenuContext((context) => context.checkedValues);
  return (
    <output
      aria-label="Public Menu context"
      data-context-open={String(open)}
      data-context-checked={JSON.stringify(checkedValues)}
    />
  );
}

function ReadyMenuSelectionFlow({
  controlled,
  defaultOpen,
  onOpenChange,
  onCheckedValueChange,
}: {
  controlled: boolean;
  defaultOpen: boolean;
  onOpenChange?: MenuProps['onOpenChange'];
  onCheckedValueChange?: MenuProps['onCheckedValueChange'];
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [checked, setChecked] = React.useState<Record<string, string[]>>(initialChecked);
  const [lastAction, setLastAction] = React.useState('none');
  const [lastChange, setLastChange] = React.useState<{
    name: string;
    checkedItems: string[];
  }>({ name: '', checkedItems: [] });
  const [changes, setChanges] = React.useState(0);
  const [openEvent, setOpenEvent] = React.useState('');
  const rootProps = controlled
    ? { open, checkedValues: checked }
    : { defaultOpen, defaultCheckedValues: initialChecked };
  return (
    <div className={styles.flow}>
      <div data-testid="menu-pointer-rest">Pointer rest</div>
      <Button type="button">Before menu</Button>
      <Menu
        {...rootProps}
        hasIcons
        hasCheckmarks
        onOpenChange={(event, data) => {
          setOpen(data.open);
          setOpenEvent(data.type);
          onOpenChange?.(event, data);
        }}
        onCheckedValueChange={(event, data) => {
          setChecked((previous) => ({ ...previous, [data.name]: data.checkedItems }));
          setLastChange(data);
          setChanges((count) => count + 1);
          onCheckedValueChange?.(event, data);
        }}
      >
        <MenuTrigger disableButtonEnhancement>
          <MenuButton type="button">Project actions</MenuButton>
        </MenuTrigger>
        <MenuPopover data-testid="menu-selection-surface">
          <MenuList>
            <MenuItem icon={<MenuFixtureGlyph />} onClick={() => setLastAction('new')}>
              New file
            </MenuItem>
            <MenuItem disabled onClick={() => setLastAction('disabled')}>
              Export unavailable
            </MenuItem>
            <MenuGroup>
              <MenuGroupHeader>View options</MenuGroupHeader>
              <MenuItemCheckbox name="view" value="grid">
                Grid view
              </MenuItemCheckbox>
              <MenuItemCheckbox name="view" value="details">
                Show details
              </MenuItemCheckbox>
            </MenuGroup>
            <MenuDivider />
            <MenuGroup>
              <MenuGroupHeader>Sort</MenuGroupHeader>
              <MenuItemRadio name="sort" value="name" persistOnClick>
                Name
              </MenuItemRadio>
              <MenuItemRadio name="sort" value="date" persistOnClick>
                Date
              </MenuItemRadio>
            </MenuGroup>
            <MenuDivider />
            <MenuGroup>
              <MenuGroupHeader>Preview settings</MenuGroupHeader>
              <MenuItemSwitch name="settings" value="preview">
                Preview explorer
              </MenuItemSwitch>
            </MenuGroup>
            <CurrentMenuState />
          </MenuList>
        </MenuPopover>
      </Menu>
      <Button type="button">After menu</Button>
      <output
        aria-label="Menu selection events"
        data-menu-open={String(open)}
        data-menu-open-event={openEvent}
        data-menu-change-count={changes}
        data-menu-change-name={lastChange.name}
        data-menu-change-items={JSON.stringify(lastChange.checkedItems)}
        data-menu-last-action={lastAction}
      >
        {JSON.stringify(checked)}
      </output>
    </div>
  );
}

export function MenuSelectionFlow({
  controlled = true,
  defaultOpen = false,
  onOpenChange,
  onCheckedValueChange,
}: {
  controlled?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: MenuProps['onOpenChange'];
  onCheckedValueChange?: MenuProps['onCheckedValueChange'];
}) {
  return (
    <MenuFocusgroupConsumer>
      <ReadyMenuSelectionFlow
        controlled={controlled}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        onCheckedValueChange={onCheckedValueChange}
      />
    </MenuFocusgroupConsumer>
  );
}

function ReadyMenuSubmenuFlow() {
  const [lastAction, setLastAction] = React.useState('none');
  const [open, setOpen] = React.useState(false);
  const [submenuOpen, setSubmenuOpen] = React.useState(false);
  return (
    <div className={styles.flow}>
      <div data-testid="menu-pointer-rest">Pointer rest</div>
      <Menu open={open} onOpenChange={(_event, data) => setOpen(data.open)}>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton type="button">Project navigation</MenuButton>
        </MenuTrigger>
        <MenuPopover data-testid="menu-root-surface">
          <MenuList>
            <MenuItem onClick={() => setLastAction('new')}>New file</MenuItem>
            <Menu
              hoverDelay={0}
              openOnHover={false}
              open={submenuOpen}
              onOpenChange={(_event, data) => setSubmenuOpen(data.open)}
            >
              <MenuTrigger disableButtonEnhancement>
                <MenuItem>Share project</MenuItem>
              </MenuTrigger>
              <MenuPopover data-testid="menu-submenu-surface">
                <MenuList>
                  <MenuItem onClick={() => setLastAction('copy-link')}>Copy link</MenuItem>
                  <MenuItem onClick={() => setLastAction('invite')}>Invite people</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
            <MenuItem onClick={() => setLastAction('archive')}>Archive</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Button type="button">After navigation</Button>
      <output
        aria-label="Menu navigation events"
        data-menu-root-open={String(open)}
        data-menu-submenu-open={String(submenuOpen)}
        data-menu-last-action={lastAction}
      >
        {lastAction}
      </output>
    </div>
  );
}

export function MenuSubmenuFlow() {
  return (
    <MenuFocusgroupConsumer>
      <ReadyMenuSubmenuFlow />
    </MenuFocusgroupConsumer>
  );
}

function ReadyMenuSplitFlow() {
  const [lastAction, setLastAction] = React.useState('none');
  return (
    <div className={styles.flow}>
      <div data-testid="menu-pointer-rest">Pointer rest</div>
      <Menu hasIcons hasCheckmarks>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton type="button">Open options</MenuButton>
        </MenuTrigger>
        <MenuPopover data-testid="menu-split-root-surface">
          <MenuList>
            <Menu hoverDelay={0} openOnHover={false}>
              <MenuSplitGroup aria-label="Open project choices">
                <MenuItem
                  aria-label="Open project"
                  icon={<MenuFixtureGlyph />}
                  subText="Use the default app"
                  onClick={() => setLastAction('default-app')}
                >
                  Open project
                </MenuItem>
                <MenuTrigger disableButtonEnhancement>
                  <MenuItem aria-label="Choose platform" />
                </MenuTrigger>
              </MenuSplitGroup>
              <MenuPopover data-testid="menu-split-submenu-surface">
                <MenuList>
                  <MenuItem onClick={() => setLastAction('browser')}>In browser</MenuItem>
                  <MenuItem onClick={() => setLastAction('desktop')}>In desktop app</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
            <MenuItem onClick={() => setLastAction('recent')}>Recent projects</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Button type="button">After split menu</Button>
      <output aria-label="Menu split events" data-menu-last-action={lastAction}>
        {lastAction}
      </output>
    </div>
  );
}

export function MenuSplitFlow() {
  return (
    <MenuFocusgroupConsumer>
      <ReadyMenuSplitFlow />
    </MenuFocusgroupConsumer>
  );
}

function ReadyMenuFormFlow() {
  const formRef = React.useRef<HTMLFormElement>(null);
  const submitRef = React.useRef<HTMLButtonElement>(null);
  const destinationId = React.useId();
  const [submitted, setSubmitted] = React.useState('none');
  const [submissions, setSubmissions] = React.useState(0);
  const [submitterName, setSubmitterName] = React.useState('');
  return (
    <form
      ref={formRef}
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        const native = event.nativeEvent;
        if (!(native instanceof SubmitEvent)) throw new Error('Expected native SubmitEvent');
        setSubmitted(JSON.stringify([...new FormData(event.currentTarget, native.submitter)]));
        setSubmitterName(
          native.submitter instanceof HTMLButtonElement ? native.submitter.value : '',
        );
        setSubmissions((count) => count + 1);
      }}
    >
      <div data-testid="menu-pointer-rest">Pointer rest</div>
      <label>
        Project name <input name="project" defaultValue="Orion" required />
      </label>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton type="button">Project form actions</MenuButton>
        </MenuTrigger>
        <MenuPopover data-testid="menu-form-surface">
          <MenuList>
            <MenuItem
              onClick={() => {
                if (!submitRef.current) throw new Error('Missing native submitter');
                formRef.current?.requestSubmit(submitRef.current);
              }}
            >
              Save project
            </MenuItem>
            <MenuItemLink href={`#${destinationId}`}>Project documentation</MenuItemLink>
            <MenuItemLink href={`#${destinationId}`} disabled>
              Restricted documentation
            </MenuItemLink>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Button as="button" ref={submitRef} type="submit" name="intent" value="save">
        Save directly
      </Button>
      <h3 id={destinationId}>Project documentation destination</h3>
      <output
        aria-label="Menu form events"
        data-menu-submissions={submissions}
        data-menu-submitter={submitterName}
      >
        {submitted}
      </output>
    </form>
  );
}

export function MenuFormFlow() {
  return (
    <MenuFocusgroupConsumer>
      <ReadyMenuFormFlow />
    </MenuFocusgroupConsumer>
  );
}

function ReadyMenuContextFlow() {
  const [open, setOpen] = React.useState(false);
  const [lastAction, setLastAction] = React.useState('none');
  return (
    <div className={styles.flow}>
      <p>
        Controlled context-menu alternative: the consumer prevents the native context menu and opens
        the current Menu anchored to its trigger. It does not use openOnContext or copy
        pointer-coordinate positioning logic.
      </p>
      <Menu open={open} onOpenChange={(_event, data) => setOpen(data.open)}>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            type="button"
            onContextMenu={(event) => {
              event.preventDefault();
              setOpen(true);
            }}
          >
            Project context actions
          </MenuButton>
        </MenuTrigger>
        <MenuPopover data-testid="menu-context-surface">
          <MenuList>
            <MenuItem onClick={() => setLastAction('copy-link')}>Copy project link</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Button type="button">Outside context menu</Button>
      <output
        aria-label="Menu context events"
        data-menu-open={String(open)}
        data-menu-last-action={lastAction}
      >
        {lastAction}
      </output>
    </div>
  );
}

export function MenuContextFlow() {
  return (
    <MenuFocusgroupConsumer>
      <ReadyMenuContextFlow />
    </MenuFocusgroupConsumer>
  );
}
