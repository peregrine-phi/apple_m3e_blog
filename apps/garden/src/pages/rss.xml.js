// src/pages/rss.xml.js — RSS feed
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../config/site";

export async function GET(context) {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const sortedPosts = posts.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );

  return rss({
    title: `${siteConfig.name} Blog`,
    description: siteConfig.description,
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/blog/${post.id.replace(/\.mdx?$/, "")}`,
    })),
  });
}
