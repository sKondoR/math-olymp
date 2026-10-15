import { describe, expect, it } from 'vitest';

import { testTask } from '@/data/test-tasks';
import type { Task } from '@/data/types';

import { NO_OPENINGS } from './openings';
import type { GradeProgress } from './progress';
import { summarize } from './summary';

/** Tasks numbered 1…n; `weights` gives the difficulty of each, by number. */
function bank(weights: (1 | 2 | 3)[]): Task[] {
  return weights.map((weight, i) =>
    testTask({ id: `t${i + 1}`, number: i + 1, points: weight + 2, weight }),
  );
}

/** Records: `s` — solved, `f` — failed, by task number. */
function closed(marks: Record<number, 's' | 'f'>): GradeProgress {
  return Object.fromEntries(
    Object.entries(marks).map(([n, m]) => [
      `t${n}`,
      m === 's' ? { wrong: [], done: 'solved' } : { wrong: ['2', '3', '4'], done: 'failed' },
    ]),
  );
}

const numbers = (tasks: Task[]) => tasks.map((t) => t.number);

/** Summary with only the free portion open. */
const summarizeFree = (tasks: Task[], progress: GradeProgress) =>
  summarize(tasks, progress, NO_OPENINGS);

describe('next task', () => {
  const tasks = bank([1, 1, 1, 1, 1]);

  it('is the first task when nothing is done', () => {
    expect(summarizeFree(tasks, {}).next?.number).toBe(1);
  });

  it('is the first task not closed, by number', () => {
    expect(summarizeFree(tasks, closed({ 1: 's', 2: 'f', 4: 's' })).next?.number).toBe(3);
  });

  it('is none when every task is closed', () => {
    expect(
      summarizeFree(tasks, closed({ 1: 's', 2: 'f', 3: 's', 4: 's', 5: 'f' })).next,
    ).toBeUndefined();
  });
});

describe('«Следующая задача» after a task', () => {
  const tasks = bank([1, 1, 1, 1, 1]);
  const at = (n: number) => tasks[n - 1];

  it('is the next open task by number, skipping closed ones', () => {
    const s = summarizeFree(tasks, closed({ 2: 's', 3: 'f', 4: 's' }));
    expect(s.nextAfter(at(2))?.number).toBe(5);
  });

  it('starts over from the beginning after the last task', () => {
    const s = summarizeFree(tasks, closed({ 3: 's', 4: 's', 5: 'f' }));
    expect(s.nextAfter(at(5))?.number).toBe(1);
  });

  it('is none when every task is closed', () => {
    const s = summarizeFree(tasks, closed({ 1: 's', 2: 'f', 3: 's', 4: 's', 5: 'f' }));
    expect(s.nextAfter(at(5))).toBeUndefined();
  });
});

describe('task state', () => {
  it('marks closed tasks, the next one and the open rest', () => {
    const tasks = bank([1, 1, 1, 1]);
    const s = summarizeFree(tasks, closed({ 1: 's', 2: 'f' }));
    expect(tasks.map(s.stateOf)).toEqual(['solved', 'failed', 'next', 'ahead']);
  });

  it('gives an empty record to an untouched task', () => {
    const tasks = bank([1]);
    expect(summarizeFree(tasks, {}).recordOf(tasks[0])).toEqual({ wrong: [] });
  });
});

describe('counts', () => {
  it('splits tasks into solved, failed and ahead, also by difficulty', () => {
    const tasks = bank([1, 1, 2, 2, 3]);
    const { counts } = summarizeFree(tasks, closed({ 1: 's', 3: 's', 4: 'f' }));
    expect(counts).toEqual({
      solved: 2,
      failed: 1,
      ahead: 2,
      total: 5,
      byWeight: { solved: [1, 1, 0], failed: [0, 1, 0], ahead: [1, 0, 1] },
    });
  });
});

describe('levels', () => {
  it('groups tasks by difficulty, easy first, and skips empty levels', () => {
    const s = summarizeFree(bank([3, 1, 3, 1]), closed({ 2: 's' }));
    expect(s.levels.map((l) => [l.weight, l.points, numbers(l.tasks), l.solved])).toEqual([
      [1, 3, [2, 4], 1],
      [3, 5, [1, 3], 0],
    ]);
  });

  describe('folded preview', () => {
    const tasks = bank(Array(10).fill(1));
    const preview = (marks: Record<number, 's' | 'f'>) =>
      numbers(summarizeFree(tasks, closed(marks)).levels[0].preview(4));

    it('starts at the beginning while the first open task is near it', () => {
      expect(preview({})).toEqual([1, 2, 3, 4]);
      expect(preview({ 1: 's', 2: 'f' })).toEqual([1, 2, 3, 4]);
    });

    it('moves on once three tasks are closed', () => {
      expect(preview({ 1: 's', 2: 's', 3: 'f' })).toEqual([2, 3, 4, 5]);
    });

    it('starts two tasks before the first open one', () => {
      expect(preview({ 1: 's', 2: 's', 3: 's', 4: 'f', 5: 's' })).toEqual([4, 5, 6, 7]);
    });

    it('stays full at the end of the level', () => {
      const marks = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [n, 's' as const]));
      expect(preview(marks)).toEqual([7, 8, 9, 10]);
    });

    it('starts at the beginning when every task is closed', () => {
      const marks = Object.fromEntries(numbers(tasks).map((n) => [n, 's' as const]));
      expect(preview(marks)).toEqual([1, 2, 3, 4]);
    });
  });
});

describe('locked tasks', () => {
  const tasks = bank(Array(45).fill(1));
  /** tasks 1…n solved */
  const all = (n: number): Record<number, 's'> =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, 's' as const]));

  it('are the tasks beyond the open portions', () => {
    const s = summarizeFree(tasks, {});
    expect(s.stateOf(tasks[19])).toBe('ahead');
    expect(s.stateOf(tasks[20])).toBe('locked');
    expect(summarize(tasks, {}, { ads: 1, bought: false }).stateOf(tasks[39])).toBe('ahead');
  });

  it('are skipped by the next task', () => {
    const s = summarizeFree(tasks, closed(all(19)));
    expect(s.next?.number).toBe(20);
    expect(s.nextAfter(tasks[19])?.number).toBe(20);
  });

  it('leave no next task once every open task is closed, and the portion shows', () => {
    const s = summarizeFree(tasks, closed(all(20)));
    expect(s.next).toBeUndefined();
    expect(s.nextAfter(tasks[19])).toBeUndefined();
    expect(s.portion).toMatchObject({ from: 21, to: 40 });
  });

  it('come back to an open task left behind before the portion', () => {
    const marks = all(20);
    delete marks[5];
    const s = summarizeFree(tasks, closed(marks));
    expect(s.nextAfter(tasks[19])?.number).toBe(5);
  });

  it('end with the last portion, shorter than 20', () => {
    expect(summarize(tasks, {}, { ads: 2, bought: false }).portion).toBeUndefined();
    expect(summarize(tasks, {}, { ads: 1, bought: false }).portion).toMatchObject({
      from: 41,
      to: 45,
    });
  });

  it('still count as ahead', () => {
    const { counts } = summarizeFree(tasks, closed(all(20)));
    expect(counts).toMatchObject({ solved: 20, ahead: 25, total: 45 });
  });
});
