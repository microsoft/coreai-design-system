// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Builds a Fluent `BrandVariants` ramp (steps 10..160) from one key color.
 *
 * Each step matches the WCAG relative luminance of the same step in the CoreAI
 * purple ramp. Brand tokens therefore keep the contrast they have in the
 * shipped themes, whatever the hue. The key color supplies hue and chroma. The
 * key color itself sits on steps 80 and 90 only when its luminance is close to
 * that step and white text on it meets WCAG AA (4.5:1).
 */

export const BRAND_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];

// coreaiBrandVariants, step 10..160. Only its luminance and chroma shape are used.
const REFERENCE_RAMP = [
  '#030206',
  '#1A1326',
  '#2B1D44',
  '#38255E',
  '#472E79',
  '#553695',
  '#643FB2',
  '#8251EE',
  '#8251EE',
  '#9263F1',
  '#A175F3',
  '#AF86F5',
  '#BC98F7',
  '#C9AAF9',
  '#D5BCFB',
  '#E1CEFC',
];
// Chroma share per step, measured from the CoreAI ramp (OKLCH). Low at the ends so near-black and near-white stay
// neutral, full in the middle where brand fills and links live.
const CHROMA_ENVELOPE = [
  0.08, 0.17, 0.32, 0.44, 0.55, 0.67, 0.78, 1, 1, 0.91, 0.82, 0.72, 0.62, 0.51, 0.4, 0.3,
];
const KEY_STEP_INDEX = BRAND_STEPS.indexOf(80);
const NEUTRAL_CHROMA = 0.012;

export function normalizeHex(value) {
  if (typeof value !== 'string') return undefined;
  let hex = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = [...hex].map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : undefined;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
}

function rgbToHex(rgb) {
  return `#${rgb
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, c)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToOklch(rgb) {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
}

function oklchToLinearRgb([L, C, H]) {
  const hr = (H * Math.PI) / 180;
  const A = C * Math.cos(hr);
  const B = C * Math.sin(hr);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((c) => c >= -0.0001 && c <= 1.0001);

// Reduce chroma until the color fits in sRGB, keeping lightness and hue.
function oklchToHex(L, C, H) {
  let low = 0;
  let high = C;
  if (!inGamut(oklchToLinearRgb([L, high, H]))) {
    for (let i = 0; i < 24; i += 1) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinearRgb([L, mid, H]))) low = mid;
      else high = mid;
    }
    high = low;
  }
  return rgbToHex(oklchToLinearRgb([L, high, H]).map(fromLinear));
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * @param {string} keyColor Hex color such as `#0F6CBD`.
 * @returns {Record<number, string>} Brand ramp keyed 10..160.
 */
export function createBrandRamp(keyColor) {
  const hex = normalizeHex(keyColor) ?? REFERENCE_RAMP[KEY_STEP_INDEX];
  const [, keyC, keyH] = rgbToOklch(hexToRgb(hex));
  // Gray picks have no meaningful hue, so they produce a neutral ramp.
  const chroma = keyC < NEUTRAL_CHROMA ? 0 : keyC;
  const ramp = {};
  BRAND_STEPS.forEach((step, index) => {
    ramp[step] = matchLuminance(
      relativeLuminance(REFERENCE_RAMP[index]),
      chroma * CHROMA_ENVELOPE[index],
      keyH,
    );
  });
  const target = relativeLuminance(ramp[80]);
  const keyLuminance = relativeLuminance(hex);
  const keyFitsStep =
    Math.abs(keyLuminance - target) / target <= 0.35 && contrastRatio(hex, '#FFFFFF') >= 4.5;
  if (keyFitsStep) {
    ramp[80] = hex;
    ramp[90] = hex;
  }
  return ramp;
}

// Find the OKLCH lightness whose sRGB color has the target luminance.
function matchLuminance(target, chroma, hue) {
  let low = 0;
  let high = 1;
  let best = oklchToHex(0.5, chroma, hue);
  for (let i = 0; i < 28; i += 1) {
    const mid = (low + high) / 2;
    best = oklchToHex(mid, chroma, hue);
    if (relativeLuminance(best) < target) low = mid;
    else high = mid;
  }
  return best;
}
