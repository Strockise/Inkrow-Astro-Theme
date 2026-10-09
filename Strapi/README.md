# Inkrow CMS (Strapi 5)

The headless CMS behind the Inkrow Astro theme. It defines three content types and ships the demo content.

| Type       | API              | Used for                                         |
| :--------- | :--------------- | :----------------------------------------------- |
| Article    | `/api/articles`  | blog posts (Blog CMS)                            |
| Category   | `/api/categories`| blog categories (Blog CMS)                       |
| Author     | `/api/authors`   | writers (Authors CMS)                            |

Relations: each Article has one Category and one Author (many-to-one). The schemas are in `src/api/*/content-types/*/schema.json`.

## Setup

```sh
npm install
npm run seed       # demo content from data/seed.json + data/uploads (skips if articles exist)
npm run develop    # admin at http://localhost:1337/admin
```

`npm run seed -- --force` wipes articles, authors and categories and reseeds them. The seed also grants the **Public** role `find`/`findOne` on the three types, so the Astro site can read published content without a token. To use a token instead, remove those permissions, create a read-only API token, and set `STRAPI_TOKEN` in the Astro project.

`data/seed.json` was generated from the original Webflow CMS export. Rich text was converted to Strapi Blocks.

## Strapi MCP server

The [MCP server](https://docs.strapi.io/cms/features/strapi-mcp-server) is enabled in `config/server.ts` (`mcp.enabled`; set `MCP_ENABLED=false` to turn it off). AI clients can then list, create, update and publish articles, authors and categories, and manage Media Library assets.

1. Start Strapi and open **Settings → Admin tokens**. Create a token with the permissions the client should have.
2. Connect a client, for example Claude Code:

   ```sh
   claude mcp add strapi-mcp --transport http http://localhost:1337/mcp -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

Per the Strapi docs, the MCP server cannot change content-type schemas or upload files. Schema changes happen in the Content-Type Builder (or the schema files), and uploads in the Media Library.

## Deploying

Use any Node host or Strapi Cloud. For production, switch `DATABASE_CLIENT` to Postgres or MySQL, and use a cloud upload provider (S3, Cloudinary, …). After deploying, set `STRAPI_URL` in the Astro project to the public Strapi URL.
