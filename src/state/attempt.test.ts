import { describe, expect, it } from 'vitest';

import { testTask } from '@/data/test-tasks';
import type { Task } from '@/data/types';

import { TRIES, answer, outcomeOf, typeKey, viewAttempt } from './attempt';
import type { TaskRecord } from './progress';

const task = (over: Partial<Task> = {}) =>
  testTask({ text: { ru: 'Условие' }, solution: { ru: 'Разбор' }, ...over });

const written = task({ options: null, answer: '12', points: null, grade: '1' });
const fresh: TaskRecord = { wrong: [] };

/** Gives the answers one after another, as the child would. */
function play(t: Task, ...values: string[]) {
  return values.reduce((r, v) => answer(r, t, v), fresh);
}

const statuses = (t: Task, r: TaskRecord, pick: string | null = null) =>
  viewAttempt(t, r, pick).options.map((o) => o.status);

describe('answer', () => {
  it('solves the task with the right answer', () => {
    const r = play(task(), 'В');
    expect(r.done).toBe('solved');
    expect(outcomeOf(r)).toBe('solved');
  });

  it('keeps the task open after a miss', () => {
    const r = play(task(), 'А');
    expect(r).toEqual({ wrong: ['А'] });
    expect(outcomeOf(r)).toBe('missed');
  });

  it(`closes the task unsolved after ${TRIES} misses`, () => {
    const r = play(task(), 'А', 'Б', 'Г');
    expect(r).toEqual({ wrong: ['А', 'Б', 'Г'], done: 'failed' });
    expect(outcomeOf(r)).toBe('failed');
  });

  it('solves after misses while tries are left', () => {
    expect(play(task(), 'А', 'Б', 'В')).toEqual({ wrong: ['А', 'Б'], done: 'solved' });
  });

  it('ignores a wrong answer given again', () => {
    const r = play(task(), 'А');
    expect(answer(r, task(), 'А')).toBe(r);
  });

  it('ignores any answer once the task is closed', () => {
    const solved = play(task(), 'В');
    expect(answer(solved, task(), 'А')).toBe(solved);
    const failed = play(task(), 'А', 'Б', 'Г');
    expect(answer(failed, task(), 'В')).toBe(failed);
  });
});

describe('viewAttempt: options', () => {
  it('asks to pick and does not allow a check before a pick', () => {
    const v = viewAttempt(task(), fresh, null);
    expect(v).toMatchObject({ note: 'pick', canCheck: false, left: TRIES, written: false });
    expect(statuses(task(), fresh)).toEqual(['open', 'open', 'open', 'open']);
  });

  it('marks the picked option and allows the check', () => {
    const v = viewAttempt(task(), fresh, 'Б');
    expect(v).toMatchObject({ note: null, canCheck: true });
    expect(statuses(task(), fresh, 'Б')).toEqual(['open', 'picked', 'open', 'open']);
  });

  it('crosses out a missed option and counts the tries left', () => {
    const r = play(task(), 'А');
    expect(viewAttempt(task(), r, null)).toMatchObject({ note: 'missed', left: TRIES - 1 });
    expect(statuses(task(), r)).toEqual(['wrong', 'open', 'open', 'open']);
  });

  it('does not allow checking a missed answer again', () => {
    const r = play(task(), 'А');
    expect(viewAttempt(task(), r, 'А')).toMatchObject({ note: 'repeated', canCheck: false });
  });

  it('shows the right option and closes the others when solved', () => {
    const r = play(task(), 'А', 'В');
    const v = viewAttempt(task(), r, null);
    expect(v).toMatchObject({ done: 'solved', note: null, canCheck: false });
    expect(statuses(task(), r)).toEqual(['wrong', 'closed', 'right', 'closed']);
  });

  it('reveals the right option after the last miss', () => {
    const r = play(task(), 'А', 'Б', 'Г');
    expect(viewAttempt(task(), r, null)).toMatchObject({ done: 'failed', left: 0, note: null });
    expect(statuses(task(), r)).toEqual(['wrong', 'wrong', 'revealed', 'wrong']);
  });
});

describe('viewAttempt: written answer', () => {
  it('asks to type a number and has no options', () => {
    const v = viewAttempt(written, fresh, null);
    expect(v).toMatchObject({ written: true, note: 'type', options: [], shown: null });
  });

  it('shows the typed number and the numbers already missed', () => {
    const r = play(written, '5');
    expect(viewAttempt(written, r, '7')).toMatchObject({
      shown: '7',
      misses: ['5'],
      canCheck: true,
    });
  });

  it('shows the right number and no misses once closed', () => {
    const r = play(written, '5', '6', '7');
    expect(viewAttempt(written, r, null)).toMatchObject({
      done: 'failed',
      shown: '12',
      misses: [],
    });
  });
});

describe('typeKey', () => {
  it('appends digits', () => {
    expect(['1', '2'].reduce<string | null>(typeKey, null)).toBe('12');
  });

  it('drops leading zeros but keeps a lone zero', () => {
    expect(typeKey(null, '0')).toBe('0');
    expect(typeKey('0', '7')).toBe('7');
  });

  it('takes at most three digits', () => {
    expect(typeKey('123', '4')).toBe('123');
  });

  it('erases the last digit, and the empty number is null', () => {
    expect(typeKey('12', 'del')).toBe('1');
    expect(typeKey('1', 'del')).toBeNull();
    expect(typeKey(null, 'del')).toBeNull();
  });
});
