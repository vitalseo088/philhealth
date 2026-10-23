const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { injectSeoHead, resolveHtmlFile } = require('./seo');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';
const ROOT = __dirname;

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const htmlPath = resolveHtmlFile(req.path);
  if (!htmlPath) return next();

  fs.readFile(htmlPath, 'utf8', (error, html) => {
    if (error) return next(error);
    res.type('html').send(injectSeoHead(html, req.path));
  });
});

app.use(express.static(ROOT, {
  extensions: ['html'],
  index: 'index.html'
}));

app.use((req, res) => {
  res.set('X-Robots-Tag', 'noindex, follow');
  res.status(404).sendFile(path.join(ROOT, '404.html'));
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`PhilHealth Guide listening on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
