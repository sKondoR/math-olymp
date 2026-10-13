import type { Task } from '@/data/types';

/** Attempts per task; after the third miss the task closes unsolved. */
export const TRIES = 3;

/** What happened to one task. Absent — not touched yet. */
export type TaskRecord = {
  /** wrong answers in the order given; they can't be picked again */
  wrong: string[];
  done?: 'solved' | 'failed';
};

/** Records of one age group, by task id. */
export type GradeProgress = Record<string, TaskRecord>;

export type TaskState = 'solved' | 'failed' | 'next' | 'open';

const EMPTY: TaskRecord = { wrong: [] };

export function recordOf(progress: GradeProgress, task: Task): TaskRecord {
  return progress[task.id] ?? EMPTY;
}

export function isClosed(progress: GradeProgress, task: Task) {
  return !!progress[task.id]?.done;
}

/** The first task not closed yet, by number; undefined when every task is closed. */
export function nextTask(progress: GradeProgress, tasks: Task[]) {
  return tasks.find((t) => !isClosed(progress, t));
}

/** The next open task after `after` by number, then from the start. */
export function nextTaskAfter(progress: GradeProgress, tasks: Task[], after: Task) {
  return (
    tasks.find((t) => t.number > after.number && !isClosed(progress, t)) ??
    nextTask(progress, tasks)
  );
}

export function taskState(progress: GradeProgress, task: Task, next: Task | undefined): TaskState {
  const done = progress[task.id]?.done;
  if (done) return done;
  return task === next ? 'next' : 'open';
}

export type Counts = {
  solved: number;
  failed: number;
  open: number;
  total: number;
  /** the same split by difficulty 1–3 */
  byWeight: Record<'solved' | 'failed' | 'open', [number, number, number]>;
};

export function countProgress(progress: GradeProgress, tasks: Task[]): Counts {
  const c: Counts = {
    solved: 0,
    failed: 0,
    open: 0,
    total: tasks.length,
    byWeight: { solved: [0, 0, 0], failed: [0, 0, 0], open: [0, 0, 0] },
  };
  for (const t of tasks) {
    const k = progress[t.id]?.done ?? 'open';
    c[k]++;
    c.byWeight[k][t.weight - 1]++;
  }
  return c;
}

/** Applies one answer to a record; the caller stores the result. */
export function answer(record: TaskRecord, task: Task, value: string): TaskRecord {
  if (record.done || record.wrong.includes(value)) return record;
  if (value === task.answer) return { ...record, done: 'solved' };
  const wrong = [...record.wrong, value];
  return wrong.length >= TRIES ? { wrong, done: 'failed' } : { wrong };
}
