import type { BuiltinBank, GradeKey, Localized, StoredTask, Task } from './types';

/**
 * Tasks for tests: one place that knows every required field, so a new field of `Task` is added
 * here once. By default — task 1 of the second grade, options А–Г, the answer В.
 */
export function testStoredTask(over: Partial<StoredTask> = {}): StoredTask {
  return {
    id: 't1',
    number: 1,
    points: 3,
    weight: 1,
    type: 'mixed',
    topics: ['логика'],
    family: 'logic',
    text: { ru: '' },
    options: ['А', 'Б', 'В', 'Г'].map((key) => ({ key, text: { ru: key } })),
    answer: 'В',
    solution: { ru: '' },
    image: null,
    ...over,
  };
}

export function testTask(over: Partial<Task> = {}): Task {
  return { ...testStoredTask(), grade: '2', source: 'builtin', image: null, ...over };
}

const GRADES: GradeKey[] = ['1', '2', '3-4', '5-6', '7-8', '9-10'];

/** Pictures by file name; in tests any value stands in for the asset Metro would load. */
type TestGrade = { tasks: StoredTask[]; pictures: Record<string, Localized<unknown>> };

/**
 * A built-in bank for `vi.mock('@/data/builtin.generated')`: the generated one pulls assets
 * through Metro's require. Age groups not given are empty.
 */
export function testBuiltinBank(given: Partial<Record<GradeKey, TestGrade>> = {}): BuiltinBank {
  return Object.fromEntries(
    GRADES.map((g) => [g, given[g] ?? { tasks: [], pictures: {} }]),
  ) as BuiltinBank;
}
