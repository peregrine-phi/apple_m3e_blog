import { readFileSync } from 'fs';
import { join } from 'path';

// ── COLOR CONVERSION UTILITIES ──

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function hexToRgb(hex) {
  hex = hex.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

function parseColorToRgb(colorStr, varsMap) {
  colorStr = colorStr.replace(/\s+/g, ''); // Strip all whitespace/newlines
  if (colorStr.startsWith('#')) {
    return hexToRgb(colorStr);
  }
  if (colorStr.startsWith('hsl')) {
    const parts = colorStr.match(/hsla?\(([^)]+)\)/);
    if (parts) {
      const vals = parts[1].split(',').map(p => p.trim());
      const h = parseFloat(vals[0]);
      const s = parseFloat(vals[1].replace('%', ''));
      const l = parseFloat(vals[2].replace('%', ''));
      return hslToRgb(h, s, l);
    }
  }
  if (colorStr.startsWith('var(')) {
    const name = colorStr.match(/var\(([^)]+)\)/)[1].trim().split(',')[0].trim();
    if (varsMap[name]) {
      return parseColorToRgb(varsMap[name], varsMap);
    }
  }
  throw new Error(`Unable to parse color: ${colorStr}`);
}

// ── WCAG LUMINANCE AND CONTRAST FORMULAS ──

function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(l1, l2) {
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 100) / 100;
}

// ── CSS PARSING AND MERGING UTILITIES ──

function parseCssVariables(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
  const variables = {};
  const regex = /(--[\w-]+)\s*:\s*([^;}]+)/g;
  let match;
  while ((match = regex.exec(cleanContent)) !== null) {
    variables[match[1].trim()] = match[2].trim();
  }
  return variables;
}

function resolveVars(varsMap) {
  const resolved = {};
  for (const key in varsMap) {
    let value = varsMap[key];
    let iterations = 0;
    while (value.includes('var(') && iterations < 10) {
      value = value.replace(/var\(([^)]+)\)/g, (match, propName) => {
        propName = propName.trim().split(',')[0].trim();
        return varsMap[propName] || match;
      });
      iterations++;
    }
    resolved[key] = value;
  }
  return resolved;
}

// ── MAIN RUNNER ──

const colorsPath = join(process.cwd(), 'src/styles/tokens/colors.css');
const darkPath = join(process.cwd(), 'src/styles/themes/dark.css');

console.log('----------------------------------------------------');
console.log('Design System Contrast Checker (WCAG 2.2 AA Audit)');
console.log('----------------------------------------------------');

const rawLightVars = parseCssVariables(colorsPath);
const rawDarkVars = parseCssVariables(darkPath);

// Merge light vars as fallbacks for dark mode references
const mergedDarkVars = { ...rawLightVars, ...rawDarkVars };

const lightResolved = resolveVars(rawLightVars);
const darkResolved = resolveVars(mergedDarkVars);

const pairsToTest = [
  { bg: '--blog-color-primary', fg: '--blog-color-on-primary', name: 'Primary Button' },
  { bg: '--blog-color-primary-container', fg: '--blog-color-on-primary-container', name: 'Primary Container' },
  { bg: '--blog-color-secondary', fg: '--blog-color-on-secondary', name: 'Secondary Button' },
  { bg: '--blog-color-secondary-container', fg: '--blog-color-on-secondary-container', name: 'Secondary Container' },
  { bg: '--blog-color-background', fg: '--blog-color-on-background', name: 'Background Text' },
  { bg: '--blog-color-surface', fg: '--blog-color-on-surface', name: 'Surface Text' },
  { bg: '--blog-color-surface-variant', fg: '--blog-color-on-surface-variant', name: 'Surface Variant' },
  { bg: '--blog-color-success', fg: '--blog-color-on-success', name: 'Success Action' },
  { bg: '--blog-color-success-container', fg: '--blog-color-on-success-container', name: 'Success Container' },
  { bg: '--blog-color-warning', fg: '--blog-color-on-warning', name: 'Warning Action' },
  { bg: '--blog-color-warning-container', fg: '--blog-color-on-warning-container', name: 'Warning Container' },
  { bg: '--blog-color-error', fg: '--blog-color-on-error', name: 'Error Action' },
  { bg: '--blog-color-error-container', fg: '--blog-color-on-error-container', name: 'Error Container' },
  { bg: '--blog-color-background', fg: '--blog-color-text-primary', name: 'Text Primary' },
  { bg: '--blog-color-background', fg: '--blog-color-text-secondary', name: 'Text Secondary' },
  { bg: '--blog-color-brand-css', fg: '--blog-color-on-brand-css', name: 'Brand CSS (Active)' },
  { bg: '--blog-color-brand-astro', fg: '--blog-color-on-brand-astro', name: 'Brand Astro (Active)' }
];

let failed = false;

function auditTheme(themeName, varsMap) {
  console.log(`\nAudit Theme: [${themeName.toUpperCase()}]`);
  console.log('='.repeat(52));
  
  for (const pair of pairsToTest) {
    try {
      const bgVal = varsMap[pair.bg];
      const fgVal = varsMap[pair.fg];
      
      if (!bgVal || !fgVal) {
        console.warn(`⚠️  Skipped [${pair.name}]: Background ${pair.bg} or Foreground ${pair.fg} not found.`);
        continue;
      }
      
      const bgRgb = parseColorToRgb(bgVal, varsMap);
      const fgRgb = parseColorToRgb(fgVal, varsMap);
      
      const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
      
      const contrast = getContrastRatio(bgLuminance, fgLuminance);
      const passed = contrast >= 4.5;
      
      const statusIcon = passed ? '✅' : '❌';
      const statusText = passed ? 'PASS' : 'FAIL';
      
      const bgClean = bgVal.replace(/\s+/g, '');
      const fgClean = fgVal.replace(/\s+/g, '');
      const label = `${statusIcon}  ${pair.name.padEnd(22)} | Contrast: ${(contrast.toFixed(2) + ':1').padEnd(7)} | ${statusText.padEnd(4)} (BG: ${bgClean}, FG: ${fgClean})`;
      console.log(label);
      
      if (!passed) {
        failed = true;
      }
    } catch (err) {
      console.error(`🔴  Error testing [${pair.name}]:`, err.message);
      failed = true;
    }
  }
}

auditTheme('Light Theme', lightResolved);
auditTheme('Dark Theme', darkResolved);

console.log('\n----------------------------------------------------');
if (failed) {
  console.error('❌  Audit FAILED: Some design tokens do not satisfy WCAG AA contrast ratio of 4.5:1.');
  process.exit(1);
} else {
  console.log('✅  Audit PASSED: All key design tokens satisfy WCAG AA contrast ratio of 4.5:1!');
  process.exit(0);
}
