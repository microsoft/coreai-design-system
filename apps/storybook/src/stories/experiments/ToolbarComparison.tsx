// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Toolbar as LegacyToolbar,
  ToolbarButton as LegacyToolbarButton,
  ToolbarDivider as LegacyToolbarDivider,
  ToolbarGroup as LegacyToolbarGroup,
  ToolbarRadioButton as LegacyToolbarRadioButton,
  ToolbarRadioGroup as LegacyToolbarRadioGroup,
  ToolbarToggleButton as LegacyToolbarToggleButton,
} from '@coreai-ds/react-components';
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  ToolbarToggleButton,
  type ToolbarProps,
  type ToolbarButtonProps,
  type ToolbarToggleButtonProps,
} from '@coreai-ds/react-headless-components';
import { CircleRegular } from '@fluentui/react-icons/headless/svg/circle';
import styles from './ToolbarComparison.module.css';

export type ToolbarImplementation = 'legacy' | 'headless';
export interface ToolbarExample {
  name: string;
  size?: ToolbarProps['size'];
  appearance?: ToolbarButtonProps['appearance'];
  vertical?: boolean;
  buttonVertical?: boolean;
  itemSize?: ToolbarToggleButtonProps['size'];
  checked?: boolean;
  disabled?: boolean;
  disabledFocusable?: boolean;
  content?: 'icon' | 'text' | 'both';
  dividerContent?: boolean;
  dividerVertical?: boolean;
  consumer?: boolean;
}

export const toolbarExamples: readonly ToolbarExample[] = [
  { name: 'Default' },
  { name: 'Small toolbar', size: 'small' },
  { name: 'Large toolbar', size: 'large' },
  { name: 'Vertical small toolbar', size: 'small', vertical: true },
  { name: 'Vertical large toolbar', size: 'large', vertical: true, checked: true },
  { name: 'Primary checked', appearance: 'primary', checked: true },
  { name: 'Transparent checked', appearance: 'transparent', checked: true },
  { name: 'Subtle checked', appearance: 'subtle', checked: true },
  { name: 'Small controls', itemSize: 'small', checked: true },
  { name: 'Large controls', itemSize: 'large', content: 'both' },
  { name: 'Icon and text', content: 'both' },
  { name: 'Vertical button layout', buttonVertical: true, content: 'both' },
  { name: 'Text only', content: 'text', checked: true },
  { name: 'Disabled controls', disabled: true },
  { name: 'Checked disabled', disabled: true, checked: true },
  { name: 'Checked disabled focusable', disabledFocusable: true, checked: true },
  { name: 'Labeled divider', dividerContent: true },
  { name: 'Horizontal divider override', dividerVertical: false, vertical: false },
];

export const toolbarConsumerExample: ToolbarExample = {
  name: 'Consumer classes',
  content: 'both',
  checked: true,
  consumer: true,
};

const converted = {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  ToolbarToggleButton,
};
const legacy = {
  Toolbar: LegacyToolbar,
  ToolbarButton: LegacyToolbarButton,
  ToolbarDivider: LegacyToolbarDivider,
  ToolbarGroup: LegacyToolbarGroup,
  ToolbarRadioButton: LegacyToolbarRadioButton,
  ToolbarRadioGroup: LegacyToolbarRadioGroup,
  ToolbarToggleButton: LegacyToolbarToggleButton,
};

export function ToolbarFixtureGlyph() {
  return <CircleRegular aria-hidden="true" data-toolbar-glyph="" />;
}

export function ToolbarFixture({
  implementation,
  example,
}: {
  implementation: ToolbarImplementation;
  example: ToolbarExample;
}) {
  const Components = implementation === 'legacy' ? legacy : converted;
  const content = example.content ?? 'icon';
  const icon = () =>
    content === 'text'
      ? undefined
      : {
          children: <ToolbarFixtureGlyph />,
          className: example.consumer ? styles.consumerIcon : undefined,
          'data-toolbar-part': 'icon',
        };
  const buttonClass = example.consumer ? styles.consumerButton : undefined;
  const itemProps = {
    appearance: example.appearance,
    disabled: example.disabled,
    disabledFocusable: example.disabledFocusable,
    className: buttonClass,
  };
  const dividerOrientation =
    example.dividerVertical === undefined ? {} : { vertical: example.dividerVertical };
  const wrapper = {
    className: 'toolbar-fixture-divider-wrapper',
    'data-toolbar-wrapper': '',
  };
  return (
    <Components.Toolbar
      aria-label={`${implementation} visual toolbar`}
      data-toolbar-implementation={implementation}
      size={example.size}
      vertical={example.vertical}
      defaultCheckedValues={
        example.checked ? { format: ['bold'], align: ['left'] } : { format: [], align: [] }
      }
      className={example.consumer ? styles.consumerToolbar : undefined}
    >
      <Components.ToolbarButton
        {...itemProps}
        aria-label="Save document"
        data-toolbar-part="button"
        icon={icon()}
        vertical={example.buttonVertical}
      >
        {content === 'icon' ? undefined : 'Save'}
      </Components.ToolbarButton>
      <Components.ToolbarDivider
        data-toolbar-part="divider"
        {...dividerOrientation}
        wrapper={wrapper}
      >
        {example.dividerContent ? 'Edit' : undefined}
      </Components.ToolbarDivider>
      <Components.ToolbarGroup data-toolbar-part="group">
        <Components.ToolbarToggleButton
          {...itemProps}
          name="format"
          value="bold"
          aria-label="Bold"
          data-toolbar-part="toggle"
          icon={icon()}
          size={example.itemSize}
        >
          {content === 'icon' ? undefined : 'Bold'}
        </Components.ToolbarToggleButton>
      </Components.ToolbarGroup>
      <Components.ToolbarRadioGroup data-toolbar-part="radioGroup" aria-label="Alignment">
        <Components.ToolbarRadioButton
          {...itemProps}
          name="align"
          value="left"
          aria-label="Align left"
          data-toolbar-part="radio"
          icon={icon()}
          size={example.itemSize}
        >
          {content === 'icon' ? undefined : 'Left'}
        </Components.ToolbarRadioButton>
        <Components.ToolbarRadioButton
          {...itemProps}
          name="align"
          value="right"
          aria-label="Align right"
          data-toolbar-part="radio"
          icon={icon()}
          size={example.itemSize}
        >
          {content === 'icon' ? undefined : 'Right'}
        </Components.ToolbarRadioButton>
      </Components.ToolbarRadioGroup>
    </Components.Toolbar>
  );
}

export function ToolbarComparison({ example }: { example: ToolbarExample }) {
  return (
    <div className={styles.comparison} data-toolbar-comparison="">
      {(['legacy', 'headless'] as const).map((implementation) => (
        <section key={implementation} className={styles.column}>
          <h3>
            {implementation === 'legacy' ? 'Current CoreAI / Griffel' : 'Headless / CSS Modules'}
          </h3>
          <div className={styles.viewport}>
            <ToolbarFixture implementation={implementation} example={example} />
          </div>
        </section>
      ))}
    </div>
  );
}
