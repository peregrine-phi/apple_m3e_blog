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

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { monetConfig } from "../src/config/monet.config.js";
import {
  Hct,
  SchemeTonalSpot,
  SchemeContent,
  SchemeExpressive,
  SchemeVibrant,
  SchemeMonochrome,
  MaterialDynamicColors,
} from "@material/material-color-utilities";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──

const OUTPUT_DIR = resolve(__dirname, "..", "public", "monet");

const PRESETS = monetConfig.presets.map(p => ({
  name: p.name,
  seed: parseInt(p.seed.replace("#", ""), 16) | 0xFF000000
}));

const VARIANTS = monetConfig.variants.map(v => ({
  key: v.value,
  factory: {
    tonalSpot: SchemeTonalSpot,
    expressive: SchemeExpressive,
    vibrant: SchemeVibrant,
    content: SchemeContent,
    monochrome: SchemeMonochrome,
  }[v.value]
}));

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

    const light = new factory(sourceHct, false, 0.0);
    const dark = new factory(sourceHct, true, 0.0);

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
    const light = new factory(sourceHct, false, 0.0);
    const dark = new factory(sourceHct, true, 0.0);

    presetCSS += generateSchemeCSS(light, `[data-monet="${prefix}"]`);
    presetCSS += "\n";
    presetCSS += generateSchemeCSS(dark, `[data-theme="dark"][data-monet="${prefix}"]`);
    presetCSS += "\n\n";
  }

  writeFileSync(resolve(OUTPUT_DIR, `${preset.name}.css`), presetCSS, "utf-8");
}

console.log(`✔ Generated ${PRESETS.length * VARIANTS.length} Monet schemes in ${OUTPUT_DIR}`);
