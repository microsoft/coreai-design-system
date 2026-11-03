// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Card,
  CoreAIFluentProvider,
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
import { Section } from '../components/Section';
import { useThemeMode } from '../theme/ThemeProvider';
import type { PagePresentation } from './PagePresentation';

export interface PageWidgetProps {
  sourceHtml: string;
  model: PagePresentation;
}

const brandSteps = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160,
] as const;

const brands = {
  coreai: {
    variants: coreaiBrandVariants,
    light: coreaiLightTheme,
    dark: coreaiDarkTheme,
  },
  azure: {
    variants: azureBrandVariants,
    light: azureLightTheme,
    dark: azureDarkTheme,
  },
} as const;

function sourceDocument(sourceHtml: string) {
  return new DOMParser().parseFromString(sourceHtml, 'text/html');
}

function sourceHeading(sourceHtml: string, fallback: string) {
  return sourceDocument(sourceHtml).querySelector('h2')?.textContent?.trim() || fallback;
}

function getBrandStep(variants: (typeof brands)['coreai']['variants'], value: string) {
  return brandSteps.find((step) => variants[step] === value);
}

function PrimaryCards({
  theme,
  variants,
}: {
  theme: (typeof brands)['coreai']['light'];
  variants: (typeof brands)['coreai']['variants'];
}) {
  const backgroundStep = getBrandStep(variants, theme.colorBrandBackground);
  const foregroundStep = getBrandStep(variants, theme.colorBrandForeground1);

  return (
    <div className="primary-grid">
      <div
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
            {backgroundStep ? `brandVariants[${backgroundStep}] · ` : ''}
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
      </div>
      <div
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
            {foregroundStep ? `brandVariants[${foregroundStep}] · ` : ''}
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
      </div>
    </div>
  );
}

function ColorScale({ variants }: { variants: (typeof brands)['coreai']['variants'] }) {
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

function ColorsView() {
  const { mode, brand: brandId } = useThemeMode();
  const brand = brands[brandId];
  const theme = brand[mode];
  const surfaces = foundationData.colors.filter((row) =>
    row.token.startsWith('colorNeutralBackground'),
  );
  const foregrounds = foundationData.colors.filter(
    (row) =>
      (row.token.startsWith('colorNeutralForeground') &&
        row.token !== 'colorNeutralForegroundOnBrand') ||
      row.token.startsWith('colorBrandForeground'),
  );

  function rows(items: typeof surfaces, filled: boolean) {
    return (
      <div
        className={`stack-table ${filled ? 'stack-table--filled' : 'stack-table--outline'} reference-token-stack`}
      >
        {items.map((row) => (
          <div
            className="stack-row"
            key={row.token}
            data-copy={row.token}
            style={filled ? { background: theme[row.token] } : undefined}
          >
            <span
              className={`stack-row__swatch${filled ? '' : ' stack-row__swatch--text'}`}
              style={{ background: theme[row.token] }}
              aria-hidden="true"
            />
            <span className="stack-row__main">
              <Text className="stack-row__title" weight="semibold" foreground={1}>
                {row.name}
              </Text>
              <Text className="stack-row__desc" foreground={2}>
                {row.description}
              </Text>
            </span>
            <span className="stack-row__meta">
              <Text font="monospace" size={200} foreground={3}>
                {row.token}
              </Text>
              <Text font="monospace" size={200} foreground={3} data-token-value={row.token}>
                {theme[row.token]}
              </Text>
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <CoreAIFluentProvider
      className="colors-theme-scope reference-color-view"
      theme={theme}
      style={{ background: 'transparent' }}
    >
      <div className="colors-theme-content">
        <Section title="Brand Color">
          <PrimaryCards theme={theme} variants={brand.variants} />
          <ColorScale variants={brand.variants} />
        </Section>
        <Section title="Surface Colors">{rows(surfaces, true)}</Section>
        <Section title="Text Colors">{rows(foregrounds, false)}</Section>
      </div>
    </CoreAIFluentProvider>
  );
}

function DataVisualizationView({ sourceHtml }: PageWidgetProps) {
  return (
    <Section title={sourceHeading(sourceHtml, 'Data Visualization')}>
      <div className="stack-table stack-table--outline reference-token-stack">
        {foundationData.dataViz.map((row) => (
          <div
            key={row.slot}
            className="stack-row"
            data-copy={row.value}
          >
            <div className="dataviz-chip" style={{ background: row.value }}>
              <span>{row.slot}</span>
            </div>
            <span className="stack-row__main">
              <Text className="stack-row__title" weight="semibold" foreground={1}>
                {row.label}
              </Text>
              <Text className="stack-row__desc" foreground={2}>
                {row.description}
              </Text>
            </span>
            <Text font="monospace" className="stack-row__hex">
              {row.value}
            </Text>
          </div>
        ))}
      </div>
    </Section>
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

interface AccessibilityExample {
  context: string;
  pass: string;
  fail: string;
}

function AccessibilityCard({
  ratio,
  label,
  example,
  light,
}: {
  ratio: string;
  label: string;
  example: AccessibilityExample;
  light: boolean;
}) {
  const large = label.startsWith('Large');
  const background = light ? '#F5F5F5' : undefined;
  const surface = light ? 'White' : 'Grey 12';
  const textStyle = large
    ? {
        fontSize: '20px',
        fontWeight: 600,
        lineHeight: '24px',
      }
    : undefined;
  return (
    <Card
      className="accessibility-card"
      appearance="outline"
      style={light ? { background: '#FFFFFF' } : undefined}
    >
      <div className="accessibility-card__header">
        <Text className="accessibility-card__ratio" size={500} weight="bold">
          {ratio}
        </Text>
        <Text className="accessibility-card__label" size={200} foreground={2}>
          {label}
        </Text>
      </div>
      <div className="accessibility-pills">
        <div className="accessibility-pill" style={background ? { background } : undefined}>
          <PassIcon />
          <span style={{ color: example.pass, ...textStyle }}>
            Pass: {example.pass} on {surface}
          </span>
        </div>
        <div className="accessibility-pill" style={background ? { background } : undefined}>
          <FailIcon />
          <span style={{ color: example.fail, ...textStyle }}>
            Fail: {example.fail} on {surface}
          </span>
        </div>
      </div>
    </Card>
  );
}

function ColorAccessibilityView({ sourceHtml }: PageWidgetProps) {
  const document = React.useMemo(() => sourceDocument(sourceHtml), [sourceHtml]);
  const rows = [...document.querySelectorAll('tbody tr')].map((row) => {
    const cells = [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim() ?? '');
    return { context: cells[0], pass: cells[1], fail: cells[2] };
  });
  if (rows.length !== 4) throw new Error('Missing canonical color accessibility examples.');
  return (
    <Section title={sourceHeading(sourceHtml, 'Accessibility requirements')}>
      <div className="card-grid theme-dark-only">
        <AccessibilityCard
          ratio="4.5:1"
          label="Normal text"
          example={rows[0]}
          light={false}
        />
        <AccessibilityCard
          ratio="3:1"
          label="Large text and UI"
          example={rows[1]}
          light={false}
        />
      </div>
      <div className="card-grid theme-light-only">
        <AccessibilityCard ratio="4.5:1" label="Normal text" example={rows[2]} light />
        <AccessibilityCard ratio="3:1" label="Large text and UI" example={rows[3]} light />
      </div>
    </Section>
  );
}

function FontFamiliesView({ sourceHtml }: PageWidgetProps) {
  const document = React.useMemo(() => sourceDocument(sourceHtml), [sourceHtml]);
  const description = document.querySelector('p')?.textContent?.trim();
  return (
    <Section title={sourceHeading(sourceHtml, 'Font families')}>
      {description ? <p>{description}</p> : null}
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
    </Section>
  );
}

function PairedLabel({ children, separator = '/' }: { children: string; separator?: string }) {
  const [first, second] = children.split(' / ');
  if (!second) return first;
  return (
    <>
      {first}
      <span className="type-table__separator" aria-hidden="true">
        {separator}
      </span>
      {second}
    </>
  );
}

function TypographyView({ sourceHtml }: PageWidgetProps) {
  return (
    <Section title={sourceHeading(sourceHtml, 'Type scale')}>
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
          <div
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
              <PairedLabel>{row.strongLabel}</PairedLabel>
            </Text>
            {row.regularPreset ? (
              <Text className="type-table__example" preset={row.regularPreset} foreground={1}>
                {row.regularLabel}
              </Text>
            ) : (
              <span aria-hidden="true" />
            )}
            <Text className="type-table__preset" font="monospace" size={100} foreground={3}>
              <PairedLabel separator="&">{row.fluent}</PairedLabel>
            </Text>
            <Text className="type-table__usage" foreground={2}>
              {row.usage}
            </Text>
          </div>
        ))}
      </div>
    </Section>
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
  'color-accessibility': ColorAccessibilityView,
  'font-families': FontFamiliesView,
  typography: TypographyView,
  materials: MaterialsView,
};
