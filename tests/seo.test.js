const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  getPageMetadata,
  injectSeoHead,
  renderSeoHead,
  resolveHtmlFile
} = require('../seo');

const ROOT = path.resolve(__dirname, '..');

function listHtmlFiles(directory) {
  const ignored = new Set(['.git', '.cache', '.local', '.agents', 'attached_assets', 'node_modules']);
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listHtmlFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(entryPath);
  }
  return files;
}

function getJsonLd(html) {
  const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(script, 'page should include one JSON-LD script');
  return JSON.parse(script[1]);
}

test('every static HTML page receives a complete, unique SEO head', () => {
  const files = listHtmlFiles(ROOT);
  assert.ok(files.length > 100, 'the site page set should be included in this check');

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const urlPath = `/${path.relative(ROOT, file).split(path.sep).join('/')}`;
    const metadata = getPageMetadata(urlPath, html);
    const rendered = injectSeoHead(html, urlPath);
    const head = rendered.split(/<\/head>/i)[0];

    assert.ok(metadata.title, `${urlPath}: title`);
    assert.ok(metadata.description.length >= 140, `${urlPath}: description`);
    assert.ok(metadata.description.length <= 160, `${urlPath}: description length`);
    assert.ok(metadata.keywords.length >= 10, `${urlPath}: keywords`);
    assert.equal((head.match(/<title\b/gi) || []).length, 1, `${urlPath}: one title`);
    assert.equal((head.match(/name="description"/gi) || []).length, 1, `${urlPath}: one description`);
    assert.equal((head.match(/name="keywords"/gi) || []).length, 1, `${urlPath}: one keywords tag`);
    assert.equal((head.match(/rel="canonical"/gi) || []).length, 1, `${urlPath}: one canonical`);
    assert.equal((head.match(/application\/ld\+json/gi) || []).length, 1, `${urlPath}: one schema block`);
    assert.equal(getJsonLd(rendered)['@context'], 'https://schema.org', `${urlPath}: valid JSON-LD`);
  }
});

test('clean URLs and .html aliases use the same canonical metadata', () => {
  const cleanFile = resolveHtmlFile('/guides/philhealth-yakap-requirements/');
  const aliasFile = resolveHtmlFile('/guides/philhealth-yakap-requirements.html');
  assert.ok(cleanFile);
  assert.ok(aliasFile);
  const clean = getPageMetadata('/guides/philhealth-yakap-requirements/', fs.readFileSync(cleanFile, 'utf8'));
  const alias = getPageMetadata('/guides/philhealth-yakap-requirements.html', fs.readFileSync(aliasFile, 'utf8'));
  assert.equal(clean.canonicalUrl, alias.canonicalUrl);
  assert.equal(clean.title, alias.title);
  assert.equal(clean.description, alias.description);
});

test('article pages expose Article and relevant FAQPage structured data', () => {
  const file = resolveHtmlFile('/guides/philhealth-yakap-requirements/');
  assert.ok(file);
  const metadata = getPageMetadata('/guides/philhealth-yakap-requirements/', fs.readFileSync(file, 'utf8'));
  assert.ok(metadata.article);
  assert.ok(metadata.faqs.length >= 2);

  const schema = getJsonLd(renderSeoHead('/guides/philhealth-yakap-requirements/'));
  const types = schema['@graph'].map(item => item['@type']);
  assert.ok(types.includes('Article'));
  assert.ok(types.includes('FAQPage'));
  assert.ok(types.includes('BreadcrumbList'));
});

test('homepage metadata is descriptive and site search is excluded from indexing', () => {
  const homepage = getPageMetadata('/');
  assert.match(homepage.title, /PhilHealth Guide/);
  assert.match(homepage.description, /benefit|contribution|tool/i);
  assert.equal(getPageMetadata('/search.html').noIndex, true);
});
