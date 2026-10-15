// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Text } from '@coreai-ds/react-components';
import { PageLayout } from '../components/PageLayout';
import { useThemeMode } from '../theme/ThemeProvider';

export function Materials() {
  const { mode } = useThemeMode();
  return (
    <PageLayout id="materials">
      <div className="theme-crossfade">
        <img
          className="materials-hero"
          src={`/assets/material-1-${mode}.png`}
          alt="Materials diagram"
          width={800}
          height={452}
        />
      </div>
      <div className="materials-body">
        <Text as="p" size={300}>
          We use subtle variations in background color to simulate depth and layering in digital
          interfaces, mimicking how light interacts with physical surfaces. Lighter shades appear
          closer to the viewer, while slightly darker tones recede into the background, creating a
          sense of spatial hierarchy. This technique helps guide user focus and enhances visual
          clarity without relying on harsh shadows or complex&nbsp;textures.
        </Text>
        <blockquote className="materials-callout">
          To maintain clarity and usability, we aim to limit visual hierarchy to no more than three
          layers on a screen.
        </blockquote>
        <Text as="p" size={300}>
          Text, strokes, and fills that are darker than the background they rest on are perceived as
          being part of the page itself rather than floating above it, creating a visual sense of
          embedded content rather than layered depth.
        </Text>
      </div>
    </PageLayout>
  );
}
