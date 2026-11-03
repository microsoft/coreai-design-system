// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/tag-group';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import {
  TagGroupComparison,
  tagGroupConsumerExample,
  tagGroupExamples,
  type TagGroupExample,
} from '../../../apps/storybook/src/stories/experiments/TagGroupComparison.js';
import {
  TagDismissFlow,
  TagSelectionFlow,
} from '../../../apps/storybook/src/stories/experiments/TagFlows.js';
import { TagComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/TagComparisonReport.js';
import { compareTagGroupStyles } from '../../../apps/storybook/src/stories/experiments/compareInteractionTagStyles.js';
import {
  getComparisonTag,
  requireTagHTML,
  settleTagStyles,
} from '../../../apps/storybook/src/stories/experiments/compareTagStyles.js';
import {
  TagGroup,
  tagGroupClassNames,
  useTagGroupContextValues,
  type TagGroupProps,
} from './TagGroup.js';
import { Tag } from './Tag.js';
import { InteractionTag } from './InteractionTag.js';
import { InteractionTagPrimary } from './InteractionTagPrimary.js';
import { InteractionTagSecondary } from './InteractionTagSecondary.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: TagGroupExample,
  theme = coreaiLightTheme,
  defaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <div data-testid="tag-pointer-rest">Pointer rest</div>
      <TagGroupComparison example={example} />
    </FocusgroupConsumer>,
    { providerProps: { theme, withComponentDefaults: defaults, dir } },
  );
  await userEvent.hover(screen.getByTestId('tag-pointer-rest'));
  const legacy = getComparisonTag(screen.container, 'legacy');
  const headless = getComparisonTag(screen.container, 'headless');
  await settleTagStyles(legacy, headless);
  return { screen, legacy, headless };
}

test('the completed TagGroup report stays ready when its current fixture is selected again', async () => {
  const screen = await renderCoreAIComponent(<TagComparisonWithReport family="group" />);
  await userEvent.hover(screen.getByTestId('tag-report-pointer-rest'));
  const report = screen.getByRole('status', { name: 'Tag style report' });
  await expect.element(report).toHaveAttribute('data-tag-report-state', 'ready');
  await settleTagStyles();
  screen
    .getByLabelText('Tag visual fixture')
    .element()
    .dispatchEvent(new Event('change', { bubbles: true }));
  await settleTagStyles();
  await expect.element(report).toHaveAttribute('data-tag-report-state', 'ready');
  await expect.element(report).toHaveAttribute('data-tag-unexpected-count', '0');
  const group = getComparisonTag(screen.container, 'headless');
  const rect = group.getBoundingClientRect();
  expect(Number(report.element().getAttribute('data-tag-root-width'))).toBe(rect.width);
  expect(Number(report.element().getAttribute('data-tag-root-height'))).toBe(rect.height);
  expect(rect.width).toBeGreaterThan(0);
  expect(rect.height).toBeGreaterThan(0);
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(tagGroupExamples)(
    `matches $name group, inherited slots and geometry in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(compareTagGroupStyles(legacy, headless, !!example.interaction)).toEqual([]);
      expect(headless).toHaveClass(tagGroupClassNames.root);
      expect(headless).toHaveAttribute('focusgroup', 'toolbar inline wrap');
      expect(headless.querySelectorAll('[data-tag-part="item"]').length).toBe(3);
    },
  );

  test.each([true, false])(
    `preserves real inherited defaults with component defaults=%s in ${mode}`,
    async (defaults) => {
      const example: TagGroupExample = {
        name: 'Group default opt-out',
        interaction: true,
        props: { size: 'small', appearance: 'brand' },
      };
      const { legacy, headless } = await renderPair(example, theme, defaults);
      expect(compareTagGroupStyles(legacy, headless, true)).toEqual([]);
      const items = headless.querySelectorAll('[data-tag-part="item"]');
      expect(items[0]).toHaveAttribute('data-size', 'small');
      expect(items[0]).toHaveAttribute('data-appearance', 'brand');
      expect(items[2]).toHaveAttribute('data-size', 'extra-small');
      expect(items[2]).toHaveAttribute('data-appearance', 'outline');
    },
  );

  test(`keeps wrapping, context spacing and explicit child overrides in RTL in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(
      {
        name: 'RTL wrapped interactions',
        interaction: true,
        wrap: true,
        props: { size: 'small', appearance: 'brand' },
      },
      theme,
      true,
      'rtl',
    );
    expect(compareTagGroupStyles(legacy, headless, true)).toEqual([]);
    expect(getComputedStyle(headless).flexWrap).toBe('wrap');
    expect(headless.getBoundingClientRect().height).toBeGreaterThan(24);
  });

  test(`preserves ordinary consumer column-gap priority in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(tagGroupConsumerExample, theme);
    expect(getComputedStyle(headless).columnGap).toBe('18px');
    expect(
      compareTagGroupStyles(legacy, headless, false, true).filter(
        (difference) => difference.kind === 'unexpected',
      ),
    ).toEqual([]);
  });
}

test('preserves the current helper, forwarded group ref/classes/data, context and explicit visual child overrides', async () => {
  expectTypeOf(TagGroup).toMatchTypeOf<ForwardRefComponent<TagGroupProps>>();
  expect(useTagGroupContextValues).toBe(primitive.useTagGroupContextValues);
  const ref = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <TagGroup
        ref={ref}
        className="caller-group"
        data-consumer="group"
        size="small"
        appearance="brand"
        disabled
        dismissible
        aria-label="Inherited labels"
      >
        <Tag as="button" disabled={false} data-testid="inherited-tag">
          Inherited
        </Tag>
        <Tag
          as="span"
          size="extra-small"
          appearance="outline"
          dismissible={false}
          data-testid="explicit-tag"
        >
          Explicit
        </Tag>
        <InteractionTag data-testid="inherited-interaction">
          <InteractionTagPrimary type="button">Primary</InteractionTagPrimary>
          <InteractionTagSecondary aria-label="Remove primary" aria-labelledby={undefined} />
        </InteractionTag>
      </TagGroup>
    </FocusgroupConsumer>,
  );
  const group = screen.getByRole('toolbar', { name: 'Inherited labels', exact: true });
  expect(ref.current).toBe(group.element());
  expect(ref.current).toHaveClass(tagGroupClassNames.root, 'caller-group');
  expect(ref.current).toHaveAttribute('data-consumer', 'group');
  expect(ref.current).toHaveAttribute('aria-disabled', 'true');
  expect(ref.current).toHaveAttribute('data-disabled');
  expect(ref.current).toHaveAttribute('data-dismissible');
  const inherited = screen.getByTestId('inherited-tag');
  await expect.element(inherited).toBeDisabled();
  await expect.element(inherited).toHaveAttribute('data-size', 'small');
  await expect.element(inherited).toHaveAttribute('data-appearance', 'brand');
  const explicit = screen.getByTestId('explicit-tag');
  expect(explicit.element().tagName).toBe('SPAN');
  await expect.element(explicit).toHaveAttribute('data-size', 'extra-small');
  await expect.element(explicit).toHaveAttribute('data-appearance', 'outline');
  await expect.element(explicit).not.toHaveAttribute('data-dismissible');
  await expect.element(screen.getByRole('button', { name: 'Primary', exact: true })).toBeDisabled();
  await expect
    .element(screen.getByRole('button', { name: 'Remove primary', exact: true }))
    .toBeDisabled();
});

test('keeps current dismissal payloads and controlled removal without automatically removing items or restoring focus', async () => {
  const calls: { value: string; type: string; keys: string[] }[] = [];
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <TagGroup
        aria-label="Controlled labels"
        onDismiss={(event, data) =>
          calls.push({ value: data.value, type: event.type, keys: Object.keys(data) })
        }
      >
        <Tag as="button" dismissible value="a">
          Alpha
        </Tag>
        <Tag as="button" dismissible value="b">
          Beta
        </Tag>
      </TagGroup>
    </FocusgroupConsumer>,
  );
  const alpha = screen.getByRole('button', { name: 'Alpha', exact: true });
  await userEvent.click(alpha);
  await userEvent.keyboard('{Delete}{Backspace}');
  expect(calls).toEqual([
    { value: 'a', type: 'click', keys: ['value'] },
    { value: 'a', type: 'keydown', keys: ['value'] },
    { value: 'a', type: 'keydown', keys: ['value'] },
  ]);
  expect(
    screen
      .getByRole('toolbar', { name: 'Controlled labels', exact: true })
      .element()
      .querySelectorAll('button').length,
  ).toBe(2);
  expect(document.activeElement).toBe(alpha.element());
});

test('preserves list/listitem and explicit listbox-option ARIA without inventing Tag selection state', async () => {
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <TagGroup role="list" aria-label="Static labels">
        <Tag role="listitem">Static one</Tag>
      </TagGroup>
      <TagGroup role="listbox" aria-label="Visual choices" selectedValues={['b']}>
        <Tag value="a" selected>
          Selected by its own prop
        </Tag>
        <Tag value="b" selected={false}>
          Not selected by group state
        </Tag>
      </TagGroup>
    </FocusgroupConsumer>,
  );
  await expect.element(screen.getByRole('listitem')).toHaveTextContent('Static one');
  await expect
    .element(screen.getByRole('option', { name: 'Selected by its own prop', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  await expect
    .element(screen.getByRole('option', { name: 'Not selected by group state', exact: true }))
    .toHaveAttribute('aria-selected', 'false');
});

test('retains the current pre-change selection values and event identity in safe array-default uncontrolled composition', async () => {
  const records: {
    value: string;
    values: string;
    sameEvent: boolean;
    type: Parameters<NonNullable<TagGroupProps['onTagSelect']>>[1]['type'];
  }[] = [];
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <TagGroup
        defaultSelectedValues={[]}
        aria-label="Uncontrolled stages"
        onTagSelect={(event, data) =>
          records.push({
            value: data.value,
            values: JSON.stringify(data.selectedValues),
            sameEvent: data.event === event,
            type: data.type,
          })
        }
      >
        <InteractionTag value="plan">
          <InteractionTagPrimary type="button">Plan</InteractionTagPrimary>
        </InteractionTag>
        <InteractionTag value="build">
          <InteractionTagPrimary type="button">Build</InteractionTagPrimary>
        </InteractionTag>
      </TagGroup>
    </FocusgroupConsumer>,
  );
  const plan = screen.getByRole('button', { name: 'Plan', exact: true });
  const build = screen.getByRole('button', { name: 'Build', exact: true });
  await userEvent.click(plan);
  await expect.element(plan).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(build);
  await expect.element(build).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(plan);
  await expect.element(plan).toHaveAttribute('aria-pressed', 'false');
  expect(records).toEqual([
    { value: 'plan', values: '[]', sameEvent: true, type: 'click' },
    { value: 'build', values: '["plan"]', sameEvent: true, type: 'click' },
    { value: 'plan', values: '["plan","build"]', sameEvent: true, type: 'click' },
  ]);
});

test('keeps controlled group selection and disabled callback blocking in the shared fixture', async () => {
  const screen = await renderCoreAIComponent(<TagSelectionFlow />);
  const plan = screen.getByRole('button', { name: 'Plan', exact: true });
  const build = screen.getByRole('button', { name: 'Build', exact: true });
  const record = screen.getByLabelText('Tag selection events', { exact: true });
  await expect.element(plan).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(plan);
  await expect.element(record).toHaveAttribute('data-tag-select-values', '["plan"]');
  await expect.element(record).toHaveAttribute('data-tag-selected', '[]');
  await expect.element(record).toHaveAttribute('data-tag-select-same-event', 'true');
  await userEvent.click(build);
  await expect.element(build).toHaveAttribute('aria-pressed', 'true');
  await expect.element(record).toHaveAttribute('data-tag-select-values', '[]');
  await expect.element(record).toHaveAttribute('data-tag-selected', '["build"]');
  await userEvent.click(
    screen.getByRole('button', { name: 'Toggle label group disabled', exact: true }),
  );
  await expect.element(build).toBeDisabled();
  const disabledShip = screen.getByRole('button', { name: 'Ship', exact: true }).element();
  if (!(disabledShip instanceof HTMLButtonElement))
    throw new Error('Expected a native stage button');
  const activeElement = document.activeElement;
  disabledShip.click();
  disabledShip.focus();
  expect(document.activeElement).toBe(activeElement);
  await expect.element(record).toHaveAttribute('data-tag-select-count', '2');
});

for (const interaction of [false, true]) {
  for (const dir of ['ltr', 'rtl'] as const) {
    for (const cold of [false, true]) {
      test(`uses real feature-detected focusgroup keys, dynamic dismissal and consumer restoration: interaction=${interaction}, ${dir}, cold=${cold}`, async () => {
        const screen = await renderCoreAIComponent(
          <TagDismissFlow interaction={interaction} cold={cold} />,
          { providerProps: { dir } },
        );
        await userEvent.hover(screen.getByTestId('tag-flow-pointer-rest'));
        const mode = supportsFocusGroup() ? 'native' : 'consumer-polyfill';
        expect(supportsFocusGroup()).toBe('focusGroup' in HTMLElement.prototype);
        expect(screen.container.querySelector('[data-tag-flow]')).toHaveAttribute(
          'data-tag-focusgroup-mode',
          mode,
        );
        const restore = screen.getByRole('button', { name: 'Restore labels', exact: true });
        if (cold) {
          expect(screen.container.querySelector('[focusgroup]')).toBeNull();
          await userEvent.click(restore);
        }
        const group = screen.getByRole('toolbar', { name: 'Project workflow labels', exact: true });
        await expect.element(group).toHaveAttribute('focusgroup', 'toolbar inline wrap');
        const before = screen.getByRole('button', { name: 'Before labels', exact: true });
        const plan = screen.getByRole('button', {
          name: interaction ? 'Plan' : 'Remove Plan',
          exact: true,
        });
        const build = screen.getByRole('button', {
          name: interaction ? 'Build' : 'Remove Build',
          exact: true,
        });
        const ship = screen.getByRole('button', {
          name: interaction ? 'Ship' : 'Remove Ship',
          exact: true,
        });
        requireTagHTML(before.element()).focus();
        await userEvent.tab();
        await expect.element(plan).toHaveFocus();
        const arrow = dir === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}';
        await userEvent.keyboard(arrow);
        await expect
          .element(
            interaction ? screen.getByRole('button', { name: 'Remove Plan', exact: true }) : build,
          )
          .toHaveFocus();
        await userEvent.keyboard('{End}');
        await expect
          .element(screen.getByRole('button', { name: 'Remove Ship', exact: true }))
          .toHaveFocus();
        await userEvent.keyboard('{Home}');
        await expect.element(plan).toHaveFocus();
        if (interaction) await userEvent.keyboard(arrow);
        await userEvent.keyboard('{Delete}');
        const record = screen.getByLabelText('Tag dismissal events', { exact: true });
        await expect.element(record).toHaveAttribute('data-tag-dismiss-value', 'plan');
        await expect.element(record).toHaveAttribute('data-tag-dismiss-type', 'keydown');
        await expect.element(record).toHaveAttribute('data-tag-dismiss-key', 'Delete');
        await expect.element(record).toHaveAttribute('data-tag-visible-count', '2');
        await expect.element(build).toHaveFocus();
        if (interaction) await userEvent.keyboard(arrow);
        await userEvent.keyboard('{Backspace}');
        await expect.element(record).toHaveAttribute('data-tag-dismiss-value', 'build');
        await expect.element(record).toHaveAttribute('data-tag-dismiss-key', 'Backspace');
        await expect.element(ship).toHaveFocus();
        await userEvent.click(screen.getByRole('button', { name: 'Remove Ship', exact: true }));
        await expect.element(record).toHaveAttribute('data-tag-visible-count', '0');
        await expect.element(record).toHaveAttribute('data-tag-dismiss-count', '3');
        await expect.element(restore).toHaveFocus();
        expect(screen.container.querySelector('[focusgroup]')).toBeNull();
        await userEvent.click(restore);
        await expect.element(plan).toHaveFocus();
        await expect.element(group).toHaveAttribute('focusgroup', 'toolbar inline wrap');
        await userEvent.tab();
        await expect.element(restore).toHaveFocus();
        await userEvent.tab({ shift: true });
        await expect.element(plan).toHaveFocus();
      });
    }
  }
}

test('keeps an empty group without fabricated items and uses a visible pointer sentinel', async () => {
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <div data-testid="empty-group-pointer-rest">Pointer rest</div>
      <TagGroup aria-label="Empty labels" />
    </FocusgroupConsumer>,
  );
  await userEvent.hover(screen.getByTestId('empty-group-pointer-rest'));
  const group = screen.getByRole('toolbar', { name: 'Empty labels', exact: true });
  expect(group.element().querySelectorAll('button').length).toBe(0);
  expect(group.element().childElementCount).toBe(0);
  expect(group.element().getBoundingClientRect().width).toBe(0);
});
