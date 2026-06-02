---
title: "Building a Token-Based Design System"
description: "Why CSS custom properties are the foundation of modern, themeable design systems, and how to structure them for maintainability."
publishedAt: 2026-05-15
tags: ["design-systems", "css", "frontend"]
featured: true
growthStage: evergreen
knowledgeDomain: Design
lang: en
---

Design systems live and die by their foundation. Get the tokens right, and everything else follows. Get them wrong, and you'll be fighting your own abstractions for years.

In this article, we'll look at why CSS custom properties are the web's native mechanism for design tokens, how M3E structures them across three layers (plus layout and pill scales), and why this architecture makes theming and design fusion practical.

## Why Design Tokens?

Design tokens are the atomic units of a design system — colors, typography scales, spacing values, shadows, motion curves. When defined as platform-agnostic variables, they become the single source of truth that bridges design and code.

CSS custom properties (`--*`) live in the browser and respond to context changes — media queries, theme switches, component states, even user-driven preferences via `prefers-color-scheme`. This fits perfectly with Astro's zero-JS-by-default philosophy: the token system is a **compile-time + runtime CSS** concern, not a JavaScript framework concern.

## The Three-Layer Token Model

A robust token system has three layers. M3E implements this in the `@m3e/framework` workspace package:

### 1. Reference Tokens

Raw values — hex colors, pixel sizes, font names. They carry no semantic meaning and are never used directly in component styles:

```css
/* packages/framework/src/styles/tokens/colors.css */
--ref-blue-500: #3B5CF6;
--ref-neutral-100: #F5F5F7;

/* packages/framework/src/styles/tokens/spacing.css */
--ref-space-4: 16px;
--ref-space-11: 44px;
```

### 2. System Tokens

Map reference tokens to semantic roles. This is where "blue-500" becomes "primary", and where theming happens:

```css
/* Light theme: packages/framework/src/styles/themes/light.css */
--sys-color-primary: var(--ref-blue-500);
--sys-surface-container: var(--ref-neutral-100);

/* Dark theme: packages/framework/src/styles/themes/dark.css */
--sys-color-primary: var(--ref-blue-200); /* lighter for dark bg */
--sys-surface-container: var(--ref-neutral-900);
```

Switching themes is just remapping system tokens. No component code changes.

### 3. Component Tokens

Component-specific tokens reference system tokens, keeping components decoupled from the global system:

```css
/* packages/framework/src/styles/components/button.css */
--btn-bg: var(--sys-color-primary);
--btn-padding-x: var(--sys-space-md);
--btn-radius: var(--sys-shape-sm);
```

## Beyond the Basics: Layout & Pill Tokens

M3E extends the three-layer model with two specialized token families:

### Layout Tokens — The Scaling Hinge

All spatial decisions derive from a single base unit:

```css
/* packages/framework/src/styles/tokens/layout.css */
--layout-base-unit: 11;  /* = 44px, the human touch target */
--layout-space-xs: calc(var(--layout-base-unit) * 0.25);  /* 11px */
--layout-space-sm: calc(var(--layout-base-unit) * 0.5);   /* 22px */
--layout-space-md: calc(var(--layout-base-unit) * 1);     /* 44px */
--layout-space-lg: calc(var(--layout-base-unit) * 1.5);   /* 66px */
```

Change `--layout-base-unit`, and the entire spatial system scales proportionally. The header height, sidebar width, and component spacing all shift together.

### Pill Tokens — The Capsule Scale

Navigation pills and capsule-shaped elements follow a strict height ↔ font-size ratio (`--pill-text-ratio: 0.32`):

```css
/* packages/framework/src/styles/tokens/nav-pill.css */
--pill-h-sm: 36px;  /* label-small (11px) → 31% */
--pill-h-md: 40px;  /* label-medium (12px) → 30% */
--pill-h-lg: 44px;  /* title-small (14px) → 32% */
```

Every capsule in the UI — header logo, ToC toggle, settings drawer button — references these tokens. Visual harmony is enforced by math, not guesswork.

## Theming and Design Fusion

The real power emerges when you realize that theming is simply reassigning system tokens. Light mode to dark mode? Remap roles. HIG style to Material 3 expressive style? Remap *selectively*.

In M3E, the visual fusion works like this:

- **Structural chrome** (header, sidebar, navigation pills) → HIG-style liquid glass with `backdrop-filter: blur(20px) saturate(1.8)`
- **State highlights and interactive surfaces** → Material 3 tonal containers (`--sys-color-primary-container: var(--ref-primary-90)`)
- **Motion** → HIG spring curves for micro-interactions, Material 3 emphasized easing for page transitions

All of this is driven by CSS custom properties. No JavaScript runtime required for the base visual system.

## Practical Tips

- **Namespace everything.** Use a prefix that identifies your system (`--sys-*`, `--ref-*`, `--pill-*`). M3E uses `--blog-*` for page-level overrides.
- **Don't over-abstract.** Every token should earn its place. If a value is used once and will never be themed, it might not need a token.
- **Document with comments.** Tokens without documentation are worse than hardcoded values — they give the *illusion* of system while being opaque.
- **Use `calc()` chains for derivation.** Layout tokens should derive from one another, creating a geometric progression that feels intentional.

## The Payoff

Building with tokens takes more upfront thought, but pays dividends every time you need to:

- Support a new theme (remap system tokens — done)
- Adjust the visual language (tweak reference tokens — cascade handles the rest)
- Hand off to another developer (tokens are self-documenting by design)
- Fuse two design philosophies (selectively remap at the system layer — no component changes)

M3E's token system is why the HIG × Material 3 fusion feels coherent rather than patched together. Each system fills the gaps in the other, and the token architecture makes that filling systematic rather than ad-hoc.
