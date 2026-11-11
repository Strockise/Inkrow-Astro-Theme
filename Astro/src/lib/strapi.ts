/**
 * Minimal Strapi v5 REST client used by the content collections (src/content.config.ts).
 * Data is fetched once at build time (or on dev-server start / content sync).
 */
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { STRAPI_URL, STRAPI_TOKEN, STRAPI_DOWNLOAD_MEDIA } from 'astro:env/server';

/** Demo content that ships with the CMS (Strapi/data). Used when Strapi cannot be reached. */
const SEED_DIR = path.resolve(process.cwd(), '..', 'Strapi', 'data');
const SEED_PREFIX = 'seed:';
let seedNoticeShown = false;

interface SeedData {
  categories: { slug: string; name: string; summary: string; isPopular: boolean }[];
  authors: ({ slug: string; name: string; avatar: string } & Record<string, unknown>)[];
  articles: ({ slug: string; title: string; date: string; cover: string; category: string; author: string } & Record<string, unknown>)[];
}

/**
 * Returns a collection from Strapi/data/seed.json, shaped like the Strapi REST response.
 * seed.json is ordered oldest -> newest, matching the order Strapi creates the entries in.
 */
function fromSeed(endpoint: string): unknown[] | null {
  const file = path.join(SEED_DIR, 'seed.json');
  if (!existsSync(file)) return null;
  if (!seedNoticeShown) {
    console.warn(`[inkrow] Strapi is not reachable at ${base} – building with the demo content from ${file}`);
    seedNoticeShown = true;
  }
  const seed = JSON.parse(readFileSync(file, 'utf8')) as SeedData;
  const media = (name: string): StrapiMedia => ({ url: `${SEED_PREFIX}${name}` });
  const pick = <T extends { slug: string; name: string }>(list: T[], slug: string) => {
    const item = list.find((i) => i.slug === slug);
    return item ? { slug: item.slug, name: item.name } : null;
  };
  switch (endpoint) {
    case 'categories':
      return [...seed.categories].reverse();
    case 'authors':
      return [...seed.authors].reverse().map((a) => ({ ...a, avatar: media(a.avatar) }));
    case 'articles':
      return [...seed.articles]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((a) => ({ ...a, cover: media(a.cover), category: pick(seed.categories, a.category), author: pick(seed.authors, a.author) }));
    default:
      return null;
  }
}

export interface StrapiMedia {
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: Record<string, { url: string; width: number; height: number }> | null;
}

const base = STRAPI_URL.replace(/\/+$/, '');

/** Fetches every entry of a collection type, following Strapi's pagination. */
export async function fetchAll<T>(endpoint: string, query: Record<string, string> = {}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let pageCount = 1;
  do {
    const params = new URLSearchParams({ ...query, 'pagination[page]': String(page), 'pagination[pageSize]': '100' });
    const url = `${base}/api/${endpoint}?${params}`;
    let res: Response;
    try {
      res = await fetch(url, { headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {} });
    } catch (error) {
      const seeded = page === 1 ? fromSeed(endpoint) : null;
      if (seeded) return seeded as T[];
      throw new Error(`Could not reach Strapi at ${base}. Is it running? (cd Strapi && npm run develop)`, { cause: error });
    }
    if (!res.ok) {
      const hint = res.status === 403 || res.status === 401 ? ' – check the Public role permissions or STRAPI_TOKEN.' : '';
      throw new Error(`Strapi request failed: ${res.status} ${res.statusText} for ${url}${hint}`);
    }
    const json = (await res.json()) as { data: T[]; meta: { pagination: { pageCount: number } } };
    results.push(...json.data);
    pageCount = json.meta.pagination.pageCount;
    page++;
  } while (page <= pageCount);
  return results;
}

/** Media queued for download into public/uploads (see STRAPI_DOWNLOAD_MEDIA). */
const pending = new Map<string, string>();

/**
 * Resolves a Strapi media URL. With STRAPI_DOWNLOAD_MEDIA=true (default) the file is copied into
 * public/uploads at build time, so the built site does not depend on Strapi being reachable.
 * Strapi's local upload provider returns relative URLs; cloud providers return absolute ones.
 */
export function mediaUrl(url: string) {
  if (url.startsWith(SEED_PREFIX)) {
    const name = url.slice(SEED_PREFIX.length);
    pending.set(`/uploads/${name}`, path.join(SEED_DIR, 'uploads', name));
    return `/uploads/${encodeURIComponent(name)}`;
  }
  const absolute = /^https?:\/\//.test(url) ? url : `${base}${url}`;
  if (!STRAPI_DOWNLOAD_MEDIA) return absolute;
  const local = `/uploads/${decodeURIComponent(new URL(absolute).pathname.split('/').pop()!)}`;
  pending.set(local, absolute);
  return local;
}

/** Downloads every media file queued by mediaUrl() (skips files that already exist). */
export async function downloadMedia() {
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  const jobs = [...pending].map(async ([local, remote]) => {
    const file = path.join(dir, path.basename(local));
    if (existsSync(file)) return;
    if (!/^https?:\/\//.test(remote)) return copyFile(remote, file);
    const res = await fetch(remote);
    if (!res.ok) throw new Error(`Could not download ${remote}: ${res.status}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  });
  pending.clear();
  await Promise.all(jobs);
}

export interface Img {
  src: string;
  srcset?: string;
  alt: string;
}

/** Turns a Strapi media object into src + a responsive srcset built from Strapi's generated formats. */
export function toImg(media: StrapiMedia | null | undefined, fallbackAlt: string): Img | null {
  if (!media) return null;
  const candidates = Object.values(media.formats ?? {})
    .filter((f) => f && f.width)
    .map((f) => ({ url: f.url, width: f.width }));
  if (media.width) candidates.push({ url: media.url, width: media.width });
  candidates.sort((a, b) => a.width - b.width);
  return {
    src: mediaUrl(media.url),
    srcset: candidates.length > 1 ? candidates.map((c) => `${mediaUrl(c.url)} ${c.width}w`).join(', ') : undefined,
    alt: media.alternativeText || fallbackAlt,
  };
}
