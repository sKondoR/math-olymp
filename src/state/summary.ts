import type { Task } from '@/data/types';

import { recordOf, type GradeProgress, type TaskRecord } from './progress';

/**
 * Summary of one age group: what is done, what is ahead and which task comes next. Screens read
 * the summary and never combine the records of tasks themselves.
 */

export type TaskState = 'solved' | 'failed' | 'next' | 'open';

type Split = 'solved' | 'failed' | 'open';

export type Counts = Record<Split, number> & {
  total: number;
  /** the same split by difficulty 1–3 */
  byWeight: Record<Split, [number, number, number]>;
};

/** Tasks of one difficulty: 1–3 stars, points 3/4/5 or, in the first grade, a level. */
export type Level = {
  weight: 1 | 2 | 3;
  /** null in the first grade, which has levels instead */
  points: number | null;
  tasks: Task[];
  solved: number;
  /**
   * Up to `size` tasks shown while the level is folded: from two tasks before the first open one,
   * so what was done stays in sight.
   */
  preview(size: number): Task[];
};

export type GradeSummary = {
  /** by number */
  tasks: Task[];
  counts: Counts;
  /** the first task not closed yet; undefined when every task is closed */
  next: Task | undefined;
  /** only the levels that have tasks, easy first */
  levels: Level[];
  recordOf(task: Task): TaskRecord;
  stateOf(task: Task): TaskState;
  /** «Следующая задача»: the next open task after `task` by number, then from the start */
  nextAfter(task: Task): Task | undefined;
};

/** `tasks` must be ordered by number. */
export function summarize(tasks: Task[], progress: GradeProgress): GradeSummary {
  const doneOf = (t: Task) => progress[t.id]?.done;
  const next = tasks.find((t) => !doneOf(t));

  const counts: Counts = {
    solved: 0,
    failed: 0,
    open: 0,
    total: tasks.length,
    byWeight: { solved: [0, 0, 0], failed: [0, 0, 0], open: [0, 0, 0] },
  };
  for (const t of tasks) {
    const k = doneOf(t) ?? 'open';
    counts[k]++;
    counts.byWeight[k][t.weight - 1]++;
  }

  const levels = ([1, 2, 3] as const)
    .map((weight): Level => {
      const own = tasks.filter((t) => t.weight === weight);
      return {
        weight,
        points: own[0]?.points ?? null,
        tasks: own,
        solved: counts.byWeight.solved[weight - 1],
        preview(size) {
          const front = own.findIndex((t) => !doneOf(t));
          const start = front > 2 ? Math.min(front - 2, Math.max(0, own.length - size)) : 0;
          return own.slice(start, start + size);
        },
      };
    })
    .filter((l) => l.tasks.length > 0);

  return {
    tasks,
    counts,
    next,
    levels,
    recordOf: (task) => recordOf(progress, task),
    stateOf: (task) => doneOf(task) ?? (task.id === next?.id ? 'next' : 'open'),
    nextAfter: (after) => tasks.find((t) => t.number > after.number && !doneOf(t)) ?? next,
  };
}
