/**
 * Regenerates src/ui/styles/fonts.css from the @fontsource packages.
 *
 *   node scripts/build-fonts.mjs
 *
 * The fonts are embedded as base64 rather than linked, so the bundle stays one
 * self-contained file that runs from a subpath, from file:// and offline. Run
 * this after changing which faces the interface uses; the output is committed.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const FACES = [
  ['Silkscreen', 400, 'node_modules/@fontsource/silkscreen/files/silkscreen-latin-400-normal.woff2'],
  ['Silkscreen', 700, 'node_modules/@fontsource/silkscreen/files/silkscreen-latin-700-normal.woff2'],
  ['Pixelify Sans', 400, 'node_modules/@fontsource/pixelify-sans/files/pixelify-sans-latin-400-normal.woff2'],
  ['Pixelify Sans', 700, 'node_modules/@fontsource/pixelify-sans/files/pixelify-sans-latin-700-normal.woff2'],
];

const header = `/* Fonts, embedded.
 *
 * Generated — do not hand-edit; run \`node scripts/build-fonts.mjs\`.
 *
 * They are base64 data URIs rather than links to a font host because the whole
 * value of this build is that it is one self-contained bundle: it runs from a
 * subpath, from a file:// URL and with no network at all. A webfont link was
 * tried once and taken back out for exactly that reason. All four files
 * together are under 40 KB, which is less than a single card illustration
 * would cost.
 *
 * Both cover the Portuguese diacritics (checked with fontTools before
 * committing). Neither has U+2192 or U+25C7, so arrows and diamonds in the
 * interface are drawn in CSS instead of typed as characters. */
`;

const blocks = FACES.map(([family, weight, path]) => {
  const data = readFileSync(path).toString('base64');
  return `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: block;
  src: url(data:font/woff2;charset=utf-8;base64,${data}) format('woff2');
}
`;
});

mkdirSync('src/ui/styles', { recursive: true });
writeFileSync('src/ui/styles/fonts.css', [header, ...blocks].join('\n'));
console.log('fonts.css escrito');
