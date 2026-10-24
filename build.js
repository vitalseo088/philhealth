const fs = require('node:fs');
const path = require('node:path');
const { getPageMetadata, injectSeoHead } = require('./seo');

const ROOT = __dirname;
const OUTPUT = path.join(ROOT, 'dist');
const EXCLUDED_DIRECTORIES = new Set([
  '.agents',
  '.cache',
  '.git',
  '.github',
  '.local',
  '.upm',
  'attached_assets',
  'dist',
  'node_modules',
  'screenshots',
  'tests'
]);
const PUBLIC_ROOT_FILES = new Set([
  'favicon.svg',
  'metadata.json',
  'robots.txt',
  'sitemap.xml'
]);

function copyPublicFiles(sourceDirectory, destinationDirectory, isRoot = false) {
  fs.mkdirSync(destinationDirectory, { recursive: true });

  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (isRoot && entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;
    if (isRoot && entry.isFile() && !entry.name.endsWith('.html') && !PUBLIC_ROOT_FILES.has(entry.name)) continue;

    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(destinationDirectory, entry.name);
    if (entry.isDirectory()) {
      copyPublicFiles(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

function addStaticSeoToHtml(directory, relativeDirectory = '') {
  let htmlFileCount = 0;
  let articlePageCount = 0;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const outputPath = path.join(directory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      const nested = addStaticSeoToHtml(outputPath, relativePath);
      htmlFileCount += nested.htmlFileCount;
      articlePageCount += nested.articlePageCount;
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

    const html = fs.readFileSync(outputPath, 'utf8');
    const requestPath = `/${relativePath.split(path.sep).join('/')}`;
    const metadata = getPageMetadata(requestPath, html);
    fs.writeFileSync(outputPath, injectSeoHead(html, requestPath));
    htmlFileCount += 1;
    if (metadata.article) articlePageCount += 1;
  }

  return { htmlFileCount, articlePageCount };
}

function buildPublicSite() {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  copyPublicFiles(ROOT, OUTPUT, true);
  return {
    outputDirectory: OUTPUT,
    ...addStaticSeoToHtml(OUTPUT)
  };
}

if (require.main === module) {
  const result = buildPublicSite();
  console.log(`Built static site with SEO metadata in ${result.htmlFileCount} HTML pages (${result.articlePageCount} article pages): dist/`);
}

module.exports = { buildPublicSite };
