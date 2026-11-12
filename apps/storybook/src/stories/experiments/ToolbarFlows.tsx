// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  ToolbarToggleButton,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  useToolbarContext,
  type ToolbarProps,
} from '@coreai-ds/react-headless-components';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import { ToolbarFixtureGlyph } from './ToolbarComparison.js';
import styles from './ToolbarComparison.module.css';

const initialChecked = { format: ['bold'], align: ['left'] };

function ToolbarContextStatus() {
  const checked = useToolbarContext((context) => context.checkedValues);
  const size = useToolbarContext((context) => context.size);
  const vertical = useToolbarContext((context) => context.vertical);
  return (
    <output
      aria-label="Public Toolbar context"
      data-context-checked={JSON.stringify(checked)}
      data-context-size={size}
      data-context-vertical={String(vertical)}
    />
  );
}

function ReadyToolbarEditingFlow({
  controlled,
  vertical,
  onCheckedValueChange,
}: {
  controlled: boolean;
  vertical: boolean;
  onCheckedValueChange?: ToolbarProps['onCheckedValueChange'];
}) {
  const [checked, setChecked] = React.useState<Record<string, string[]>>(initialChecked);
  const [text, setText] = React.useState('Draft');
  const [lastAction, setLastAction] = React.useState('none');
  const [changeCount, setChangeCount] = React.useState(0);
  const [change, setChange] = React.useState<{ name: string; checkedItems: string[] }>({
    name: '',
    checkedItems: [],
  });
  const rootProps = controlled
    ? { checkedValues: checked }
    : { defaultCheckedValues: initialChecked };
  return (
    <div className={styles.flow}>
      <div data-testid="toolbar-pointer-rest">Pointer rest</div>
      <button type="button">Before toolbar</button>
      <Toolbar
        {...rootProps}
        aria-label="Document formatting"
        className={styles.flowToolbar}
        vertical={vertical}
        onCheckedValueChange={(event, data) => {
          setChecked((previous) => ({ ...previous, [data.name]: data.checkedItems }));
          setChange(data);
          setChangeCount((count) => count + 1);
          onCheckedValueChange?.(event, data);
        }}
      >
        <ToolbarButton onClick={() => setLastAction('save')} icon={<ToolbarFixtureGlyph />}>
          Save draft
        </ToolbarButton>
        <ToolbarButton disabled onClick={() => setLastAction('disabled')}>
          Delete unavailable
        </ToolbarButton>
        <ToolbarGroup>
          <ToolbarToggleButton name="format" value="bold" icon={<ToolbarFixtureGlyph />}>
            Bold
          </ToolbarToggleButton>
          <ToolbarToggleButton name="format" value="italic" icon={<ToolbarFixtureGlyph />}>
            Italic
          </ToolbarToggleButton>
          <ToolbarToggleButton
            name="format"
            value="locked"
            disabledFocusable
            onClick={() => setLastAction('disabled-focusable')}
          >
            Lock unavailable
          </ToolbarToggleButton>
        </ToolbarGroup>
        <ToolbarDivider />
        <ToolbarRadioGroup aria-label="Text alignment">
          <ToolbarRadioButton name="align" value="left">
            Align left
          </ToolbarRadioButton>
          <ToolbarRadioButton name="align" value="center">
            Align center
          </ToolbarRadioButton>
          <ToolbarRadioButton name="align" value="right" disabled>
            Align right unavailable
          </ToolbarRadioButton>
        </ToolbarRadioGroup>
        <ToolbarContextStatus />
      </Toolbar>
      <button type="button">After toolbar</button>
      <label>
        Document content
        <textarea
          className={styles.editor}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          style={{
            fontWeight: checked.format.includes('bold') ? 'bold' : 'normal',
            fontStyle: checked.format.includes('italic') ? 'italic' : 'normal',
            textAlign: checked.align.includes('center') ? 'center' : 'left',
          }}
        />
      </label>
      <output
        aria-label="Toolbar editing events"
        data-toolbar-change-count={changeCount}
        data-toolbar-change-name={change.name}
        data-toolbar-change-items={JSON.stringify(change.checkedItems)}
        data-toolbar-last-action={lastAction}
        data-toolbar-text={text}
      >
        {JSON.stringify(checked)}
      </output>
    </div>
  );
}

export function ToolbarEditingFlow({
  controlled = true,
  vertical = false,
  onCheckedValueChange,
}: {
  controlled?: boolean;
  vertical?: boolean;
  onCheckedValueChange?: ToolbarProps['onCheckedValueChange'];
}) {
  return (
    <FocusgroupConsumer>
      <ReadyToolbarEditingFlow
        controlled={controlled}
        vertical={vertical}
        onCheckedValueChange={onCheckedValueChange}
      />
    </FocusgroupConsumer>
  );
}

function ReadyToolbarDynamicFlow() {
  const [mounted, setMounted] = React.useState(false);
  const [group, setGroup] = React.useState(false);
  return (
    <div className={styles.flow}>
      <div data-testid="toolbar-dynamic-pointer-rest">Pointer rest</div>
      <button type="button" onClick={() => setMounted((value) => !value)}>
        {mounted ? 'Unmount additional toolbar' : 'Mount additional toolbar'}
      </button>
      <button type="button" onClick={() => setGroup((value) => !value)}>
        {group ? 'Remove action group' : 'Add action group'}
      </button>
      <Toolbar aria-label="Dynamic primary commands" className={styles.flowToolbar}>
        <ToolbarButton>First command</ToolbarButton>
        <ToolbarButton>Second command</ToolbarButton>
        {group && (
          <ToolbarGroup>
            <ToolbarButton>Added command</ToolbarButton>
            <ToolbarButton>Final added command</ToolbarButton>
          </ToolbarGroup>
        )}
      </Toolbar>
      {mounted && (
        <Toolbar aria-label="Additional commands" className={styles.flowToolbar}>
          <ToolbarButton>Additional first</ToolbarButton>
          <ToolbarGroup>
            <ToolbarButton>Additional second</ToolbarButton>
            <ToolbarButton>Additional last</ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
      )}
      <button type="button">After dynamic toolbars</button>
    </div>
  );
}

export function ToolbarDynamicFlow() {
  return (
    <FocusgroupConsumer>
      <ReadyToolbarDynamicFlow />
    </FocusgroupConsumer>
  );
}

function ReadyToolbarFormFlow() {
  const [payload, setPayload] = React.useState('');
  const [previews, setPreviews] = React.useState(0);
  const [vetoed, setVetoed] = React.useState(false);
  return (
    <form
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        const submitter =
          event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : undefined;
        setPayload(JSON.stringify([...new FormData(event.currentTarget, submitter).entries()]));
      }}
    >
      <label>
        Document title
        <input name="title" defaultValue="Draft" />
      </label>
      <Toolbar
        aria-label="Native form actions"
        className={styles.flowToolbar}
        defaultCheckedValues={{ format: [] }}
      >
        <ToolbarButton type="submit" name="action" value="save">
          Save document
        </ToolbarButton>
        <ToolbarButton onClick={() => setPreviews((count) => count + 1)}>
          Preview document
        </ToolbarButton>
        <ToolbarToggleButton name="format" value="bold">
          Form bold
        </ToolbarToggleButton>
        <ToolbarButton type="reset">Reset document</ToolbarButton>
        <ToolbarButton
          as="a"
          href="#toolbar-preview"
          onClick={(event) => {
            event.preventDefault();
            setVetoed(event.defaultPrevented);
          }}
        >
          Veto navigation
        </ToolbarButton>
      </Toolbar>
      <output
        aria-label="Toolbar form result"
        data-toolbar-form-payload={payload}
        data-toolbar-previews={previews}
        data-toolbar-navigation-vetoed={String(vetoed)}
      >
        {payload || 'Not submitted'}
      </output>
    </form>
  );
}

export function ToolbarFormFlow() {
  return (
    <FocusgroupConsumer>
      <ReadyToolbarFormFlow />
    </FocusgroupConsumer>
  );
}

function ReadyToolbarMenuFlow() {
  const [action, setAction] = React.useState('none');
  return (
    <div className={styles.flow}>
      <div data-testid="toolbar-menu-pointer-rest">Pointer rest</div>
      <Toolbar aria-label="Document commands" className={styles.flowToolbar}>
        <ToolbarButton>New document</ToolbarButton>
        <ToolbarButton>Open document</ToolbarButton>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <ToolbarButton>More document commands</ToolbarButton>
          </MenuTrigger>
          <MenuPopover data-testid="toolbar-menu-surface">
            <MenuList>
              <MenuItem onClick={() => setAction('rename')}>Rename document</MenuItem>
              <MenuItem onClick={() => setAction('duplicate')}>Duplicate document</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Toolbar>
      <output aria-label="Toolbar menu result" data-toolbar-menu-action={action}>
        {action}
      </output>
    </div>
  );
}

export function ToolbarMenuFlow() {
  return (
    <FocusgroupConsumer>
      <ReadyToolbarMenuFlow />
    </FocusgroupConsumer>
  );
}
