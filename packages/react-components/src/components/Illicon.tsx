// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `Illicon` — turns a filled Fluent icon or SVG element into a dotted illustration.
 *
 * Original vector paths are sampled at the requested output size. Dots have
 * a fixed 2px diameter and 3px gap. Rasterized occupancy is cached per icon and size.
 * Output uses CSS-pixel coordinates and preserves the source aspect ratio.
 */
import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  type ForwardRefComponent,
} from '@fluentui/react-components';
import type { FluentIcon } from '@fluentui/react-icons';
import {
  buildDottedPath,
  getDotSettings,
  peekRasterizedIcon,
  rasterizeIcon,
} from './illiconRasterize.js';

export type IlliconSize = number;
export type IlliconIcon = FluentIcon | React.ReactElement<React.SVGProps<SVGSVGElement>>;

export type IlliconProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /**
   * Fluent icon component or SVG element; Fluent Filled icons are recommended.
   * Custom SVGs require static, flattened filled paths without strokes, transforms,
   * effects, or external CSS. Use omitted fill, currentColor, or opaque named/3-/6-digit
   * hex colors via SVG attributes. Paths merge into one color; viewBox sets the aspect ratio.
   * Results are cached by icon identity and size. Reuse SVG elements for caching;
   * provide a new element when geometry changes.
   */
  icon: IlliconIcon;
  /**
   * Output SVG viewport width in CSS pixels. Must be a positive, finite whole number.
   * The height follows the source viewBox aspect ratio, preserving its internal whitespace
   * and path positioning. A minimum of 100px is recommended for visual clarity but not
   * enforced; smaller sizes remain supported but may lose recognizable details depending
   * on icon complexity. Dots retain their fixed 2px diameter and 3px gap at every size.
   *
   * @default 100
   */
  size?: IlliconSize;
};

// Layout effects don't run during SSR, so this only matters for the warning
// React logs when `useLayoutEffect` is referenced in a server render; fall
// back to `useEffect` there instead.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

const useIlliconStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexShrink: 0,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  svg: {
    display: 'block',
  },
});

/**
 * Turns a filled Fluent icon or SVG element into a dotted illustration. Pass
 * an accessible name via `aria-label` or `aria-labelledby` for a meaningful
 * image; omit both to treat the icon as decorative.
 */
export const Illicon: ForwardRefComponent<IlliconProps> = React.forwardRef<
  HTMLSpanElement,
  IlliconProps
>((props, ref) => {
  const {
    icon,
    size = 100,
    className,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  } = props;
  const styles = useIlliconStyles();
  const sourceRef = React.useRef<HTMLSpanElement>(null);
  const [, forceRerender] = React.useReducer((n: number) => n + 1, 0);

  getDotSettings(size);
  const rasterizedIcon = peekRasterizedIcon(icon, size);

  // A new icon/size pair samples the original paths before paint.
  useIsomorphicLayoutEffect(() => {
    if (rasterizedIcon) return;
    const svg = sourceRef.current?.querySelector('svg');
    if (svg) {
      rasterizeIcon(icon, svg, size);
      forceRerender();
    }
  }, [icon, rasterizedIcon, size]);

  const renderedHeight = rasterizedIcon ? rasterizedIcon.height : size;
  const dottedPath = React.useMemo(
    () => (rasterizedIcon ? buildDottedPath(rasterizedIcon) : ''),
    [rasterizedIcon],
  );

  const labelled = Boolean(ariaLabel || ariaLabelledBy);

  return (
    <span
      ref={ref}
      role={labelled ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-hidden={labelled ? undefined : true}
      className={mergeClasses('fui-Illicon', styles.root, className)}
      style={{ width: size, height: renderedHeight, ...style }}
      {...rest}
    >
      {rasterizedIcon ? (
        <svg
          className={styles.svg}
          width={size}
          height={renderedHeight}
          viewBox={`0 0 ${size} ${renderedHeight}`}
          focusable="false"
          aria-hidden="true"
        >
          <path d={dottedPath} fill="currentColor" />
        </svg>
      ) : (
        // Rendered only until the icon is sampled; never visible.
        <span ref={sourceRef} hidden>
          {React.isValidElement(icon) ? icon : React.createElement(icon)}
        </span>
      )}
    </span>
  );
}) as ForwardRefComponent<IlliconProps>;

Illicon.displayName = 'Illicon';
