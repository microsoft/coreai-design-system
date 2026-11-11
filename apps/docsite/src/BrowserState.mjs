// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function readStoredValue(storageName, key) {
  try {
    return globalThis[storageName].getItem(key);
  } catch (error) {
    globalThis.console.warn(
      `Could not read ${key} from ${storageName}; using an in-memory preference.`,
      error,
    );
    return null;
  }
}

export function writeStoredValue(storageName, key, value) {
  try {
    globalThis[storageName].setItem(key, value);
  } catch (error) {
    globalThis.console.warn(
      `Could not save ${key} to ${storageName}; the preference is not persistent.`,
      error,
    );
  }
}

export function fragmentId(hash) {
  if (!hash) return undefined;
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
    globalThis.console.warn('Could not decode the documentation section link.', error);
    return undefined;
  }
}

export function revealFragment(hash) {
  const id = fragmentId(hash);
  const target = id ? globalThis.document.getElementById(id) : null;
  for (let parent = target?.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof globalThis.HTMLDetailsElement) parent.open = true;
  }
  return target;
}
