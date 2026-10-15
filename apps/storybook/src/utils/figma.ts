// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Parameters } from '@storybook/react-vite';

/**
 * Figma source of truth for the CoreAI Design System.
 *
 * `figmaNodes` maps a component's Storybook name to its published Figma
 * component-set node id (dash form, e.g. "160313-4460"). The ids come from the
 * Figma library "CoreAI DS" (file key below) and were pulled via the Figma MCP
 * `list_file_components_for_code_connect` — the single authoritative list of
 * published nodes. Regenerate by re-running that tool and taking each entry's
 * `nodeId` (replace ":" with "-").
 *
 * `figmaDesign(name)` returns the `parameters.design` object consumed by
 * `@storybook/addon-designs`, which renders the linked frame in each story's
 * "Design" tab. Spread it into a story meta's `parameters`:
 *
 *   export default {
 *     title: "Components/Button/Button",
 *     component: Button,
 *     parameters: { ...figmaDesign("Button") },
 *   };
 */

export const FIGMA_FILE_KEY = 'eXfSQrRg3poHRgmr0ivN5V';
export const FIGMA_FILE_NAME = 'CoreAI-DS';

/** Component display name → published Figma node id (dash form). */
export const figmaNodes: Record<string, string> = {
  Accordion: '113348-3337',
  Avatar: '306874-117056',
  'Avatar group': '308130-4946',
  Badge: '151708-5234',
  Breadcrumb: '133494-14993',
  Button: '160313-4460',
  Card: '432832-55273',
  CardHeader: '322754-163770',
  CardPreview: '322781-4911',
  Carousel: '322705-4097',
  CarouselNav: '322705-3987',
  Checkbox: '116-46830',
  'Color picker': '182179-455',
  Combobox: '329018-4917',
  'Compound button': '161008-6469',
  DataGrid: '298485-9476',
  Dialog: '168998-1175',
  Divider: '320758-1170',
  'Dropdown button': '432750-47205',
  Drawer: '145579-770',
  Dropdown: '324567-6252',
  Field: '32182-95336',
  Image: '417322-8489',
  InfoButton: '77695-190112',
  InfoLabel: '323059-758',
  Input: '321038-7764',
  'Interaction tag': '175028-86039',
  Label: '7062-121104',
  Link: '6401-122467',
  List: '287954-86982',
  Menu: '301778-9076',
  'Menu item': '413448-1211',
  'Message bar': '433133-6491',
  Persona: '316233-1823',
  Popover: '167560-4316',
  ProgressBar: '41988-213166',
  'Presence Badge': '2746-98970',
  Radio: '10292-173155',
  RadioGroup: '219564-4609',
  Rating: '192287-25319',
  RatingDisplay: '192287-25319',
  SearchBox: '321831-998',
  Skeleton: '114502-121706',
  Slider: '12126-152884',
  'Spin button': '324095-17400',
  Spinner: '7234-133747',
  'Split button': '160724-5710',
  'Status Indicator': '326713-3193',
  SwatchPicker: '208407-2275',
  Switch: '6022-126541',
  Tag: '174111-15541',
  TabList: '23575-138808',
  TagPicker: '304788-13375',
  'Teaching Popover': '170592-76650',
  Textarea: '62039-177849',
  Toast: '49507-161985',
  Toolbar: '78568-197710',
  Tooltip: '168532-852',
  'Tree item': '166093-119814',
};

/** Build the Figma design-file URL for a node id (dash form). */
export function figmaUrl(nodeId: string): string {
  return `https://www.figma.com/design/${FIGMA_FILE_KEY}/${FIGMA_FILE_NAME}?node-id=${nodeId}`;
}

/**
 * `parameters.design` for `@storybook/addon-designs`, resolved from the
 * component name. Returns an empty object when the name isn't in the registry
 * (so it's always safe to spread into a meta's `parameters`).
 */
export function figmaDesign(name: keyof typeof figmaNodes | string): Parameters {
  const nodeId = figmaNodes[name];
  if (!nodeId) {
    return {};
  }
  return {
    design: {
      type: 'figma',
      url: figmaUrl(nodeId),
    },
  };
}
