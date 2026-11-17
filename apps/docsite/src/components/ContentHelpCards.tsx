// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Card, Link, Text } from '@coreai-ds/react-components';
import { ExternalIcon } from './Icons';

interface ContentHelpItem {
  title: string;
  description: string;
  details?: string[];
  href: string;
  linkLabel?: string;
}

export function ContentHelpCards({ items }: { items: ContentHelpItem[] }) {
  const id = React.useId();
  return (
    <div className="content-help-cards">
      {items.map((item, index) => {
        const titleId = `${id}-${index}`;
        return (
          <Card
            className="resource-card content-help-card"
            focusMode="off"
            key={item.href}
            aria-labelledby={`${titleId}-title`}
          >
            <div className="content-help-card__summary">
              <Text
                as="h3"
                className="resource-card__title"
                id={`${titleId}-title`}
                size={400}
                weight="semibold"
                foreground={1}
              >
                {item.title}
              </Text>
              <Text as="p" size={300} foreground={3}>
                {item.description}
              </Text>
              <Link
                className="content-help-card__link"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.linkLabel ?? item.title}
                <span aria-hidden="true">
                  <ExternalIcon />
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </Link>
            </div>
            {item.details?.length ? (
              <ul className="content-guidance-list">
                {item.details.map((detail) => (
                  <li key={detail}>
                    <Text size={300} foreground={3}>
                      {detail}
                    </Text>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
