import { useSyncExternalStore } from 'react';

import { builtinBank } from './builtin.generated';
import { AgeGroups } from './groups';
import type { GradeKey, Task, TaskSourceKind } from './types';

/**
 * The task bank: the built-in set plus any other source added later (paid downloads after v1).
 * A source gives tasks per age group. A task is known by its id across the whole bank — routes
 * and progress use it; the number is only what the child sees and orders the list, so two
 * sources may share numbers. A task whose id is already taken is left out.
 * Screens read the bank through `useTasks` and `useTask`, which re-render when a source is added.
 */
export type TaskSource = {
  kind: TaskSourceKind;
  tasks(grade: GradeKey): Task[];
};

const builtin: TaskSource = {
  kind: 'builtin',
  tasks(grade) {
    const { tasks, pictures } = builtinBank[grade];
    return tasks.map((t) => ({
      ...t,
      grade,
      source: 'builtin',
      image: t.image ? (pictures[t.image] ?? null) : null,
    }));
  },
};

const sources: TaskSource[] = [builtin];
const byGrade = new Map<GradeKey, Task[]>();
let byId: Map<string, Task> | null = null;
const listeners = new Set<() => void>();

export function addTaskSource(source: TaskSource) {
  sources.push(source);
  byGrade.clear();
  byId = null;
  listeners.forEach((l) => l());
}

/** Tasks of an age group by number; the same array until a source is added. */
export function tasksOf(grade: GradeKey): Task[] {
  let list = byGrade.get(grade);
  if (!list) {
    list = [];
    const ids = new Set(allIds(grade));
    for (const source of sources) {
      for (const task of source.tasks(grade)) {
        if (ids.has(task.id)) {
          console.warn(`task ${task.id} from ${source.kind} is already in the bank, left out`);
          continue;
        }
        ids.add(task.id);
        list.push(task);
      }
    }
    // stable: on equal numbers the earlier source goes first
    list.sort((a, b) => a.number - b.number);
    byGrade.set(grade, list);
  }
  return list;
}

/** Ids already taken by the age groups listed before `grade`, so ids stay unique bank-wide. */
function allIds(grade: GradeKey) {
  const index = AgeGroups.findIndex((g) => g.grade === grade);
  return AgeGroups.slice(0, index).flatMap((g) => tasksOf(g.grade).map((t) => t.id));
}

export function findTask(id: string): Task | undefined {
  if (!byId) byId = new Map(AgeGroups.flatMap((g) => tasksOf(g.grade).map((t) => [t.id, t])));
  return byId.get(id);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** `tasksOf` for a screen: re-renders it when a source is added. */
export function useTasks(grade: GradeKey): Task[] {
  return useSyncExternalStore(subscribe, () => tasksOf(grade));
}

/** `findTask` for a screen: re-renders it when a source is added. */
export function useTask(id: string): Task | undefined {
  return useSyncExternalStore(subscribe, () => findTask(id));
}
