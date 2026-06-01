// src/content/filter-config.ts
// Separation of Concerns: Content metadata configuration

export interface ChipConfig {
  color?: string;
  borderColor?: string;
  hoverColor?: string;
  variant?: "default" | "brutal" | "elevated";
  emoji?: string;
  iconSvg?: string;
}

export const tagConfig: Record<string, ChipConfig> = {
  "design": {
    color: "var(--blog-color-primary)",
    borderColor: "var(--blog-color-primary)",
    variant: "brutal"
  },
  "css": {
    color: "#E34F26",
    borderColor: "#E34F26",
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 4H4v16h16V4z"/></svg>`
  },
  "astro": {
    color: "#FF5D01",
    borderColor: "#FF5D01",
    variant: "elevated",
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>`
  },
  "design-systems": {
    color: "var(--blog-color-secondary)",
    borderColor: "var(--blog-color-secondary)",
    variant: "brutal"
  },
  "en": {
    color: "var(--blog-color-primary-container)",
    borderColor: "var(--blog-color-outline-variant)"
  },
  "zh": {
    color: "var(--blog-color-tertiary-container)",
    borderColor: "var(--blog-color-outline-variant)"
  }
};

export const stageConfig: Record<string, ChipConfig> = {
  "seedling": {
    emoji: "🌱",
    color: "var(--blog-color-primary)",
    borderColor: "var(--blog-color-outline)"
  },
  "budding": {
    emoji: "🌿",
    color: "var(--blog-color-secondary)",
    borderColor: "var(--blog-color-outline)"
  },
  "evergreen": {
    emoji: "🌳",
    color: "var(--blog-color-tertiary)",
    borderColor: "var(--blog-color-outline)"
  }
};
