// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import {
  TeachingPopover,
  TeachingPopoverBody,
  TeachingPopoverCarousel,
  TeachingPopoverCarouselCard,
  TeachingPopoverCarouselFooter,
  TeachingPopoverCarouselFooterButton,
  TeachingPopoverCarouselNav,
  TeachingPopoverCarouselNavButton,
  TeachingPopoverCarouselPageCount,
  TeachingPopoverFooter,
  TeachingPopoverHeader,
  TeachingPopoverSurface,
  TeachingPopoverTitle,
  TeachingPopoverTrigger,
  type TeachingPopoverBodySlots,
  type TeachingPopoverHeaderSlots,
  type TeachingPopoverSurfaceSlots,
} from '@coreai-ds/react-headless-components';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import {
  TeachingPopoverNativeFlow,
  TeachingPopoverTourFlow,
  teachingPopoverConsumerExample,
} from './TeachingPopoverComparison.js';
import { TeachingPopoverComparisonWithReport } from './TeachingPopoverComparisonReport.js';
import {
  captureTeachingPopoverStyles,
  compareTeachingPopoverStyles,
  getTeachingPopoverSurface,
  getTeachingPopoverTrigger,
} from './compareTeachingPopoverStyles.js';
import styles from './TeachingPopoverComparison.module.css';

type DialogRootProps = Extract<
  ExtractSlotProps<TeachingPopoverSurfaceSlots['root']>,
  { as?: 'dialog' }
>;

const renderSurface: SlotRenderFunction<DialogRootProps> = (Component, props) => (
  <Component {...props} data-custom-teaching-surface="">
    {props.children}
  </Component>
);

const renderMedia: SlotRenderFunction<ExtractSlotProps<TeachingPopoverBodySlots['media']>> = (
  Component,
  props,
) => (
  <Component {...props} data-custom-teaching-media="">
    <span>Consumer media content</span>
  </Component>
);

const renderDismiss: SlotRenderFunction<
  ExtractSlotProps<TeachingPopoverHeaderSlots['dismissButton']>
> = (Component, props) => (
  <Component {...props} data-custom-teaching-dismiss="">
    Close slots
  </Component>
);

const CustomTrigger: ForwardRefComponent<React.ComponentPropsWithRef<'button'>> = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(function CustomTrigger(props, ref) {
  return <button {...props} ref={ref} />;
});

function SlottedGuide() {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const mediaRef = React.useRef<HTMLSpanElement>(null);
  const dismissRef = React.useRef<HTMLButtonElement>(null);
  const surfaceRef = React.useCallback((node: HTMLDialogElement | null) => {
    if (!node) return;
    if (
      !(node instanceof HTMLDialogElement) ||
      !(triggerRef.current instanceof HTMLButtonElement) ||
      !(mediaRef.current instanceof HTMLSpanElement) ||
      !(dismissRef.current instanceof HTMLButtonElement) ||
      !node.contains(mediaRef.current) ||
      !node.contains(dismissRef.current)
    ) {
      throw new Error('Public TeachingPopover slots did not preserve their native refs');
    }
    node.dataset.nativeRefContract = 'preserved';
  }, []);
  return (
    <TeachingPopover positioning={{ position: 'below', offset: 12 }}>
      <TeachingPopoverTrigger>
        <CustomTrigger type="button" ref={triggerRef} className="caller-trigger">
          Open slotted guide
        </CustomTrigger>
      </TeachingPopoverTrigger>
      <TeachingPopoverSurface
        as="dialog"
        ref={surfaceRef}
        aria-label="Slotted guide"
        className={`${styles.flowSurface} caller-surface`}
      >
        {
          ((Component, props) =>
            renderSurface(Component, {
              ...props,
              children: (
                <>
                  <TeachingPopoverHeader
                    as="h3"
                    aria-label="Slotted header"
                    icon={null}
                    dismissButton={{
                      type: 'button',
                      ref: dismissRef,
                      className: 'caller-dismiss',
                      'aria-label': 'Close slotted guide',
                      children: renderDismiss,
                    }}
                  >
                    Slotted header
                  </TeachingPopoverHeader>
                  <TeachingPopoverBody
                    media={{
                      ref: mediaRef,
                      className: 'caller-media',
                      children: renderMedia,
                    }}
                  >
                    <TeachingPopoverTitle>Typed public slots</TeachingPopoverTitle>
                  </TeachingPopoverBody>
                </>
              ),
            })) satisfies SlotRenderFunction<DialogRootProps>
        }
      </TeachingPopoverSurface>
    </TeachingPopover>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless TeachingPopover',
  component: TeachingPopover,
  subcomponents: {
    TeachingPopoverBody,
    TeachingPopoverCarousel,
    TeachingPopoverCarouselCard,
    TeachingPopoverCarouselFooter,
    TeachingPopoverCarouselFooterButton,
    TeachingPopoverCarouselNav,
    TeachingPopoverCarouselNavButton,
    TeachingPopoverCarouselPageCount,
    TeachingPopoverFooter,
    TeachingPopoverHeader,
    TeachingPopoverSurface,
    TeachingPopoverTitle,
    TeachingPopoverTrigger,
  },
  args: {
    children: <TeachingPopoverSurface>Project guide</TeachingPopoverSurface>,
  },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Private migration of all 14 family members actually published by react-headless-components-preview 0.3.2/teaching-popover, with react-teaching-popover 9.7.9 visual sources. Only appearance/size and carousel-footer layout are restored missing visual props. Hooks/renderers own native dialog/popover/anchor state, dismissal, callbacks and carousel registration. The surface reuses Popover CSS without CoreAI Overlay overrides; carousel actions compose Button CSS without CoreAI wrapper defaults. There is no old Portal, positioning engine, motion slot, Tabster, legacy footer primary/secondary API, or carousel compatibility layer. The pinned trapFocus prop defaults false (unlike the old styled TeachingPopover); withArrow defaults true. Non-modal surfaces retain role=group and aria-details without an invented aria-controls. Title dismissal needs explicit aria-hidden=false for accessibility, as the raw-current regression demonstrates. Current CarouselNav has ordinary native tab stops and no focusgroup; neither a polyfill nor legacy roving focus is injected. Carousel card content unmounts while inactive. Consumers control Footer children/actions and form button types. Header/title dismiss handlers and carousel completion remain the public current contracts; tests distinguish consumer-preventDefault ordering rather than adding normalization. Updating controlled content during a native outside click can reopen the pinned surface; raw-current tests also verify plain outside dismissal and explicit open=false resets as safe forms. Overlay/anchor fallbacks on older browsers are application-owned. Comparison reports reserve space, refresh public positioning handles and check final stable geometry.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: ['brand', 'inverted'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
} satisfies Meta<typeof TeachingPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <TeachingPopoverComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    for (const name of [
      'Default teaching content',
      'Small arrow',
      'Title dismissal',
      'Carousel brand',
    ]) {
      if (name !== 'Default teaching content') {
        await userEvent.selectOptions(
          canvas.getByLabelText('TeachingPopover visual fixture'),
          name,
        );
      }
      await waitFor(async () => {
        const report = canvas.getByRole('status', { name: 'TeachingPopover style report' });
        await expect(report).toHaveAttribute('data-teaching-report-example', name);
        await expect(report).toHaveAttribute('data-teaching-report-state', 'ready');
        await expect(report).toHaveAttribute('data-teaching-unexpected-count', '0');
        await expect(report).toHaveTextContent(
          'No unexpected differences in the selected properties.',
        );
      });
    }
    const legacy = getTeachingPopoverSurface(canvasElement, 'legacy');
    const headless = getTeachingPopoverSurface(canvasElement, 'headless');
    const finalDifferences = compareTeachingPopoverStyles(
      captureTeachingPopoverStyles(legacy, getTeachingPopoverTrigger(canvasElement, 'legacy')),
      captureTeachingPopoverStyles(headless, getTeachingPopoverTrigger(canvasElement, 'headless')),
      8,
    );
    await expect(finalDifferences.filter((difference) => difference.kind === 'unexpected')).toEqual(
      [],
    );
    await expect(headless.getBoundingClientRect().width).toBe(320);
    await expect(headless.matches(':popover-open')).toBe(true);
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TeachingPopoverComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <TeachingPopoverComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => (
    <TeachingPopoverComparisonWithReport examples={[teachingPopoverConsumerExample]} consumer />
  ),
  play: async ({ canvas, canvasElement }) => {
    await waitFor(async () => {
      const report = canvas.getByRole('status', { name: 'TeachingPopover style report' });
      await expect(report).toHaveAttribute('data-teaching-report-state', 'ready');
      await expect(report).toHaveAttribute('data-teaching-report-example', 'Consumer CSS priority');
      await expect(report).toHaveTextContent('Intentional consumer cascade example.');
    });
    const surface = getTeachingPopoverSurface(canvasElement, 'headless');
    await expect(getComputedStyle(surface).paddingTop).toBe('9px');
    await expect(getComputedStyle(surface).borderRadius).toBe('3px');
    await expect(getComputedStyle(surface).borderTopWidth).toBe('3px');
    await expect(surface.getBoundingClientRect().width).toBe(320);
  },
};

export const NativeModalForm: Story = {
  render: () => <TeachingPopoverNativeFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open project guide' });
    await userEvent.click(trigger);
    const dialog = await canvas.findByRole('dialog', { name: 'Project guide' });
    await expect(dialog.matches(':modal')).toBe(true);
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Reviewer' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Reviewer' }), 'Alex');
    await userEvent.click(canvas.getByRole('button', { name: 'Invite reviewer' }));
    await expect(canvas.getByRole('status', { name: 'Guide submission' })).toHaveTextContent(
      'Alex:invite',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Got it' }));
    await waitFor(async () => {
      await expect(canvas.queryByRole('dialog', { name: 'Project guide' })).toBeNull();
    });
    await expect(trigger).toHaveFocus();
  },
};

export const ControlledCarousel: Story = {
  render: () => <TeachingPopoverTourFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Keep current step' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Start Atlas tour' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByRole('status', { name: 'Tour selected step' })).toHaveTextContent(
      'welcome',
    );
    await expect(canvas.getByRole('status', { name: 'Tour value changes' })).toHaveTextContent(
      'click:review:button',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Close Atlas tour' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Keep current step' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Start Atlas tour' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByRole('heading', { name: 'Review together' })).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: 'Step ready' }));
    await expect(canvas.getByLabelText('Tour page count')).toHaveTextContent('3 of 3');
    await expect(canvas.getByRole('tab', { name: 'Step ready' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Finish tour' }));
    await waitFor(async () => {
      await expect(canvas.queryByRole('group', { name: 'Atlas tour' })).toBeNull();
    });
    await expect(canvas.getByRole('status', { name: 'Tour finish count' })).toHaveTextContent('1');
  },
};

export const PublicSlots: Story = {
  render: () => <SlottedGuide />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open slotted guide' });
    await userEvent.click(trigger);
    const surface = await canvas.findByRole('group', { name: 'Slotted guide' });
    await expect(surface).toHaveClass('caller-surface');
    await expect(surface).toHaveAttribute('data-custom-teaching-surface');
    await expect(surface).toHaveAttribute('data-native-ref-contract', 'preserved');
    await expect(canvas.getByText('Consumer media content').parentElement).toHaveClass(
      'caller-media',
    );
    await expect(canvas.getByRole('heading', { name: 'Slotted header' })).toHaveProperty(
      'tagName',
      'H3',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Close slotted guide' }));
    await expect(trigger).toHaveFocus();
  },
};
