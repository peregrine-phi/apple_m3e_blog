/**
 * Zero-dependency Monet/Material You color scheme generator.
 * Based on OKLCH color space for perceptual uniformity.
 *
 * Architecture:
 *   1. Hex → OKLCH (perceptually uniform, CSS-native)
 *   2. Seed color → rotated hues for secondary/tertiary
 *   3. Tone levels mapped to M3 color roles (light + dark)
 *   4. Output as --blog-color-* CSS tokens
 *
 * M3 Tone → Role mapping (light theme):
 *   Primary:        tone 40  (vibrant)
 *   On Primary:     tone 100 (white)
 *   Container:      tone 90  (pale)
 *   On Container:   tone 10  (dark)
 *   Secondary/Tertiary: same structure
 *   Surface:        98→92  tone gradient
 */

// ── Color conversion utilities ──

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [
    parseInt(c.substring(0, 2), 16) / 255,
    parseInt(c.substring(2, 4), 16) / 255,
    parseInt(c.substring(4, 6), 16) / 255,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (x: number) =>
    Math.round(Math.max(0, Math.min(1, x)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Linear sRGB
function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function fromLinear(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// sRGB → OKLab
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

// OKLab → OKLCH
function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  const H = Math.atan2(b, a) * (180 / Math.PI);
  return [L, C, H < 0 ? H + 360 : H];
}

// OKLCH → OKLab
function oklchToOklab(L: number, C: number, H: number): [number, number, number] {
  const hRad = H * (Math.PI / 180);
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

// OKLab → sRGB
function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    fromLinear(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}

// ── Monet Palette Generator ──

function toneColor(L: number, C: number, H: number, tone: number): string {
  // tone is 0-100 (OKLCH Lightness)
  const tL = tone / 100;
  // Scale chroma: maintain at low tones, reduce at extremes for perceptual quality
  const tC = tone < 10 ? C * 0.3 : tone > 90 ? C * 0.4 : C;
  const [r, g, b] = oklabToRgb(...oklchToOklab(tL, tC, H));
  return rgbToHex(r, g, b);
}

interface MonetPalette {
  primary: { L: number; C: number; H: number };
  secondary: { L: number; C: number; H: number };
  tertiary: { L: number; C: number; H: number };
  neutral: { L: number; C: number; H: number };
  neutralVariant: { L: number; C: number; H: number };
  error: { L: number; C: number; H: number };
}

function buildPalette(seedHex: string, variant: string = "tonalSpot"): MonetPalette {
  const [r, g, b] = hexToRgb(seedHex);
  const [L, a_val, b_val] = rgbToOklab(r, g, b);
  const [_, C, H] = oklabToOklch(L, a_val, b_val);

  let pC = 0, sC = 0, tC = 0, nC = 0, nvC = 0;
  let tertiaryShift = 60;
  let secondaryShift = 30;

  if (variant === "monochrome") {
    pC = 0;
    sC = 0;
    tC = 0;
    nC = 0;
    nvC = 0;
    tertiaryShift = 0;
    secondaryShift = 0;
  } else if (variant === "vibrant") {
    pC = Math.max(C, 0.22);
    sC = Math.min(C * 0.8, 0.16);
    tC = Math.min(C * 0.9, 0.18);
    nC = Math.min(C * 0.1, 0.03);
    nvC = Math.min(C * 0.25, 0.05);
    tertiaryShift = 60;
  } else if (variant === "expressive") {
    pC = Math.min(C, 0.22);
    sC = Math.min(C * 0.7, 0.14);
    tC = Math.max(C, 0.22);
    nC = Math.min(C * 0.12, 0.03);
    nvC = Math.min(C * 0.25, 0.06);
    tertiaryShift = 120;
    secondaryShift = 60;
  } else if (variant === "content") {
    pC = C;
    sC = Math.min(C * 0.35, 0.06);
    tC = Math.min(C * 0.45, 0.08);
    nC = Math.min(C * 0.04, 0.01);
    nvC = Math.min(C * 0.08, 0.02);
    tertiaryShift = 30;
  } else {
    // Default tonalSpot
    pC = Math.min(C, 0.18);
    sC = Math.min(C * 0.5, 0.08);
    tC = Math.min(C * 0.6, 0.10);
    nC = Math.min(C * 0.08, 0.02);
    nvC = Math.min(C * 0.2, 0.04);
    tertiaryShift = 60;
  }

  return {
    primary:     { L: 0.5, C: pC, H },
    secondary:   { L: 0.5, C: sC, H: (H + secondaryShift) % 360 },
    tertiary:    { L: 0.5, C: tC, H: (H + tertiaryShift) % 360 },
    neutral:     { L: 0.5, C: nC, H },
    neutralVariant: { L: 0.5, C: nvC, H },
    error:       { L: 0.5, C: 0.15, H: 25 },
  };
}

// ── M3 Tone Mapping (light theme) ──

interface TokenDef {
  role: string;
  token: string;
  palette: keyof MonetPalette;
  lightTone: number;
  darkTone: number;
}

const SCHEME_TOKENS: TokenDef[] = [
  // Primary
  { role: "primary",              token: "--blog-color-primary",               palette: "primary",        lightTone: 40, darkTone: 80 },
  { role: "onPrimary",            token: "--blog-color-on-primary",             palette: "primary",        lightTone: 100, darkTone: 20 },
  { role: "primaryContainer",      token: "--blog-color-primary-container",      palette: "primary",        lightTone: 90, darkTone: 30 },
  { role: "onPrimaryContainer",    token: "--blog-color-on-primary-container",   palette: "primary",        lightTone: 10, darkTone: 90 },
  // Secondary  
  { role: "secondary",            token: "--blog-color-secondary",             palette: "secondary",      lightTone: 40, darkTone: 80 },
  { role: "onSecondary",          token: "--blog-color-on-secondary",           palette: "secondary",      lightTone: 100, darkTone: 20 },
  { role: "secondaryContainer",    token: "--blog-color-secondary-container",    palette: "secondary",      lightTone: 90, darkTone: 30 },
  { role: "onSecondaryContainer",  token: "--blog-color-on-secondary-container", palette: "secondary",      lightTone: 10, darkTone: 90 },
  // Tertiary
  { role: "tertiary",             token: "--blog-color-tertiary",              palette: "tertiary",       lightTone: 40, darkTone: 80 },
  { role: "onTertiary",           token: "--blog-color-on-tertiary",            palette: "tertiary",       lightTone: 100, darkTone: 20 },
  { role: "tertiaryContainer",     token: "--blog-color-tertiary-container",     palette: "tertiary",       lightTone: 90, darkTone: 30 },
  { role: "onTertiaryContainer",   token: "--blog-color-on-tertiary-container",  palette: "tertiary",       lightTone: 10, darkTone: 90 },
  // Error
  { role: "error",                token: "--blog-color-error",                 palette: "error",          lightTone: 40, darkTone: 80 },
  { role: "onError",              token: "--blog-color-on-error",               palette: "error",          lightTone: 100, darkTone: 20 },
  { role: "errorContainer",        token: "--blog-color-error-container",         palette: "error",          lightTone: 90, darkTone: 30 },
  { role: "onErrorContainer",      token: "--blog-color-on-error-container",      palette: "error",          lightTone: 10, darkTone: 90 },
  // Surface
  { role: "background",           token: "--blog-color-background",            palette: "neutral",       lightTone: 98, darkTone: 6 },
  { role: "onBackground",         token: "--blog-color-on-background",          palette: "neutral",       lightTone: 10, darkTone: 90 },
  { role: "surface",              token: "--blog-color-surface",                palette: "neutral",       lightTone: 98, darkTone: 6 },
  { role: "onSurface",            token: "--blog-color-on-surface",              palette: "neutral",       lightTone: 10, darkTone: 90 },
  // Surface containers (tonal elevation)
  { role: "surfaceContainerLowest",     token: "--blog-color-surface-container-lowest",    palette: "neutral", lightTone: 100, darkTone: 4 },
  { role: "surfaceContainerLow",       token: "--blog-color-surface-container-low",       palette: "neutral", lightTone: 96, darkTone: 10 },
  { role: "surfaceContainer",           token: "--blog-color-surface-container",           palette: "neutral", lightTone: 94, darkTone: 12 },
  { role: "surfaceContainerHigh",       token: "--blog-color-surface-container-high",      palette: "neutral", lightTone: 92, darkTone: 17 },
  { role: "surfaceContainerHighest",    token: "--blog-color-surface-container-highest",   palette: "neutral", lightTone: 90, darkTone: 22 },
  // Outline
  { role: "outline",              token: "--blog-color-outline",                palette: "neutralVariant", lightTone: 50, darkTone: 60 },
  { role: "outlineVariant",       token: "--blog-color-outline-variant",         palette: "neutralVariant", lightTone: 80, darkTone: 30 },
  { role: "onSurfaceVariant",     token: "--blog-color-on-surface-variant",      palette: "neutralVariant", lightTone: 30, darkTone: 80 },
  // Derived
  { role: "primaryHover",         token: "--blog-color-primary-hover",           palette: "primary",        lightTone: 30, darkTone: 90 },
  { role: "primaryActive",        token: "--blog-color-primary-active",          palette: "primary",        lightTone: 20, darkTone: 95 },
  // Text (derived from neutral)
  { role: "textPrimary",          token: "--blog-color-text-primary",            palette: "neutral",        lightTone: 10, darkTone: 90 },
  { role: "textSecondary",        token: "--blog-color-text-secondary",          palette: "neutral",        lightTone: 40, darkTone: 70 },
  { role: "textTertiary",         token: "--blog-color-text-tertiary",           palette: "neutral",        lightTone: 60, darkTone: 50 },
  { role: "textLink",             token: "--blog-color-text-link",               palette: "primary",        lightTone: 40, darkTone: 80 },
  { role: "textLinkHover",        token: "--blog-color-text-link-hover",         palette: "primary",        lightTone: 30, darkTone: 90 },
  // Selection
  { role: "selectionBg",          token: "--blog-color-selection-bg",            palette: "primary",        lightTone: 80, darkTone: 30 },
];

// ── Public API ──

export function generateSchemeCSS(seedHex: string, variant: string = "tonalSpot"): {
  light: string;
  dark: string;
} {
  const palette = buildPalette(seedHex, variant);

  function build(scope: string, isDark: boolean): string {
    const lines: string[] = [scope + " {"];
    for (const def of SCHEME_TOKENS) {
      const p = palette[def.palette];
      const tone = isDark ? def.darkTone : def.lightTone;
      const color = toneColor(p.L, p.C, p.H, tone);
      lines.push(`  ${def.token}: ${color};`);
    }
    // Also add surface variants (not in scheme tokens — internal tokens)
    if (!isDark) {
      lines.push(`  --blog-color-surface-variant: ${toneColor(palette.neutral.L, palette.neutral.C, palette.neutral.H, 90)};`);
      lines.push(`  --blog-color-surface-dim: ${toneColor(palette.neutral.L, palette.neutral.C, palette.neutral.H, 87)};`);
      lines.push(`  --blog-color-surface-bright: ${toneColor(palette.neutral.L, palette.neutral.C, palette.neutral.H, 100)};`);
    } else {
      lines.push(`  --blog-color-surface-variant: ${toneColor(palette.neutral.L, palette.neutral.C, palette.neutral.H, 30)};`);
      lines.push(`  --blog-color-surface-dim: ${toneColor(palette.neutral.L, palette.neutral.C, palette.neutral.H, 6)};`);
      lines.push(`  --blog-color-surface-raised: ${toneColor(palette.neutral.L, palette.neutral.C, palette.neutral.H, 12)};`);
    }
    lines.push("}");
    return lines.join("\n");
  }

  return {
    light: build(`:root[data-monet="custom-${seedHex.replace('#','')}-${variant}"]`, false),
    dark: build(`:root[data-theme="dark"][data-monet="custom-${seedHex.replace('#','')}-${variant}"]`, true),
  };
}

import { monetConfig } from "../config/monet.config.js";

export const MONET_PRESETS = monetConfig.presets;
export const MONET_VARIANTS = monetConfig.variants;
