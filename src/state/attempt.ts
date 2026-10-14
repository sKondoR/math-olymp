import type { Task } from '@/data/types';

import type { TaskRecord } from './progress';

/**
 * The rules of solving one task: three tries, a wrong answer can't be given again, after the
 * right answer or the third miss the task closes. Screens draw what `viewAttempt` returns and
 * never read the record themselves.
 */

/** Attempts per task; after the third miss the task closes unsolved. */
export const TRIES = 3;

/** Digits a written answer takes on the keys. */
export const WRITTEN_DIGITS = 3;

/**
 * An option as the child sees it. `closed` — the task is done and this option was neither
 * missed nor right; `revealed` — the right option shown after the third miss.
 */
export type OptionStatus = 'open' | 'picked' | 'wrong' | 'right' | 'revealed' | 'closed';

/** The line under the answer while the task is open. */
export type AttemptNote = 'pick' | 'type' | 'missed' | 'repeated';

/** What one check did: `missed` leaves tries, `failed` was the last one. */
export type Outcome = 'solved' | 'missed' | 'failed';

export type AttemptView = {
  done: TaskRecord['done'];
  /** tries left */
  left: number;
  /** the answer is a number typed on digit keys, not an option */
  written: boolean;
  canCheck: boolean;
  note: AttemptNote | null;
  /** empty for a written answer */
  options: { key: string; status: OptionStatus }[];
  /** written answer: numbers already missed, while the task is open */
  misses: string[];
  /** written answer: the number in the box — the typed one, or the right one once done */
  shown: string | null;
};

export function viewAttempt(task: Task, record: TaskRecord, pick: string | null): AttemptView {
  const { done, wrong } = record;
  const written = !task.options;
  const repeated = !done && !!pick && wrong.includes(pick);

  let note: AttemptNote | null = null;
  if (!done) {
    if (repeated) note = 'repeated';
    else if (wrong.length) note = 'missed';
    else if (!pick) note = written ? 'type' : 'pick';
  }

  const statusOf = (key: string): OptionStatus => {
    if (wrong.includes(key)) return 'wrong';
    if (key === task.answer && done) return done === 'solved' ? 'right' : 'revealed';
    if (done) return 'closed';
    return key === pick ? 'picked' : 'open';
  };

  return {
    done,
    left: TRIES - wrong.length,
    written,
    canCheck: !done && !!pick && !repeated,
    note,
    options: (task.options ?? []).map((o) => ({ key: o.key, status: statusOf(o.key) })),
    misses: written && !done ? wrong : [],
    shown: done ? task.answer : pick,
  };
}

/** Applies one answer to a record; the caller stores the result. */
export function answer(record: TaskRecord, task: Task, value: string): TaskRecord {
  if (record.done || record.wrong.includes(value)) return record;
  if (value === task.answer) return { ...record, done: 'solved' };
  const wrong = [...record.wrong, value];
  return wrong.length >= TRIES ? { wrong, done: 'failed' } : { wrong };
}

/** What the answer that produced `after` did. */
export function outcomeOf(after: TaskRecord): Outcome {
  return after.done ?? 'missed';
}

/** A digit key or `del` applied to the typed number: no leading zeros, at most WRITTEN_DIGITS. */
export function typeKey(typed: string | null, key: string): string | null {
  const cur = typed ?? '';
  if (key === 'del') return cur.slice(0, -1) || null;
  return (cur + key).replace(/^0+(?=\d)/, '').slice(0, WRITTEN_DIGITS);
}
