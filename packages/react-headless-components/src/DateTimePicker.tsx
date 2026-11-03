// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `DateTimePicker` wraps the local `Input` with HTML's native temporal input
 * types, not the compat calendar / dropdown-list implementations. See coreai-ds#249.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/month
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/week
 *
 * `value`/`defaultValue`/`min`/`max` use local wall-clock `Date` fields. Construct
 * them with local fields (e.g. `new Date(y, m, d)`), not UTC/ISO parsing, which
 * can shift the calendar day in negative-UTC-offset timezones.
 *
 * The native picker remains browser-owned. Its icon is hidden in favor of a
 * themed button that calls `HTMLInputElement.showPicker()`. Native keyboard
 * editing, picker availability, activation requirements, and form reset remain
 * browser/Input contracts; this wrapper adds no segment-stepping or reset shim.
 */
import * as React from 'react';
import type { InputSlots } from '@fluentui/react-headless-components-preview/input';
import { bundleIcon } from '@fluentui/react-icons/headless/utils';
import {
  CalendarLtr20Filled,
  CalendarLtr20Regular,
} from '@fluentui/react-icons/headless/svg/calendar-ltr';
import { Clock20Filled, Clock20Regular } from '@fluentui/react-icons/headless/svg/clock';
import { Dismiss20Filled, Dismiss20Regular } from '@fluentui/react-icons/headless/svg/dismiss';
import {
  slot,
  useMergedRefs,
  type DistributiveOmit,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { Button } from './Button.js';
import { dateToInputValue, inputValueToDate } from './dateTimePickerValue.js';
import { Input, type InputProps } from './Input.js';
import styles from './DateTimePicker.module.css';

export type DateTimePickerType = 'date' | 'time' | 'datetime-local' | 'month' | 'week';

export type DateTimePickerOnChangeData = {
  value: Date | null;
};

/** Error categories reported from the native input's `ValidityState`. */
export type DateTimePickerErrorType = 'invalid-input' | 'out-of-bounds' | 'required-input';

export type DateTimePickerValidationResultData = {
  /** The error found when validating the input, or `undefined` if none of these categories apply. */
  error?: DateTimePickerErrorType;
};

// Distribute the omission over Input's inline-label union. A plain Omit would
// collapse its members and allow dynamicWidth without a label.
export type DateTimePickerProps = DistributiveOmit<
  InputProps,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max'
> & {
  /** Native temporal input type. @default 'date' */
  type?: DateTimePickerType;
  /** Current controlled value. `null` represents an empty input. */
  value?: Date | null;
  /** Initial uncontrolled value; also the target of the clear action when supplied. */
  defaultValue?: Date;
  /** Minimum allowable value, converted using local wall-clock fields. */
  min?: Date;
  /** Maximum allowable value, converted using local wall-clock fields. */
  max?: Date;
  /** Clear to empty, or reset to `defaultValue` if supplied. */
  clearable?: boolean;
  /** Called when the native input changes. Time values use today's local date and minute precision. */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, data: DateTimePickerOnChangeData) => void;
  /**
   * Called after `onChange` with native required, range, or malformed-input errors.
   * Pair with Field's validationState/validationMessage. Native stepMismatch and
   * customError still block native submission but have no matching error category.
   */
  onValidationResult?: (
    event: React.ChangeEvent<HTMLInputElement>,
    data: DateTimePickerValidationResultData,
  ) => void;
};

export const dateTimePickerClassNames = {
  root: 'fui-DateTimePicker',
  input: 'fui-DateTimePicker__input',
  contentAfter: 'fui-DateTimePicker__contentAfter',
  pickerButton: 'fui-DateTimePicker__pickerButton',
  clearButton: 'fui-DateTimePicker__clearButton',
  icon: 'fui-DateTimePicker__icon',
} as const;

const CalendarIcon = bundleIcon(CalendarLtr20Filled, CalendarLtr20Regular);
const ClockIcon = bundleIcon(Clock20Filled, Clock20Regular);
const ClearIcon = bundleIcon(Dismiss20Filled, Dismiss20Regular);

const pickerLabels: Record<DateTimePickerType, string> = {
  date: 'Open date picker',
  'datetime-local': 'Open date and time picker',
  month: 'Open month picker',
  week: 'Open week picker',
  time: 'Open time picker',
};

function getValidationError(validity: ValidityState): DateTimePickerErrorType | undefined {
  if (validity.valueMissing) return 'required-input';
  if (validity.rangeUnderflow || validity.rangeOverflow) return 'out-of-bounds';
  if (validity.badInput || validity.typeMismatch) return 'invalid-input';
  return undefined;
}

type RootProps = ExtractSlotProps<InputSlots['root']>;
type ContentAfterProps = ExtractSlotProps<InputSlots['contentAfter']>;

export const DateTimePicker: ForwardRefComponent<DateTimePickerProps> = React.forwardRef<
  HTMLInputElement,
  DateTimePickerProps
>(function DateTimePicker(
  {
    className,
    root,
    type = 'date',
    input,
    disabled,
    readOnly,
    contentAfter,
    value,
    defaultValue,
    min,
    max,
    clearable,
    onChange,
    onValidationResult,
    ...props
  },
  ref,
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(ref, input?.ref, inputRef);
  const nativeProps = { disabled, readOnly, ...input };
  const mutable = !nativeProps.disabled && !nativeProps.readOnly;
  const rootProps = {
    className,
    ...slot.resolveShorthand<RootProps | undefined>(root),
  };
  const afterProps = slot.resolveShorthand<ContentAfterProps | null | undefined>(contentAfter);

  // Input owns its controllable value. This shadow only determines whether
  // clearable has a value to act on; it is not a second editing/reset model.
  const [uncontrolledNativeValue, setUncontrolledNativeValue] = React.useState(() =>
    dateToInputValue(defaultValue, type),
  );
  const currentNativeValue =
    value !== undefined ? dateToInputValue(value, type) : uncontrolledNativeValue;
  const clearNativeValue = dateToInputValue(defaultValue, type);
  const showClearButton = clearable && mutable && currentNativeValue !== clearNativeValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nativeValue = event.currentTarget.value;
    const error = getValidationError(event.currentTarget.validity);
    if (value === undefined) setUncontrolledNativeValue(nativeValue);
    onChange?.(event, { value: inputValueToDate(nativeValue, type) });
    onValidationResult?.(event, { error });
  };

  // Write through the native setter, bypassing React's value tracker, then
  // dispatch input so Input and caller callbacks handle clear/reset like an edit.
  const handleClear = () => {
    const element = inputRef.current;
    if (!element || element.matches(':disabled') || element.readOnly) return;
    const ownerWindow = element.ownerDocument.defaultView;
    const prototype = (ownerWindow?.HTMLInputElement ?? HTMLInputElement).prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (!setter) return;
    setter.call(element, clearNativeValue);
    const NativeEvent = ownerWindow?.Event ?? Event;
    element.dispatchEvent(new NativeEvent('input', { bubbles: true }));
    element.focus();
  };

  const handleOpen = () => {
    const element = inputRef.current;
    if (!element || element.matches(':disabled') || element.readOnly) return;
    // Missing showPicker leaves the native editor available, not a custom popup.
    if (typeof element.showPicker === 'function') element.showPicker();
    else element.focus();
  };

  const Icon = type === 'time' ? ClockIcon : CalendarIcon;
  const iconClassName = `${dateTimePickerClassNames.icon} ${styles.DateTimePicker__icon}`;
  const actions = (
    <>
      {showClearButton && (
        <Button
          type="button"
          appearance="transparent"
          size="small"
          className={dateTimePickerClassNames.clearButton}
          icon={<ClearIcon className={iconClassName} aria-hidden />}
          aria-label="Clear value"
          onClick={handleClear}
        />
      )}
      <Button
        type="button"
        appearance="transparent"
        size="small"
        className={dateTimePickerClassNames.pickerButton}
        icon={<Icon className={iconClassName} aria-hidden />}
        disabled={!mutable}
        aria-label={pickerLabels[type]}
        onClick={handleOpen}
      />
    </>
  );
  const renderAfter: SlotRenderFunction<ContentAfterProps> = (Component, slotProps) => {
    const children = (
      <>
        {typeof afterProps?.children === 'function' ? slotProps.children : afterProps?.children}
        {actions}
      </>
    );
    return typeof afterProps?.children === 'function' ? (
      afterProps.children(Component, { ...slotProps, children })
    ) : (
      <Component {...slotProps}>{children}</Component>
    );
  };

  return (
    <Input
      {...props}
      ref={mergedRef}
      root={{
        ...rootProps,
        className: [dateTimePickerClassNames.root, styles.DateTimePicker, rootProps.className]
          .filter(Boolean)
          .join(' '),
      }}
      type={type}
      disabled={disabled}
      readOnly={readOnly}
      value={value !== undefined ? dateToInputValue(value, type) : undefined}
      defaultValue={defaultValue !== undefined ? dateToInputValue(defaultValue, type) : undefined}
      min={min !== undefined ? dateToInputValue(min, type) : undefined}
      max={max !== undefined ? dateToInputValue(max, type) : undefined}
      onChange={handleChange}
      input={{
        ...nativeProps,
        ref: mergedRef,
        className: [
          dateTimePickerClassNames.input,
          styles.DateTimePicker__input,
          nativeProps.className,
        ]
          .filter(Boolean)
          .join(' '),
      }}
      contentAfter={{
        ...afterProps,
        className: [dateTimePickerClassNames.contentAfter, afterProps?.className]
          .filter(Boolean)
          .join(' '),
        children: renderAfter,
      }}
    />
  );
});

DateTimePicker.displayName = 'DateTimePicker';
