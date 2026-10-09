import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { fetchAll, toImg, mediaUrl, downloadMedia, type StrapiMedia } from './lib/strapi';

/** Image blocks inside rich text carry their own media URL. */
function resolveBlockImages(blocks: unknown[]): unknown[] {
  return blocks.map((block) => {
    const b = block as { type?: string; image?: { url: string }; children?: unknown[] };
    if (b.type === 'image' && b.image) return { ...b, image: { ...b.image, url: mediaUrl(b.image.url) } };
    return b.children ? { ...b, children: resolveBlockImages(b.children) } : b;
  });
}

/*
 * Two CMS systems, both served by Strapi:
 *  - Blog:    articles + categories (article -> category, many-to-one)
 *  - Authors: authors              (article -> author,   many-to-one)
 * Entries are keyed by slug so pages can call getEntry('articles', slug).
 */

const img = z.object({ src: z.string(), srcset: z.string().optional(), alt: z.string() });

interface StrapiCategory { slug: string; name: string; summary: string | null; isPopular: boolean }
interface StrapiAuthor {
  slug: string; name: string; designation: string | null; bio: string | null; avatar: StrapiMedia | null;
  xUrl: string | null; facebookUrl: string | null; instagramUrl: string | null; linkedinUrl: string | null;
}
interface StrapiArticle {
  slug: string; title: string; excerpt: string | null; readTime: string | null; date: string;
  cover: StrapiMedia | null; content: unknown[] | null; isFeatured: boolean; isShowcase: boolean;
  category: Pick<StrapiCategory, 'slug' | 'name'> | null; author: Pick<StrapiAuthor, 'slug' | 'name'> | null;
}

const categories = defineCollection({
  loader: async () => {
    const data = await fetchAll<StrapiCategory>('categories', { sort: 'createdAt:desc' });
    return data.map((c, order) => ({ id: c.slug, order, slug: c.slug, name: c.name, summary: c.summary ?? '', isPopular: !!c.isPopular }));
  },
  schema: z.object({ order: z.number(), slug: z.string(), name: z.string(), summary: z.string(), isPopular: z.boolean() }),
});

const authors = defineCollection({
  loader: async () => {
    const data = await fetchAll<StrapiAuthor>('authors', { sort: 'createdAt:desc', populate: 'avatar' });
    const entries = data.map((a, order) => ({
      id: a.slug,
      order,
      slug: a.slug,
      name: a.name,
      designation: a.designation ?? '',
      bio: a.bio ?? '',
      avatar: toImg(a.avatar, 'Author Image'),
      social: { x: a.xUrl, facebook: a.facebookUrl, instagram: a.instagramUrl, linkedin: a.linkedinUrl },
    }));
    await downloadMedia();
    return entries;
  },
  schema: z.object({
    order: z.number(),
    slug: z.string(),
    name: z.string(),
    designation: z.string(),
    bio: z.string(),
    avatar: img.nullable(),
    social: z.object({ x: z.string().nullable(), facebook: z.string().nullable(), instagram: z.string().nullable(), linkedin: z.string().nullable() }),
  }),
});

const articles = defineCollection({
  loader: async () => {
    const data = await fetchAll<StrapiArticle>('articles', {
      sort: 'date:desc',
      'populate[cover]': 'true',
      'populate[category][fields][0]': 'name',
      'populate[category][fields][1]': 'slug',
      'populate[author][fields][0]': 'name',
      'populate[author][fields][1]': 'slug',
    });
    const entries = data.map((a) => ({
      id: a.slug,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt ?? '',
      readTime: a.readTime ?? '',
      date: a.date,
      cover: toImg(a.cover, 'Blog Image'),
      content: resolveBlockImages(a.content ?? []),
      isFeatured: !!a.isFeatured,
      isShowcase: !!a.isShowcase,
      category: a.category ? { slug: a.category.slug, name: a.category.name } : null,
      author: a.author ? { slug: a.author.slug, name: a.author.name } : null,
    }));
    await downloadMedia();
    return entries;
  },
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    excerpt: z.string(),
    readTime: z.string(),
    date: z.coerce.date(),
    cover: img.nullable(),
    // Strapi "blocks" rich text – rendered by src/lib/blocks.ts
    content: z.array(z.any()),
    isFeatured: z.boolean(),
    isShowcase: z.boolean(),
    category: z.object({ slug: z.string(), name: z.string() }).nullable(),
    author: z.object({ slug: z.string(), name: z.string() }).nullable(),
  }),
});

export const collections = { articles, authors, categories };
