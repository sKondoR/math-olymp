import type { ImageSourcePropType } from 'react-native';

import { builtinBank } from './builtin.generated';
import { Langs, type GradeKey, type Localized, type Task, type TaskSourceKind } from './types';

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
      image: t.image ? pictureOf(images, t.image) : null,
    }));
  },
};

/** The picture and its translated copies (`en/NN.svg`…), when the picture has text. */
function pictureOf(images: Record<string, ImageSourcePropType>, file: string) {
  const ru = images[file];
  if (!ru) return null;
  const picture: Localized<ImageSourcePropType> = { ru };
  for (const lang of Langs) {
    if (lang !== 'ru' && images[`${lang}/${file}`]) picture[lang] = images[`${lang}/${file}`];
  }
  return picture;
}

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
