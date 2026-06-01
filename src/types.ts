import type { translations } from "./i18n/translations";

export interface NavItem {
  href: string;
  labelKey?: keyof typeof translations.en;
  label?: string;
  external?: boolean;
}
