// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  type ForwardRefComponent,
} from '@fluentui/react-components';
import {
  getDotGridCircles,
  getDotGridLayout,
  type DotGridData,
  type DotGridRenderOptions,
} from '../illicons/dotGridGeometry.js';

export type IlliconProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> &
  (
    | (DotGridRenderOptions & { data: DotGridData; children?: never; size?: never })
    | {
        data?: never;
        radius?: never;
        pitch?: never;
        /** Display width for custom SVG artwork only. Grids use cells times pitch. */
        size?: number;
        /** Trusted inline SVG. Use currentColor for theme-aware paint; geometry is not rewritten. */
        children: React.ReactElement<React.SVGProps<SVGSVGElement>>;
      }
  );

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexShrink: 0,
    color: tokens.colorNeutralForeground1,
  },
  svg: {
    display: 'block',
    flexShrink: 0,
  },
  customSvg: {
    width: '100%',
    height: 'auto',
  },
});

/**
 * Renders saved occupancy as SVG circles, or preserves custom inline SVG artwork.
 * Supply aria-label/aria-labelledby for meaningful images; otherwise it is decorative.
 * Convert source icons separately with iconToDotGrid before rendering.
 */
export const Illicon: ForwardRefComponent<IlliconProps> = React.forwardRef<
  HTMLSpanElement,
  IlliconProps
>((props, ref) => {
  const {
    data,
    children,
    radius,
    pitch,
    size,
    className,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  } = props;
  const styles = useStyles();
  if (data !== undefined && size !== undefined) {
    throw new Error(
      'Illicon: size applies only to custom SVG artwork; grids use cells times pitch.',
    );
  }
  if (size !== undefined && (!Number.isFinite(size) || size <= 0)) {
    throw new Error('Illicon: size must be positive and finite.');
  }
  if ((data !== undefined) === (children !== undefined)) {
    throw new Error('Illicon: provide either grid data or one inline SVG, not both.');
  }
  const layout = data === undefined ? undefined : getDotGridLayout(data, { radius, pitch });
  const labelled = Boolean(ariaLabel || ariaLabelledBy);
  return (
    <span
      ref={ref}
      role={labelled ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-hidden={labelled ? undefined : true}
      className={mergeClasses('fui-Illicon', styles.root, className)}
      style={{ width: size ?? layout?.width, ...style }}
      {...rest}
    >
      {data !== undefined && layout ? (
        <svg
          className={styles.svg}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          fill="currentColor"
          focusable="false"
          aria-hidden="true"
        >
          {Array.from(getDotGridCircles(data, layout.pitch, layout.radius), ({ cx, cy }) => (
            <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={layout.radius} />
          ))}
        </svg>
      ) : children ? (
        React.cloneElement(children, {
          className: mergeClasses(styles.svg, styles.customSvg, children.props.className),
          focusable: 'false',
          'aria-hidden': true,
        })
      ) : null}
    </span>
  );
}) as ForwardRefComponent<IlliconProps>;

Illicon.displayName = 'Illicon';
