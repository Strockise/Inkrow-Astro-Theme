const trim = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

/**
 * Webflow marks links to the current page with `w--current` + aria-current.
 * Paginated pages (/blog/2) count as their first page, like Webflow's ?page= query.
 */
export function isCurrent(url: string, pathname: string) {
  const path = trim(pathname).replace(/\/\d+$/, '');
  return trim(url) === trim(pathname) || (url !== '/' && trim(url) === path);
}

/** Route builders – the URL structure matches the original Webflow site. */
export const postUrl = (slug: string) => `/blog-post/${slug}`;
export const categoryUrl = (slug: string) => `/blog-catagories/${slug}`;
export const authorUrl = (slug: string) => `/team-member/${slug}`;

/** "June 17, 2025" – the format the Webflow template used for post dates. */
export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
