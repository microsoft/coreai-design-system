// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tooltip,
  makeStyles,
} from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';

afterEach(cleanup);

const useStyles = makeStyles({
  consumerBorder: {
    border: '3px dashed rgb(255, 0, 0)',
  },
});

const ConsumerStyledPopover = () => {
  const styles = useStyles();

  return (
    <Popover open>
      <PopoverTrigger disableButtonEnhancement>
        <Button>Consumer popover trigger</Button>
      </PopoverTrigger>
      <PopoverSurface className={styles.consumerBorder}>Consumer popover</PopoverSurface>
    </Popover>
  );
};

const resolveColor = (color: string) => {
  const probe = document.createElement('span');
  probe.style.color = color;
  document.body.append(probe);
  const resolvedColor = getComputedStyle(probe).color;
  probe.remove();
  return resolvedColor;
};

const expectCoreAIOverlayBorder = (element: Element) => {
  const styles = getComputedStyle(element);
  const coreAIStroke = styles.getPropertyValue('--colorNeutralStroke3').trim();

  expect(styles.borderTopWidth).toBe('1px');
  expect(styles.borderTopStyle).toBe('solid');
  expect(styles.borderTopColor).toBe(resolveColor(coreAIStroke));
};

test('applies the shared border to Dialog, Popover, Tooltip, and Menu surfaces', async () => {
  await renderCoreAIComponent(
    <>
      <Dialog open modalType="non-modal">
        <DialogSurface>
          <DialogBody>
            <DialogContent>Dialog surface</DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Popover open>
        <PopoverTrigger disableButtonEnhancement>
          <Button>Popover trigger</Button>
        </PopoverTrigger>
        <PopoverSurface>Popover surface</PopoverSurface>
      </Popover>
      <Tooltip content="Tooltip surface" relationship="description" visible>
        <Button>Tooltip trigger</Button>
      </Tooltip>
      <Menu open>
        <MenuTrigger disableButtonEnhancement>
          <Button>Menu trigger</Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Menu item</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </>,
  );

  const surfaces = [
    document.querySelector('.fui-DialogSurface'),
    document.querySelector('.fui-PopoverSurface'),
    document.querySelector('.fui-Tooltip__content'),
    document.querySelector('.fui-MenuPopover'),
  ];

  for (const surface of surfaces) {
    expect(surface).not.toBeNull();
    expectCoreAIOverlayBorder(surface!);
  }
});

test('applies the shared border to a popover beak', async () => {
  await renderCoreAIComponent(
    <Popover open withArrow>
      <PopoverTrigger disableButtonEnhancement>
        <Button>Beak trigger</Button>
      </PopoverTrigger>
      <PopoverSurface>Popover with beak</PopoverSurface>
    </Popover>,
  );

  const surface = document.querySelector('.fui-PopoverSurface');
  const beak = surface?.firstElementChild;

  expect(beak).not.toBeNull();
  const beakStyles = getComputedStyle(beak!, '::before');
  const coreAIStroke = beakStyles.getPropertyValue('--colorNeutralStroke3').trim();

  expect(beakStyles.borderTopStyle).toBe('solid');
  expect(beakStyles.borderTopWidth).toBe('1px');
  expect(beakStyles.borderTopColor).toBe(resolveColor(coreAIStroke));
});

test('preserves consumer class and inline style precedence', async () => {
  await renderCoreAIComponent(
    <>
      <ConsumerStyledPopover />
      <Popover open>
        <PopoverTrigger disableButtonEnhancement>
          <Button>Inline popover trigger</Button>
        </PopoverTrigger>
        <PopoverSurface style={{ border: '5px dotted rgb(0, 0, 255)' }}>
          Inline styled popover
        </PopoverSurface>
      </Popover>
    </>,
  );

  const surfaces = document.querySelectorAll('.fui-PopoverSurface');
  const consumerStyles = getComputedStyle(surfaces[0]);
  const inlineStyles = getComputedStyle(surfaces[1]);

  expect(consumerStyles.borderTop).toBe('3px dashed rgb(255, 0, 0)');
  expect(inlineStyles.borderTop).toBe('5px dotted rgb(0, 0, 255)');
});

test('keeps stock Fluent border behavior when component defaults are disabled', async () => {
  await renderCoreAIComponent(
    <Popover open>
      <PopoverTrigger disableButtonEnhancement>
        <Button>Stock popover trigger</Button>
      </PopoverTrigger>
      <PopoverSurface>Stock popover</PopoverSurface>
    </Popover>,
    { providerProps: { withComponentDefaults: false } },
  );

  const surface = document.querySelector('.fui-PopoverSurface');

  expect(surface).not.toBeNull();
  const styles = getComputedStyle(surface!);
  const coreAIStroke = styles.getPropertyValue('--colorNeutralStroke3').trim();

  expect(styles.borderTopColor).not.toBe(resolveColor(coreAIStroke));
});
