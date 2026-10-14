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
 * The content rules are in scripts/tasks-bank.mjs; this file only reads and writes. Nothing is
 * written when a rule fails, so the app keeps the last good bank.
 *
 * Only invented tasks (generated/) go into the app; real contest tasks (tasks/) never do.
 *
 * Usage: npm run tasks:sync            (sources at ../sources)
 *        MO_SOURCES=/path npm run tasks:sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import prettier from 'prettier';

import { GRADES, buildBank } from './tasks-bank.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = path.resolve(process.env.MO_SOURCES ?? path.join(ROOT, '..', 'sources'));
const OUT_ASSETS = path.join(ROOT, 'assets', 'tasks');
const OUT_TS = path.join(ROOT, 'src', 'data', 'builtin.generated.ts');

function fail(msg) {
  console.error(`sync-tasks: ${msg}`);
  process.exit(1);
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** A picture of the folder: the glass one when there is one; undefined when there is none. */
function readPicture(src, file) {
  for (const p of [path.join(src, 'styled_glass', file), path.join(src, file)]) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  return undefined;
}

async function main() {
  const generated = path.join(SOURCES, 'generated');
  if (!fs.existsSync(generated)) fail(`no generated/ in ${SOURCES}`);

  const grades = GRADES.map(([grade, folder]) => {
    const src = path.join(generated, folder);
    const raw = readJson(path.join(src, 'tasks.json'));
    const svgs = Object.fromEntries(
      raw.filter((t) => t.image).map((t) => [t.image, readPicture(src, t.image)]),
    );
    return { grade, folder, raw, svgs };
  });

  const { files, generatedTs, errors, stats } = buildBank(
    grades,
    readJson(path.join(generated, 'svg_i18n.json')),
  );
  if (errors.length) fail(`\n  ${errors.join('\n  ')}`);

  fs.rmSync(OUT_ASSETS, { recursive: true, force: true });
  for (const { path: file, content } of files) {
    const out = path.join(OUT_ASSETS, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // JSON in the repo's style, so a sync without changes in the sources changes nothing
    const text = file.endsWith('.json')
      ? await prettier.format(content, { ...(await prettier.resolveConfig(out)), filepath: out })
      : content;
    fs.writeFileSync(out, text);
  }
  fs.writeFileSync(OUT_TS, generatedTs);
  for (const line of stats) console.log(line);
  const total = grades.reduce((n, g) => n + g.raw.length, 0);
  console.log(`done: ${total} tasks -> ${path.relative(ROOT, OUT_ASSETS)}`);
}

main().catch((e) => fail(e.stack ?? String(e)));
