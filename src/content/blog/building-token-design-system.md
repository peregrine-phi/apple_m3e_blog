---
title: "Building a Token-Based Design System"
description: "Why CSS custom properties are the foundation of modern, themeable design systems, and how to structure them for maintainability."
publishedAt: 2026-05-15
tags: ["design-systems", "css", "frontend", "en"]
featured: true
growthStage: evergreen
knowledgeDomain: Design
---

Design systems live and die by their foundation. Get the tokens right, and everything else follows. Get them wrong, and you'll be fighting your own abstractions for years. 

In this article, we'll look at why CSS custom properties are the web's native mechanism for design tokens, and how we leverage them to bridge design philosophies.

## Why Design Tokens?

Design tokens are the atomic units of a design system — colors, typography scales, spacing values, shadows, and motion curves. When defined as platform-agnostic variables, they become the single source of truth that bridges design and code.

CSS custom properties (`--*`) live in the browser and respond to context changes — media queries, theme switches, and component states. This fits perfectly with the zero-JS-by-default philosophy we discuss in [[astro-content-first-framework|Astro 5: The Content-First Web Framework]], where we keep the runtime footprint as light as possible.

## The Three-Layer Token Model

A robust token system has three layers:

### 1. Reference Tokens
These are the raw values — hex colors, pixel sizes, font names. They carry no semantic meaning:
```css
--ref-blue-500: #3B5CF6;
--ref-space-4: 16px;
```

### 2. System Tokens
These map reference tokens to semantic roles. This is where "blue-500" becomes "primary":
```css
--sys-color-primary: var(--ref-blue-500);
--sys-space-md: var(--ref-space-4);
```

### 3. Component Tokens
Component-specific tokens reference system tokens, keeping components decoupled from the global system:
```css
--btn-bg: var(--sys-color-primary);
--btn-padding: var(--sys-space-md);
```

## Theming and Design Fusion

The real power emerges when you realize that theming is simply reassigning system tokens. Light mode to dark mode is just a remapping of roles.

By mapping system tokens dynamically, we can even bridge completely different visual philosophies on the same page. For example, our unique visual aesthetic in [[apple-meets-material3|Apple Design Meets Material 3]] relies heavily on using Apple-style translucent glass variables for structural layout while leveraging Material 3 tonal containers for state highlights.

## Practical Tips

- **Namespace everything.** Use a prefix that identifies your system (`--blog-*`, `--acme-*`).
- **Don't over-abstract.** Every token should earn its place. If you only use a value once, it might not need a token.
- **Document with comments.** Tokens without documentation are worse than hardcoded values.

Building with tokens takes more upfront thought, but pays dividends every time you need to support a new theme, adjust the visual language, or hand off to another developer.
