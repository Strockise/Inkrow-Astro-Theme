import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'articles'>['data'];
export type Author = CollectionEntry<'authors'>['data'];
export type Category = CollectionEntry<'categories'>['data'];

/** Newest first – the order every list in the original template used. */
export async function getPosts(): Promise<Post[]> {
  return (await getCollection('articles')).map((e) => e.data).sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

/** Newest first (Strapi creation order). */
export async function getAuthors(): Promise<Author[]> {
  return (await getCollection('authors')).map((e) => e.data).sort((a, b) => a.order - b.order);
}

/** Newest first (Strapi creation order). */
export async function getCategories(): Promise<Category[]> {
  return (await getCollection('categories')).map((e) => e.data).sort((a, b) => a.order - b.order);
}
