import type { ImageSourcePropType } from 'react-native';

export const Langs = ['ru', 'en', 'es', 'fr'] as const;
export type Lang = (typeof Langs)[number];

/** Content in several languages; `ru` is the base and the fallback, so it is required. */
export type Localized<T = string> = { ru: T } & Partial<Record<Exclude<Lang, 'ru'>, T>>;

/** Data key of an age group: the school grade the tasks were written for. */
export type GradeKey = '1' | '2' | '3-4' | '5-6' | '7-8' | '9-10';

export type TaskType = 'mixed' | 'time' | 'calendar' | 'first-examples';

/** Where a task came from: bundled with the app or downloaded later (after v1). */
export type TaskSourceKind = 'builtin' | 'downloaded';

export type TaskOption = { key: string; text: Localized };

/** A task as stored in assets/tasks/<grade>/tasks.json (written by scripts/sync-tasks.mjs). */
export type StoredTask = {
  id: string;
  number: number;
  /** 3/4/5 points; null in the first grade, which has levels instead */
  points: number | null;
  /** difficulty 1–3 (points 3/4/5 or level easy/medium/hard) */
  weight: 1 | 2 | 3;
  type: TaskType;
  topics: string[];
  text: Localized;
  /** null — the answer is a number typed on digit keys */
  options: TaskOption[] | null;
  /** option key (А–Д) or the written number */
  answer: string;
  solution: Localized;
  /** a hint before the answer; none in v1, room for later */
  hint?: Localized;
  image: string | null;
};

export type Task = Omit<StoredTask, 'image'> & {
  grade: GradeKey;
  source: TaskSourceKind;
  /** a picture with text has a copy per language; the others are shared */
  image: Localized<ImageSourcePropType> | null;
};

export type BuiltinBank = Record<
  GradeKey,
  /** pictures by the file name in `StoredTask.image`, each with its translated copies */
  { tasks: StoredTask[]; pictures: Record<string, Localized<ImageSourcePropType>> }
>;
