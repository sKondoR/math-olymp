import { ThemeNames, type ThemeName } from '@/constants/tokens';
import { AgeGroups } from '@/data/groups';
import { Langs, type GradeKey, type Lang } from '@/data/types';

import { NO_OPENINGS, type GradeOpenings } from './openings';
import type { GradeProgress, TaskRecord } from './progress';

/**
 * What the app keeps between launches, on the device only (no accounts in v1): settings, the
 * records of tasks per age group and what opens the tasks beyond the free portion. What comes
 * back is checked: a value saved by an older version or damaged on the way through a backup falls
 * back to the default instead of breaking a screen.
 */

export type Settings = {
  lang: Lang;
  theme: ThemeName;
  /** the age group opened last; the home screen's «Решать» card leads there */
  lastGrade: GradeKey | null;
};

export type AllProgress = Record<GradeKey, GradeProgress>;
export type AllOpenings = Record<GradeKey, GradeOpenings>;

/** Where the state lives: AsyncStorage on the device, a map in tests. */
export type Storage = {
  multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  setItem(key: string, value: string): Promise<void>;
};

const GRADES = AgeGroups.map((g) => g.grade);
const SETTINGS_KEY = 'mo:settings';
const progressKey = (grade: GradeKey) => `mo:progress:${grade}`;
const openingsKey = (grade: GradeKey) => `mo:openings:${grade}`;

/** Reads everything once at launch; unreadable storage gives the defaults. */
export async function loadState(storage: Storage, deviceLang: Lang) {
  const keys = [SETTINGS_KEY, ...GRADES.map(progressKey), ...GRADES.map(openingsKey)];
  const entries = new Map(
    await storage.multiGet(keys).catch((e) => {
      console.warn('load failed', e);
      return [];
    }),
  );
  const parse = (key: string): unknown => {
    try {
      return JSON.parse(entries.get(key) ?? 'null');
    } catch {
      return null;
    }
  };
  const settings = readSettings(parse(SETTINGS_KEY), deviceLang);
  const progress = Object.fromEntries(
    GRADES.map((grade) => [grade, readProgress(parse(progressKey(grade)))]),
  ) as AllProgress;
  const openings = Object.fromEntries(
    GRADES.map((grade) => [grade, readOpenings(parse(openingsKey(grade)))]),
  ) as AllOpenings;
  return { settings, progress, openings };
}

export function saveSettings(storage: Storage, settings: Settings) {
  save(storage, SETTINGS_KEY, settings);
}

export function saveProgress(storage: Storage, grade: GradeKey, progress: GradeProgress) {
  save(storage, progressKey(grade), progress);
}

export function saveOpenings(storage: Storage, grade: GradeKey, openings: GradeOpenings) {
  save(storage, openingsKey(grade), openings);
}

function save(storage: Storage, key: string, value: unknown) {
  storage.setItem(key, JSON.stringify(value)).catch((e) => console.warn('save failed', e));
}

function readSettings(raw: unknown, deviceLang: Lang): Settings {
  const s = isObject(raw) ? raw : {};
  return {
    lang: oneOf(Langs, s.lang) ? s.lang : deviceLang,
    theme: oneOf(ThemeNames, s.theme) ? s.theme : 'sea',
    lastGrade: oneOf(GRADES, s.lastGrade) ? s.lastGrade : null,
  };
}

/** Keeps the records that read right and drops the rest: such a task is simply untouched. */
function readProgress(raw: unknown): GradeProgress {
  if (!isObject(raw)) return {};
  const out: GradeProgress = {};
  for (const [id, value] of Object.entries(raw)) {
    const record = readRecord(value);
    if (record) out[id] = record;
  }
  return out;
}

function readRecord(raw: unknown): TaskRecord | null {
  if (!isObject(raw)) return null;
  const { wrong, done } = raw;
  if (!Array.isArray(wrong) || !wrong.every((w) => typeof w === 'string')) return null;
  if (done === undefined) return { wrong };
  return oneOf(['solved', 'failed'] as const, done) ? { wrong, done } : null;
}

function readOpenings(raw: unknown): GradeOpenings {
  if (!isObject(raw)) return NO_OPENINGS;
  const { ads, bought } = raw;
  return {
    ads: typeof ads === 'number' && Number.isInteger(ads) && ads > 0 ? ads : 0,
    bought: bought === true,
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function oneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return (list as readonly unknown[]).includes(v);
}
