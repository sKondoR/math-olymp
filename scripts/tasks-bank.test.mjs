import { describe, expect, it } from 'vitest';

import { WRITTEN_DIGITS as APP_WRITTEN_DIGITS } from '../src/state/attempt';
import { WRITTEN_DIGITS, buildBank } from './tasks-bank.mjs';

const tr = (s) => ({ text: `${s} text`, solution: `${s} solution` });

/** A raw task as in generated/<grade>/tasks.json, translated into every language. */
function raw(over = {}) {
  const options = { А: '1', Б: '2', В: '3' };
  const i18n = Object.fromEntries(['en', 'es', 'fr'].map((l) => [l, { ...tr(l), options }]));
  return {
    id: 'g2-01',
    number: 1,
    points: 3,
    type: 'Разные темы',
    topics: ['логика'],
    text: 'Условие',
    options,
    answer: 'Б',
    solution: 'Разбор',
    image: null,
    i18n,
    ...over,
  };
}

const dict = (over = {}) => ({
  keep: [],
  labels: [],
  files: {},
  common: { en: { кот: 'cat' }, es: { кот: 'gato' }, fr: { кот: 'chat' } },
  ...over,
});

const grade = (tasks, svgs = {}) => ({ grade: '2', folder: 'grade2', raw: tasks, svgs });
const build = (tasks, svgs, d = dict()) => buildBank([grade(tasks, svgs)], d);
const file = (bank, p) => bank.files.find((f) => f.path === p)?.content;

describe('tasks', () => {
  it('converts a task into the app format', () => {
    const bank = build([raw()]);
    expect(bank.errors).toEqual([]);
    const [task] = JSON.parse(file(bank, 'grade2/tasks.json'));
    expect(task).toMatchObject({
      id: 'g2-01',
      points: 3,
      weight: 1,
      type: 'mixed',
      answer: 'Б',
      text: { ru: 'Условие', en: 'en text', es: 'es text', fr: 'fr text' },
      image: null,
    });
    expect(task.options[1]).toEqual({ key: 'Б', text: { ru: '2', en: '2', es: '2', fr: '2' } });
  });

  it('turns points 3/4/5 and first-grade levels into weights 1–3', () => {
    const bank = build([
      raw({ id: 'a', number: 1, points: 5 }),
      raw({ id: 'b', number: 2, points: null, level: 'средняя' }),
    ]);
    const tasks = JSON.parse(file(bank, 'grade2/tasks.json'));
    expect(tasks.map((t) => [t.weight, t.points])).toEqual([
      [3, 5],
      [2, null],
    ]);
  });

  it('orders tasks by number', () => {
    const bank = build([raw({ id: 'b', number: 2 }), raw({ id: 'a', number: 1 })]);
    expect(JSON.parse(file(bank, 'grade2/tasks.json')).map((t) => t.number)).toEqual([1, 2]);
  });
});

describe('content rules', () => {
  const errorsOf = (...tasks) => build(tasks).errors;

  it('needs the answer among the options', () => {
    expect(errorsOf(raw({ answer: 'Д' }))).toEqual(['2 #1: answer not among options']);
  });

  it('needs a written answer to be a whole number', () => {
    expect(errorsOf(raw({ options: null, answer: '1,5' }))).toEqual([
      '2 #1: written answer "1,5" is not a whole number',
    ]);
  });

  it('needs a written answer the digit keys can type', () => {
    expect(errorsOf(raw({ options: null, answer: '12' }))).toEqual([]);
    expect(errorsOf(raw({ options: null, answer: '0' }))).toEqual([]);
    expect(errorsOf(raw({ options: null, answer: '1000' }))).toEqual([
      `2 #1: written answer "1000" can't be typed on the keys`,
    ]);
    expect(errorsOf(raw({ options: null, answer: '07' }))).toEqual([
      `2 #1: written answer "07" can't be typed on the keys`,
    ]);
  });

  it('takes as many digits as the app does', () => {
    expect(WRITTEN_DIGITS).toBe(APP_WRITTEN_DIGITS);
  });

  it('needs every translation', () => {
    const t = raw();
    delete t.i18n.fr.text;
    expect(errorsOf(t)).toEqual(['2 #1 text: no fr translation']);
  });

  it('needs a known type and points or a level', () => {
    expect(errorsOf(raw({ type: 'Другое', points: null }))).toEqual([
      '2 #1: unknown type "Другое"',
      '2 #1: no points or level',
    ]);
  });

  it('needs ids unique across the whole bank', () => {
    const bank = buildBank(
      [grade([raw()]), { ...grade([raw()]), grade: '3-4', folder: 'grade3-4' }],
      dict(),
    );
    expect(bank.errors).toEqual(['3-4 #1: id g2-01 is not unique']);
  });
});

describe('pictures', () => {
  const svg = (label) => `<svg><text x="1">${label}</text><text>5</text></svg>`;

  it('copies a picture without Russian text once', () => {
    const bank = build([raw({ image: '01.svg' })], { '01.svg': svg('7') });
    expect(bank.errors).toEqual([]);
    expect(bank.files.map((f) => f.path)).toEqual(['grade2/01.svg', 'grade2/tasks.json']);
    expect(bank.generatedTs).toContain(
      "      '01.svg': { ru: require('@/assets/tasks/grade2/01.svg') },\n",
    );
  });

  it('writes a translated copy per language from the common words', () => {
    const bank = build([raw({ image: '01.svg' })], { '01.svg': svg('кот') });
    expect(file(bank, 'grade2/en/01.svg')).toBe(svg('cat'));
    expect(file(bank, 'grade2/fr/01.svg')).toBe(svg('chat'));
    // the app gets the picture with its copies as one Localized value
    expect(bank.generatedTs).toContain(
      [
        "      '01.svg': {",
        "        ru: require('@/assets/tasks/grade2/01.svg'),",
        "        en: require('@/assets/tasks/grade2/en/01.svg'),",
        "        es: require('@/assets/tasks/grade2/es/01.svg'),",
        "        fr: require('@/assets/tasks/grade2/fr/01.svg'),",
        '      },',
      ].join('\n'),
    );
  });

  it('turns letter labels Latin by position', () => {
    const bank = build(
      [raw({ image: '01.svg' })],
      { '01.svg': svg('В') },
      dict({ labels: ['grade2/01.svg'] }),
    );
    expect(file(bank, 'grade2/es/01.svg')).toBe(svg('C'));
  });

  it('keeps Russian text where it is meant to stay', () => {
    const bank = build(
      [raw({ image: '01.svg' })],
      { '01.svg': svg('кит') },
      dict({ keep: ['grade2/01.svg'] }),
    );
    expect(bank.errors).toEqual([]);
    expect(file(bank, 'grade2/en/01.svg')).toBeUndefined();
  });

  it('reports a word with no translation and a missing picture', () => {
    const bank = build([raw({ image: '01.svg' }), raw({ id: 'b', number: 2, image: '02.svg' })], {
      '01.svg': svg('кит'),
      '02.svg': undefined,
    });
    expect(bank.errors).toEqual([
      'grade2/01.svg: no en translation for picture text "кит"',
      'grade2/01.svg: no es translation for picture text "кит"',
      'grade2/01.svg: no fr translation for picture text "кит"',
      '2 #2: picture 02.svg not found',
    ]);
  });

  it('reports a dictionary entry for a picture without Russian text', () => {
    const bank = build(
      [raw({ image: '01.svg' })],
      { '01.svg': svg('7') },
      dict({ labels: ['grade2/01.svg'] }),
    );
    expect(bank.errors).toEqual([
      'svg_i18n.json: grade2/01.svg is not a picture with Russian text',
    ]);
  });
});
