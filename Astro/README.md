# Inkrow — Astro blog theme with Strapi CMS

Inkrow is a clean, content-focused blog theme for [Astro](https://astro.build) 7. Articles, categories and authors are managed in [Strapi](https://strapi.io) 5 and fetched at build time.

**Live demo:** https://inkrow-astro-theme.vercel.app

**Pages:** Home (two variants), Blog (paginated), Categories, Authors, Contact, Search, plus detail pages for posts (`/blog-post/[slug]`), categories (`/blog-catagories/[slug]`) and authors (`/team-member/[slug]`). Utility pages: Style Guide and 404.

## Quick start

You need Node.js 22.12 or newer. The theme expects this layout:

```
Astro/    ← this theme
Strapi/   ← the CMS (content types, seed data, MCP enabled)
```

**1. Start the CMS**

```sh
cd Strapi
npm install
npm run seed        # loads the demo articles, authors, categories and images
npm run develop     # http://localhost:1337/admin – create your admin user
```

**2. Run the site**

```sh
cd Astro
npm install
cp .env.example .env
npm run dev         # http://localhost:4321
```

| Command           | Action                                         |
| :---------------- | :--------------------------------------------- |
| `npm run dev`     | Start the dev server at `localhost:4321`       |
| `npm run build`   | Build the static site into `./dist/`           |
| `npm run preview` | Preview the production build                   |

## Environment variables

| Variable       | Required | Description                                                                                             |
| :------------- | :------- | :------------------------------------------------------------------------------------------------------ |
| `STRAPI_URL`   | yes      | Base URL of Strapi, e.g. `http://localhost:1337` (defaults to that)                                     |
| `STRAPI_TOKEN` | no       | Read-only API token. Leave empty if the Public role can `find`/`findOne` the three content types.      |
| `SITE_URL`     | no       | Production URL, used for canonical and Open Graph tags                                                  |

The variables are validated by `astro:env` (see `astro.config.mjs`). Nothing secret is committed.

## Content model (Strapi)

| Type         | Fields                                                                                                     |
| :----------- | :--------------------------------------------------------------------------------------------------------- |
| **Article**  | title, slug, excerpt, date, readTime, cover (image), content (Blocks rich text), isFeatured, isShowcase, category → Category, author → Author |
| **Category** | name, slug, summary, isPopular                                                                             |
| **Author**   | name, slug, designation, bio, avatar (image), xUrl, facebookUrl, instagramUrl, linkedinUrl                 |

Where content appears:

- **Home V1:** featured articles (`isFeatured`, 3), all categories, all authors, latest 6 articles
- **Home V2:** showcase article (`isShowcase`), featured articles (2), popular categories (`isPopular`, 5), latest 3 articles, 3 authors
- **Blog:** all articles, 9 per page (`src/config/config.json → blog.postsPerPage`)
- Every list is sorted newest first (articles by `date`, authors and categories by creation date).

The site is static: after you publish changes in Strapi, rebuild the site. A Strapi webhook pointing at your host's build hook automates this.

## Project structure

```
src/
├── config/
│   ├── config.json        # site title, description, contact email, credits, posts per page
│   └── menu.json          # navbar, "Pages" dropdown and footer links
├── content.config.ts      # Strapi-backed content collections (articles, authors, categories)
├── layouts/BaseLayout.astro
├── components/
│   ├── Navbar.astro  Footer.astro  Cta.astro  SeoMeta.astro
│   ├── cards/             # BlogCard, CategoryCard, TeamCard, FeaturedTags
│   └── icons/
├── lib/
│   ├── strapi.ts          # REST client + media URL/srcset helpers
│   ├── content.ts         # sorted collection getters
│   ├── blocks.ts          # Strapi Blocks → HTML (matches the theme's rich-text styles)
│   ├── ix.ts              # initial states for the page animations
│   └── utils.ts           # routes, dates
└── pages/                 # one file per route
public/
├── css/                   # theme stylesheets
├── js/interactions.js     # interactions runtime (menus, dropdowns, scroll/hover animations)
└── images/
```

### About the animations

The interactions (navbar, dropdowns, FAQ, scroll reveals, hover effects, marquees) run from `public/js/interactions.js` (with jQuery). They are keyed to the `pageId` passed to `BaseLayout` and to the `data-w-id` attributes in the markup, so keep both when editing pages. Remove a `data-w-id` attribute (and its inline `style`) to drop an animation from an element.

### Forms

The newsletter and contact forms keep the original markup and success/error states. A static site has no form backend, so connect them to a form service (Formspree, Netlify Forms, Basin, …) by setting the form's `action`.

## Customising

- **Site name, description, email:** `src/config/config.json`
- **Navigation:** `src/config/menu.json`
- **Styles:** `public/css/inkrow.css`
- **Open Graph image:** `public/images/og-image.webp`

## Deploying

Build with `npm run build` and deploy `dist/` to any static host. Set `STRAPI_URL` (and `STRAPI_TOKEN` if used) in the host's build environment. Strapi must be reachable from the build machine, and its uploads URL must be public, because images load from Strapi.

## Credits

The footer shows "Copyright © {year} {site name}, Powered by Astro". Change the name in `src/config/config.json → site.name` and the "Powered by" link in `credits`.
