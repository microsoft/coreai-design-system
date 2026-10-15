// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export * from '@fluentui/react-components';

export * from './theme/theme.js';
export * from './theme/azureTheme.js';
export { useCoreAIGlobalStyles } from './theme/globalStyles.js';
export {
  CoreAIFluentProvider,
  type CoreAIFluentProviderProps,
} from './contexts/CoreAIFluentProvider.js';

// Explicit exports shadow matching names from the Fluent star export above.
export { Button, type ButtonProps } from './components/Button.js';
export { CompoundButton, type CompoundButtonProps } from './components/CompoundButton.js';
export { MenuButton, type MenuButtonProps } from './components/MenuButton.js';
export { SearchBox, type SearchBoxProps } from './components/SearchBox.js';
export { Select, type SelectProps } from './components/Select.js';
export { SpinButton, type SpinButtonProps } from './components/SpinButton.js';
export { SplitButton, type SplitButtonProps } from './components/SplitButton.js';
export { SwatchPicker, type SwatchPickerProps } from './components/SwatchPicker.js';
export { TagPicker, type TagPickerProps } from './components/TagPicker.js';
export { Textarea, type TextareaProps } from './components/Textarea.js';
export { ToggleButton, type ToggleButtonProps } from './components/ToggleButton.js';

export { Avatar, type AvatarProps, type AvatarColor } from './components/Avatar.js';
export { Card, type CardProps, type CardFloatingActionPosition } from './components/Card.js';
export { TabList, type TabListAppearance, type TabListProps } from './components/TabList.js';
export { Dropdown, type DropdownProps } from './components/Dropdown.js';
export { DropdownButton, type DropdownButtonProps } from './components/DropdownButton.js';
export { Combobox, type ComboboxProps } from './components/Combobox.js';
export { Input, type InputProps } from './components/Input.js';
export {
  DateTimePicker,
  type DateTimePickerProps,
  type DateTimePickerType,
  type DateTimePickerOnChangeData,
  type DateTimePickerErrorType,
  type DateTimePickerValidationResultData,
} from './components/DateTimePicker.js';
export { Link, type LinkProps } from './components/Link.js';
export {
  MessageBar,
  type MessageBarProps,
  type MessageBarIntent,
} from './components/MessageBar.js';
export { Text, type TextProps, type TextForeground, type TextPreset } from './components/Text.js';
export { LinkButton, type LinkButtonProps } from './components/LinkButton.js';
export { CopyButton, type CopyButtonProps } from './components/CopyButton.js';
export { InfoButton, type InfoButtonProps } from './components/InfoButton.js';
export { CodeBlock, type CodeBlockProps } from './components/CodeBlock.js';
export { Markdown, type MarkdownProps } from './components/Markdown.js';
export {
  DataGrid,
  type DataGridProps,
  type DataGridColumnFlexOption,
  type DataGridColumnFlexOptions,
} from './components/DataGrid.js';
export {
  DataGridHeaderCell,
  type DataGridHeaderCellProps,
} from './components/DataGridHeaderCell.js';
export { DataGridCell, type DataGridCellProps } from './components/DataGridCell.js';

export { FileUpload, type FileUploadProps, type FileUploadState } from './components/FileUpload.js';

// Deprecated Fluent `Nav` primitives. Explicit exports preserve CoreAI's
// deprecation metadata over the Fluent star export above.
export {
  AppItem,
  AppItemStatic,
  Hamburger,
  Nav,
  NavCategory,
  NavCategoryItem,
  NavDivider,
  NavDrawer,
  NavDrawerBody,
  NavDrawerFooter,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  NavSubItem,
  NavSubItemGroup,
  SplitNavItem,
  type AppItemProps,
  type AppItemSlots,
  type AppItemState,
  type AppItemStaticProps,
  type AppItemStaticSlots,
  type AppItemStaticState,
  type HamburgerProps,
  type HamburgerState,
  type NavProps,
  type NavSlots,
  type NavState,
  type NavCategoryProps,
  type NavCategoryState,
  type NavCategoryItemProps,
  type NavCategoryItemSlots,
  type NavCategoryItemState,
  type NavDividerProps,
  type NavDividerState,
  type NavDrawerProps,
  type NavDrawerSlots,
  type NavDrawerState,
  type NavDrawerBodyProps,
  type NavDrawerBodySlots,
  type NavDrawerBodyState,
  type NavDrawerFooterProps,
  type NavDrawerFooterSlots,
  type NavDrawerFooterState,
  type NavDrawerHeaderProps,
  type NavDrawerHeaderSlots,
  type NavDrawerHeaderState,
  type NavItemProps,
  type NavItemSlots,
  type NavItemState,
  type NavSectionHeaderProps,
  type NavSectionHeaderSlots,
  type NavSectionHeaderState,
  type NavSubItemProps,
  type NavSubItemSlots,
  type NavSubItemState,
  type NavSubItemGroupProps,
  type NavSubItemGroupSlots,
  type NavSubItemGroupState,
  type SplitNavItemProps,
  type SplitNavItemSlots,
  type SplitNavItemState,
  type NavItemValue,
  type NavDensity,
  type OnNavItemSelectData,
  type NavContextValue,
  type NavContextValues,
  type NavCategoryContextValues,
  type NavCategoryItemContextValues,
} from './components/Nav.deprecated.js';

// Deprecated Fluent `Text` presets (`Body1`, `Caption1`, `Title1`, etc.).
// Prefer the CoreAI `Text` component with explicit `size`/`weight` props;
// see ./components/Text.deprecated for the full set. Named (not `export *`) so these
// deprecated re-exports shadow the identically-named ones from the stock
// `@fluentui/react-components` star export above.
export {
  Body1,
  Body1Strong,
  Body1Stronger,
  Body2,
  Caption1,
  Caption1Strong,
  Caption1Stronger,
  Caption2,
  Caption2Strong,
  Display,
  LargeTitle,
  Subtitle1,
  Subtitle2,
  Subtitle2Stronger,
  Title1,
  Title2,
  Title3,
  type TextPresetProps,
} from './components/Text.deprecated.js';

export { Divider, type DividerProps, type DividerAppearance } from './components/Divider.js';
// Preserve access to Fluent's content-bearing Divider under a distinct name.
export {
  Divider as DividerLabeled,
  type DividerProps as DividerLabeledProps,
} from '@fluentui/react-components';

export { useFluentThemeMode, type FluentThemeMode } from './contexts/FluentThemeModeContext.js';
