# Experimental headless components

Private component migration pilot. Converted components are listed in the
[public exports](./src/index.ts). The production `@coreai-ds/react-components` package is unchanged.

Each implementation calls Fluent's public component hook, styles the resolved slots, and calls
the public render function. It does not call Fluent's Griffel styling hook.

## Run

From the repository root:

```sh
npm install
npm --workspace packages/react-headless-components test
npm --workspace packages/react-headless-components run build
npm run storybook
```

Open **Experiments / Headless &lt;Component&gt; / Comparison** for a converted component. The
toolbar's theme and light/dark settings apply to both columns. Both implementations receive the
same fixtures. Comparison stories report selected slot computed properties and dimensions at rest.
Consumer Overrides stories also show the intentional change to ordinary CSS override priority.

The experiments appear in local development only. Normal Storybook builds exclude them to
preserve the production catalog. To build an experimental static preview in PowerShell:

```powershell
$env:COREAI_HEADLESS_BUTTON = '1'
npm --workspace apps/storybook run build
Remove-Item Env:\COREAI_HEADLESS_BUTTON
```

Do not publish that experimental build or run the normal `verify:build` against it; the production
verifier deliberately rejects experiment entries. The original `COREAI_HEADLESS_BUTTON` flag
enables the whole experiments directory, not just Button.

Storybook and tests resolve the experimental package to source. Built-package consumers must
load the emitted CSS once:

```tsx
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Button, Input, Textarea } from '@coreai-ds/react-headless-components';
import '@coreai-ds/react-headless-components/styles.css';

<CoreAIFluentProvider>
  <Button appearance="primary">Save</Button>
  <Input aria-label="Name" placeholder="Name" />
  <Textarea aria-label="Description" placeholder="Description" />
</CoreAIFluentProvider>;
```

The existing provider supplies theme variables, inherited typography, and the component-default
context. This temporary bridge still depends on the old package and its provider; this pilot is
not a claim that the whole application bundle is Griffel-free.

## Style source and ownership

- Baseline: CoreAI main commit `9e7876c`, with `@fluentui/react-button@9.11.1`.
  The exact dev dependency preserves the legacy Button reference during this experiment.
- Fluent source: [`useButtonStyles.styles.ts` in react-button 9.11.1](https://unpkg.com/@fluentui/react-button@9.11.1/lib/components/Button/useButtonStyles.styles.raw.js).
  The port is in `src/Button.module.css`; Microsoft copyright and MIT license notices are retained.
  The repository's [MIT code license](../../LICENSE-CODE) applies.
- The first parallel batch uses the installed dependency snapshot at commit `51997c2`:
  [Input styles in react-input 9.8.8](https://unpkg.com/@fluentui/react-input@9.8.8/lib/components/Input/useInputStyles.styles.raw.js)
  and [Textarea styles in react-textarea 9.7.8](https://unpkg.com/@fluentui/react-textarea@9.7.8/lib/components/Textarea/useTextareaStyles.styles.raw.js).
  Their base styles live in the corresponding component CSS Modules, separately from CoreAI
  overrides and prop defaults. Headless remains pinned to `0.3.2`.
- The next batch uses
  [Label styles in react-label 9.4.6](https://unpkg.com/@fluentui/react-label@9.4.6/lib/components/Label/useLabelStyles.styles.raw.js)
  and [Image styles in react-image 9.4.6](https://unpkg.com/@fluentui/react-image@9.4.6/lib/components/Image/useImageStyles.styles.raw.js).
  Neither has additional CoreAI style overrides. Label's required and disabled props are visual;
  the associated control owns validation and disabled behavior. Image retains its supported shadow
  prop and native image semantics.
- The form-control batch uses
  [Checkbox styles in react-checkbox 9.6.6](https://unpkg.com/@fluentui/react-checkbox@9.6.6/lib/components/Checkbox/useCheckboxStyles.styles.raw.js)
  and [Switch styles in react-switch 9.7.7](https://unpkg.com/@fluentui/react-switch@9.7.7/lib/components/Switch/useSwitchStyles.styles.raw.js).
  Both reuse the completed Label component rather than duplicating its styling foundation.
- The navigation/loading batch uses the installed snapshot at commit `a89186d`:
  [Link styles in react-link 9.8.6](https://unpkg.com/@fluentui/react-link@9.8.6/lib/components/Link/useLinkStyles.styles.raw.js)
  and [Spinner styles in react-spinner 9.8.7](https://unpkg.com/@fluentui/react-spinner@9.8.7/lib/components/Spinner/useSpinnerStyles.styles.raw.js).
  Spinner reuses the completed Label styling through the current public slot-render contract.
- The progress/separator batch uses the installed snapshot at commit `d1f4f10`:
  [ProgressBar styles in react-progress 9.5.7](https://unpkg.com/@fluentui/react-progress@9.5.7/lib/components/ProgressBar/useProgressBarStyles.styles.raw.js)
  and [Divider styles in react-divider 9.7.6](https://unpkg.com/@fluentui/react-divider@9.7.6/lib/components/Divider/useDividerStyles.styles.raw.js).
  `Divider` retains CoreAI's contentless separator contract; `DividerLabeled` supplies Fluent's
  content-bearing variant through the same public headless hook/render pipeline.
- The native-control batch uses the installed snapshot at commit `8f22e99`:
  [Select styles in react-select 9.5.7](https://unpkg.com/@fluentui/react-select@9.5.7/lib/components/Select/useSelectStyles.styles.raw.js)
  and [Slider styles in react-slider 9.6.8](https://unpkg.com/@fluentui/react-slider@9.6.8/lib/components/Slider/useSliderStyles.styles.raw.js).
- The selection/status batch uses the installed snapshot at commit `5e4e918`:
  [Radio styles in react-radio 9.6.7](https://unpkg.com/@fluentui/react-radio@9.6.7/lib/components/Radio/useRadioStyles.styles.raw.js),
  [RadioGroup styles](https://unpkg.com/@fluentui/react-radio@9.6.7/lib/components/RadioGroup/useRadioGroupStyles.styles.raw.js),
  and the [Badge family baseline in react-badge 9.5.7](https://unpkg.com/@fluentui/react-badge@9.5.7/lib/components/Badge/useBadgeStyles.styles.raw.js).
  CounterBadge shares the Badge foundation; PresenceBadge has its own status-specific styling.
- The disclosure/loading batch uses the installed snapshot at commit `a98711e`:
  the [Accordion family in react-accordion 9.12.5](https://unpkg.com/@fluentui/react-accordion@9.12.5/lib/components/AccordionHeader/useAccordionHeaderStyles.styles.raw.js)
  and [Skeleton family in react-skeleton 9.7.7](https://unpkg.com/@fluentui/react-skeleton@9.7.7/lib/components/SkeletonItem/useSkeletonItemStyles.styles.raw.js).
- The identity/search batch uses the installed snapshot at commit `86a8705`:
  [Avatar styles in react-avatar 9.11.9](https://unpkg.com/@fluentui/react-avatar@9.11.9/lib/components/Avatar/useAvatarStyles.styles.raw.js)
  and [SearchBox styles in react-search 9.4.8](https://unpkg.com/@fluentui/react-search@9.4.8/lib/components/SearchBox/useSearchBoxStyles.styles.raw.js).
  SearchBox composes the completed Input CSS slot foundation instead of copying a second Input
  style port. Avatar reuses the completed PresenceBadge through a public slot render function.
- The derived-button/navigation batch uses the installed snapshot at commit `66f1b04`:
  the [Button family in react-button 9.11.1](https://unpkg.com/@fluentui/react-button@9.11.1/lib/components/Button/useButtonStyles.styles.raw.js)
  and [Breadcrumb family in react-breadcrumb 9.4.8](https://unpkg.com/@fluentui/react-breadcrumb@9.4.8/lib/components/Breadcrumb/useBreadcrumbStyles.styles.raw.js).
  CompoundButton, ToggleButton, MenuButton, and BreadcrumbButton compose the completed Button
  CSS foundation. SplitButton reuses styled buttons through current public slot render functions.
- The content/identity batch uses the installed snapshot at commit `53ebde2`:
  the [Card family in react-card 9.7.4](https://unpkg.com/@fluentui/react-card@9.7.4/lib/components/Card/useCardStyles.styles.raw.js)
  and [Persona in react-persona 9.7.11](https://unpkg.com/@fluentui/react-persona@9.7.11/lib/components/Persona/usePersonaStyles.styles.raw.js).
  Persona reuses the completed Avatar/PresenceBadge foundations; Card fixtures reuse completed
  Button/Image components without importing styled legacy implementations for behavior.
- The overlay/numeric-input batch uses the installed snapshot at commit `a8a84a1`:
  [PopoverSurface in react-popover 9.14.10](https://unpkg.com/@fluentui/react-popover@9.14.10/lib/components/PopoverSurface/usePopoverSurfaceStyles.styles.raw.js)
  and [SpinButton in react-spinbutton 9.6.8](https://unpkg.com/@fluentui/react-spinbutton@9.6.8/lib/components/SpinButton/useSpinButtonStyles.styles.raw.js).
  Popover and its trigger are behavior-only; the current facade has no public PopoverProvider.
  The surface supplies the ported CSS, keeping native closed-state hiding and top-layer behavior.
- The form-information/rating batch uses the installed snapshot at commit `9c7a515`:
  [Field in react-field 9.5.6](https://unpkg.com/@fluentui/react-field@9.5.6/lib/components/Field/useFieldStyles.styles.raw.js),
  [InfoLabel in react-infolabel 9.4.27](https://unpkg.com/@fluentui/react-infolabel@9.4.27/lib/components/InfoLabel/useInfoLabelStyles.styles.raw.js),
  and the [Rating family in react-rating 9.4.7](https://unpkg.com/@fluentui/react-rating@9.4.7/lib/components/Rating/useRatingStyles.styles.raw.js).
  Public InfoButton preserves CoreAI's required accessible-name contract; InfoLabel uses a private
  current-base adapter. Both reuse the completed Label/Popover foundations without legacy behavior.
  Rating and RatingDisplay share one RatingItem implementation and a visual-only color/size context.
- The native-picker/dialog batch uses the installed snapshot at commit `1cabc6b`:
  the [Combobox family in react-combobox 9.17.7](https://unpkg.com/@fluentui/react-combobox@9.17.7/lib/components/Combobox/useComboboxStyles.styles.raw.js)
  and [Dialog family in react-dialog 9.18.6](https://unpkg.com/@fluentui/react-dialog@9.18.6/lib/components/DialogSurface/useDialogSurfaceStyles.styles.raw.js).
- The native-menu/drawer batch uses the installed snapshot at commit `ebb5a9e`:
  the [Menu family in react-menu 9.25.8](https://unpkg.com/@fluentui/react-menu@9.25.8/lib/components/MenuPopover/useMenuPopoverStyles.styles.raw.js)
  and [Drawer family in react-drawer 9.13.5](https://unpkg.com/@fluentui/react-drawer@9.13.5/lib/components/OverlayDrawer/useOverlayDrawerStyles.styles.raw.js).
- The native-toolbar/tag batch uses the installed snapshot at commit `b8337ab`:
  the [Toolbar family in react-toolbar 9.8.7](https://unpkg.com/@fluentui/react-toolbar@9.8.7/lib/components/Toolbar/useToolbarStyles.styles.raw.js)
  and [Tag family in react-tags 9.9.8](https://unpkg.com/@fluentui/react-tags@9.9.8/lib/components/Tag/useTagStyles.styles.raw.js).
  Experimental focusgroup consumers share one test/Storybook-only initializer.
- The native-tab/tag-picker batch uses the installed snapshot at commit `51c66d8`:
  the [Tab family in react-tabs 9.12.6](https://unpkg.com/@fluentui/react-tabs@9.12.6/lib/components/Tab/useTabStyles.styles.raw.js)
  and [TagPicker family in react-tag-picker 9.10.5](https://unpkg.com/@fluentui/react-tag-picker@9.10.5/lib/components/TagPickerControl/useTagPickerControlStyles.styles.raw.js).
  The installed headless facade also resolves a nested react-tag-picker 9.10.6; the local raw
  source links in each CSS Module identify the visual source independently of that behavior package.
- The identity/message batch uses the installed snapshot at commit `ee9b499`:
  [AvatarGroup in react-avatar 9.11.9](https://unpkg.com/@fluentui/react-avatar@9.11.9/lib/components/AvatarGroup/useAvatarGroupStyles.styles.raw.js)
  and [MessageBar in react-message-bar 9.7.9](https://unpkg.com/@fluentui/react-message-bar@9.7.9/lib/components/MessageBar/useMessageBarStyles.styles.raw.js).
  The current MessageBar facade publishes MessageBar, Actions, Body, and Title, not the legacy Group.
- CoreAI source: [Button defaults](../react-components/src/components/Button.ts) and
  [minimum-width override](../react-components/src/components/Button.styles.ts).
  Visual overrides live in `src/Button.overrides.module.css`; prop defaults remain in the component.
- Normal cascade order: `fluent-components` layer, then `coreai-overrides`, then unlayered consumer CSS.
  Class-name concatenation does not establish priority.
- Fluent-derived CSS uses `--fui-*` component custom properties. CoreAI-specific overrides keep
  CoreAI naming; shared theme tokens and the stable `fui-*` slot markers are unchanged.
- Every ported component CSS Module links from its header to the exact local `node_modules`
  `.styles.raw.js` file used as its Fluent source. Use repository-relative links, not a
  machine-specific absolute path. Override modules identify the Fluent baseline separately from
  the CoreAI source; handwritten comparison-layout CSS is not an upstream port.
- CSS Modules use `.Button` and `.Button__icon`, with native nesting and ordinary state selectors.
  Enabled interaction styles exclude disabled and disabled-focusable buttons rather than relying
  on `:where()` to flatten specificity. New components follow the same component/slot naming
  convention rather than using `.root`.
- Every component-owned slot also receives a stable, unstyled global marker: `fui-Button` on
  the root and `fui-Button__icon` on the icon slot. Exported `buttonClassNames` exposes these names
  for consumers; internal styling uses the scoped module classes instead.
- Visual props extend the headless data-attribute pattern with `data-appearance`, `data-size`,
  and `data-shape`. Resolved content/icon presence uses `data-has-content` and `data-has-icon`;
  headless still supplies its disabled, icon-only, and icon-position attributes.
- Existing Fluent bundled icons ship unlayered visibility rules. A narrow, unlayered descendant
  adapter preserves their regular/filled hover behavior without adding a Griffel runtime import.
  Other Button styles stay layered.
- Switch's default thumb uses the public `@fluentui/react-icons/headless/svg/circle` entry.
  The pinned icon dependency supplies the original CircleFilled glyph without Griffel styling;
  a standalone import check verifies that this entry loads no Griffel modules.
- Checkbox's default indicators use the same package's headless SVG checkmark, square, and circle
  entries. Its label binding uses public `slot.optional` from `@fluentui/react-utilities`.
  Standalone checks verify these glyph and utility imports also load no Griffel modules.
- Link's external-navigation glyph uses the public headless SVG open entry. Its inverted-background
  styling reads the current public `useBackgroundAppearance` hook from
  `@fluentui/react-shared-contexts`. The pinned helper and glyph imports load no Griffel or Tabster
  modules; the existing provider still supplies the background context.
- Select's default expand glyph uses the public headless SVG chevron-down entry. Its isolated
  import likewise loads no Griffel or Tabster modules; the browser owns the native select popup.
- PresenceBadge uses the public headless SVG presence entries for its default status glyphs.
  Each entry is independently verified to load no Griffel or Tabster modules.
- Avatar's default person glyph and SearchBox's search/dismiss glyphs use the same style-free
  public headless SVG entries, with independent import-isolation checks.

For Button, the recreated visual props are `appearance` (including `transparent`), `size`, and `shape`.
Defaults are secondary/medium/circular with CoreAI defaults enabled. Disabling component defaults
restores rounded shape and Fluent's size-dependent minimum widths. Icon-only widths are unchanged.
Size inherits the headless Button context; mixed old/new component-family contexts are not bridged.
Arbitrary `customStyleHooks_unstable` overrides from the legacy provider are not invoked by this
new styling pipeline; use CSS classes, slots, or inline styles for the experimental Button.
Input and Textarea likewise do not invoke legacy custom style hooks or the internal provider
`inputDefaultAppearance` override. Input's automatic copy action still composes the existing
legacy `CopyButton`; converting that component is a separate job.
Input also preserves the legacy `filled-darker` fallback even when component defaults are disabled.
Its automatic copy action uses the supplied `value` or `defaultValue`, not subsequent uncontrolled
edits. These inherited limitations are not corrected as part of the styling migration.
Input and Textarea expose only current appearances. Deprecated shadow appearances, their CSS,
compatibility diagnostics, and comparison fixtures are intentionally excluded from this package.

Image inherits Fluent's native-property filter: `decoding`, `sizes`, and `referrerPolicy` are accepted
by its TypeScript props but are not forwarded to the native image in either implementation.
`loading`, `srcSet`, `crossOrigin`, and width/height are preserved. Tests explicitly compare this
omission with the legacy reference; adding native support is a separate dependency/behavior change,
not part of this styling migration.

Slider leaves range resolution to the current headless hook. Native step snapping can differ from
the hook's visual progress, and a native form reset does not reset hook state. Explicit input-slot
callbacks and refs retain their current precedence. Tests cover these inherited boundaries rather
than adding a second range state model or changing native events.

RadioGroup preserves the installed Field contract: Field supplies group `aria-required` and
`aria-invalid`, but native required radio inputs need an explicit group `required` prop.
CounterBadge preserves current headless content resolution: explicit numeric `children={0}`
remains visible instead of copying the legacy falsy-content hide check.

Skeleton and SkeletonItem keep behavior in the public headless context. A private, typed
visual-only context supplies appearance/animation inheritance because the public facade has no
visual context reader. Deprecated width props are excluded; use CSS for custom sizing.

Accordion examples use array-form open items, including `defaultOpenItems={[0]}` for numeric
identifiers. The pinned upstream implementation mishandles falsy scalar defaults such as `0`;
this inherited bug is outside the styling migration. The public prop contract remains unchanged,
and no normalization workaround or dependency patch is added.
Closed headless panels remain mounted and CSS-hidden, preserving local state. Legacy panels
unmount after their exit animation finishes. React 18 omits the hook's boolean `inert` attribute;
CSS hiding excludes closed content from focus and accessibility without a compatibility shim.

Avatar keeps current headless size-16 initials rather than truncating them to the legacy single
character. Its reused PresenceBadge includes out-of-office information in the accessible label,
as the current headless badge does. These differences remain explicit in comparisons.
AvatarGroup reuses the completed Avatar and Popover visuals through current public slot renderers.
Its neutral-avatar override bridge restores the original nested Fluent background6 rather than
the standalone CoreAI Avatar background4; it stays separate from the Fluent-derived CSS.
Native trigger tooltip content is styled through its public slot, without copying Tooltip behavior.
Use explicit counts for fragment content and complete overflow content in pie layouts, as the
current public composition requires; no legacy focus manager or child-count normalization is added.
The pinned overflow trigger rejects render-function content through the same public Fragment guard
as InfoButton; ordinary trigger content is supported and tested without a compatibility shim.
SearchBox keeps its medium default rather than inheriting Field size. Its hook-controlled native
input retains the installed form-reset behavior; no second value model or reset shim is added.

Derived buttons retain the actual wrapper defaults, including explicit `undefined` shape falling
back to rounded. SplitButton defaults to medium without inheriting the surrounding Button size.
Breadcrumb retains native Tab navigation; the pinned arrow mode adds no focusgroup machinery.
Its native button defaults to submit, as upstream does; use `type="button"` for non-submit actions.

Card uses native focus and explicit tab stops instead of `focusMode`/Tabster machinery. Its
CoreAI floating-action `left`/`right` positions retain physical edges in RTL. Current hook
selection predicates and consumer event handlers control nested-action selection; inherited
checkbox notification and nested-Enter behavior remain explicit in the tests/examples.

SpinButton leaves parsing and range handling to its public hook: typed values are not additionally
clamped by this wrapper. Its current repeat-button, ref-precedence, and latest-value native-reset
contracts remain intact; no second numeric state or compatibility reset model is introduced.

Popover uses native popovers/dialogs, modal focus, and CSS anchors instead of the legacy portal
and positioning pipeline. Arrows are surface-centered unless the caller supplies offsets.
Headless `0.3.2` has a first-right-click `openOnContext` timing defect on Windows Chromium; one
platform-scoped expected-failure regression records it. The controlled native-context-menu
example is verified and adds no compatibility behavior to the component.

Rating remains interactive when `onChange` is omitted in the installed public headless API.
Use RatingDisplay for read-only output; no wrapper-specific read-only behavior is added.

InfoButton root render-function children hit the pinned public trigger's Fragment guard in both
headless and this wrapper; use ordinary root content. Field's control-children render function and
the other tested label/info/surface slot renderers remain supported. No trigger workaround is added.

The current Dialog facade uses DialogHeader and a scrollable DialogBody. It has no DialogContent,
Title action slot, backdrop slot, or legacy provider aliases. Surface CSS styles the native
`::backdrop`; native dialogs/popovers own focus, inertness, dismissal, and restoration.
Dialog reports distinguish native viewport-fit/scrollbar-gutter behavior from the legacy
non-modal divider collision with Overlay's historical beak selector. That accidental selector
collision is not copied into the native surface.

Standalone Listbox keeps the native-popover contract. Its published props omit a `popover`
override, so standalone examples use the public DOM ref and native `showPopover()` rather than
adding an unsupported prop or removing attributes. Native viewport sizing remains visible in
comparison reports instead of being normalized to the old positioning pipeline.
Combobox/Dropdown retain their current positioning, joined multiselect text, and native form/reset
contracts. DropdownButton keeps its separate Button-style surface. Dialog form examples use
controlled submission; bare `method="dialog"` retains the upstream native-close/context-state boundary.
OverlayDrawer is controlled-only in the pinned facade. Drawer dispatches to the supported overlay
or inline variant, with the current DrawerProvider/context; no defaultOpen, legacy motion, or
backdrop-slot aliases are added. DrawerHeaderTitle reuses the completed DialogTitle CSS foundation.
Toolbar retains the installed checked-event ordering and reset behavior; caller cancellation does
not add a wrapper-specific selection veto. Controlled state can reject a requested change.
TagGroup retains current selection/dismiss payloads, with post-dismiss focus restoration supplied
by the consumer examples rather than a legacy focus manager in the components.
Tab retains current activation, selection, and focusgroup behavior. Its reserved-space content
uses the public root-render contract, preserving native button identity, refs, caller renderers,
and callback targets across selection changes rather than altering the deprecated slot registry.
TagPicker retains current native popup, selection, and focusgroup contracts. The pinned option
does not supply `aria-selected`, and the trigger button does not inherit disabled behavior;
consumers explicitly pass these supported native props, as the examples demonstrate. Raw-current
regressions establish both boundaries without adding wrapper normalization. After ArrowRight from
the last tag, backward Tab restores the last tag natively but the first tag with the current
consumer polyfill; the examples/tests retain that distinction.
MessageBar keeps the shared upstream announcement contract rather than adding a second announcer.
In the pinned base hook used by both implementations, either explicit `politeness` string selects
polite provider options, and updates that leave computed politeness unchanged do not reannounce.
Use the semantically correct intent preset without explicit politeness, and give genuinely new
notifications new React keys after managing any focused descendants. Application-owned announcing
or suppression can use the current public AnnounceProvider/useAnnounce composition; `aria-live="off"`
alone cannot cancel a native `document.ariaNotify` call. These are inherited boundaries, not fixes
to recreate in this style port. Separate installed Button copies also need explicit action sizes.

## Conversion workflow

### API policy

Use current, supported public APIs from the installed headless package. Fluent v9 style sources
are a visual reference, not a template for component behavior or compatibility plumbing.
Do not author new code against deprecated or legacy APIs, including `state.components`,
deprecated `getSlots` helpers, or internal base hooks. Use the public hook/render pipeline and
current slot APIs such as `slot.always`, `slot.optional`, and `assertSlots`.
Components used as custom slots expose the public `ForwardRefComponent` type, matching headless's
current ref contract. Slot element selection belongs in the slot resolver, not `state.components`.
Checkbox and Switch keep the primitive's native label slot contract. The shared `resolveLabelSlot`
helper uses a typed public slot render function to render the styled Label, preserving resolved
props, refs, caller render functions, and required content without changing compatibility registries.
The contentless Divider likewise retains native slot metadata and uses a public render function
for its `hr` root, preserving native refs without triggering the pinned renderer's slot rewrite.
Check the published slot type before using a render function: props-object slots can reserve
`children` for ordinary content instead. Keep that contract and use a compatible visual boundary,
not a cast that forces a render-function slot.

Preserve the current headless slot, ref, and accessibility contracts. Reuse local styling
foundations only through type-safe current APIs; do not use casts to force an incompatible slot
replacement. Public, non-deprecated, style-free utility and glyph helpers are allowed when needed.
Current headless and native-browser behavior takes precedence over reproducing old implementation
quirks. Document intentional visual or behavioral differences instead of recreating obsolete
markup, focus machinery, or compatibility branches to make comparisons pass.

The existing theme/defaults provider bridge is an explicit temporary pilot boundary, not permission
to introduce deprecated APIs or new dependencies on old styled component implementations.

### Worker process

Start with two independent workers in one worktree. Assign one component or tightly coupled
family per worker, with explicit prerequisites and file ownership. Unsupported headless components
remain deferred; do not recreate their behavior as part of a styling conversion.

- The coordinating thread records the reference commit and installed Fluent/headless versions.
  Workers read the legacy CoreAI wrapper, defaults, overrides, and Fluent style-selection logic,
  not just the style objects. The legacy package stays read-only.
- Follow calls to other component style hooks and styled subcomponents. For example, SearchBox
  uses Input's styling foundation. Reuse an existing port where compatible rather than silently
  dropping inherited styles or copying a second divergent foundation. Assign unfinished shared
  dependencies before their consumers.
- CSS Modules `composes` can emit the same foundation selectors in several component sheets.
  Family-specific overrides must retain the required resolved-state specificity so later
  foundation copies do not undo them. Verify the families together, not just in isolated imports.
- Each worker owns its component wrapper, base/override CSS Modules, comparison stories/fixtures,
  and focused browser tests. The coordinator owns public exports, dependencies, lockfiles,
  providers, shared utilities/configuration, shared documentation, and Git operations.
- Workers read the [headless documentation index](https://storybooks.fluentui.dev/headless/llms.txt)
  and relevant component, browser-support, and polyfill pages. The
  [Fluent React documentation index](https://storybooks.fluentui.dev/react/llms.txt) describes the
  component being converted. Online documentation may be newer than the pinned package; installed
  public hooks, render functions, and types determine which APIs are available.
- Different DOM **and modern browser APIs** are expected. Check native focus, form, sizing,
  overlay, and navigation behavior relevant to the assignment before copying legacy selectors or
  supporting code. Do not retain obsolete focus attributes, Tabster assumptions, or overlay
  machinery merely to match the old implementation.
- Convert directly into the final CSS Modules using the Button conventions. Keep source/version
  attribution, license notices, and source comments alongside the translated rules. Adapt comments
  only when their syntax or behavior changes; omit comments belonging to removed deprecated branches.
  Use the `fluent-components` layer and `--fui-*` custom properties for Fluent-derived styles;
  keep CoreAI-specific overrides in `coreai-overrides` with CoreAI naming.
  Preserve refs, slots, consumer classes, defaults opt-out,
  controlled/uncontrolled state, and callbacks.
- Preserve current headless behavior and the intended CoreAI visual contract. Check omitted versus
  explicitly undefined visual props and supported composition rules. Do not port deprecated APIs
  or styles, or recreate old behavior in conflict with the API policy above. Report dependency
  limitations and intentional differences explicitly; do not change parity expectations merely
  to hide an unintended regression.
- Share representative fixtures between comparison stories and focused tests. Compare bounded
  computed-style properties, relevant slot dimensions, and meaningful interactions, not every CSS
  declaration or the full upstream behavior matrix. Investigate surfaced differences; report
  intentional differences and gaps rather than hiding them with broad exclusions.
- Settle relevant pseudo-element animations as well as element transitions. Neutralize the pointer
  before pure keyboard-focus checks and assert actual hover state; test combined hover/focus
  separately. Check callbacks and form results, not just a changed native value. Smoke-check the
  actual Storybook reports and interaction plays in addition to the browser-test fixtures.
- Require play-exception propagation (`throwPlayFunctionExceptions: true`) and check final report
  state/geometry, not only a `storyFinished` success event. Layout changes without resize can leave
  legacy positioning stale; refresh through public handles and await stable geometry before capture.
- Workers may format/lint their own files. The coordinator integrates exports, then runs the
  combined focused tests, existing Button regressions, type checks, and builds. Serialize shared
  validation to avoid unfinished-file, cache, and build-output interference. Return failures to
  the owning worker.
- Wait until every batch fixture import and public export is wired before starting a browser run.
  Vite's dependency scanner scans all configured test entries, even when the command selects a
  single file. An unfinished sibling fixture can prevent the selected tests from loading.
- Register newly imported headless entry points in both
  [browser-test optimization](./vitest.config.ts) and
  [Storybook optimization](../../apps/storybook/.storybook/main.ts). Dependency discovery must
  not reload React modules in the middle of Browser Mode tests. Check a representative cold-cache
  case after changing these entries, then run the focused suites.

A worker's handoff includes changed files, source versions, modern browser API/polyfill findings,
checks actually run, integration requirements, remaining differences, and coverage gaps.
`Implementation-ready` is not verified completion. Complete a job only after integration checks
pass. Use separate worktrees if shared-file contention or independent full builds justify the
extra dependency and merge management.

## Modern browser behavior

Button focus styles use native `:focus-visible`, not the legacy focus-visible attribute/polyfill.
Icon spacing uses logical properties for RTL. Forced-colors, reduced-motion, and the original
Firefox focus-stroke adjustment are included in the CSS port.

Input and Textarea use native `:focus-within` for their wrapper focus treatment and retain native
form/editing behavior. Neither needs a component-specific overlay or focusgroup polyfill.
Input's `field-sizing: content` is progressive enhancement; unsupported browsers keep ordinary
input sizing. Textarea retains native rows and resize behavior rather than introducing autosizing.

Link keeps the public headless hook's native anchor/button semantics and uses `:focus-visible`
for its focus indicator. A keyboard-focused disabled-focusable Link keeps its double underline
during hover/press while `:focus-visible` remains true; the legacy disabled-hover rules remove it.
Unfocused disabled links remain undecorated, with disabled colors and activation blocking unchanged.
Spinner ports its masks, conic gradients, and CSS animations and uses native direction selectors
for RTL. Neither needs an overlay or focusgroup polyfill.
ProgressBar supplies CSS slide/pulse animations for indeterminate progress rather than restoring
the old motion slot. Divider uses logical alignment and native separator semantics. Neither needs
an overlay or focusgroup polyfill.
Select retains the browser-owned popup and native selection/form/reset behavior. Slider uses
native range inputs, focus-visible styling, and vertical writing mode. In vertical RTL mode, the
legacy Griffel input flips to `direction: ltr`, reversing pointer and keyboard value progression.
The port keeps the current native/headless direction and its thumb aligned with that progression;
RTL tests and reports explicitly distinguish this intentional correction.
RadioGroup uses its public headless context helper and native radio-input navigation; it needs no
focusgroup polyfill. Badge counts and presence accessibility likewise remain owned by their
headless hooks, without introducing live-region behavior.

Button needs no overlay or focusgroup polyfill. Every conversion must follow the headless
[browser-support](https://storybooks.fluentui.dev/headless/llms/overview-browser-support.txt) and
[polyfill](https://storybooks.fluentui.dev/headless/llms/overview-polyfills-fallbacks.txt) contracts.
In particular, native dialog/popover/anchor positioning replace parts of the old overlay pipeline.
Arrow-key `focusgroup` navigation requires a consumer-supplied polyfill where native support is absent;
detect the actual browser capability rather than relying on a version list.
Menu's experimental consumers initialize the documented `polyfill(root)` API and newly mounted
subtree groups. The exact polyfill is a development dependency of the test/Storybook consumers,
not an import or runtime dependency of the component library.
Menu checks exercise both native focusgroup and a feature-disabled Chromium mode that executes
the actual consumer polyfill, including cold opening, reopening, nested groups, and Tab behavior.

## Practical parity coverage

The focused Vitest Browser Mode suites use Playwright Chromium and the same fixtures as Storybook.
The Button suite compares a bounded list of computed properties, dimensions, and icon visibility across light
and dark modes, appearances, sizes, shapes, icons, disabled states, anchors, hover, keyboard focus,
and keyboard press. It also checks defaults opt-out, RTL spacing, consumer CSS priority, context
sizing, refs, slot preservation, stable global slot markers, data-state attributes, and disabled
activation. Disabled hover and combined keyboard-focus/hover cases protect interaction priority
without zero-specificity selectors.

The Consumer Overrides fixture deliberately differs: ordinary CSS sets the headless minimum width
to `120px`, radius to `3px`, and icon size to `16px`. Legacy Griffel rules can retain `40px`,
circular radius, and `20px` icons. The test asserts the new consumer-override contract rather than
requiring those differences to disappear.

Input and Textarea add component-specific slot and pseudo-element comparisons, native text entry,
controlled/uncontrolled values, callbacks, form semantics, read-only/disabled/invalid states,
Field context, and consumer overrides. Input covers its inline labels, sizing/truncation, and
copy composition; Textarea covers native row sizing and resize modes. Relevant interactions and
combined focus/hover states are checked rather than comparing only resting fixtures.
Label covers typography, required-slot styling, native association, and consumer overrides.
Image uses deterministic inline fixtures to compare fitting, shape, border, shadow, and dimensions
while preserving alt text, intrinsic sizing, and native image events.
Link adds native navigation/activation, disabled and disabled-focusable behavior, external glyphs,
caller rendering, context/defaults, and consumer priority. Spinner compares sizes, label positions,
appearance, slot/pseudo-element styling, live-region semantics, caller slots/refs, and loading-state
changes. Its comparison fixture freezes time-varying animation frames rather than waiting for
infinite animations; animation configuration remains part of the checks.
ProgressBar covers determinate ranges, indeterminate styling/animation, status semantics, custom
slots, and progress updates. Divider compares both CoreAI's contentless separator and Fluent's
content-bearing variant, including orientation, alignment, insets, content slots, and consumer CSS.
Select adds native options/optgroups, controlled and uncontrolled values, Field sizing, callbacks,
FormData, and reset. Slider checks keyboard/pointer callbacks, range edges, rail/thumb geometry,
native form boundaries, valid slot rendering, and the intentional vertical-RTL direction difference.
Radio and RadioGroup add native selection/navigation, grouping, Field/required boundaries, label
composition, callbacks, and form/reset checks. Badge, CounterBadge, and PresenceBadge cover visual
categories, count/overflow/dot/hidden states, current status glyphs and accessible names, and supplied
content. Radio's report permits at most `0.5px` of captured rectangle width/height allocation noise;
threshold regressions keep larger geometry differences and all CSS property values observable.
Accordion covers current context wiring, visual header variants, native toggle callbacks, disabled
and controlled states, slot/ref contracts, and persistent hidden-panel state. Its live report
distinguishes intentional mounted-panel differences from unexpected selected-style differences.
Skeleton covers visual inheritance and item overrides, shape/size variants, owned pseudo-element
animation timing/keyframes, refs, and loading/completion/reload state.
Avatar adds identity/image fallback, named-color categories, active rings, presence composition,
current accessible labels, and logical masks/offsets. SearchBox adds composed Input styling,
query/dismiss callbacks, native submission/reset boundaries, and focus/spacing transitions.
CompoundButton, ToggleButton, MenuButton, and SplitButton cover inherited Button styling,
secondary content, checked interaction priority, native menu composition, separate split actions,
slot/ref adapters, and native forms/links. Breadcrumb covers navigation/current-page semantics,
native Tab and hash navigation, custom content/dividers, refs, and actual submitter/FormData events.
Card covers appearances, orientation, preview/header/footer edges, physical floating-action rails,
selection predicates, native focus/actions/forms, and slot/ref contracts. Persona covers text-line
layout and Avatar/PresenceBadge composition, including the current initials/out-of-office
accessibility differences and native identity/image-fallback flows.
Popover covers native closed/open hiding, top-layer nesting, modal focus/inertness, restoration,
dismissal, CSS anchors, and explicit arrow-geometry differences. Its report reserves layout space
and exposes fixture-specific readiness/counts to prevent stale successful captures.
SpinButton covers typed/controlled formatting, numeric callbacks, keyboard/step/repeat cancellation,
forms/reset, and current range/ref boundaries. Emitted library CSS is also smoke-tested in the
live Popover/SpinButton comparisons after removing their development component stylesheets.
Field and information controls cover generated associations, validation/hint glyphs, native form
controls, required labels, accessible naming, and native help overlays. Rating and RatingDisplay
cover shared item styling, native radio input, fractional/read-only summaries, default owned items,
glyph geometry, form/callback behavior, and native accessible names including generated separators.
Native pickers add grouped/freeform/multiselect options, exact selection payloads, Field naming,
keyboard/forms/reset, popup hiding, collision/relocation, and custom trigger surfaces. Dialog adds
modal/alert/non-modal focus/inertness/restoration, cancellation/veto, forms and nesting. Its default
width is tested exactly as `min(600px, document width)` across the threshold and both modal modes.
Menu covers current native/popover and checked-item composition, first-open/reopen focus,
focusgroup navigation, submenus/split actions, links/forms, and both native/polyfill execution.
Drawer covers overlay/inline geometry, modal/non-modal focus and dismissal, viewport/RTL edges,
headers/footers/separators, native forms and nested top layers.
Toolbar adds exact parent visual inheritance, checked radio/toggle groups, dynamic group navigation,
editing/forms/Menu composition, and current event/reset boundaries. Tags add media/text/glyph
geometry, dismissal and interaction-part contracts, controlled group payloads, native forms, and
consumer-owned restoration after removal. Both families are checked in native and polyfill modes.
Tabs add controlled and automatic/manual activation, content switching, dynamic groups, native
forms, exact event/ref identity, and reserved-space geometry, including caller root renderers.
TagPicker adds query/filtering, single/multiple selection, removal, grouped options, explicit
selection/disabled accessibility, native forms/reset, and current slot/ref/callback contracts.
Both families run with native focusgroup and the actual consumer polyfill, with strict live
reports and trusted follow-ups at desktop and narrow viewport sizes.
AvatarGroup adds layout/partition/overflow composition, current Avatar and native Popover reuse,
named tooltip content, modal overflow, slot/ref rendering, and consumer priority. MessageBar adds
intent/layout/action composition, native announcement options, dismissal/restoration, keyed updates,
responsive reflow, and native forms, with raw-current regressions for inherited boundaries.
RTL cases still emit an unsuppressed Griffel mixed-direction warning from the legacy provider;
the selected RTL style assertions pass.

Standalone Playwright Chromium replays also complete the Input Playground and Textarea Typing Flow
stories with their callback and form assertions unchanged. The VS Code integrated preview showed
a separate synthetic-input limitation: typed native values appeared without triggering callbacks,
and inspection found React's value setter instead of Testing Library's value interceptor.
Native typing in that preview works. No component workaround or weakened assertion was added for
this preview-tool difference.
ProgressBar's frame-zero comparison also stalled in the integrated preview, while the unchanged
report passed in standalone Chromium. Standalone checks additionally cover its upload flow and
DividerLabeled's orientation/content controls.

This is not exhaustive. Gaps include automated screenshot/pixel comparison, Firefox/Safari,
forced-colors and reduced-motion emulation, transition frames, pointer-down combinations,
every theme/custom-token combination, and mixed legacy/headless compound components.
The interactive Storybook report compares resting styles only, and the icon checks target the
shared fixtures' `parity-icon` slot rather than trying to inspect arbitrary children.
The tests do not load the hosted Aptos fonts. The local static-preview check also encountered font
CORS errors and used fallback fonts in both columns, so Aptos-specific geometry is not verified.

## License

The Fluent-derived styling and this package are available under the MIT license:

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
