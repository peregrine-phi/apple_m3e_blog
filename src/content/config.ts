import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    growthStage: z.enum(["seedling", "budding", "evergreen"]).default("seedling"),
    knowledgeDomain: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
