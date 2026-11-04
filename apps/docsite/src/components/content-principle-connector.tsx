// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';

interface ConnectorGraph {
  x: number;
  start: number;
  branches: { x: number; y: number }[];
}

export function ContentPrincipleConnector() {
  const ref = React.useRef<SVGSVGElement>(null);
  const [graph, setGraph] = React.useState<ConnectorGraph | null>(null);

  React.useLayoutEffect(() => {
    const svg = ref.current;
    const root = svg?.closest<HTMLElement>('.content-principle');
    if (!root || !svg) return;
    const update = () => {
      const bounds = svg.getBoundingClientRect();
      const number = root.querySelector('.content-principle__number')?.getBoundingClientRect();
      const branches = [
        ...root.querySelectorAll(
          '.content-example > .fui-Badge, .content-principle__guidance > .fui-Badge',
        ),
      ]
        .map((badge) => badge.getBoundingClientRect())
        .filter((badge) => badge.height > 0)
        .map((badge) => ({
          x: badge.left - bounds.left,
          y: badge.top - bounds.top + badge.height / 2,
        }));
      setGraph(
        number && branches.length
          ? {
              x: number.left - bounds.left + number.width / 2,
              start: number.bottom - bounds.top,
              branches,
            }
          : null,
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    update();
    return () => observer.disconnect();
  }, []);

  return (
    <svg ref={ref} className="content-principle-connector" aria-hidden="true">
      {graph ? (
        <>
          <path
            d={`M ${graph.x} ${graph.start} V ${graph.branches[graph.branches.length - 1].y - 12}`}
          />
          {graph.branches.map((branch, index) => (
            <path
              key={index}
              d={`M ${graph.x} ${branch.y - 12} Q ${graph.x} ${branch.y} ${graph.x + 12} ${branch.y} H ${branch.x}`}
            />
          ))}
        </>
      ) : null}
    </svg>
  );
}
