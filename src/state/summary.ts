import type { Task } from '@/data/types';

import { nextPortion, openUpTo, type GradeOpenings, type Portion } from './openings';
import { recordOf, type GradeProgress, type TaskRecord } from './progress';

/**
 * Summary of one age group: what is done, what is ahead, which task comes next and which tasks
 * the next ad opens. Screens read the summary and never combine the records of tasks themselves.
 */

/** `locked` — beyond the open portions; such a task waits for an ad (or a purchase). */
export type TaskState = 'solved' | 'failed' | 'next' | 'ahead' | 'locked';

type Split = 'solved' | 'failed' | 'ahead';

/** Counted over every task of the age group; `ahead` (not closed yet) includes the locked ones. */
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

/** The tasks the next ad opens, and the first of them. */
export type NextPortion = Portion & { first: Task };

export type GradeSummary = {
  /** by number */
  tasks: Task[];
  counts: Counts;
  /** the first open task not closed yet; undefined when every open task is closed */
  next: Task | undefined;
  /** undefined when no task is locked */
  portion: NextPortion | undefined;
  /** only the levels that have tasks, easy first */
  levels: Level[];
  recordOf(task: Task): TaskRecord;
  stateOf(task: Task): TaskState;
  /**
   * «Следующая задача»: the next open task not closed after `task` by number, then from the
   * start; undefined when every open task is closed
   */
  nextAfter(task: Task): Task | undefined;
};

/** `tasks` must be ordered by number. */
export function summarize(
  tasks: Task[],
  progress: GradeProgress,
  openings: GradeOpenings,
): GradeSummary {
  const doneOf = (t: Task) => progress[t.id]?.done;
  const upTo = openUpTo(openings);
  const toSolve = (t: Task) => t.number <= upTo && !doneOf(t);
  const next = tasks.find(toSolve);
  const portion = nextPortion(openings, tasks.at(-1)?.number ?? 0);

  const counts: Counts = {
    solved: 0,
    failed: 0,
    ahead: 0,
    total: tasks.length,
    byWeight: { solved: [0, 0, 0], failed: [0, 0, 0], ahead: [0, 0, 0] },
  };
  for (const t of tasks) {
    const k = doneOf(t) ?? 'ahead';
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
    // a portion ends at the last number, so it always has a first task
    portion: portion && { ...portion, first: tasks.find((t) => t.number >= portion.from)! },
    levels,
    recordOf: (task) => recordOf(progress, task),
    stateOf: (task) =>
      doneOf(task) ?? (task.number > upTo ? 'locked' : task.id === next?.id ? 'next' : 'ahead'),
    nextAfter: (after) => tasks.find((t) => t.number > after.number && toSolve(t)) ?? next,
  };
}
