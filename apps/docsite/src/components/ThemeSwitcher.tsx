// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Badge,
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tab,
  TabList,
  Text,
} from '@coreai-ds/react-components';
import { Settings20Regular } from '@fluentui/react-icons';
import { useThemeMode } from '../theme/ThemeProvider';

export function ThemeSwitcher({ isApplePlatform }: { isApplePlatform: boolean }) {
  const { preference, setPreference } = useThemeMode();
  const [open, setOpen] = React.useState(false);
  const modifier = isApplePlatform ? 'Option' : 'Alt';
  const primary = isApplePlatform ? 'Cmd' : 'Ctrl';
  const modifierSymbol = isApplePlatform ? '⌥' : '⎇';
  const primarySymbol = isApplePlatform ? '⌘' : '⌃';
  const shortcuts = [
    ['Show/hide navigation', `${modifierSymbol}S`, `${modifier} S`],
    ['Previous page', `${modifierSymbol}↑`, `${modifier} Up arrow`],
    ['Next page', `${modifierSymbol}↓`, `${modifier} Down arrow`],
    ['Collapse all sections', `${primarySymbol}⇧↑`, `${primary} Shift Up arrow`],
    ['Expand all sections', `${primarySymbol}⇧↓`, `${primary} Shift Down arrow`],
    ['Switch theme', `${modifierSymbol}M`, `${modifier} M`],
    ['Search navigation', `${primarySymbol}K`, `${primary} K`],
  ];

  return (
    <Popover
      trapFocus
      positioning="below-start"
      open={open}
      onOpenChange={(_event, data) => setOpen(data.open)}
    >
      <PopoverTrigger disableButtonEnhancement>
        <Button
          shape="rounded"
          appearance="subtle"
          icon={<Settings20Regular />}
          aria-label="Settings"
          title="Settings"
        />
      </PopoverTrigger>
      <PopoverSurface
        className="docsite-settings"
        aria-label="Settings"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            setOpen(false);
          }
        }}
      >
        <TabList
          aria-label="Color mode"
          className="docsite-settings__mode"
          appearance="elevated"
          size="small"
          selectedValue={preference}
          onTabSelect={(_event, data) => {
            if (data.value === 'light' || data.value === 'dark') {
              setPreference(data.value);
            }
          }}
        >
          <Tab value="dark">Dark</Tab>
          <Tab value="light">Light</Tab>
        </TabList>
        <section className="docsite-settings__shortcuts" aria-label="Keyboard shortcuts">
          <dl className="docsite-settings__shortcut-list">
            {shortcuts.map(([label, keys, accessibleKeys]) => (
              <div className="docsite-settings__shortcut" key={label}>
                <dt>
                  <Text size={200} foreground={2}>
                    {label}
                  </Text>
                </dt>
                <dd>
                  <Badge
                    appearance="tint"
                    color="subtle"
                    shape="rounded"
                    size="large"
                    title={accessibleKeys}
                  >
                    <span className="docsite-settings__keys" aria-hidden="true">
                      {[...keys].map((key, index) => (
                        <span
                          className={
                            /^[A-Z]$/.test(key)
                              ? 'docsite-settings__key-letter'
                              : 'docsite-settings__key-symbol'
                          }
                          key={index}
                        >
                          {key}
                        </span>
                      ))}
                    </span>
                    <span className="sr-only">{accessibleKeys}</span>
                  </Badge>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </PopoverSurface>
    </Popover>
  );
}
