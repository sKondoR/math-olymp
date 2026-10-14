import type { Task } from '@/data/types';

/** What happened to one task. Absent — not touched yet. */
export type TaskRecord = {
  /** wrong answers in the order given; they can't be picked again */
  wrong: string[];
  done?: 'solved' | 'failed';
};

/** Records of one age group, by task id. */
export type GradeProgress = Record<string, TaskRecord>;

const EMPTY: TaskRecord = { wrong: [] };

export function recordOf(progress: GradeProgress, task: Task): TaskRecord {
  return progress[task.id] ?? EMPTY;
}
