'use strict';

/**
 * Seeds Strapi with the Inkrow demo content (data/seed.json + data/uploads/*).
 *
 *   npm run seed            # only seeds an empty database
 *   npm run seed -- --force # deletes existing articles/authors/categories first
 *
 * The content mirrors the original Webflow CMS export (CMS/*.csv).
 */
const fs = require('node:fs');
const path = require('node:path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', gif: 'image/gif' };

const UIDS = {
  article: 'api::article.article',
  author: 'api::author.author',
  category: 'api::category.category',
};

async function uploadImage(strapi, fileName, alt) {
  const existing = await strapi.query('plugin::upload.file').findOne({ where: { name: fileName } });
  if (existing) return existing;
  const filepath = path.join(DATA_DIR, 'uploads', fileName);
  const ext = fileName.split('.').pop().toLowerCase();
  const [file] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: { filepath, originalFilename: fileName, mimetype: MIME[ext], size: fs.statSync(filepath).size },
      data: { fileInfo: { name: fileName, alternativeText: alt, caption: alt } },
    });
  return file;
}

async function setPublicPermissions(strapi) {
  const role = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  for (const uid of Object.values(UIDS)) {
    for (const action of ['find', 'findOne']) {
      const name = `${uid}.${action}`;
      const exists = await strapi.query('plugin::users-permissions.permission').findOne({ where: { action: name, role: role.id } });
      if (!exists) await strapi.query('plugin::users-permissions.permission').create({ data: { action: name, role: role.id } });
    }
  }
}

async function seed(strapi, { force }) {
  const count = await strapi.documents(UIDS.article).count({});
  if (count > 0 && !force) {
    console.log(`Database already has ${count} articles – skipping (use --force to reseed).`);
    return;
  }
  if (force) {
    for (const uid of Object.values(UIDS)) await strapi.db.query(uid).deleteMany({});
  }

  const { categories, authors, articles } = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seed.json'), 'utf8'));
  // seed.json is ordered oldest -> newest so Strapi's createdAt keeps the original ordering
  const categoryIds = {};
  for (const c of categories) {
    const doc = await strapi.documents(UIDS.category).create({ data: c, status: 'published' });
    categoryIds[c.slug] = doc.documentId;
  }
  console.log(`✓ ${categories.length} categories`);

  const authorIds = {};
  for (const { avatar, ...a } of authors) {
    const file = await uploadImage(strapi, avatar, a.name);
    const doc = await strapi.documents(UIDS.author).create({ data: { ...a, avatar: file.id }, status: 'published' });
    authorIds[a.slug] = doc.documentId;
  }
  console.log(`✓ ${authors.length} authors`);

  for (const { cover, category, author, ...a } of articles) {
    const file = await uploadImage(strapi, cover, a.title);
    await strapi.documents(UIDS.article).create({
      data: { ...a, cover: file.id, category: categoryIds[category], author: authorIds[author] },
      status: 'published',
    });
  }
  console.log(`✓ ${articles.length} articles`);
}

async function main() {
  const force = process.argv.includes('--force');
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'error';
  try {
    await seed(app, { force });
    await setPublicPermissions(app);
    console.log('✓ Public role can read articles, authors and categories');
  } finally {
    await app.destroy();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
