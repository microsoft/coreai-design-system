// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  CalendarDay as HeadlessCalendarDay,
  CalendarMonth as HeadlessCalendarMonth,
  CalendarYear as HeadlessCalendarYear,
  renderCalendar,
  renderCalendarDay,
  renderCalendarMonth,
  renderCalendarYear,
  useCalendar,
  useCalendarContextValues,
  useCalendarDay,
  useCalendarMonth,
  useCalendarYear,
  type CalendarDayProps,
  type CalendarMonthProps,
  type CalendarProps,
  type CalendarYearProps,
} from '@fluentui/react-headless-components-preview/calendar';
import { slot, type ForwardRefComponent, type SlotRenderFunction } from '@fluentui/react-utilities';
import { ChevronDownRegular } from '@fluentui/react-icons/headless/svg/chevron-down';
import { ChevronUpRegular } from '@fluentui/react-icons/headless/svg/chevron-up';
import { DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import styles from './Calendar.module.css';
import './Calendar.overrides.module.css';

export {
  CalendarProvider,
  calendarFormatters,
  createCalendarDateTimeFormatter,
  useCalendarContext,
} from '@fluentui/react-headless-components-preview/calendar';
export type {
  CalendarDayCellData,
  CalendarDayHandle,
  CalendarDayProps,
  CalendarDaySlots,
  CalendarDayState,
  CalendarFormatters,
  CalendarLayout,
  CalendarMonthHandle,
  CalendarMonthProps,
  CalendarMonthSlots,
  CalendarMonthState,
  CalendarNavigateData,
  CalendarProps,
  CalendarSelectDateData,
  CalendarSlots,
  CalendarState,
  CalendarView,
  CalendarViewChangeData,
  CalendarYearHandle,
  CalendarYearProps,
  CalendarYearSlots,
  CalendarYearState,
  DateRangeType,
  DayOfWeek,
  FirstWeekOfYear,
} from '@fluentui/react-headless-components-preview/calendar';

export const calendarClassNames = {
  root: 'fui-Calendar',
  liveRegion: 'fui-Calendar__liveRegion',
  divider: 'fui-Calendar__divider',
  monthPickerWrapper: 'fui-Calendar__monthPickerWrapper',
  goToTodayButton: 'fui-Calendar__goToTodayButton',
} as const;

export const calendarDayClassNames = {
  root: 'fui-CalendarDay',
  header: 'fui-CalendarDay__header',
  heading: 'fui-CalendarDay__heading',
  navigation: 'fui-CalendarDay__navigation',
  previousMonthButton: 'fui-CalendarDay__previousMonthButton',
  nextMonthButton: 'fui-CalendarDay__nextMonthButton',
  closeButton: 'fui-CalendarDay__closeButton',
  grid: 'fui-CalendarDay__grid',
  body: 'fui-CalendarDay__body',
} as const;

export const calendarMonthClassNames = {
  root: 'fui-CalendarMonth',
  header: 'fui-CalendarMonth__header',
  heading: 'fui-CalendarMonth__heading',
  navigation: 'fui-CalendarMonth__navigation',
  previousYearButton: 'fui-CalendarMonth__previousYearButton',
  nextYearButton: 'fui-CalendarMonth__nextYearButton',
  grid: 'fui-CalendarMonth__grid',
} as const;

export const calendarYearClassNames = {
  root: 'fui-CalendarYear',
  header: 'fui-CalendarYear__header',
  heading: 'fui-CalendarYear__heading',
  navigation: 'fui-CalendarYear__navigation',
  previousRangeButton: 'fui-CalendarYear__previousRangeButton',
  nextRangeButton: 'fui-CalendarYear__nextRangeButton',
  grid: 'fui-CalendarYear__grid',
} as const;

type ClassNameSlot = { className?: string; children?: React.ReactNode } | null | undefined;

function compose(slotProps: ClassNameSlot, ...classNames: (string | false | undefined)[]) {
  if (slotProps) {
    slotProps.className = [...classNames, slotProps.className].filter(Boolean).join(' ');
  }
}

// Upstream navigation buttons are unlabeled visually; supply the v9 glyph only when consumers did not.
function withDefaultIcon(slotProps: ClassNameSlot, icon: React.ReactNode) {
  if (slotProps && slotProps.children === undefined) {
    slotProps.children = icon;
  }
}

/**
 * Keeps the public hook's resolved slot props and metadata, but renders the styled CoreAI foundation.
 * A consumer render function still receives the styled component. Internal; not exported from the package.
 */
export function renderStyled<P extends object>(
  resolved: P,
  original: unknown,
  Styled: React.ComponentType<P>,
  elementType: React.ComponentType<P>,
): P {
  const shorthand = slot.resolveShorthand(original as P | undefined) as
    { children?: unknown } | undefined;
  const userRender =
    typeof shorthand?.children === 'function'
      ? (shorthand.children as SlotRenderFunction<P>)
      : undefined;
  const render: SlotRenderFunction<P> = (_Component, props) =>
    userRender ? userRender(Styled, props) : <Styled {...(props as P & React.Attributes)} />;
  return slot.always<P>({ children: render } as P & { children: SlotRenderFunction<P> }, {
    defaultProps: resolved,
    elementType,
  }) as P;
}

export const CalendarYear: ForwardRefComponent<CalendarYearProps> = React.forwardRef<
  HTMLDivElement,
  CalendarYearProps
>(function CalendarYear(props, ref) {
  const state = useCalendarYear(props, ref);

  compose(state.root, calendarYearClassNames.root, styles.CalendarPicker, styles.CalendarYear);
  compose(state.header, calendarYearClassNames.header, styles.CalendarPicker__header);
  compose(state.heading, calendarYearClassNames.heading, styles.CalendarPicker__heading);
  compose(state.navigation, calendarYearClassNames.navigation, styles.CalendarPicker__navigation);
  compose(
    state.previousRangeButton,
    calendarYearClassNames.previousRangeButton,
    styles.CalendarPicker__navigationButton,
  );
  compose(
    state.nextRangeButton,
    calendarYearClassNames.nextRangeButton,
    styles.CalendarPicker__navigationButton,
  );
  compose(state.grid, calendarYearClassNames.grid, styles.CalendarPicker__grid);
  withDefaultIcon(state.previousRangeButton, <ChevronUpRegular aria-hidden />);
  withDefaultIcon(state.nextRangeButton, <ChevronDownRegular aria-hidden />);

  return renderCalendarYear(state);
});

CalendarYear.displayName = 'CalendarYear';

export const CalendarMonth: ForwardRefComponent<CalendarMonthProps> = React.forwardRef<
  HTMLDivElement,
  CalendarMonthProps
>(function CalendarMonth(props, ref) {
  const state = useCalendarMonth(props, ref);

  compose(state.root, calendarMonthClassNames.root, styles.CalendarPicker);
  compose(state.header, calendarMonthClassNames.header, styles.CalendarPicker__header);
  compose(state.heading, calendarMonthClassNames.heading, styles.CalendarPicker__heading);
  compose(state.navigation, calendarMonthClassNames.navigation, styles.CalendarPicker__navigation);
  compose(
    state.previousYearButton,
    calendarMonthClassNames.previousYearButton,
    styles.CalendarPicker__navigationButton,
  );
  compose(
    state.nextYearButton,
    calendarMonthClassNames.nextYearButton,
    styles.CalendarPicker__navigationButton,
  );
  compose(state.grid, calendarMonthClassNames.grid, styles.CalendarPicker__grid);
  withDefaultIcon(state.previousYearButton, <ChevronUpRegular aria-hidden />);
  withDefaultIcon(state.nextYearButton, <ChevronDownRegular aria-hidden />);
  state.yearPicker = renderStyled<CalendarYearProps>(
    state.yearPicker,
    props.yearPicker,
    CalendarYear,
    HeadlessCalendarYear,
  );

  return renderCalendarMonth(state);
});

CalendarMonth.displayName = 'CalendarMonth';

export const CalendarDay: ForwardRefComponent<CalendarDayProps> = React.forwardRef<
  HTMLDivElement,
  CalendarDayProps
>(function CalendarDay(props, ref) {
  const state = useCalendarDay(props, ref);

  compose(state.root, calendarDayClassNames.root, styles.CalendarDay);
  compose(state.header, calendarDayClassNames.header, styles.CalendarDay__header);
  compose(state.heading, calendarDayClassNames.heading, styles.CalendarDay__heading);
  compose(state.navigation, calendarDayClassNames.navigation, styles.CalendarDay__navigation);
  compose(
    state.previousMonthButton,
    calendarDayClassNames.previousMonthButton,
    styles.CalendarDay__navigationButton,
  );
  compose(
    state.nextMonthButton,
    calendarDayClassNames.nextMonthButton,
    styles.CalendarDay__navigationButton,
  );
  compose(
    state.closeButton,
    calendarDayClassNames.closeButton,
    styles.CalendarDay__navigationButton,
  );
  compose(state.grid, calendarDayClassNames.grid, styles.CalendarDay__grid);
  compose(state.body, calendarDayClassNames.body, styles.CalendarDay__body);
  withDefaultIcon(state.previousMonthButton, <ChevronUpRegular aria-hidden />);
  withDefaultIcon(state.nextMonthButton, <ChevronDownRegular aria-hidden />);
  withDefaultIcon(state.closeButton, <DismissRegular aria-hidden />);

  return renderCalendarDay(state);
});

CalendarDay.displayName = 'CalendarDay';

export const Calendar: ForwardRefComponent<CalendarProps> = React.forwardRef<
  HTMLDivElement,
  CalendarProps
>(function Calendar(props, ref) {
  const state = useCalendar(props, ref);
  const contextValues = useCalendarContextValues(state);

  Object.assign(state.root, {
    'data-date-range-type': state.dateRangeType,
    'data-side-by-side':
      state.isDayPickerVisible && state.dayPicker && state.isMonthPickerVisible ? '' : undefined,
  });
  compose(state.root, calendarClassNames.root, styles.Calendar);
  compose(state.liveRegion, calendarClassNames.liveRegion, styles.Calendar__liveRegion);
  compose(state.divider, calendarClassNames.divider, styles.Calendar__divider);
  compose(
    state.monthPickerWrapper,
    calendarClassNames.monthPickerWrapper,
    styles.Calendar__monthPickerWrapper,
  );
  compose(
    state.goToTodayButton,
    calendarClassNames.goToTodayButton,
    styles.Calendar__goToTodayButton,
  );
  if (state.dayPicker) {
    state.dayPicker = renderStyled<CalendarDayProps>(
      state.dayPicker,
      props.dayPicker,
      CalendarDay,
      HeadlessCalendarDay,
    );
  }
  if (state.monthPicker) {
    state.monthPicker = renderStyled<CalendarMonthProps>(
      state.monthPicker,
      props.monthPicker,
      CalendarMonth,
      HeadlessCalendarMonth,
    );
  }

  return renderCalendar(state, contextValues);
});

Calendar.displayName = 'Calendar';
