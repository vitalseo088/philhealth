const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(ROOT, 'assets/js/app.js'), 'utf8');
const articlesSource = fs.readFileSync(path.join(ROOT, 'data/article-content.js'), 'utf8');

function extractSeoArticles() {
  const declaration = '  const seoArticles = ';
  const start = appSource.indexOf(declaration);
  const end = appSource.indexOf('\n  ];', start);
  assert.ok(start >= 0 && end > start, 'SEO article catalog should exist');
  return vm.runInNewContext(appSource.slice(start + declaration.length, end + 5));
}

test('all blog posts use distinct Unsplash images', () => {
  const articleContext = { window: {} };
  vm.runInNewContext(articlesSource, articleContext);
  const articles = articleContext.window.PHArticles;
  const seoArticles = extractSeoArticles();

  const overrideStart = appSource.indexOf('  const articleImageOverrides =');
  const overrideEnd = appSource.indexOf('  const importedGuides =', overrideStart);
  assert.ok(overrideStart >= 0 && overrideEnd > overrideStart, 'image overrides should be applied');
  vm.runInNewContext(appSource.slice(overrideStart, overrideEnd), {
    window: articleContext.window,
    articles,
    seoArticles
  });

  const posts = [...seoArticles, ...articles];
  const slugs = new Set(posts.map(post => post.slug));
  const overrides = articleContext.window.PHArticleImageOverrides;
  const unmatchedOverrides = Object.keys(overrides).filter(slug => !slugs.has(slug));
  assert.deepEqual(unmatchedOverrides, [], 'every image override should match a blog post');

  const imageIds = posts.map(post => {
    assert.match(post.image || '', /^https:\/\/images\.unsplash\.com\/photo-/i, `${post.slug}: Unsplash image`);
    return post.image.match(/\/(photo-[^?]+)/i)[1];
  });
  assert.equal(new Set(imageIds).size, posts.length, 'no two posts should share an Unsplash image');
});
