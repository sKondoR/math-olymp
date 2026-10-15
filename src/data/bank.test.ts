// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as sharedBank from './bank';
import { testTask } from './test-tasks';
import type { GradeKey, Task } from './types';

// A small built-in set instead of the generated one, which pulls assets through Metro's require.
vi.mock('./builtin.generated', async () => {
  const { testBuiltinBank, testStoredTask } = await import('./test-tasks');
  const stored = (id: string, number: number) =>
    testStoredTask({ id, number, image: number === 1 ? '01.svg' : null });
  return {
    builtinBank: testBuiltinBank({
      '1': { tasks: [stored('a1', 1)], pictures: { '01.svg': { ru: 'a1.svg' } } },
      '2': { tasks: [stored('b2', 2), stored('b1', 1)], pictures: { '01.svg': { ru: 'b1.svg' } } },
    }),
  };
});

const task = (id: string, number: number, grade: GradeKey = '2') =>
  testTask({ id, number, grade, source: 'downloaded' });

const downloaded = (byGrade: Partial<Record<GradeKey, Task[]>>) => ({
  kind: 'downloaded' as const,
  tasks: (g: GradeKey) => byGrade[g] ?? [],
});

/** A bank with only the built-in source: the module keeps its sources, so each test reloads it. */
async function freshBank() {
  vi.resetModules();
  return import('./bank');
}

const ids = (tasks: Task[]) => tasks.map((t) => t.id);

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('built-in source', () => {
  it('gives tasks by number with the age group, the source and the picture', async () => {
    const { tasksOf } = await freshBank();
    const tasks = tasksOf('2');
    expect(ids(tasks)).toEqual(['b1', 'b2']);
    expect(tasks[0]).toMatchObject({ grade: '2', source: 'builtin', image: { ru: 'b1.svg' } });
    expect(tasks[1].image).toBeNull();
  });

  it('gives the same list until a source is added', async () => {
    const { tasksOf, addTaskSource } = await freshBank();
    const before = tasksOf('2');
    expect(tasksOf('2')).toBe(before);
    addTaskSource(downloaded({}));
    expect(tasksOf('2')).not.toBe(before);
  });
});

describe('another source', () => {
  it('merges by number; on the same number the built-in task goes first', async () => {
    const { tasksOf, addTaskSource } = await freshBank();
    addTaskSource(downloaded({ '2': [task('d2', 2), task('d0', 0)] }));
    expect(ids(tasksOf('2'))).toEqual(['d0', 'b1', 'b2', 'd2']);
  });

  it('leaves out a task whose id is taken, in the same or another age group', async () => {
    const { tasksOf, addTaskSource } = await freshBank();
    addTaskSource(downloaded({ '2': [task('b1', 5), task('a1', 6), task('d1', 7)] }));
    expect(ids(tasksOf('2'))).toEqual(['b1', 'b2', 'd1']);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe('findTask', () => {
  it('finds a task by id in any age group', async () => {
    const { findTask, addTaskSource } = await freshBank();
    addTaskSource(downloaded({ '5-6': [task('d9', 9, '5-6')] }));
    expect(findTask('a1')?.grade).toBe('1');
    expect(findTask('d9')?.grade).toBe('5-6');
    expect(findTask('nope')).toBeUndefined();
  });
});

describe('screens', () => {
  it('re-render when a source is added', () => {
    const { result } = renderHook(() => ({
      tasks: sharedBank.useTasks('7-8'),
      task: sharedBank.useTask('late'),
    }));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.task).toBeUndefined();

    act(() => sharedBank.addTaskSource(downloaded({ '7-8': [task('late', 1, '7-8')] })));
    expect(ids(result.current.tasks)).toEqual(['late']);
    expect(result.current.task?.id).toBe('late');
  });
});
