/**
 * Build script: generate Monet CSS stylesheets
 * Run: node scripts/generate-monet.mjs
 *
 * This script must be run BEFORE astro build.
 * It generates pre-built CSS for all Monet presets × variants.
 *
 * Why a separate script?
 * The @material/material-color-utilities package has known
 * ESM import bugs in Node.js. We work around this by running
 * the generation as a standalone CommonJS process.
 */

import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const {
  Hct,
  SchemeTonalSpot,
  SchemeContent,
  SchemeExpressive,
  SchemeVibrant,
  SchemeMonochrome,
  MaterialDynamicColors,
} = require("@material/material-color-utilities");

// ── Config ──

const OUTPUT_DIR = resolve(__dirname, "..", "public", "monet");

const PRESETS = [
  { name: "m3-default",   seed: 0xFF6750A4 },
  { name: "ocean",        seed: 0xFF006C52 },
  { name: "coral",        seed: 0xFFBA1A1A },
  { name: "sapphire",     seed: 0xFF3B5CF6 },
  { name: "amber",        seed: 0xFF825500 },
  { name: "rose",         seed: 0xFFA0004B },
  { name: "mint",         seed: 0xFF006C4C },
  { name: "plum",         seed: 0xFF7A0065 },
];

const VARIANTS = [
  { key: "tonalSpot",  factory: SchemeTonalSpot },
  { key: "expressive", factory: SchemeExpressive },
  { key: "vibrant",    factory: SchemeVibrant },
  { key: "content",    factory: SchemeContent },
  { key: "monochrome", factory: SchemeMonochrome },
];

const SCHEME_ROLES = [
  // Primary
  ["primary", "--blog-color-primary"],
  ["onPrimary", "--blog-color-on-primary"],
  ["primaryContainer", "--blog-color-primary-container"],
  ["onPrimaryContainer", "--blog-color-on-primary-container"],
  // Secondary
  ["secondary", "--blog-color-secondary"],
  ["onSecondary", "--blog-color-on-secondary"],
  ["secondaryContainer", "--blog-color-secondary-container"],
  ["onSecondaryContainer", "--blog-color-on-secondary-container"],
  // Tertiary
  ["tertiary", "--blog-color-tertiary"],
  ["onTertiary", "--blog-color-on-tertiary"],
  ["tertiaryContainer", "--blog-color-tertiary-container"],
  ["onTertiaryContainer", "--blog-color-on-tertiary-container"],
  // Error
  ["error", "--blog-color-error"],
  ["onError", "--blog-color-on-error"],
  ["errorContainer", "--blog-color-error-container"],
  ["onErrorContainer", "--blog-color-on-error-container"],
  // Surface / Background
  ["background", "--blog-color-background"],
  ["onBackground", "--blog-color-on-background"],
  ["surface", "--blog-color-surface"],
  ["onSurface", "--blog-color-on-surface"],
  ["surfaceDim", "--blog-color-surface-dim"],
  ["surfaceBright", "--blog-color-surface-bright"],
  // Surface containers
  ["surfaceContainerLowest", "--blog-color-surface-container-lowest"],
  ["surfaceContainerLow", "--blog-color-surface-container-low"],
  ["surfaceContainer", "--blog-color-surface-container"],
  ["surfaceContainerHigh", "--blog-color-surface-container-high"],
  ["surfaceContainerHighest", "--blog-color-surface-container-highest"],
  // Outline
  ["outline", "--blog-color-outline"],
  ["outlineVariant", "--blog-color-outline-variant"],
  ["onSurfaceVariant", "--blog-color-on-surface-variant"],
];

// ── Helpers ──

function argbToHex(argb) {
  const r = (argb >> 16) & 0xff;
  const g = (argb >> 8) & 0xff;
  const b = argb & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function generateSchemeCSS(scheme, scope) {
  const lines = [scope + " {"];
  for (const [role, token] of SCHEME_ROLES) {
    const getter = MaterialDynamicColors[role];
    if (typeof getter?.getArgb === "function") {
      lines.push(`  ${token}: ${argbToHex(getter.getArgb(scheme))};`);
    }
  }
  lines.push("}");
  return lines.join("\n");
}

// ── Main ──

mkdirSync(OUTPUT_DIR, { recursive: true });

let allCSS = "/* Monet Dynamic Color — auto-generated */\n\n";

for (const preset of PRESETS) {
  const sourceHct = Hct.fromInt(preset.seed);

  for (const { key, factory } of VARIANTS) {
    const prefix = `${preset.name}--${key}`;

    const light = new factory({ sourceColorHct: sourceHct, isDark: false, contrastLevel: 0.0 });
    const dark = new factory({ sourceColorHct: sourceHct, isDark: true, contrastLevel: 0.0 });

    allCSS += generateSchemeCSS(light, `[data-monet="${prefix}"]`);
    allCSS += "\n";
    allCSS += generateSchemeCSS(dark, `[data-theme="dark"][data-monet="${prefix}"]`);
    allCSS += "\n\n";
  }
}

writeFileSync(resolve(OUTPUT_DIR, "all.css"), allCSS, "utf-8");

// Also generate individual preset files for selective loading
for (const preset of PRESETS) {
  let presetCSS = `/* Monet: ${preset.name} */\n\n`;

  for (const { key, factory } of VARIANTS) {
    const prefix = `${preset.name}--${key}`;
    const sourceHct = Hct.fromInt(preset.seed);
    const light = new factory({ sourceColorHct: sourceHct, isDark: false, contrastLevel: 0.0 });
    const dark = new factory({ sourceColorHct: sourceHct, isDark: true, contrastLevel: 0.0 });

    presetCSS += generateSchemeCSS(light, `[data-monet="${prefix}"]`);
    presetCSS += "\n";
    presetCSS += generateSchemeCSS(dark, `[data-theme="dark"][data-monet="${prefix}"]`);
    presetCSS += "\n\n";
  }

  writeFileSync(resolve(OUTPUT_DIR, `${preset.name}.css`), presetCSS, "utf-8");
}

console.log(`✔ Generated ${PRESETS.length * VARIANTS.length} Monet schemes in ${OUTPUT_DIR}`);
