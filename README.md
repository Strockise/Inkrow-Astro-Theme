# Inkrow — Astro + Strapi blog theme

A clean, content-focused blog theme for **Astro 7**, with articles, categories and authors managed in **Strapi 5**.

**Live demo:** https://inkrow-astro-theme.vercel.app

| Folder              | What it is                                                                 |
| :------------------ | :------------------------------------------------------------------------- |
| [`Astro/`](Astro)   | The Astro theme (pages, components, styles). See [Astro/README.md](Astro/README.md). |
| [`Strapi/`](Strapi) | The Strapi CMS with content types and demo content. See [Strapi/README.md](Strapi/README.md). |

## Features

- Two home page layouts, a paginated blog, categories, authors, search, contact, a style guide and a 404 page
- Article, category and author detail pages generated from Strapi
- Strapi Blocks rich text, responsive images, SEO and Open Graph tags
- Fully static output: Strapi media is copied into the build, so any static host works
- Builds without Strapi too. If the CMS can't be reached, the site uses the bundled demo content.
- Contact and newsletter forms that connect to any form service (Formspree, Basin, Getform, …)
- Strapi MCP server enabled for AI-assisted content editing

## How it works

```
Strapi (CMS)  ──REST API──▶  Astro (build time)  ──▶  static HTML in Astro/dist  ──▶  any static host
```

You write and publish content in Strapi. When the Astro site builds, it fetches the published articles, categories and authors and copies their images into the build. The result is a plain static site. After you publish new content in Strapi, rebuild the site so the change goes live.

## Requirements

- **Node.js 22.12 or newer** (check with `node -v`)
- npm (ships with Node.js)
- Git, to clone the repository

---

## 1. Get the code

```sh
git clone https://github.com/Strockise/Inkrow-Astro-Theme.git my-blog
cd my-blog
```

Or click **Code → Download ZIP** on GitHub and unzip it.

## 2. Try it without Strapi (fastest)

You can preview the theme in under a minute without setting up the CMS:

```sh
cd Astro
npm install
npm run dev
```

Open http://localhost:4321. Strapi isn't running, so the site loads the demo content from `Strapi/data/seed.json` and prints a warning in the terminal. This is fine for a preview. Set up Strapi (step 3) when you want to manage your own content.

## 3. Set up the CMS (Strapi)

Open a terminal in the `Strapi` folder:

```sh
cd Strapi
cp .env.example .env        # Windows (PowerShell): Copy-Item .env.example .env
```

Open `Strapi/.env` and replace every `tobemodified` value with a random secret. You can generate each one with:

```sh
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

`APP_KEYS` takes two such values separated by a comma.

Then install, load the demo content and start Strapi:

```sh
npm install
npm run seed                # 12 demo articles, 8 categories, 6 authors and their images
npm run develop             # admin panel at http://localhost:1337/admin
```

On first start, open http://localhost:1337/admin and create your admin account. The seed script also lets the **Public** role read articles, categories and authors, so the site needs no API token.

> `npm run seed` only runs on an empty database. Use `npm run seed -- --force` to delete the existing articles, authors and categories and reload the demo content.

## 4. Run the site with your CMS

Keep Strapi running and open a **second terminal** in the `Astro` folder:

```sh
cd Astro
cp .env.example .env        # Windows (PowerShell): Copy-Item .env.example .env
npm install
npm run dev                 # http://localhost:4321
```

`Astro/.env`:

| Variable       | Required | What it does                                                                 |
| :------------- | :------- | :--------------------------------------------------------------------------- |
| `STRAPI_URL`   | yes      | Strapi address, e.g. `http://localhost:1337` (no trailing slash)             |
| `STRAPI_TOKEN` | no       | Read-only API token. Leave it empty while the Public role can read content. |
| `SITE_URL`     | no       | Your live domain, used for canonical and Open Graph URLs                     |

Content is fetched when the dev server starts. If you publish something in Strapi while `npm run dev` is running, restart the dev server to see it.

| Command (in `Astro/`) | Action                                     |
| :-------------------- | :----------------------------------------- |
| `npm run dev`         | Start the dev server at `localhost:4321`   |
| `npm run build`       | Build the static site into `Astro/dist/`   |
| `npm run preview`     | Preview the production build locally       |

---

## Managing content

In the Strapi admin, open **Content Manager**.

**Write an article**

1. Go to **Article → Create new entry**.
2. Fill in **title** and **slug**. The slug becomes the URL: `/blog-post/your-slug`.
3. Add an **excerpt**, **date**, **readTime** (e.g. `5min`) and a **cover** image.
4. Write the body in **content**. Headings, lists, quotes, links, code and images are styled by the theme.
5. Pick a **category** and an **author**.
6. Optional: turn on **isFeatured** to show it in the home page's featured section, or **isShowcase** to make it the large hero post on Home V2.
7. Click **Publish**. Drafts are never shown on the site.

**Categories:** name, slug (`/blog-catagories/your-slug`), a one-line summary and **isPopular**. Popular categories are listed on Home V2.

**Authors:** name, slug (`/team-member/your-slug`), designation, bio, avatar and optional X, Facebook, Instagram and LinkedIn links.

**Where content appears**

| Page    | Content                                                                                      |
| :------ | :------------------------------------------------------------------------------------------- |
| Home V1 | 3 featured articles, all categories, all authors, latest 6 articles                          |
| Home V2 | showcase article, 2 featured articles, 5 popular categories, latest 3 articles, 3 authors    |
| Blog    | all articles, newest first, 9 per page                                                       |
| Search  | all articles, filtered in the browser                                                        |

When you are done editing, rebuild the site (or let your host rebuild it, see [Automatic rebuilds](#automatic-rebuilds)).

To replace the demo content, delete the demo entries in the Content Manager and add your own. Or edit `Strapi/data/seed.json` and run `npm run seed -- --force`.

## Customising the theme

All paths are inside `Astro/`.

| What                                   | Where                                                    |
| :------------------------------------- | :------------------------------------------------------- |
| Site name, title, description, language | `src/config/config.json → site`                         |
| Contact email                          | `src/config/config.json → contact.email`                 |
| Form service URL                       | `src/config/config.json → forms.endpoint`                |
| "Powered by" footer credit             | `src/config/config.json → credits`                       |
| Posts per blog page                    | `src/config/config.json → blog.postsPerPage`             |
| Navbar, "Pages" dropdown, footer links | `src/config/menu.json`                                   |
| Colours, fonts, spacing                | `public/css/inkrow.css`                                  |
| Logo, favicon and static images        | `public/images/`                                         |
| Social sharing image                   | `public/images/og-image.jpg`                             |
| Page layouts and sections              | `src/pages/` and `src/components/`                       |

### Forms

A static site can't receive form submissions by itself. Create a form on a service such as [Formspree](https://formspree.io), [Basin](https://usebasin.com) or [Getform](https://getform.io), and paste its endpoint URL into `config.json`:

```json
"forms": {
  "endpoint": "https://formspree.io/f/your-form-id"
}
```

Both the contact form and the newsletter form then post to that URL. While `endpoint` is empty, which is how the demo ships, a form only shows its success message and sends nothing.

### Animations

Page animations run from `public/js/interactions.js`. They are linked to the `pageId` passed to `BaseLayout` and the `data-w-id` attributes in the markup, so keep those when you edit a page. To remove an animation from an element, delete its `data-w-id` attribute and its inline `style`.

---

## Deploying

### The site

The site is static, so any static host works.

**Vercel:** import the repository. The root [`vercel.json`](vercel.json) already builds the `Astro/` folder and publishes `Astro/dist`, so no settings are needed. Under **Settings → Environment Variables**, add `STRAPI_URL` (your public Strapi URL) and `SITE_URL`.

**Netlify, Cloudflare Pages or others:**

| Setting           | Value                |
| :---------------- | :------------------- |
| Base / root dir   | `Astro`              |
| Build command     | `npm run build`      |
| Output directory  | `dist`               |
| Node version      | 22.12 or newer       |
| Env variables     | `STRAPI_URL`, `SITE_URL` (and `STRAPI_TOKEN` if used) |

Strapi must be reachable from the build server. If it isn't, the build falls back to the bundled demo content instead of yours.

### The CMS

Deploy the `Strapi/` folder to [Strapi Cloud](https://strapi.io/cloud) or any Node host. For production, switch `DATABASE_CLIENT` to Postgres or MySQL and use a cloud upload provider such as S3 or Cloudinary. The Strapi docs cover both.

### Automatic rebuilds

To publish content without rebuilding by hand:

1. In your site host, create a **Deploy Hook** (on Vercel: **Settings → Git → Deploy Hooks**).
2. In Strapi, open **Settings → Webhooks → Create new webhook**, paste the hook URL and select the **Entry: publish / unpublish** events.

Every publish in Strapi now triggers a new build.

---

## Troubleshooting

| Problem                                              | Fix                                                                                                  |
| :--------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| "Strapi is not reachable … building with the demo content" | Strapi isn't running or `STRAPI_URL` is wrong. Start Strapi or fix the URL, then restart `npm run dev`. |
| `Strapi request failed: 403`                         | The Public role can't read content. Run `npm run seed` again or grant `find`/`findOne`, or set `STRAPI_TOKEN`. |
| New article doesn't show up                          | Make sure it is **published**, then restart the dev server or rebuild the site.                       |
| Old images after replacing one in Strapi             | Delete `Astro/public/uploads/` and rebuild. Images are copied once and reused.                        |
| `npm install` fails                                  | Check `node -v` and use Node.js 22.12 or newer.                                                       |

## More documentation

- [Astro/README.md](Astro/README.md): content model, project structure, environment variables
- [Strapi/README.md](Strapi/README.md): content types, seeding, MCP server, CMS deployment
