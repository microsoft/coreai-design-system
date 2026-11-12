// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Calendar as HeadlessCalendar } from '@fluentui/react-headless-components-preview/calendar';
import {
  renderDatePicker,
  useDatePicker,
  type DatePickerButtonProps as HeadlessDatePickerButtonProps,
  type DatePickerInputProps as HeadlessDatePickerInputProps,
  type DatePickerProps as HeadlessDatePickerProps,
} from '@fluentui/react-headless-components-preview/date-picker';
import { useFieldContext } from '@fluentui/react-headless-components-preview/field';
import { CalendarLtrRegular } from '@fluentui/react-icons/headless/svg/calendar-ltr';
import { Calendar, renderStyled, type CalendarProps } from './Calendar.js';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import styles from './DatePicker.module.css';
import overrides from './DatePicker.overrides.module.css';

export {
  defaultFormatDate,
  defaultParseDate,
} from '@fluentui/react-headless-components-preview/date-picker';
export type {
  DatePickerCalendarProps,
  DatePickerDateChangeData,
  DatePickerErrorMessageData,
  DatePickerErrorType,
  DatePickerOpenChangeData,
  DatePickerSlots,
  DatePickerState,
  DatePickerValidationResultData,
} from '@fluentui/react-headless-components-preview/date-picker';

export const datePickerClassNames = {
  root: 'fui-DatePicker',
  input: 'fui-DatePicker__input',
  trigger: 'fui-DatePicker__trigger',
  displayValue: 'fui-DatePicker__displayValue',
  icon: 'fui-DatePicker__icon',
  errorMessage: 'fui-DatePicker__errorMessage',
  popupSurface: 'fui-DatePicker__popupSurface',
  calendar: 'fui-DatePicker__calendar',
} as const;

type DatePickerVisualProps = {
  /** Field chrome, matching Input. @default 'filled-darker' */
  appearance?: 'outline' | 'underline' | 'filled-darker' | 'filled-lighter';
  /** Inherits Field size when omitted. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
};

export type DatePickerButtonProps = HeadlessDatePickerButtonProps & DatePickerVisualProps;
export type DatePickerInputProps = HeadlessDatePickerInputProps & DatePickerVisualProps;
export type DatePickerProps = DatePickerButtonProps | DatePickerInputProps;

/** The ref targets the field control: a button by default, or the input with `allowTextInput`. */
export type DatePickerComponent = React.NamedExoticComponent<
  | (DatePickerButtonProps & React.RefAttributes<HTMLButtonElement>)
  | (DatePickerInputProps & React.RefAttributes<HTMLInputElement>)
>;

const DatePickerBase = React.forwardRef<HTMLButtonElement | HTMLInputElement, DatePickerProps>(
  function DatePicker({ appearance = 'filled-darker', size: sizeProp, ...props }, ref) {
    const field = useFieldContext();
    const defaultsEnabled = useCoreAIDefaults();
    const size = sizeProp ?? field?.size ?? 'medium';
    const state = useDatePicker(props as HeadlessDatePickerProps, ref);

    Object.assign(state.root, {
      'data-appearance': appearance,
      'data-size': size,
    });
    state.root.className = [datePickerClassNames.root, styles.DatePicker, state.root.className]
      .filter(Boolean)
      .join(' ');
    if (state.input) {
      state.input.className = [
        datePickerClassNames.input,
        styles.DatePicker__input,
        state.input.className,
      ]
        .filter(Boolean)
        .join(' ');
    }
    if (state.trigger) {
      state.trigger.className = [
        datePickerClassNames.trigger,
        styles.DatePicker__trigger,
        state.trigger.className,
      ]
        .filter(Boolean)
        .join(' ');
    }
    state.displayValue.className = [
      datePickerClassNames.displayValue,
      styles.DatePicker__displayValue,
      state.displayValue.className,
    ]
      .filter(Boolean)
      .join(' ');
    if (state.icon) {
      state.icon.className = [
        datePickerClassNames.icon,
        styles.DatePicker__icon,
        state.icon.className,
      ]
        .filter(Boolean)
        .join(' ');
      state.icon.children ??= <CalendarLtrRegular />;
    }
    if (state.errorMessage) {
      state.errorMessage.className = [
        datePickerClassNames.errorMessage,
        styles.DatePicker__errorMessage,
        state.errorMessage.className,
      ]
        .filter(Boolean)
        .join(' ');
    }
    state.popupSurface.className = [
      datePickerClassNames.popupSurface,
      styles.DatePicker__popupSurface,
      defaultsEnabled && overrides.DatePicker__popupSurface,
      state.popupSurface.className,
    ]
      .filter(Boolean)
      .join(' ');
    state.calendar.className = [datePickerClassNames.calendar, state.calendar.className]
      .filter(Boolean)
      .join(' ');
    state.calendar = renderStyled<CalendarProps>(
      state.calendar,
      props.calendar,
      Calendar,
      HeadlessCalendar,
    );

    return renderDatePicker(state);
  },
);

export const DatePicker = DatePickerBase as DatePickerComponent;

DatePicker.displayName = 'DatePicker';
