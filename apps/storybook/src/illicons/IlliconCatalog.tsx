// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  CopyButton,
  Field,
  Input,
  Link,
  illicons,
  makeStyles,
  mergeClasses,
  tokens,
  useFluentThemeMode,
} from '@coreai-ds/react-components';

const pageSize = 24;
const useStyles = makeStyles({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    maxWidth: '1280px',
    minWidth: 0,
    width: '100%',
    marginInline: 'auto',
    padding: tokens.spacingHorizontalXXXL,
  },
  heading: { margin: 0, fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800 },
  copy: { margin: 0 },
  search: { maxWidth: '440px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  tile: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalXXL,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  copyButton: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    right: tokens.spacingHorizontalXS,
  },
  caption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXXS,
    width: '100%',
    minWidth: 0,
  },
  label: {
    margin: 0,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground2,
  },
  tags: {
    margin: 0,
    width: '100%',
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actions: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  error: { color: tokens.colorPaletteRedForeground1 },
  preview: { display: 'block', flexShrink: 0 },
  dark: { filter: 'brightness(0) invert(1)' },
  light: { filter: 'brightness(0) invert(0.1411764706)' },
});

function originalSvg(source: string) {
  const bytes = Uint8Array.from(
    atob(source.slice('data:image/svg+xml;base64,'.length)),
    (character) => character.charCodeAt(0),
  );
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Search reviewed artwork and copy its original SVG markup.
 * Saved-data catalog integration is separate from this artwork browser.
 */
export function IlliconCatalog() {
  const styles = useStyles();
  const mode = useFluentThemeMode();
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [error, setError] = React.useState('');
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered = illicons.filter((icon) => {
    const searchable = `${icon.name} ${icon.id} ${icon.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
  const pageCount = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const start = currentPage * pageSize;

  return (
    <section className={styles.root} aria-label="Illicon catalog">
      <h1 className={styles.heading}>Illicon catalog</h1>
      <p className={styles.copy}>
        Browse starter artwork and copy its original SVG for Figma or further editing. Saved-data
        catalog integration is being designed separately.
      </p>
      <p className={styles.copy}>
        <Link
          href="https://mini-foundry.azurewebsites.net/ckantner/illicon-creator/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Create a new illicon
        </Link>
      </p>
      <Field label="Search illicons" className={styles.search}>
        <Input
          type="search"
          value={query}
          placeholder="Search names or tags"
          onChange={(_, data) => {
            setQuery(data.value);
            setPage(0);
          }}
        />
      </Field>
      <p className={styles.copy} role="status">
        {filtered.length} {filtered.length === 1 ? 'illicon' : 'illicons'}
      </p>
      {error ? (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      ) : null}
      {filtered.length ? (
        <div className={styles.grid}>
          {filtered.slice(start, start + pageSize).map((icon) => (
            <article key={icon.id} className={styles.tile} aria-label={icon.name}>
              <CopyButton
                className={styles.copyButton}
                aria-label={`Copy ${icon.name} SVG`}
                contentToCopy={originalSvg(icon.src)}
                copiedMessage={`Copied ${icon.name} SVG`}
                onClick={() => setError('')}
                onCopyError={() =>
                  setError(
                    `Could not copy ${icon.name} SVG. Check clipboard permissions and try again.`,
                  )
                }
              />
              <img
                src={icon.src}
                alt=""
                width={80}
                height={80}
                loading="lazy"
                className={mergeClasses(styles.preview, styles[mode])}
                onError={() => setError(`Preview unavailable for ${icon.name}.`)}
              />
              <div className={styles.caption}>
                <h2 className={styles.label}>{icon.name}</h2>
                {icon.tags.length ? (
                  <p className={styles.tags} title={icon.tags.join(', ')}>
                    {icon.tags.join(', ')}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>No illicons match your search. Try another name or tag.</p>
      )}
      {pageCount > 1 ? (
        <nav className={styles.actions} aria-label="Illicon pages">
          <Button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
            Previous
          </Button>
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <Button disabled={currentPage + 1 === pageCount} onClick={() => setPage(currentPage + 1)}>
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
