import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";
import remarkWikiLink from "@flowershow/remark-wiki-link";

// https://astro.build/config
const siteUrl = process.env.PUBLIC_SITE_URL || "https://m3e.blog";

export default defineConfig({
  site: siteUrl,
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [
      [
        remarkWikiLink,
        {
          pathFormat: "obsidian-absolute",
          hrefTemplate: (permalink) => `/blog/${permalink}`,
        },
      ],
    ],
    shikiConfig: {
      theme: "css-variables",
    },
  },
});