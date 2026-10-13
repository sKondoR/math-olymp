#!/usr/bin/env node
/**
 * Copies the built-in task bank into the app.
 *
 * Reads ../sources/generated/<grade>/tasks.json and the "glass" pictures (styled_glass/NN.svg,
 * falling back to NN.svg) and writes:
 *   assets/tasks/<grade>/tasks.json  — tasks in the app format (see src/data/types.ts)
 *   assets/tasks/<grade>/NN.svg      — pictures, copied as is
 *   assets/tasks/<grade>/<lang>/NN.svg — pictures with Russian text, the text translated by
 *                                      ../sources/generated/svg_i18n.json
 *   src/data/builtin.generated.ts    — static requires for Metro
 *
 * Only invented tasks (generated/) go into the app; real contest tasks (tasks/) never do.
 *
 * Usage: npm run tasks:sync            (sources at ../sources)
 *        MO_SOURCES=/path npm run tasks:sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = path.resolve(process.env.MO_SOURCES ?? path.join(ROOT, '..', 'sources'));
const OUT_ASSETS = path.join(ROOT, 'assets', 'tasks');
const OUT_TS = path.join(ROOT, 'src', 'data', 'builtin.generated.ts');

// Data folders by school grade; the app shows only ages (see src/data/groups.ts).
const GRADES = [
  ['1', 'grade1'],
  ['2', 'grade2'],
  ['3-4', 'grade3-4'],
  ['5-6', 'grade5-6'],
  ['7-8', 'grade7-8'],
  ['9-10', 'grade9-10'],
];

const TYPES = {
  'Разные темы': 'mixed',
  Время: 'time',
  'Календарь и високосные годы': 'calendar',
  'Первые примеры': 'first-examples',
};
const LEVELS = { лёгкая: 1, средняя: 2, трудная: 3 };
// Translations live in raw.i18n.<lang> as { text, options, solution }; Russian is the base.
const LANGS = ['en', 'es', 'fr'];
// Letter labels in pictures (and in translated texts) go Latin by position: А→A, Б→B, В→C…
const LATIN = Object.fromEntries([...'АБВГДЕЖЗИК'].map((c, i) => [c, 'ABCDEFGHIJ'[i]]));
const CYRILLIC = /[А-Яа-яЁё]/;
const SVG_TEXT = /(<text\b[^>]*>)([^<]*)(<\/text>)/g;
function fail(msg) {
  console.error(`sync-tasks: ${msg}`);
  process.exit(1);
}

/** Russian text plus every translation of the field `pick` returns, e.g. the text or an option. */
function localized(raw, ru, pick, where, errors) {
  const out = { ru: String(ru) };
  for (const lang of LANGS) {
    const value = raw.i18n?.[lang] && pick(raw.i18n[lang]);
    if (value == null || value === '') errors.push(`${where}: no ${lang} translation`);
    else out[lang] = String(value);
  }
  return out;
}

function convert(raw, grade, errors) {
  const where = `${grade} #${raw.number}`;
  const type = TYPES[raw.type];
  if (!type) errors.push(`${where}: unknown type "${raw.type}"`);
  const weight = raw.points ? raw.points - 2 : LEVELS[raw.level];
  if (![1, 2, 3].includes(weight)) errors.push(`${where}: no points or level`);
  const answer = String(raw.answer).trim();
  let options = null;
  if (raw.options && Object.keys(raw.options).length) {
    options = Object.entries(raw.options).map(([key, text]) => ({
      key,
      text: localized(raw, text, (tr) => tr.options?.[key], `${where} option ${key}`, errors),
    }));
    if (!options.some((o) => o.key === answer)) errors.push(`${where}: answer not among options`);
  } else if (!/^\d+$/.test(answer)) {
    // written answers are typed on digit keys
    errors.push(`${where}: written answer "${answer}" is not a whole number`);
  }
  if (!raw.text || !raw.solution) errors.push(`${where}: text or solution missing`);
  return {
    id: raw.id,
    number: raw.number,
    points: raw.points ?? null,
    weight,
    type,
    topics: raw.topics ?? [],
    text: localized(raw, raw.text, (tr) => tr.text, `${where} text`, errors),
    options,
    answer,
    solution: localized(raw, raw.solution, (tr) => tr.solution, `${where} solution`, errors),
    image: raw.image ?? null,
  };
}

/**
 * The picture in every language that needs its own copy: { en: svg, … }, or null when the
 * picture has no Russian text or keeps it on purpose (rebuses, Russian words).
 */
function translatePicture(svg, file, dict, used, errors) {
  if (dict.keep.includes(file) || ![...svg.matchAll(SVG_TEXT)].some((m) => CYRILLIC.test(m[2]))) {
    return null;
  }
  const own = dict.files[file] ?? {};
  const labels = dict.labels.includes(file);
  const out = {};
  for (const lang of LANGS) {
    out[lang] = svg.replace(SVG_TEXT, (all, open, text, close) => {
      if (!CYRILLIC.test(text)) return all;
      const key = text.trim();
      const tr = own[lang]?.[key] ?? (labels ? LATIN[key] : undefined) ?? dict.common[lang][key];
      if (tr == null) {
        errors.push(`${file}: no ${lang} translation for picture text "${key}"`);
        return all;
      }
      used.add(file);
      return open + text.replace(key, tr) + close;
    });
  }
  return out;
}

function main() {
  if (!fs.existsSync(path.join(SOURCES, 'generated'))) fail(`no generated/ in ${SOURCES}`);

  const dict = JSON.parse(
    fs.readFileSync(path.join(SOURCES, 'generated', 'svg_i18n.json'), 'utf8'),
  );
  const used = new Set();

  fs.rmSync(OUT_ASSETS, { recursive: true, force: true });
  const errors = [];
  const lines = [
    '// Generated by scripts/sync-tasks.mjs — do not edit by hand.',
    "import type { BuiltinBank } from './types';",
    '',
    'export const builtinBank: BuiltinBank = {',
  ];
  let total = 0;

  for (const [grade, folder] of GRADES) {
    const src = path.join(SOURCES, 'generated', folder);
    const raw = JSON.parse(fs.readFileSync(path.join(src, 'tasks.json'), 'utf8'));
    const tasks = raw.map((t) => convert(t, grade, errors)).sort((a, b) => a.number - b.number);
    const out = path.join(OUT_ASSETS, folder);
    fs.mkdirSync(out, { recursive: true });

    const images = [];
    for (const t of raw) {
      if (!t.image) continue;
      const glass = path.join(src, 'styled_glass', t.image);
      const svgPath = fs.existsSync(glass) ? glass : path.join(src, t.image);
      if (!fs.existsSync(svgPath)) {
        errors.push(`${grade} #${t.number}: picture ${t.image} not found`);
        continue;
      }
      fs.copyFileSync(svgPath, path.join(out, t.image));
      images.push(t.image);
      const svg = fs.readFileSync(svgPath, 'utf8');
      const translated = translatePicture(svg, `${folder}/${t.image}`, dict, used, errors);
      for (const [lang, text] of Object.entries(translated ?? {})) {
        fs.mkdirSync(path.join(out, lang), { recursive: true });
        fs.writeFileSync(path.join(out, lang, t.image), text);
        images.push(`${lang}/${t.image}`);
      }
    }
    fs.writeFileSync(path.join(out, 'tasks.json'), JSON.stringify(tasks, null, 1) + '\n');

    lines.push(`  '${grade}': {`);
    lines.push(`    tasks: require('@/assets/tasks/${folder}/tasks.json'),`);
    lines.push('    images: {');
    for (const img of images.sort()) {
      lines.push(`      '${img}': require('@/assets/tasks/${folder}/${img}'),`);
    }
    lines.push('    },');
    lines.push('  },');
    total += tasks.length;
    const localized = images.filter((i) => i.includes('/')).length;
    console.log(
      `${grade}: ${tasks.length} tasks, ${images.length - localized} pictures (+${localized} translated)`,
    );
  }
  lines.push('};', '');

  for (const file of [...Object.keys(dict.files), ...dict.labels]) {
    if (!used.has(file)) errors.push(`svg_i18n.json: ${file} is not a picture with Russian text`);
  }

  if (errors.length) fail(`\n  ${errors.join('\n  ')}`);
  fs.writeFileSync(OUT_TS, lines.join('\n'));
  console.log(`done: ${total} tasks -> ${path.relative(ROOT, OUT_ASSETS)}`);
}

try {
  main();
} catch (e) {
  fail(e.stack ?? String(e));
}
