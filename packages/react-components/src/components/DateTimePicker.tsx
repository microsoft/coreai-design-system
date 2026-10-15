// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `DateTimePicker` wraps our `Input` and restricts `type` to HTML's native
 * temporal input types, rendering the browser's own picker UI instead of the
 * `@fluentui/react-datepicker-compat` / `react-timepicker-compat` popup
 * calendar / dropdown-list implementations. See coreai-ds#249.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/month
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/week
 *
 * `value`/`defaultValue`/`min`/`max` are `Date` only (no raw strings) — the
 * ease-of-use the compat `DatePicker`/`TimePicker` offered over a bare native
 * input. Conversion to/from the native string format lives in
 * `./dateTimePickerValue`, using local wall-clock `Date` fields — construct/compare
 * these `Date`s the same way (e.g. `new Date(y, m, d)`), not via UTC/ISO parsing
 * (e.g. `new Date("2026-07-29")`), or the calendar day can shift by one in
 * negative-UTC-offset timezones.
 *
 * The browser's own calendar/clock-picker affordance is kept (opened via
 * `HTMLInputElement.showPicker()`), but its native icon is hidden in favor of
 * a themed Fluent icon button so it stays legible across CoreAI's light/dark
 * themes.
 *
 * `onValidationResult` mirrors the compat `DatePicker`'s `onValidationResult`,
 * derived from the native input's `ValidityState` (covers `min`/`max`/`required`/
 * malformed input for all 5 types for free, no extra `Date` comparisons needed).
 * Pair it with `Field`'s `validationState`/`validationMessage` - Fluent's `Input`
 * already themes the invalid state via `aria-invalid` once nested in a `Field`.
 */
import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  useMergedRefs,
  type ForwardRefComponent,
  type InputProps as FluentInputProps,
} from '@fluentui/react-components';
import {
  bundleIcon,
  CalendarLtr20Filled,
  CalendarLtr20Regular,
  Clock20Filled,
  Clock20Regular,
  Dismiss20Filled,
  Dismiss20Regular,
} from '@fluentui/react-icons';
import { Button } from './Button.js';
import { dateToInputValue, inputValueToDate } from './dateTimePickerValue.js';
import { Input } from './Input.js';
import type { InlineLabelProps } from './inlineLabelProps.js';

export type DateTimePickerType = 'date' | 'time' | 'datetime-local' | 'month' | 'week';

export type DateTimePickerOnChangeData = {
  value: Date | null;
};

/** Error types reported by `onValidationResult`, mirroring `@fluentui/react-datepicker-compat`'s `DatePickerErrorType`. */
export type DateTimePickerErrorType = 'invalid-input' | 'out-of-bounds' | 'required-input';

export type DateTimePickerValidationResultData = {
  /** The error found when validating the input, or `undefined` if the value is valid. */
  error?: DateTimePickerErrorType;
};

// `Omit` only touches `FluentInputProps` (a plain object type) here, not the
// `InlineLabelProps` discriminated union — `Omit`/`keyof` collapse a union's
// members into their common keys, which would otherwise widen `label` to
// `string | undefined` and break the "no `dynamicWidth` without `label`" check.
export type DateTimePickerProps = Omit<
  FluentInputProps,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max'
> &
  InlineLabelProps & {
    /**
     * Which native temporal input to render.
     * @default 'date'
     */
    type?: DateTimePickerType;
    /** Current value. Provide this for a controlled component; otherwise use `defaultValue`. */
    value?: Date | null;
    /** Initial value for an uncontrolled component. */
    defaultValue?: Date;
    /** The minimum allowable value. */
    min?: Date;
    /** The maximum allowable value. */
    max?: Date;
    /**
     * If set, shows an "x" button once there's a value to act on. If `defaultValue` is set, the
     * button resets the value back to `defaultValue`; otherwise it clears the value entirely.
     */
    clearable?: boolean;
    /** Called when the user changes the value. */
    onChange?: (
      event: React.ChangeEvent<HTMLInputElement>,
      data: DateTimePickerOnChangeData,
    ) => void;
    /**
     * Called after every `onChange` with the native constraint-validation result, derived from
     * the input's `ValidityState`, so `min`/`max`/`required`/malformed-input are all covered
     * without re-deriving them from the `Date` value. Pair with `Field`'s `validationState`/
     * `validationMessage` to surface it (Fluent's `Input` already themes `aria-invalid` for you).
     */
    onValidationResult?: (
      event: React.ChangeEvent<HTMLInputElement>,
      data: DateTimePickerValidationResultData,
    ) => void;
  };

const CalendarIcon = bundleIcon(CalendarLtr20Filled, CalendarLtr20Regular);
const ClockIcon = bundleIcon(Clock20Filled, Clock20Regular);
const ClearIcon = bundleIcon(Dismiss20Filled, Dismiss20Regular);

const pickerButtonConfig: Record<DateTimePickerType, { icon: React.ReactElement; label: string }> =
  {
    date: { icon: <CalendarIcon />, label: 'Open date picker' },
    'datetime-local': {
      icon: <CalendarIcon />,
      label: 'Open date and time picker',
    },
    month: { icon: <CalendarIcon />, label: 'Open month picker' },
    week: { icon: <CalendarIcon />, label: 'Open week picker' },
    time: { icon: <ClockIcon />, label: 'Open time picker' },
  };

const useStyles = makeStyles({
  // The OS-rendered `::-webkit-calendar-picker-indicator` doesn't adapt to
  // CoreAI's dark theme (it renders as a barely-visible dark glyph), so hide
  // it in favor of the themed icon button rendered in `contentAfter`.
  input: {
    '&::-webkit-calendar-picker-indicator': {
      display: 'none',
    },
  },
});

function getValidationError(validity: ValidityState): DateTimePickerErrorType | undefined {
  if (validity.valueMissing) {
    return 'required-input';
  }
  if (validity.rangeUnderflow || validity.rangeOverflow) {
    return 'out-of-bounds';
  }
  if (validity.badInput || validity.typeMismatch) {
    return 'invalid-input';
  }
  return undefined;
}

export const DateTimePicker: ForwardRefComponent<DateTimePickerProps> = React.forwardRef<
  HTMLInputElement,
  DateTimePickerProps
>((props, ref) => {
  const {
    className,
    type = 'date',
    input,
    disabled,
    contentAfter,
    value,
    defaultValue,
    min,
    max,
    clearable,
    onChange,
    onValidationResult,
    onKeyDown,
    ...rest
  } = props;
  const styles = useStyles();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(ref, inputRef);
  const { icon, label } = pickerButtonConfig[type];

  const inputObj =
    typeof input === 'object' && input !== null && !React.isValidElement(input)
      ? (input as Record<string, unknown>)
      : {};

  // `Input` (via `useInputBase_unstable`) always tracks `value` in its own controllable state,
  // even when this component is used uncontrolled (no `value` prop). Track a shadow copy here
  // too, just so `clearable` knows whether there's currently a value to act on, without needing
  // to lift that state up to the caller.
  const [uncontrolledNativeValue, setUncontrolledNativeValue] = React.useState(() =>
    dateToInputValue(defaultValue ?? null, type),
  );
  const currentNativeValue =
    value !== undefined ? dateToInputValue(value, type) : uncontrolledNativeValue;

  // The native input's year-segment up/down-arrow stepping can wrap past `max`/`min` instead of
  // clamping (a Chromium quirk: stepping the year above `max` jumps it down to `min` - or year
  // 0001 if `min` is unset - rather than stopping at the boundary). Legitimate segment cycling
  // (e.g. month rolling from December to January) never changes the year, so treat any arrow-key
  // step that moves the year the "wrong" way as a wraparound and undo it.
  const arrowStepDirectionRef = React.useRef<'up' | 'down' | null>(null);
  const preArrowStepValueRef = React.useRef('');

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        arrowStepDirectionRef.current = event.key === 'ArrowUp' ? 'up' : 'down';
        preArrowStepValueRef.current = event.currentTarget.value;
      } else {
        arrowStepDirectionRef.current = null;
      }
      onKeyDown?.(event);
    },
    [onKeyDown],
  );

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const arrowDirection = arrowStepDirectionRef.current;
      arrowStepDirectionRef.current = null;
      if (arrowDirection) {
        const prevYear = inputValueToDate(preArrowStepValueRef.current, type)?.getFullYear();
        const nextYear = inputValueToDate(event.target.value, type)?.getFullYear();
        const wrapped =
          prevYear !== undefined &&
          nextYear !== undefined &&
          (arrowDirection === 'up' ? nextYear < prevYear : nextYear > prevYear);
        if (wrapped) {
          event.target.value = preArrowStepValueRef.current;
          return;
        }
      }
      if (value === undefined) {
        setUncontrolledNativeValue(event.target.value);
      }
      onChange?.(event, {
        value: inputValueToDate(event.target.value, type),
      });
      onValidationResult?.(event, {
        error: getValidationError(event.target.validity),
      });
    },
    [onChange, onValidationResult, type, value],
  );

  // Writes through the native setter (bypassing React's tracked value) then dispatches a real
  // `input` event, so `Input`'s own controllable state - and this component's `handleChange` -
  // pick it up exactly as if the user had typed/picked it, whether controlled or uncontrolled.
  const setNativeValue = React.useCallback((nativeValue: string) => {
    const el = inputRef.current;
    if (!el) {
      return;
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, nativeValue);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  }, []);

  // With `defaultValue` set, clearing means resetting back to it rather than to empty.
  const clearNativeValue = defaultValue !== undefined ? dateToInputValue(defaultValue, type) : '';

  const handleClear = React.useCallback(() => {
    setNativeValue(clearNativeValue);
  }, [setNativeValue, clearNativeValue]);

  const showClearButton = clearable && !disabled && currentNativeValue !== clearNativeValue;

  return (
    <Input
      ref={mergedRef}
      className={mergeClasses('fui-DateTimePicker', className)}
      type={type}
      disabled={disabled}
      value={value !== undefined ? dateToInputValue(value, type) : undefined}
      defaultValue={defaultValue !== undefined ? dateToInputValue(defaultValue, type) : undefined}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min={min !== undefined ? dateToInputValue(min, type) : undefined}
      max={max !== undefined ? dateToInputValue(max, type) : undefined}
      input={{
        ...inputObj,
        className: mergeClasses(inputObj.className as string | undefined, styles.input),
      }}
      contentAfter={
        <>
          {contentAfter}
          {showClearButton && (
            <Button
              appearance="transparent"
              size="small"
              icon={<ClearIcon />}
              aria-label="Clear value"
              onClick={handleClear}
            />
          )}
          <Button
            appearance="transparent"
            size="small"
            icon={icon}
            disabled={disabled}
            aria-label={label}
            onClick={() => inputRef.current?.showPicker()}
          />
        </>
      }
      {...rest}
    />
  );
}) as ForwardRefComponent<DateTimePickerProps>;

DateTimePicker.displayName = 'DateTimePicker';
