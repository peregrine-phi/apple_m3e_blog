---
title: "About the author"
---
Hi, I'm the creator of M3E — a personal blog where design systems theory meets frontend craft.

M3E stands for **Material 3 Expressive × Apple HIG** — a design language that fuses HIG's restrained precision with Material 3's expressive vitality. The blog itself is the sandbox where this fusion takes shape.

## Design Philosophy

- **Tokens first, always.** Every visual decision — color, type, spacing, motion — lives in CSS custom properties. No exceptions.
- **Progressive enhancement.** Pages are fully functional without JavaScript. Interactivity is layered on as isolated "islands" where needed.
- **Accessibility by default.** WCAG 2.1 AA contrast, keyboard navigation, and screen-reader semantics are built in, not bolted on.
- **Motion with purpose.** Animation guides attention and reinforces spatial relationships — never decorative.

## Colophon

| Layer | Tooling |
|-------|---------|
| Framework | [Astro 5](https://astro.build) — content-first, zero-JS-by-default |
| Interactivity | [Svelte 5](https://svelte.dev) — reactive islands (theme toggle, Monet switcher, music player) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [daisyUI v5](https://daisyui.com) — utility layer + component primitives |
| Design Tokens | `@m3e/framework` (workspace package) — 3-layer token architecture: Reference → System → Component |
| Color System | `@material/material-color-utilities` — Material 3 tonal palettes + dynamic Monet extraction |
| Code Highlighting | [Prism](https://prismjs.com) — server-side tokenization, zero client JS |
| Typography | Google Sans Flex + Noto Sans/Serif (JP / SC / TC) — variable font stacks |
| Hosting | Edge-first static deployment |

## The M3E Design System

The `@m3e/framework` package is the project's shared design-system workspace. It publishes semantic CSS custom properties organized into layered token families:

- **Reference tokens** — raw hex, px, rem values (e.g. `--ref-blue-500: #3B5CF6`)
- **System tokens** — semantic role mapping (e.g. `--sys-color-primary: var(--ref-blue-500)`)
- **Component tokens** — scoped to each UI element (e.g. `--btn-bg: var(--sys-color-primary)`)
- **Layout tokens** — `--layout-base-unit: 11` (44px) as the single scaling hinge
- **Pill tokens** — `--pill-*` scale (sm/md/lg) pairing capsule height, font-size, and horizontal padding

The visual identity merges HIG's liquid-glass surfaces and spring-curve motion with Material 3's tonal palette system and corner-token shapes. The result: interfaces that feel simultaneously precise and alive.
