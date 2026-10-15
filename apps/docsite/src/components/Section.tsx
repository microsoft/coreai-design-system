// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Text } from '@coreai-ds/react-components';

export function Section({
  id,
  title,
  intro,
  children,
}: {
  id?: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="page-section">
      <Text as="h2" size={500} weight="semibold">
        {title}
      </Text>
      {intro && (
        <Text as="p" className="section-intro" size={300} foreground={2}>
          {intro}
        </Text>
      )}
      {children}
    </section>
  );
}
