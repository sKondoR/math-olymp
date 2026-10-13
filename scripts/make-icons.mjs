// Renders the app icon and the splash mark (design 01 «Тихий», logo 26 «M·A» tiles) into assets/images.
// The icon always takes the sea colours, whatever theme is chosen in the app (see DESIGN.md).
// Run: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => join(root, 'assets/images', name);
const font = join(
  root,
  'node_modules/@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf',
);

const page = '#e9f7f7'; // sea-page
const tile = '#1f5d80'; // sea-deep
const pick = '#e3600f'; // sea-logo-orange
const letter = 'font-family="Manrope" font-weight="800" font-size="22" text-anchor="middle"';

// The mark on the 108-unit adaptive icon grid (72-unit visible circle in the middle)
const aTile = (color) =>
  `<g transform="rotate(4 67 52)">
    <rect x="51.65" y="36.65" width="30.7" height="30.7" rx="6.9" fill="none" stroke="${color}" stroke-width="3.3"/>
    <text x="67" y="60" ${letter} fill="${color}" stroke="${color}" stroke-width="0.33">A</text>
  </g>`;
const mTileRect = 'x="24" y="39" width="34" height="34" rx="8.5"';
const mTile = `<g transform="rotate(-4 41 56)">
    <rect ${mTileRect} fill="${tile}" stroke="${page}" stroke-width="1.6"/>
    <text x="41" y="64" ${letter} fill="#fff">M</text>
  </g>`;
const mark = aTile(pick) + mTile;

// Monochrome (themed icons): only alpha counts, so the M letter and the gap around the M tile are cut out
const mono = `<defs>
    <mask id="gap"><rect width="108" height="108" fill="#fff"/>
      <g transform="rotate(-4 41 56)"><rect ${mTileRect} fill="#000" stroke="#000" stroke-width="1.6"/></g></mask>
    <mask id="letter"><rect width="108" height="108" fill="#fff"/>
      <g transform="rotate(-4 41 56)"><text x="41" y="64" ${letter} fill="#000">M</text></g></mask>
  </defs>
  <g mask="url(#gap)">${aTile('#fff')}</g>
  <g mask="url(#letter)"><g transform="rotate(-4 41 56)"><rect ${mTileRect} fill="#fff"/></g></g>`;

function render(name, viewBox, body, size = 1024) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { fontFiles: [font], loadSystemFonts: false, defaultFontFamily: 'Manrope' },
  })
    .render()
    .asPng();
  writeFileSync(out(name), png);
  console.log(name);
}

const grid = '0 0 108 108';
render('icon.png', grid, `<rect width="108" height="108" fill="${page}"/>${mark}`);
render('android-icon-foreground.png', grid, mark);
render('android-icon-monochrome.png', grid, mono);
// Splash: Android 12+ shows the icon in a 192 dp circle on the page colour; this crop of the grid
// keeps the tiles inside it (app.json: imageWidth 192)
render('splash-icon.png', '14.5 16 77 77', mark);
