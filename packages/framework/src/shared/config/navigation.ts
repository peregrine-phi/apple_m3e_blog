/**
 * Navigation Configuration
 *
 * Data-driven nav items for the site header.
 * Add / remove / reorder entries here — the header auto-renders them.
 *
 * Schema:
 *   href      — target URL
 *   labelKey  — i18n translation key (from translations.ts)
 *   label     — fallback plain text if no i18n key
 *   external  — if true, opens in new tab with rel="noopener"
 */

import type { NavItem } from "../types";

const navigation: NavItem[] = [
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/about", labelKey: "nav.about" },
];

export default navigation;
