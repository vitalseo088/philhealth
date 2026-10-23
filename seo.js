const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = __dirname;
const SITE_ORIGIN = 'https://philbenefits.com';
const SITE_NAME = 'PhilHealth Guide';
const DEFAULT_DESCRIPTION = 'Independent PhilHealth guides, practical tools and links to official sources. Check the details that matter and verify current rules with PhilHealth.';

const PAGE_PROFILES = {
  '/': {
    title: 'PhilHealth Guide: Benefits, Contributions & Tools',
    description: 'Find clear PhilHealth guides, benefit and contribution tools, requirements, and provider directories. Use official PhilHealth sources to verify current details.'
  },
  '/about/': {
    title: 'About PhilHealth Guide',
    description: 'Learn how this independent PhilHealth information resource researches, reviews and explains public information without accessing member records.'
  },
  '/accessibility/': {
    title: 'Accessibility at PhilHealth Guide',
    description: 'Read about accessibility practices at PhilHealth Guide and how to report a barrier or request a correction.'
  },
  '/benefits/': {
    title: 'PhilHealth Benefits: Coverage & Eligibility',
    description: 'Explore PhilHealth benefit guides, coverage, eligibility and claims tools. Confirm current package rules with PhilHealth or your healthcare facility.'
  },
  '/branches/': {
    title: 'PhilHealth Branches & Office Directory',
    description: 'Find links and practical guidance for PhilHealth regional and local offices. Confirm current addresses, contact details and hours with PhilHealth.'
  },
  '/contact/': {
    title: 'Contact PhilHealth Guide',
    description: 'Contact the PhilHealth Guide site owner with a question about this independent information resource. Do not send passwords, OTPs or member numbers.'
  },
  '/contributions/': {
    title: 'PhilHealth Contributions: Rates & Payment Guides',
    description: 'Understand PhilHealth contribution rates, payment schedules and member categories with practical guides and tools. Verify current amounts with PhilHealth.'
  },
  '/corrections/': {
    title: 'Report a Correction to PhilHealth Guide',
    description: 'Report an outdated detail, unclear explanation or broken source on PhilHealth Guide so it can be reviewed.'
  },
  '/disclaimer/': {
    title: 'PhilHealth Guide Disclaimer',
    description: 'Read the limits of PhilHealth Guide’s independent information and planning tools. They do not replace official decisions or professional advice.'
  },
  '/documents/': {
    title: 'PhilHealth Documents & Forms Guide',
    description: 'Explore practical guidance on PhilHealth forms and supporting documents. Requirements vary by transaction, so check the current official instructions.'
  },
  '/editorial-policy/': {
    title: 'PhilHealth Guide Editorial Policy',
    description: 'See how PhilHealth Guide researches, sources, reviews and corrects information, and how it labels uncertain or time-sensitive details.'
  },
  '/guides/': {
    title: 'PhilHealth Guides: Benefits, Contributions & More',
    description: 'Browse practical, date-stamped PhilHealth guides on contributions, benefits, requirements, providers, the Member Portal and YAKAP.'
  },
  '/payment/': {
    title: 'PhilHealth Payment Guide',
    description: 'Find guidance on PhilHealth premium payments, payment references and common payment issues. Confirm current steps with official PhilHealth channels.'
  },
  '/portal/': {
    title: 'PhilHealth Member Portal Guides',
    description: 'Find guides for PhilHealth Member Portal registration, login, contribution records and member documents. Use only official channels for account access.'
  },
  '/privacy/': {
    title: 'PhilHealth Guide Privacy',
    description: 'Read how PhilHealth Guide handles privacy, browser-based tools and contact forms, and what information you should never enter.'
  },
  '/providers/': {
    title: 'PhilHealth Providers & Accredited Facilities',
    description: 'Learn how to find and verify PhilHealth-accredited hospitals, clinics and other providers using current official directories.'
  },
  '/requirements/': {
    title: 'PhilHealth Requirements & Documents',
    description: 'Find PhilHealth document checklists and guides by transaction or member type. Confirm the latest forms and requirements with PhilHealth.'
  },
  '/sources/': {
    title: 'PhilHealth Guide Sources & Verification',
    description: 'Review the official PhilHealth sources used by this independent guide and learn how to verify time-sensitive rates, benefits and provider details.'
  },
  '/terms/': {
    title: 'PhilHealth Guide Terms of Use',
    description: 'Read the terms for using PhilHealth Guide, including the limits of its informational content, estimates and browser-based tools.'
  },
  '/tools/': {
    title: 'PhilHealth Tools & Calculators',
    description: 'Use PhilHealth contribution calculators, benefit finders, checklists and directories to organize your next step, then verify details with official sources.'
  },
  '/troubleshooting/': {
    title: 'PhilHealth Troubleshooting Guides',
    description: 'Find practical guidance for common PhilHealth payment, portal and records issues, with steps to verify the right answer through official channels.'
  },
  '/yakap/': {
    title: 'PhilHealth YAKAP Program Guides',
    description: 'Explore PhilHealth YAKAP guidance on eligibility, clinics, primary care, medicines and registration. Confirm current details with PhilHealth.'
  }
};

const TOOL_DESCRIPTIONS = {
  '/tools/asian-bmi/': 'Estimate adult body mass index using Asia-Pacific categories. This calculator is informational and does not diagnose a health condition.',
  '/tools/benefits-eligibility/': 'Review common PhilHealth benefit eligibility questions and the details to confirm with PhilHealth before preparing a claim.',
  '/tools/benefits-finder/': 'Search PhilHealth benefit topics and identify the official package details to verify for your situation.',
  '/tools/branch-finder/': 'Find official PhilHealth office directory links and narrow down the branch details you need to verify.',
  '/tools/case-rate-finder/': 'Search the available PhilHealth case-rate information and follow the official source link to confirm the current package.',
  '/tools/contribution-calculator/': 'Estimate a PhilHealth contribution using the schedule and income limits shown, then verify the amount posted to your account.',
  '/tools/contribution-checker/': 'Compare expected and recorded PhilHealth contribution periods to help identify what to check with your employer or PhilHealth.',
  '/tools/contribution-table/': 'Review PhilHealth contribution schedules by year, including the rates and income ranges shown in the guide.',
  '/tools/diabetes-risk/': 'Review common type 2 diabetes risk factors with an informational screener. It is not a diagnosis or substitute for clinical advice.',
  '/tools/heat-hydration/': 'Plan a general hydration estimate for active time and hot conditions. Adjust for your health needs and follow local safety guidance.',
  '/tools/heat-index-guide/': 'Estimate heat index and review practical heat-safety guidance. Follow PAGASA advisories and local workplace safety instructions.',
  '/tools/hospital-bill-estimator/': 'Estimate a possible remaining hospital bill from a facility quote and benefit amount. Confirm actual charges with the hospital and PhilHealth.',
  '/tools/hypertension-risk/': 'Review common hypertension risk factors with an informational screener. It does not measure blood pressure or diagnose a condition.',
  '/tools/provider-finder/': 'Open official PhilHealth provider directories and learn what to verify about a facility’s current accreditation.',
  '/tools/requirements-finder/': 'Build a practical checklist for a PhilHealth transaction, then confirm the current forms and supporting documents with PhilHealth.',
  '/tools/rice-portions/': 'Convert rice portions to an approximate calorie estimate and compare common serving sizes. Nutrition values are estimates.',
  '/tools/service-navigator/': 'Explore PhilHealth service topics and choose a practical next step with links to relevant guides and official sources.',
  '/tools/spa-generator/': 'Review the information used in a PhilHealth Statement of Premium Account estimate. Confirm payment references through official PhilHealth services.',
  '/tools/yakap-benefits/': 'Explore YAKAP primary-care benefits and questions to ask a clinic, then verify current coverage with PhilHealth.',
  '/tools/yakap-clinic-finder/': 'Open the official YAKAP clinic directory and check current accreditation and services directly with the listed clinic.'
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function normalizeCanonicalPath(value) {
  let pathname = String(value || '/').split('?')[0].split('#')[0];
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    pathname = '/';
  }
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  if (pathname === '/' || pathname === '/index.html') return '/';
  pathname = pathname.replace(/\/index\.html$/i, '/');
  if (/\.html$/i.test(pathname)) pathname = pathname.slice(0, -5) + '/';
  if (!pathname.endsWith('/')) pathname += '/';
  return pathname.replace(/\/+/g, '/');
}

function pageSlug(value) {
  return normalizeCanonicalPath(value).split('/').filter(Boolean).pop() || '';
}

function resolveSafeFile(pathname) {
  const resolved = path.resolve(ROOT, `.${pathname}`);
  return resolved === ROOT || resolved.startsWith(`${ROOT}${path.sep}`) ? resolved : null;
}

function resolveHtmlFile(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(String(urlPath || '/').split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;

  const extension = path.extname(pathname);
  if (extension && extension.toLowerCase() !== '.html') return null;

  const candidates = extension
    ? [pathname]
    : pathname.endsWith('/')
      ? [`${pathname}index.html`]
      : [`${pathname}/index.html`, `${pathname}.html`];

  for (const candidate of candidates) {
    const filePath = resolveSafeFile(candidate);
    if (!filePath) continue;
    try {
      if (fs.statSync(filePath).isFile()) return filePath;
    } catch {
      // Try the next static-route form.
    }
  }
  return null;
}

function extractSeoArticleArray() {
  const appSource = fs.readFileSync(path.join(ROOT, 'assets/js/app.js'), 'utf8');
  const match = appSource.match(/const seoArticles\s*=\s*(\[[\s\S]*?\n  \]);/);
  if (!match) throw new Error('Could not locate the article metadata catalog in assets/js/app.js');
  return vm.runInNewContext(match[1], Object.create(null), { timeout: 1000 });
}

function loadArticleCatalog() {
  const context = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, 'data/article-content.js'), 'utf8'),
    context,
    { timeout: 1000 }
  );

  const records = new Map();
  const addRecord = record => {
    if (!record?.slug) return;
    const slug = String(record.slug).replace(/\.html$/i, '');
    const previous = records.get(slug) || {};
    records.set(slug, { ...previous, ...record, slug });
  };

  for (const record of context.window.PHArticles || []) addRecord(record);
  for (const record of extractSeoArticleArray()) addRecord(record);

  for (const article of records.values()) {
    if (typeof article.content === 'string' && article.content.trim()) continue;
    const sourceFile = String(article.sourceFile || '');
    if (!sourceFile.startsWith('/data/articles/')) continue;
    const filePath = resolveSafeFile(sourceFile);
    if (filePath && fs.existsSync(filePath)) article.content = fs.readFileSync(filePath, 'utf8');
  }

  return records;
}

const SITEMAP_PATHS = (() => {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return [];
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  return [...xml.matchAll(/<loc>\s*https:\/\/philbenefits\.com([^<]*)<\/loc>/gi)]
    .map(match => normalizeCanonicalPath(decodeHtml(match[1])));
})();
const SITEMAP_PATH_BY_SLUG = new Map();
for (const sitemapPath of SITEMAP_PATHS) {
  const slug = pageSlug(sitemapPath);
  if (!slug) continue;
  if (!SITEMAP_PATH_BY_SLUG.has(slug) || sitemapPath.startsWith('/guides/')) {
    SITEMAP_PATH_BY_SLUG.set(slug, sitemapPath);
  }
}

const ARTICLES_BY_SLUG = loadArticleCatalog();
const ARTICLES_BY_CANONICAL = new Map();
for (const article of ARTICLES_BY_SLUG.values()) {
  const canonicalPath = article.url
    ? normalizeCanonicalPath(article.url)
    : SITEMAP_PATH_BY_SLUG.get(article.slug) || `/guides/${article.slug}/`;
  article.canonicalPath = canonicalPath;
  ARTICLES_BY_CANONICAL.set(canonicalPath, article);
}

function truncateDescription(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  const short = text.slice(0, 157).replace(/\s+\S*$/, '').trim();
  return `${short || text.slice(0, 157).trim()}…`;
}

function optimizeDescription(value) {
  const description = truncateDescription(value);
  if (description.length >= 140) return description;
  for (const ending of [
    ' Check current details with PhilHealth.',
    ' Confirm details with PhilHealth.',
    ' Check with PhilHealth.',
    ' Check PhilHealth.'
  ]) {
    if (description.length + ending.length <= 160) return `${description}${ending}`;
  }
  return description;
}

function formatTitle(title, canonicalPath) {
  if (canonicalPath === '/') return PAGE_PROFILES['/'].title;
  const base = String(title || SITE_NAME).replace(/\s+/g, ' ').trim();
  if (!base) return SITE_NAME;
  if (/philhealth guide/i.test(base)) return base;
  const suffix = ` | ${SITE_NAME}`;
  return base.length + suffix.length <= 65 ? `${base}${suffix}` : base;
}

function keywordsFor(title, category = '') {
  const topic = String(title || SITE_NAME)
    .replace(/\s*\|\s*PhilHealth Guide$/i, '')
    .replace(/^PhilHealth Guide:\s*/i, '')
    .trim();
  const brandedTopic = /^philhealth\b/i.test(topic) ? topic : `PhilHealth ${topic}`;
  const keywords = [
    topic,
    brandedTopic,
    category ? `PhilHealth ${category}` : '',
    'PhilHealth Philippines',
    'PhilHealth Guide'
  ];
  return [...new Set(keywords.map(value => value.trim()).filter(Boolean))].slice(0, 8).join(', ');
}

function fallbackDescription(title, canonicalPath) {
  if (canonicalPath.startsWith('/tools/')) {
    return `Use ${title} to review a PhilHealth-related estimate, checklist or next step. Results are informational; confirm current details with official sources.`;
  }
  if (canonicalPath.startsWith('/guides/')) {
    return `Read this PhilHealth guide for practical context, next steps and links to official sources. Verify current eligibility, rates and requirements before acting.`;
  }
  return `Explore ${title} with independent PhilHealth information, practical next steps and links to official sources. Verify current details directly with PhilHealth.`;
}

function stripMarkdown(value) {
  return String(value || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[*_~#|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function faqQuestion(line) {
  const value = String(line || '').trim();
  const bold = value.match(/^\*\*(.+?)\*\*\s*$/);
  const heading = value.match(/^#{3,6}\s+(.+?)\s*$/);
  const prefixed = value.match(/^(?:Q|Question)\s*:\s*(.+?)\s*$/i);
  const question = stripMarkdown(bold?.[1] || heading?.[1] || prefixed?.[1] || '');
  return question.endsWith('?') && question.length <= 220 ? question : '';
}

function extractFaqs(markdown) {
  if (typeof markdown !== 'string' || !markdown.trim()) return [];
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex(line => /^#{1,6}\s*(?:frequently asked questions|faqs?|common questions)\b/i.test(line.trim()));
  if (headingIndex < 0) return [];

  const sectionLevel = (lines[headingIndex].match(/^#+/) || ['##'])[0].length;
  let sectionEnd = lines.length;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const heading = lines[index].trim().match(/^(#+)\s+/);
    if (heading && heading[1].length <= sectionLevel) {
      sectionEnd = index;
      break;
    }
  }

  const faqs = [];
  let current = null;
  const saveCurrent = () => {
    if (!current) return;
    const text = stripMarkdown(current.answer.join(' '));
    if (current.question && text.length >= 12) {
      faqs.push({ question: current.question, answer: text.slice(0, 1000) });
    }
  };

  for (let index = headingIndex + 1; index < sectionEnd; index += 1) {
    const question = faqQuestion(lines[index]);
    if (question) {
      saveCurrent();
      current = { question, answer: [] };
    } else if (current) {
      current.answer.push(lines[index]);
    }
  }
  saveCurrent();
  return faqs.slice(0, 12);
}

function parseDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function articleForPath(canonicalPath) {
  return ARTICLES_BY_CANONICAL.get(canonicalPath)
    || ARTICLES_BY_SLUG.get(pageSlug(canonicalPath))
    || null;
}

function getPageMetadata(requestPath, html = '') {
  const canonicalPath = normalizeCanonicalPath(requestPath);
  const article = articleForPath(canonicalPath);
  const profile = PAGE_PROFILES[canonicalPath];
  const toolDescription = TOOL_DESCRIPTIONS[canonicalPath];
  const rawTitle = article?.title
    || profile?.title
    || decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
    || pageSlug(canonicalPath).replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    || SITE_NAME;
  const title = formatTitle(rawTitle, canonicalPath);
  const description = optimizeDescription(
    article?.metaDescription
    || article?.excerpt
    || profile?.description
    || toolDescription
    || fallbackDescription(rawTitle, canonicalPath)
    || DEFAULT_DESCRIPTION
  );
  const published = parseDate(article?.datePublished || article?.date);
  const modified = parseDate(article?.dateModified || article?.modified);
  const notFound = canonicalPath === '/404/' || /<title[^>]*>\s*404/i.test(html);
  const noIndex = notFound || canonicalPath === '/search/';
  const breadcrumbs = [];

  if (!noIndex && canonicalPath !== '/') {
    breadcrumbs.push({ name: 'Home', item: `${SITE_ORIGIN}/` });
    if (article) {
      breadcrumbs.push({ name: 'Guides', item: `${SITE_ORIGIN}/guides/` });
      breadcrumbs.push({ name: rawTitle, item: `${SITE_ORIGIN}${article.canonicalPath}` });
    } else if (canonicalPath.startsWith('/tools/')) {
      breadcrumbs.push({ name: 'Tools', item: `${SITE_ORIGIN}/tools/` });
      breadcrumbs.push({ name: rawTitle, item: `${SITE_ORIGIN}${canonicalPath}` });
    } else {
      breadcrumbs.push({ name: rawTitle, item: `${SITE_ORIGIN}${canonicalPath}` });
    }
  }

  const faqItems = article ? extractFaqs(article.content) : [];
  const visibleArticleFaqs = faqItems.length >= 2 ? faqItems : article ? [
    {
      question: 'Is this an official PhilHealth page?',
      answer: 'No. PhilHealth Guide is an independent informational resource and does not access member records or make official decisions.'
    },
    {
      question: 'Can I rely on the numbers shown?',
      answer: 'Use the article as a planning and reading aid, then verify current rates, packages, facilities, documents and dates with PhilHealth or the relevant facility.'
    }
  ] : [];

  return {
    article,
    author: article?.author || SITE_NAME,
    breadcrumbs,
    canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
    category: article?.category || '',
    description: description || DEFAULT_DESCRIPTION,
    faqs: visibleArticleFaqs,
    image: article?.image || '',
    keywords: keywordsFor(rawTitle, article?.category),
    noIndex,
    published,
    modified,
    title,
    type: article ? 'article' : 'website'
  };
}

function makeStructuredData(metadata) {
  const organizationId = `${SITE_ORIGIN}/#organization`;
  const websiteId = `${SITE_ORIGIN}/#website`;
  const pageId = `${metadata.canonicalUrl}#webpage`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: SITE_NAME,
      url: SITE_ORIGIN,
      description: 'An independent informational resource about PhilHealth programs, requirements and tools.'
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      inLanguage: 'en-PH',
      publisher: { '@id': organizationId }
    },
    {
      '@type': 'WebPage',
      '@id': pageId,
      url: metadata.canonicalUrl,
      name: metadata.title,
      description: metadata.description,
      inLanguage: 'en-PH',
      isPartOf: { '@id': websiteId }
    }
  ];

  if (metadata.image) {
    graph[2].primaryImageOfPage = { '@type': 'ImageObject', url: metadata.image };
  }
  if (metadata.breadcrumbs.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: metadata.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.item
      }))
    });
  }
  if (metadata.article) {
    const articleNode = {
      '@type': 'Article',
      '@id': `${metadata.canonicalUrl}#article`,
      mainEntityOfPage: { '@id': pageId },
      headline: metadata.article.title,
      description: metadata.description,
      inLanguage: 'en-PH',
      publisher: { '@id': organizationId },
      isAccessibleForFree: true
    };
    if (metadata.image) articleNode.image = [metadata.image];
    if (metadata.published) articleNode.datePublished = metadata.published;
    if (metadata.modified) articleNode.dateModified = metadata.modified;
    if (metadata.author) {
      const organizationAuthor = /editorial team|philhealth guide/i.test(metadata.author);
      articleNode.author = {
        '@type': organizationAuthor ? 'Organization' : 'Person',
        name: metadata.author
      };
    }
    if (metadata.category) articleNode.articleSection = metadata.category;
    graph.push(articleNode);
  }
  if (metadata.faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${metadata.canonicalUrl}#faq`,
      mainEntity: metadata.faqs.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

function metaTag(name, content, attribute = 'name') {
  return `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}">`;
}

function renderSeoHead(requestPath, html = '') {
  const metadata = getPageMetadata(requestPath, html);
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    metaTag('description', metadata.description),
    metaTag('keywords', metadata.keywords),
    metaTag('author', metadata.author),
    metaTag('robots', metadata.noIndex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'),
    metaTag('theme-color', '#0B5D3B'),
    `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}">`,
    metaTag('og:title', metadata.title, 'property'),
    metaTag('og:description', metadata.description, 'property'),
    metaTag('og:url', metadata.canonicalUrl, 'property'),
    metaTag('og:type', metadata.type, 'property'),
    metaTag('og:locale', 'en_PH', 'property'),
    metaTag('og:site_name', SITE_NAME, 'property'),
    metaTag('twitter:card', metadata.image ? 'summary_large_image' : 'summary'),
    metaTag('twitter:title', metadata.title),
    metaTag('twitter:description', metadata.description),
    metaTag('twitter:url', metadata.canonicalUrl)
  ];

  if (metadata.image) {
    tags.push(metaTag('og:image', metadata.image, 'property'));
    tags.push(metaTag('og:image:alt', metadata.article?.title || metadata.title, 'property'));
    tags.push(metaTag('twitter:image', metadata.image));
    tags.push(metaTag('twitter:image:alt', metadata.article?.title || metadata.title));
  }
  if (metadata.type === 'article') {
    if (metadata.published) tags.push(metaTag('article:published_time', metadata.published, 'property'));
    if (metadata.modified) tags.push(metaTag('article:modified_time', metadata.modified, 'property'));
    if (metadata.author) tags.push(metaTag('article:author', metadata.author, 'property'));
    if (metadata.category) tags.push(metaTag('article:section', metadata.category, 'property'));
  }

  const jsonLd = JSON.stringify(makeStructuredData(metadata))
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  tags.push(`<script type="application/ld+json">${jsonLd}</script>`);
  return tags.join('\n  ');
}

function isManagedMetaTag(tag) {
  const name = tag.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() || '';
  const property = tag.match(/\bproperty\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() || '';
  return new Set([
    'description', 'keywords', 'author', 'robots', 'theme-color',
    'og:title', 'og:description', 'og:url', 'og:type', 'og:locale', 'og:site_name',
    'og:image', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description',
    'twitter:url', 'twitter:image', 'twitter:image:alt', 'article:published_time',
    'article:modified_time', 'article:author', 'article:section'
  ]).has(name) || new Set([
    'og:title', 'og:description', 'og:url', 'og:type', 'og:locale', 'og:site_name',
    'og:image', 'og:image:alt', 'article:published_time', 'article:modified_time',
    'article:author', 'article:section'
  ]).has(property);
}

function injectSeoHead(html, requestPath) {
  const head = renderSeoHead(requestPath, html);
  let cleaned = String(html || '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\b[^>]*>/gi, tag => isManagedMetaTag(tag) ? '' : tag)
    .replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi, '')
    .replace(/<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '');

  if (/<\/head\s*>/i.test(cleaned)) {
    return cleaned.replace(/<\/head\s*>/i, `  ${head}\n</head>`);
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${head}</head><body>${cleaned}</body></html>`;
}

module.exports = {
  SITE_ORIGIN,
  extractFaqs,
  getPageMetadata,
  injectSeoHead,
  normalizeCanonicalPath,
  renderSeoHead,
  resolveHtmlFile
};
