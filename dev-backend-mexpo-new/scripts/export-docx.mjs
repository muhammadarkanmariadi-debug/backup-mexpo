// scripts/export-docx.mjs
// Builds docs/Mexpo-API-and-Backend-Design.docx (inside dev-backend-mexpo-new/docs)
// from docs/api-handbook.md. Pipeline: Markdown → HTML (marked) → .docx (html-to-docx).
// No network/pandoc needed.
//
// Usage: npm run docs:docx   (inside dev-backend-mexpo-new)

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import htmlToDocx from 'html-to-docx';

const here = dirname(fileURLToPath(import.meta.url));
const mdPath = resolve(here, '..', 'docs', 'api-handbook.md');
const outPath = resolve(here, '..', 'docs', 'Mexpo-API-and-Backend-Design.docx');

const md = readFileSync(mdPath, 'utf8');
let html = marked.parse(md, { gfm: true });

// Inline styles so Word renders readable tables / code (html-to-docx honors
// attributes on the elements).
html = html.replace(
  /<table>/g,
  '<table width="100%" cellspacing="0" cellpadding="6" style="border-collapse:collapse;">',
);
html = html.replace(
  /<th>/g,
  '<th style="border:1pt solid #999;background:#f0f0f0;padding:4pt 6pt;text-align:left;">',
);
html = html.replace(
  /<td>/g,
  '<td style="border:1pt solid #ccc;padding:4pt 6pt;">',
);
html = html.replace(
  /<pre>/g,
  '<pre style="font-size:9pt;line-height:1.3;page-break-inside:avoid;">',
);
html = html.replace(
  /<code>/g,
  '<code style="font-family:Consolas,monospace;">',
);

const wrapped = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Mexpo API &amp; Backend Design</title>
</head>
<body>${html}</body>
</html>`;

const buffer = await htmlToDocx(
  wrapped,
  undefined,
  {
    margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
    fontSize: 21,
  },
  undefined,
);

writeFileSync(outPath, buffer);
console.log(`Wrote ${outPath} (${buffer.length} bytes)`);