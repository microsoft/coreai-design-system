// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { Divider, Text, type TextPreset } from '@coreai-ds/react-components';

/**
 * A typical mix of `Text` usages in one piece of content: a heading, a body
 * paragraph, a bold callout, an inline code reference, and small metadata —
 * each combining a `preset` (size/weight) with a `foreground` emphasis level
 * appropriate to its role. Explicit props like `weight="bold"` still override
 * `preset`'s defaults, as shown on the callout line. Nested text inherits every
 * unset typography property: the date changes only foreground, while inline
 * code changes only font family and foreground.
 */
export const Default: StoryObj = {
  render: () => {
    /** Renders inline code-styled text using `Text`'s `monospace` font. */
    const Code = ({ children }: React.PropsWithChildren): React.JSX.Element => (
      <Text font="monospace" foreground={1}>
        {children}
      </Text>
    );

    const styles = /* css */ `
      .text-default-example {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacingVerticalS);
        max-width: 80ch;
      }
      .text-default-example__divider {
        margin: var(--spacingVerticalL) 0;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="text-default-example">
          <Text as="h2" preset="heading3" foreground={1} block>
            Weekly status report{' '}
            <Text foreground={4} weight="regular">
              (00/00/0000)
            </Text>
          </Text>
          <Text as="p" preset="body" block>
            This paragraph uses the <Code>body</Code> preset with <Code>foreground=2</Code>, the
            standard combination for readable body copy.
          </Text>
          <Text preset="body" weight="bold" foreground={1} block>
            Action needed: review the deployment checklist before Friday.
          </Text>
          <Text as="p" preset="bodyS" block>
            For quicker styling, pass a <Code>TextPreset</Code> name in the <Code>preset</Code> prop
            instead of Fluent's separate size/weight components.
          </Text>
          <Text preset="bodyXS" foreground={4}>
            Posted 3 days ago · 5 min read
          </Text>
          <Divider className="text-default-example__divider" />
          <div>
            <Text>Same</Text> <span>Same</span>
          </div>
          <Text as="p" block preset="bodyS" foreground={3}>
            The above two <Text italic>"Same"</Text> elements render text visually the same.{' '}
            <Code>Text</Code> components inherit css text properties by default (differently from
            Fluent's Text components) so they can be nested more constructively.
          </Text>
        </div>
      </>
    );
  },
};

/**
 * `preset` selects one of CoreAI's named `size`/`weight` combinations instead
 * of picking `size`/`weight` (or a separate Fluent typography component)
 * directly — use the name that matches the content's semantic role (a
 * `heading*` for titles, `body`/`bodyS`/`bodyXS` for copy at decreasing
 * emphasis).
 */
export const Presets: StoryObj = {
  render: () => {
    /** Every CoreAI `TextPreset`, ordered largest to smallest, alongside the
     * `size`/`weight` pair it resolves to. Aliases that share the same
     * `size`/`weight` (`heading5`/`bodyStrong`, `heading6`/`bodySStrong`) are
     * listed on one row. */
    const textPresets: Array<{
      preset: TextPreset;
      label: string;
      size: number;
      weight: string;
    }> = [
      { preset: 'heading1', label: 'heading1', size: 900, weight: 'semibold' },
      { preset: 'heading2', label: 'heading2', size: 700, weight: 'semibold' },
      { preset: 'heading3', label: 'heading3', size: 500, weight: 'semibold' },
      { preset: 'heading4', label: 'heading4', size: 400, weight: 'semibold' },
      {
        preset: 'heading5',
        label: 'heading5 / bodyStrong',
        size: 300,
        weight: 'semibold',
      },
      { preset: 'body', label: 'body', size: 300, weight: 'regular' },
      {
        preset: 'heading6',
        label: 'heading6 / bodySStrong',
        size: 200,
        weight: 'semibold',
      },
      { preset: 'bodyS', label: 'bodyS', size: 200, weight: 'regular' },
      {
        preset: 'bodyXSStrong',
        label: 'bodyXSStrong',
        size: 100,
        weight: 'semibold',
      },
      { preset: 'bodyXS', label: 'bodyXS', size: 100, weight: 'regular' },
    ];

    const styles = /* css */ `
      .text-presets-example {
        display: grid;
        grid-template-columns: max-content 1fr;
        column-gap: var(--spacingHorizontalXXL);
        row-gap: var(--spacingVerticalM);
        align-items: baseline;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="text-presets-example">
          {textPresets.map(({ preset, label, size, weight }) => (
            <React.Fragment key={preset}>
              <Text preset={preset} foreground={weight === 'semibold' ? 1 : 2} block>
                {label}
              </Text>
              <Text foreground={4} size={200}>
                {size} / {weight}
              </Text>
            </React.Fragment>
          ))}
        </div>
      </>
    );
  },
};

/**
 * Typography and styling abstraction component used to ensure consistency and standardize text throughout your application.
 *
 * @summary Typography primitive for consistent, standardized text styling.
 */
export default {
  title: 'Components/Text',
  component: Text,
};
