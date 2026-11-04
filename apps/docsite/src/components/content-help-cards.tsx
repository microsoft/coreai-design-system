// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Card, Link, Text } from '@coreai-ds/react-components';
import { ExternalIcon } from './Icons';

interface ContentHelpItem {
  title: string;
  description: string;
  href: string;
}

export function ContentHelpCards({ items }: { items: ContentHelpItem[] }) {
  const id = React.useId();
  return (
    <div className="resources-grid content-help-cards">
      {items.map((item, index) => {
        const titleId = `${id}-${index}`;
        return (
          <Link
            className="resource-card-link"
            href={item.href}
            key={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-labelledby={`${titleId}-title`}
            aria-describedby={`${titleId}-description`}
          >
            <Card className="resource-card" focusMode="off">
              <Text
                as="h3"
                className="resource-card__title"
                id={`${titleId}-title`}
                size={300}
                weight="semibold"
                foreground={1}
              >
                {item.title}
                <span aria-hidden="true">
                  <ExternalIcon />
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </Text>
              <Text as="p" id={`${titleId}-description`} size={200} foreground={3}>
                {item.description}
              </Text>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
