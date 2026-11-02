// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Card,
  Tab,
  TabList,
  Text,
  coreaiBrandVariants,
  azureBrandVariants,
  coreaiLightTheme,
  coreaiDarkTheme,
  azureLightTheme,
  azureDarkTheme,
} from '@coreai-ds/react-components';
import { foundationData } from 'virtual:reference-foundation-data';
import { ExternalIcon } from '../components/Icons';
import { useThemeMode } from '../theme/ThemeProvider';
import type { PagePresentation } from './PagePresentation';

export interface PageWidgetProps {
  sourceHtml: string;
  model: PagePresentation;
}

function ColorsView({ sourceHtml }: PageWidgetProps) {
  const { mode } = useThemeMode();
  const [brandHeading, semanticHeading] = React.useMemo(
    () => [...new DOMParser().parseFromString(sourceHtml, 'text/html').querySelectorAll('h3')],
    [sourceHtml],
  );
  const [brandId, setBrandId] = React.useState<'coreai' | 'azure'>('coreai');
  if (!brandHeading || !semanticHeading) throw new Error('Missing canonical color headings.');
  const brands = {
    coreai: {
      label: 'CoreAI theme',
      variants: coreaiBrandVariants,
      light: coreaiLightTheme,
      dark: coreaiDarkTheme,
    },
    azure: {
      label: 'Azure theme',
      variants: azureBrandVariants,
      light: azureLightTheme,
      dark: azureDarkTheme,
    },
  };
  const brand = brands[brandId];
  const theme = brand[mode];
  const steps = Object.entries(brand.variants);
  const surfaces = foundationData.colors.filter((row) =>
    row.token.startsWith('colorNeutralBackground'),
  );
  const foregrounds = foundationData.colors.filter(
    (row) =>
      row.token.startsWith('colorNeutralForeground') ||
      row.token.startsWith('colorBrandForeground'),
  );
  function rows(items: typeof surfaces, filled: boolean) {
    return (
      <div
        className={`stack-table ${filled ? 'stack-table--filled' : 'stack-table--outline'} reference-token-stack`}
      >
        {items.map((row) => (
          <button
            type="button"
            className="stack-row"
            key={row.token}
            data-copy={row.token}
            aria-label={`Copy ${row.token}`}
            style={filled ? { background: theme[row.token] } : undefined}
          >
            <span
              className="stack-row__swatch"
              style={{ background: theme[row.token] }}
              aria-hidden="true"
            />
            <span className="stack-row__main">
              <Text weight="semibold" foreground={1}>
                {row.name}
              </Text>
              <Text foreground={2}>{row.description}</Text>
            </span>
            <span className="stack-row__meta">
              <Text font="monospace" size={200} foreground={3}>
                {row.token}
              </Text>
              <Text font="monospace" size={200} foreground={3} data-token-value={row.token}>
                {theme[row.token]}
              </Text>
            </span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="reference-color-view">
      <TabList
        aria-label="Reference brand"
        appearance="elevated"
        selectedValue={brandId}
        onTabSelect={(_event, data) => {
          if (data.value === 'coreai' || data.value === 'azure') setBrandId(data.value);
        }}
      >
        {Object.entries(brands).map(([id, entry]) => (
          <Tab key={id} value={id}>
            {entry.label}
          </Tab>
        ))}
      </TabList>
      <Text as="h3" preset="heading3" id={brandHeading.id} foreground={1}>
        {brandHeading.textContent}
      </Text>
      <div className="primary-grid">
        <button
          type="button"
          className="primary-card"
          data-copy="colorBrandBackground"
          style={{
            background: theme.colorBrandBackground,
            color: theme.colorNeutralForegroundOnBrand,
          }}
        >
          <div>
            <Text className="primary-card__title" size={400} weight="semibold">
              Brand as background
            </Text>
            <Text className="primary-card__meta" size={200}>
              colorBrandBackground
            </Text>
          </div>
          <Text
            className="primary-card__meta"
            font="monospace"
            size={200}
            data-token-value="colorBrandBackground"
          >
            {theme.colorBrandBackground}
          </Text>
        </button>
        <button
          type="button"
          className="primary-card primary-card--foreground"
          data-copy="colorBrandForeground1"
          style={{ background: theme.colorNeutralBackground2 }}
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
              colorBrandForeground1
            </Text>
          </div>
          <Text
            className="primary-card__meta"
            font="monospace"
            size={200}
            data-token-value="colorBrandForeground1"
          >
            {theme.colorBrandForeground1}
          </Text>
        </button>
      </div>
      <div className="color-scale">
        <div className="color-scale__bar">
          {steps.map(([step, color]) => (
            <button
              type="button"
              key={step}
              style={{ background: color }}
              data-copy={color}
              aria-label={`Copy brand step ${step}: ${color}`}
              title={`brandVariants[${step}] · ${color}`}
            />
          ))}
        </div>
        <div className="color-scale__labels">
          {steps.map(([step]) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      </div>
      <section id={semanticHeading.id} aria-label={semanticHeading.textContent ?? undefined}>
        <Text as="h3" preset="heading3" foreground={1}>
          Surface colors
        </Text>
        {rows(surfaces, true)}
      </section>
      <section>
        <Text as="h3" preset="heading3" foreground={1}>
          Text colors
        </Text>
        {rows(foregrounds, false)}
      </section>
    </div>
  );
}

function DataVisualizationView() {
  return (
    <div className="stack-table stack-table--outline reference-token-stack">
      {foundationData.dataViz.map((row) => (
        <button
          type="button"
          key={row.slot}
          className="stack-row"
          data-copy={row.value}
          aria-label={`Copy ${row.label}: ${row.value}`}
        >
          <span className="dataviz-chip" style={{ background: row.value }} aria-hidden="true">
            {row.slot}
          </span>
          <span className="stack-row__main">
            <Text weight="semibold" foreground={1}>
              {row.label}
            </Text>
            <Text foreground={2}>{row.description}</Text>
          </span>
          <Text font="monospace" className="stack-row__hex" foreground={3}>
            {row.value}
          </Text>
        </button>
      ))}
    </div>
  );
}

function FontFamiliesView() {
  return (
    <div className="card-grid">
      {foundationData.fonts.map((font) => (
        <a
          className="font-card-link"
          key={font.token}
          href={font.download}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Card className="font-card" appearance="outline">
            <ExternalIcon className="font-card__external" />
            <span className="font-card__sample">
              <Text font={font.variant} size={800} foreground={1}>
                {font.sample}
              </Text>
              <Text
                className="font-card__sample-suffix"
                font={font.variant}
                size={800}
                foreground={4}
              >
                {font.suffix}
              </Text>
            </span>
            <div className="font-card__details">
              <Text className="font-card__description" size={200} foreground={3}>
                {font.description}
              </Text>
              <Text className="font-card__token" font="monospace" size={100} foreground={4}>
                {font.token}
              </Text>
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
}

function TypographyView() {
  return (
    <div className="type-table reference-type-table">
      <div className="type-table__head">
        <Text size={200} weight="semibold">
          Heading / strong
        </Text>
        <Text size={200} weight="semibold">
          Regular
        </Text>
        <Text size={200} weight="semibold">
          Corresponding Fluent UI
        </Text>
        <Text size={200} weight="semibold">
          Usage
        </Text>
      </div>
      {foundationData.typography.map((row) => (
        <button
          type="button"
          key={row.strongPreset}
          className="type-table__row"
          data-copy={
            row.regularPreset ? `${row.strongPreset} / ${row.regularPreset}` : row.strongPreset
          }
        >
          <Text
            className="type-table__example"
            data-type-preset={row.strongPreset}
            preset={row.strongPreset}
            foreground={1}
          >
            {row.strongLabel}
          </Text>
          {row.regularPreset ? (
            <Text className="type-table__example" preset={row.regularPreset} foreground={1}>
              {row.regularLabel}
            </Text>
          ) : (
            <span aria-hidden="true" />
          )}
          <Text className="type-table__preset" font="monospace" size={100} foreground={3}>
            {row.fluent}
          </Text>
          <Text className="type-table__usage" foreground={2}>
            {row.usage}
          </Text>
        </button>
      ))}
    </div>
  );
}

function MaterialsView({ sourceHtml }: PageWidgetProps) {
  const { mode } = useThemeMode();
  const images = React.useMemo(
    () => [...new DOMParser().parseFromString(sourceHtml, 'text/html').querySelectorAll('img')],
    [sourceHtml],
  );
  const image = images.find((candidate) => candidate.getAttribute('src')?.includes(`-${mode}.png`));
  if (!image) throw new Error(`Missing ${mode} materials diagram.`);
  return (
    <div className="theme-crossfade">
      <img
        className="materials-hero"
        src={image.getAttribute('src') ?? ''}
        alt={image.alt}
        width={800}
        height={452}
      />
    </div>
  );
}

export const foundationViews: Record<string, React.ComponentType<PageWidgetProps>> = {
  colors: ColorsView,
  'data-visualization': DataVisualizationView,
  'font-families': FontFamiliesView,
  typography: TypographyView,
  materials: MaterialsView,
};
