import { builtinBank } from './builtin.generated';
import type { GradeKey, Task, TaskSourceKind } from './types';

/**
 * The task bank: the built-in set plus any other source added later (paid downloads after v1).
 * A source gives tasks per age group; tasks are ordered by number, ids must be unique.
 */
export type TaskSource = {
  kind: TaskSourceKind;
  tasks(grade: GradeKey): Task[];
};

const builtin: TaskSource = {
  kind: 'builtin',
  tasks(grade) {
    const { tasks, images } = builtinBank[grade];
    return tasks.map((t) => ({
      ...t,
      grade,
      source: 'builtin',
      image: t.image ? (images[t.image] ?? null) : null,
    }));
  },
};

const sources: TaskSource[] = [builtin];
const cache = new Map<GradeKey, Task[]>();

export function addTaskSource(source: TaskSource) {
  sources.push(source);
  cache.clear();
}

export function tasksOf(grade: GradeKey): Task[] {
  let list = cache.get(grade);
  if (!list) {
    list = sources.flatMap((s) => s.tasks(grade)).sort((a, b) => a.number - b.number);
    cache.set(grade, list);
  }
  return list;
}

export function findTask(grade: GradeKey, number: number): Task | undefined {
  return tasksOf(grade).find((t) => t.number === number);
}
