// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Button,
  ColorArea,
  ColorPicker,
  ColorSlider,
  Dropdown,
  Field,
  Input,
  Option,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tab,
  TabList,
  Text,
} from '@coreai-ds/react-components';
import { Options20Regular } from '@fluentui/react-icons';
import { tinycolor } from '@ctrl/tinycolor';
import { useThemeMode, type BrandPreference } from '../theme/ThemeProvider';
import { BRAND_STEPS, normalizeHex } from '../utils/BrandRamp.mjs';

const BRAND_LABELS: Record<BrandPreference, string> = {
  coreai: 'CoreAI purple',
  azure: 'Azure blue',
  custom: 'Custom theme',
};

type HsvColor = { h: number; s: number; v: number; a?: number };

function hexToHsv(hex: string): HsvColor {
  const { h, s, v } = tinycolor(hex).toHsv();
  return { h, s, v };
}

function CustomColorEditor() {
  const { customColor, setCustomColor, brandVariants } = useThemeMode();
  // Keep HSV locally so hue survives when saturation or brightness reach 0.
  const [hsv, setHsv] = React.useState<HsvColor>(() => hexToHsv(customColor));
  const [hexDraft, setHexDraft] = React.useState(customColor);

  React.useEffect(() => {
    setHexDraft(customColor);
    setHsv((current) =>
      normalizeHex(tinycolor(current).toHexString()) === customColor
        ? current
        : hexToHsv(customColor),
    );
  }, [customColor]);

  const commitHex = (value: string) => {
    const hex = normalizeHex(value);
    if (hex) setCustomColor(hex);
    else setHexDraft(customColor);
  };

  return (
    <div className="docsite-settings__custom" role="group" aria-label="Custom theme color">
      <ColorPicker
        className="docsite-settings__color-picker"
        color={hsv}
        onColorChange={(_event, data) => {
          setHsv(data.color);
          setCustomColor(tinycolor(data.color).toHexString());
        }}
      >
        <ColorArea
          className="docsite-settings__color-area"
          inputX={{ 'aria-label': 'Saturation' }}
          inputY={{ 'aria-label': 'Brightness' }}
        />
        <ColorSlider aria-label="Hue" />
      </ColorPicker>
      <Field label="Hex" size="small">
        <Input
          size="small"
          value={hexDraft}
          maxLength={7}
          spellCheck={false}
          contentBefore={
            <span
              className="docsite-settings__color-chip"
              style={{ background: customColor }}
              aria-hidden="true"
            />
          }
          onChange={(_event, data) => {
            setHexDraft(data.value);
            const hex = normalizeHex(data.value);
            if (hex && data.value.replace('#', '').length === 6) setCustomColor(hex);
          }}
          onBlur={(event) => commitHex(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitHex(event.currentTarget.value);
          }}
        />
      </Field>
      <div
        className="docsite-settings__ramp"
        aria-hidden="true"
        title="Generated brand ramp, 10 to 160"
      >
        {BRAND_STEPS.map((step) => (
          <span key={step} style={{ background: brandVariants[step] }} />
        ))}
      </div>
    </div>
  );
}

export function ThemeSwitcher({ isApplePlatform }: { isApplePlatform: boolean }) {
  const { preference, brand, setPreference, setBrand } = useThemeMode();
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
    ['Switch color mode', `${modifierSymbol}M`, `${modifier} M`],
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
          icon={<Options20Regular />}
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
        <div className="docsite-settings__appearance">
          <TabList
            aria-label="Color mode"
            className="docsite-settings__mode"
            appearance="elevated"
            size="small"
            selectedValue={preference}
            onTabSelect={(_event, data) => {
              if (data.value === 'light' || data.value === 'dark' || data.value === 'system') {
                setPreference(data.value);
              }
            }}
          >
            <Tab value="system">System</Tab>
            <Tab value="dark">Dark</Tab>
            <Tab value="light">Light</Tab>
          </TabList>
          <Field className="docsite-settings__brand-field" label="Theme">
            <Dropdown
              id="docsite-theme"
              className="docsite-settings__brand"
              size="medium"
              style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
              selectedOptions={[brand]}
              value={BRAND_LABELS[brand]}
              onOptionSelect={(_event, data) => {
                if (data.optionValue && data.optionValue in BRAND_LABELS) {
                  setBrand(data.optionValue as BrandPreference);
                }
              }}
            >
              <Option value="coreai">{BRAND_LABELS.coreai}</Option>
              <Option value="azure">{BRAND_LABELS.azure}</Option>
              <Option value="custom">{BRAND_LABELS.custom}</Option>
            </Dropdown>
          </Field>
          {brand === 'custom' && <CustomColorEditor />}
        </div>
        <Accordion className="docsite-settings__shortcuts" collapsible>
          <AccordionItem value="keyboard-shortcuts">
            <AccordionHeader expandIconPosition="end" size="small">
              Keyboard shortcuts
            </AccordionHeader>
            <AccordionPanel>
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
                        size="medium"
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
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </PopoverSurface>
    </Popover>
  );
}
