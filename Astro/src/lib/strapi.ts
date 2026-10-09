/**
 * Minimal Strapi v5 REST client used by the content collections (src/content.config.ts).
 * Data is fetched once at build time (or on dev-server start / content sync).
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { STRAPI_URL, STRAPI_TOKEN, STRAPI_DOWNLOAD_MEDIA } from 'astro:env/server';

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
