# Inkrow — Astro + Strapi blog theme

A clean, content-focused blog theme for **Astro 7**, with articles, categories and authors managed in **Strapi 5**.

**Live demo:** https://inkrow-astro-theme.vercel.app

| Folder              | What it is                                                                 |
| :------------------ | :------------------------------------------------------------------------- |
| [`Astro/`](Astro)   | The Astro theme (pages, components, styles). See [Astro/README.md](Astro/README.md). |
| [`Strapi/`](Strapi) | The Strapi CMS with content types and demo content. See [Strapi/README.md](Strapi/README.md). |

## Quick start

Requires Node.js 22.12+.

```sh
# 1. CMS
cd Strapi
cp .env.example .env      # then replace the "tobemodified" secrets
npm install
npm run seed              # demo articles, authors, categories, images
npm run develop           # http://localhost:1337/admin

# 2. Site (in a second terminal)
cd Astro
cp .env.example .env
npm install
npm run dev               # http://localhost:4321
```

## Features

- Two home page layouts, a paginated blog, categories, authors, search, contact, a style guide and a 404 page
- Article, category and author detail pages generated from Strapi
- Strapi Blocks rich text, responsive images, SEO and Open Graph tags
- Fully static output: Strapi media is copied into the build, so any static host works
- Strapi MCP server enabled for AI-assisted content editing
