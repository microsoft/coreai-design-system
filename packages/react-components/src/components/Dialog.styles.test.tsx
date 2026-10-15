// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
} from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';

afterEach(cleanup);

const useStyles = makeStyles({
  surface: { padding: '30px' },
  body: { gap: '12px' },
  content: { margin: '0', padding: '6px' },
});

const DialogFixture = ({ consumerStyles = false }: { consumerStyles?: boolean }) => {
  const styles = useStyles();

  return (
    <Dialog open modalType="non-modal">
      <DialogSurface className={consumerStyles ? styles.surface : undefined}>
        <DialogBody className={consumerStyles ? styles.body : undefined}>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogContent className={consumerStyles ? styles.content : undefined}>
            Dialog content
          </DialogContent>
          <DialogActions>Dialog actions</DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

const getDialogElements = () => {
  const surface = document.querySelector('.fui-DialogSurface');
  const body = document.querySelector('.fui-DialogBody');
  const content = document.querySelector('.fui-DialogContent');

  expect(surface).not.toBeNull();
  expect(body).not.toBeNull();
  expect(content).not.toBeNull();

  return { surface: surface!, body: body!, content: content! };
};

test('applies CoreAI spacing and content layout to Dialog slots', async () => {
  await renderCoreAIComponent(<DialogFixture />);

  const { surface, body, content } = getDialogElements();
  const surfaceStyles = getComputedStyle(surface);
  const bodyStyles = getComputedStyle(body);
  const contentStyles = getComputedStyle(content);

  expect(surfaceStyles.getPropertyValue('--fui-Dialog--spacing').trim()).toBe('16px');
  expect(surfaceStyles.padding).toBe('16px');
  expect(bodyStyles.gap).toBe('16px');
  expect(contentStyles.marginLeft).toBe('-16px');
  expect(contentStyles.marginRight).toBe('-16px');
  expect(contentStyles.paddingTop).toBe('0px');
  expect(contentStyles.paddingRight).toBe('16px');
  expect(contentStyles.paddingBottom).toBe('16px');
  expect(contentStyles.paddingLeft).toBe('16px');
});

test('adds the Dialog body divider before the actions row', async () => {
  await renderCoreAIComponent(<DialogFixture />);

  const { body } = getDialogElements();
  const dividerStyles = getComputedStyle(body, '::before');

  expect(dividerStyles.content).not.toBe('none');
  expect(dividerStyles.borderBottomStyle).toBe('solid');
  expect(dividerStyles.borderBottomWidth).toBe('1px');
  expect(dividerStyles.pointerEvents).toBe('none');
});

test('preserves consumer classes and explicit style props on styled Dialog slots', async () => {
  await renderCoreAIComponent(
    <>
      <DialogFixture consumerStyles />
      <Dialog open modalType="non-modal">
        <DialogSurface style={{ padding: '40px' }}>
          <DialogBody style={{ gap: '20px' }}>
            <DialogContent style={{ margin: '2px', padding: '10px' }}>
              Inline Dialog content
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>,
  );

  const surfaces = document.querySelectorAll('.fui-DialogSurface');
  const bodies = document.querySelectorAll('.fui-DialogBody');
  const contents = document.querySelectorAll('.fui-DialogContent');

  expect(getComputedStyle(surfaces[0]).padding).toBe('30px');
  expect(getComputedStyle(bodies[0]).gap).toBe('12px');
  expect(getComputedStyle(contents[0]).margin).toBe('0px');
  expect(getComputedStyle(contents[0]).padding).toBe('6px');
  expect(getComputedStyle(surfaces[1]).padding).toBe('40px');
  expect(getComputedStyle(bodies[1]).gap).toBe('20px');
  expect(getComputedStyle(contents[1]).margin).toBe('2px');
  expect(getComputedStyle(contents[1]).padding).toBe('10px');
});

test('keeps stock Fluent Dialog spacing when component defaults are disabled', async () => {
  await renderCoreAIComponent(<DialogFixture />, {
    providerProps: { withComponentDefaults: false },
  });

  const { surface, body, content } = getDialogElements();
  const surfaceStyles = getComputedStyle(surface);
  const bodyStyles = getComputedStyle(body);
  const contentStyles = getComputedStyle(content);

  expect(surfaceStyles.getPropertyValue('--fui-Dialog--spacing')).toBe('');
  expect(surfaceStyles.padding).not.toBe('16px');
  expect(bodyStyles.gap).not.toBe('16px');
  expect(contentStyles.marginLeft).not.toBe('-16px');
  expect(contentStyles.paddingLeft).not.toBe('16px');
});
