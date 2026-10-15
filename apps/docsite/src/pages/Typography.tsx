// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Card, Link, Text, type TextProps } from '@coreai-ds/react-components';
import { PageLayout } from '../components/PageLayout';
import { Section } from '../components/Section';
import { ExternalIcon } from '../components/Icons';
import { typographyRows, siteLinks } from '../data/content';

function FontCard({
  font = 'base',
  sample,
  sampleSuffix,
  token,
  description,
}: {
  font?: TextProps['font'];
  sample: string;
  sampleSuffix: string;
  token: string;
  description: string;
}) {
  return (
    <a className="font-card-link" href={siteLinks.fontDownload} target="_blank" rel="noopener">
      <Card className="font-card" appearance="outline">
        <ExternalIcon className="font-card__external" />
        <span className="font-card__sample">
          <Text font={font} size={800}>
            {sample}
          </Text>
          <Text className="font-card__sample-suffix" font={font} size={800} foreground={4}>
            {sampleSuffix}
          </Text>
        </span>
        <div className="font-card__details">
          <Text className="font-card__description" font="base" size={200} foreground={3}>
            {description}
          </Text>
          <Text className="font-card__token" font="monospace" size={100} foreground={4}>
            {token}
          </Text>
        </div>
      </Card>
    </a>
  );
}

function PairedLabel({ children, separator = '/' }: { children: string; separator?: string }) {
  const [first, second] = children.split(' / ');

  if (!second) {
    return first;
  }

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

export function Typography() {
  return (
    <PageLayout id="typography">
      <Section title="Font families">
        <p>
          Aptos and Aptos Mono are the preferred CoreAI typefaces. This site uses them when
          installed on your device and otherwise uses system fonts. Font files are not included in
          this repository or the npm package.
        </p>
        <div className="card-grid">
          <FontCard
            sample="Aptos Sans"
            sampleSuffix="/ ABCD"
            token="fontFamilyBase"
            description="Primary typeface for UI text, labels, and content."
          />
          <FontCard
            font="monospace"
            sample="Aptos Mono"
            sampleSuffix="/0123"
            token="fontFamilyMonospace"
            description="Monospace typeface for code, data, and technical content."
          />
        </div>
      </Section>
      <Section title="Type scale">
        <div className="type-table">
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
          {typographyRows.map((row) => (
            <div
              key={row.strongPreset}
              className="type-table__row"
              data-copy={
                row.regularPreset ? `${row.strongPreset} / ${row.regularPreset}` : row.strongPreset
              }
            >
              <Text className="type-table__example" preset={row.strongPreset} foreground={1}>
                <PairedLabel>{row.strongLabel}</PairedLabel>
              </Text>
              {row.regularPreset ? (
                <Text className="type-table__example" preset={row.regularPreset}>
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
      <p>
        <Link href={siteLinks.fontDownload} external>
          Download Aptos from Microsoft
        </Link>
      </p>
    </PageLayout>
  );
}
