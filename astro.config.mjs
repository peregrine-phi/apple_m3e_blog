import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import remarkWikiLink from "@flowershow/remark-wiki-link";

// https://astro.build/config
export default defineConfig({
  site: "https://m3e.blog",
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