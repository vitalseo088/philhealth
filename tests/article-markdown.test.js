const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'assets/js/app.js'), 'utf8');
const start = appSource.indexOf('  function markdownInline(value) {');
const end = appSource.indexOf('  function markdownHtml(markdown) {', start);
assert.ok(start >= 0 && end > start, 'markdown inline renderer should exist');

const context = {
  esc: value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character])
};
vm.runInNewContext(
  `${appSource.slice(start, end)}\nglobalThis.renderMarkdownInline = markdownInline;`,
  context
);

test('external markdown links have valid attributes and do not swallow following text', () => {
  const html = context.renderMarkdownInline(
    'Read the [official provider directory](https://www.philhealth.gov.ph/partners/), then call the facility.'
  );

  assert.equal(
    html,
    'Read the <a href="https://www.philhealth.gov.ph/partners/" target="_blank" rel="noopener noreferrer">official provider directory</a>, then call the facility.'
  );
});

test('internal markdown links stay in the current tab', () => {
  const html = context.renderMarkdownInline('See the [provider guide](/providers.html).');

  assert.equal(html, 'See the <a href="/providers.html">provider guide</a>.');
});
