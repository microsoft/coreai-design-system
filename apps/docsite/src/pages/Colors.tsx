// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { azureBrandVariants, azureDarkTheme, azureLightTheme } from '@coreai-ds/react-components';
import { Card } from '@coreai-ds/react-components';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import {
  coreaiBrandVariants,
  coreaiDarkTheme,
  coreaiLightTheme,
  type CoreAITheme,
} from '@coreai-ds/react-components';
import { Tab, TabList, type SelectTabData, type SelectTabEvent } from '@coreai-ds/react-components';
import { Text } from '@coreai-ds/react-components';
import type { BrandVariants } from '@fluentui/react-components';
import { PageLayout } from '../components/PageLayout';
import { Section } from '../components/Section';
import { dataVizRows, type ColorRow } from '../data/content';
import { useThemeMode } from '../theme/ThemeProvider';

const brandSteps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160] as const;

type BrandId = 'coreai' | 'azure';

const brands = {
  coreai: {
    label: 'CoreAI theme',
    variants: coreaiBrandVariants,
    lightTheme: coreaiLightTheme,
    darkTheme: coreaiDarkTheme,
  },
  azure: {
    label: 'Azure theme',
    variants: azureBrandVariants,
    lightTheme: azureLightTheme,
    darkTheme: azureDarkTheme,
  },
} as const;

const surfaceTokens = [
  {
    name: 'Background 4',
    description: 'Shell and sidebar',
    token: 'colorNeutralBackground4',
  },
  {
    name: 'Background 3',
    description: 'Filled-darker areas',
    token: 'colorNeutralBackground3',
  },
  {
    name: 'Background 2',
    description: 'Elevated surfaces, cards',
    token: 'colorNeutralBackground2',
  },
  {
    name: 'Background 1',
    description: 'Page content',
    token: 'colorNeutralBackground1',
  },
] as const;

const textTokens = [
  {
    name: 'Foreground 1',
    description: 'Headings, high-emphasis',
    token: 'colorNeutralForeground1',
  },
  {
    name: 'Foreground 2',
    description: 'Body text, default content',
    token: 'colorNeutralForeground2',
  },
  {
    name: 'Foreground 3',
    description: 'Timestamps, metadata',
    token: 'colorNeutralForeground3',
  },
  {
    name: 'Foreground 4',
    description: 'Disabled, placeholder',
    token: 'colorNeutralForeground4',
  },
  {
    name: 'Brand Foreground',
    description: 'Brand-colored emphasis',
    token: 'colorBrandForeground1',
  },
  {
    name: 'Brand Link',
    description: 'Interactive link text',
    token: 'colorBrandForegroundLink',
  },
] as const;

function getColorRows(
  theme: CoreAITheme,
  rows: ReadonlyArray<{
    name: string;
    description: string;
    token: keyof CoreAITheme;
  }>,
): ColorRow[] {
  return rows.map(({ name, description, token }) => ({
    name,
    description,
    token,
    value: String(theme[token]),
  }));
}

function getBrandStep(variants: BrandVariants, value: string) {
  return brandSteps.find((step) => variants[step] === value);
}

function ColorScale({ variants }: { variants: BrandVariants }) {
  return (
    <div className="color-scale">
      <div className="color-scale__bar">
        {brandSteps.map((step) => (
          <span
            key={step}
            style={{ background: variants[step] }}
            data-copy={variants[step]}
            title={`brandVariants[${step}] · ${variants[step]}`}
          />
        ))}
      </div>
      <div className="color-scale__labels">
        {brandSteps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
    </div>
  );
}

function PrimaryCards({ theme, variants }: { theme: CoreAITheme; variants: BrandVariants }) {
  const backgroundStep = getBrandStep(variants, theme.colorBrandBackground);
  const foregroundStep = getBrandStep(variants, theme.colorBrandForeground1);

  return (
    <div className="primary-grid">
      <div
        className="primary-card"
        style={{
          background: theme.colorBrandBackground,
          color: theme.colorNeutralForegroundOnBrand,
        }}
        data-copy="colorBrandBackground"
      >
        <div>
          <Text className="primary-card__title" size={400} weight="semibold">
            Brand as background
          </Text>
          <Text className="primary-card__meta" size={200}>
            {backgroundStep ? `brandVariants[${backgroundStep}] · ` : ''}
            colorBrandBackground
          </Text>
        </div>
        <Text className="primary-card__meta" font="monospace" size={200}>
          {theme.colorBrandBackground}
        </Text>
      </div>
      <div
        className="primary-card primary-card--foreground"
        style={{ background: theme.colorNeutralBackground2 }}
        data-copy="colorBrandForeground1"
      >
        <div>
          <Text
            className="primary-card__title"
            size={400}
            weight="semibold"
            style={{ color: theme.colorBrandForeground1 }}
          >
            Brand as foreground
          </Text>
          <Text className="primary-card__meta" size={200}>
            {foregroundStep ? `brandVariants[${foregroundStep}] · ` : ''}
            colorBrandForeground1
          </Text>
        </div>
        <Text className="primary-card__meta" font="monospace" size={200}>
          {theme.colorBrandForeground1}
        </Text>
      </div>
    </div>
  );
}

function SurfaceTable({ rows }: { rows: ColorRow[] }) {
  return (
    <div className="stack-table stack-table--filled">
      {rows.map((r) => (
        <div
          key={r.token}
          className="stack-row"
          data-copy={r.token}
          style={{ background: r.value }}
        >
          <div className="stack-row__swatch" style={{ background: r.value }} />
          <div className="stack-row__main">
            <Text className="stack-row__title" weight="semibold">
              {r.name}
            </Text>
            <Text className="stack-row__desc" foreground={2}>
              {r.description}
            </Text>
          </div>
          <div className="stack-row__meta">
            <Text font="monospace" size={200}>
              {r.token}
            </Text>
            <Text font="monospace" size={200}>
              {r.value}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextTable({ rows }: { rows: ColorRow[] }) {
  return (
    <div className="stack-table stack-table--outline">
      {rows.map((r) => (
        <div key={r.token} className="stack-row" data-copy={r.token}>
          <div
            className="stack-row__swatch stack-row__swatch--text"
            style={{ background: r.value }}
          />
          <div className="stack-row__main">
            <Text className="stack-row__title" weight="semibold">
              {r.name}
            </Text>
            <Text className="stack-row__desc" foreground={2}>
              {r.description}
            </Text>
          </div>
          <div className="stack-row__meta">
            <Text font="monospace" size={200}>
              {r.token}
            </Text>
            <Text font="monospace" size={200}>
              {r.value}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}

function DataVizTable() {
  return (
    <div className="stack-table stack-table--outline">
      {dataVizRows.map((r) => (
        <div key={r.slot} className="stack-row" data-copy={r.value}>
          <div className="dataviz-chip" style={{ background: r.value }}>
            <span>{r.slot}</span>
          </div>
          <div className="stack-row__main">
            <Text className="stack-row__title" weight="semibold">
              {r.label}
            </Text>
            <Text className="stack-row__desc" foreground={2}>
              {r.description}
            </Text>
          </div>
          <Text className="stack-row__hex" font="monospace">
            {r.value}
          </Text>
        </div>
      ))}
    </div>
  );
}

function RatioCards({ theme }: { theme: CoreAITheme }) {
  return (
    <div className="ratio-grid">
      <div className="ratio-column">
        <Card className="ratio-card">
          <Text className="ratio-card__value" size={700} weight="semibold">
            95%
          </Text>
          <Text className="ratio-card__label" size={200} foreground={2}>
            Neutral
          </Text>
        </Card>
        <div className="ratio-desc">
          <ul>
            <li>Used for backgrounds, controls, and containers</li>
            <li>Provides clarity, accessibility, and reduces visual fatigue</li>
          </ul>
        </div>
      </div>
      <div className="ratio-column">
        <Card
          className="ratio-card ratio-card--brand"
          style={{ background: theme.colorBrandBackground2 }}
        >
          <Text className="ratio-card__value" size={700} weight="semibold">
            5%
          </Text>
          <Text className="ratio-card__label" size={200} foreground={2}>
            Brand
          </Text>
        </Card>
        <div className="ratio-desc">
          <ul>
            <li>Used for primary actions, key highlights, links, and visual anchors</li>
            <li>Creates recognition and reinforces our brand voice</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PassIcon() {
  return (
    <svg
      className="status-pass-icon"
      width="14"
      height="14"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm3.36 4.65c.17.17.2.44.06.63l-.06.07-4 4a.5.5 0 0 1-.64.07l-.07-.06-2-2a.5.5 0 0 1 .63-.77l.07.06L9 11.3l3.65-3.65c.2-.2.51-.2.7 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
function FailIcon() {
  return (
    <svg
      className="status-fail-icon"
      width="14"
      height="14"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM7.8 7.11l.08.06L10 9.3l2.12-2.12a.5.5 0 0 1 .64-.06l.07.06c.17.18.2.44.06.64l-.06.07L10.7 10l2.12 2.12c.17.17.2.44.06.64l-.06.07a.5.5 0 0 1-.64.06l-.07-.06L10 10.7l-2.12 2.12a.5.5 0 0 1-.64.06l-.07-.06a.5.5 0 0 1-.06-.64l.06-.07L9.3 10 7.17 7.88a.5.5 0 0 1-.06-.64l.06-.07a.5.5 0 0 1 .64-.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AccessibilityCards() {
  const bigText = {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: '24px',
  } as const;
  return (
    <>
      <div className="card-grid theme-dark-only">
        <Card className="accessibility-card" appearance="outline">
          <div className="accessibility-card__header">
            <Text className="accessibility-card__ratio" size={500} weight="bold">
              4.5:1
            </Text>
            <Text className="accessibility-card__label" size={200} foreground={2}>
              Normal text
            </Text>
          </div>
          <div className="accessibility-pills">
            <div className="accessibility-pill">
              <PassIcon />
              <span style={{ color: '#EDEDED' }}>Pass: #EDEDED on Grey 12</span>
            </div>
            <div className="accessibility-pill">
              <FailIcon />
              <span style={{ color: '#555555' }}>Fail: #555555 on Grey 12</span>
            </div>
          </div>
        </Card>
        <Card className="accessibility-card" appearance="outline">
          <div className="accessibility-card__header">
            <Text className="accessibility-card__ratio" size={500} weight="bold">
              3:1
            </Text>
            <Text className="accessibility-card__label" size={200} foreground={2}>
              Large text and UI
            </Text>
          </div>
          <div className="accessibility-pills">
            <div className="accessibility-pill">
              <PassIcon />
              <span style={{ color: '#808080', ...bigText }}>Pass: #808080 on Grey 12</span>
            </div>
            <div className="accessibility-pill">
              <FailIcon />
              <span style={{ color: '#3D3D3D', ...bigText }}>Fail: #3D3D3D on Grey 12</span>
            </div>
          </div>
        </Card>
      </div>
      <div className="card-grid theme-light-only">
        <Card className="accessibility-card" appearance="outline" style={{ background: '#FFFFFF' }}>
          <div className="accessibility-card__header">
            <Text className="accessibility-card__ratio" size={500} weight="bold">
              4.5:1
            </Text>
            <Text className="accessibility-card__label" size={200} foreground={2}>
              Normal text
            </Text>
          </div>
          <div className="accessibility-pills">
            <div className="accessibility-pill" style={{ background: '#F5F5F5' }}>
              <PassIcon />
              <span style={{ color: '#242424' }}>Pass: #242424 on White</span>
            </div>
            <div className="accessibility-pill" style={{ background: '#F5F5F5' }}>
              <FailIcon />
              <span style={{ color: '#BDBDBD' }}>Fail: #BDBDBD on White</span>
            </div>
          </div>
        </Card>
        <Card className="accessibility-card" appearance="outline" style={{ background: '#FFFFFF' }}>
          <div className="accessibility-card__header">
            <Text className="accessibility-card__ratio" size={500} weight="bold">
              3:1
            </Text>
            <Text className="accessibility-card__label" size={200} foreground={2}>
              Large text and UI
            </Text>
          </div>
          <div className="accessibility-pills">
            <div className="accessibility-pill" style={{ background: '#F5F5F5' }}>
              <PassIcon />
              <span style={{ color: '#808080', ...bigText }}>Pass: #808080 on White</span>
            </div>
            <div className="accessibility-pill" style={{ background: '#F5F5F5' }}>
              <FailIcon />
              <span style={{ color: '#D4D4D4', ...bigText }}>Fail: #D4D4D4 on White</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export function Colors() {
  const { mode } = useThemeMode();
  const [brandId, setBrandId] = React.useState<BrandId>('coreai');
  const brand = brands[brandId];
  const theme = mode === 'dark' ? brand.darkTheme : brand.lightTheme;
  const surfaceRows = getColorRows(theme, surfaceTokens);
  const textRows = getColorRows(theme, textTokens);

  const onBrandSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setBrandId(data.value as BrandId);
  };

  return (
    <PageLayout id="colors">
      <CoreAIFluentProvider
        className="colors-theme-scope"
        theme={theme}
        style={{ background: 'transparent' }}
      >
        <TabList
          className="colors-theme-tabs"
          appearance="elevated"
          selectedValue={brandId}
          onTabSelect={onBrandSelect}
        >
          {Object.entries(brands).map(([id, entry]) => (
            <Tab key={id} value={id}>
              {entry.label}
            </Tab>
          ))}
        </TabList>

        <div className="colors-theme-content">
          <Section title="Brand Color">
            <PrimaryCards theme={theme} variants={brand.variants} />
            <ColorScale variants={brand.variants} />
          </Section>
          <Section title="Surface Colors">
            <SurfaceTable rows={surfaceRows} />
          </Section>
          <Section title="Text Colors">
            <TextTable rows={textRows} />
          </Section>
          <Section title="Data Visualization">
            <DataVizTable />
          </Section>
          <Section title="Color Usage Balance">
            <RatioCards theme={theme} />
          </Section>
          <Section title="Accessibility">
            <AccessibilityCards />
          </Section>
        </div>
      </CoreAIFluentProvider>
    </PageLayout>
  );
}
