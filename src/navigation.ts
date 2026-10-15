import { useRouter } from 'expo-router';

import type { GradeKey, Task } from '@/data/types';

/**
 * Moving between screens. Only this module knows the shape of the routes (an age group by its
 * grade key, a task by its id) and where a flow goes when it runs out of tasks.
 */
export const ageHref = (grade: GradeKey) =>
  ({ pathname: '/age/[grade]', params: { grade } }) as const;
const task = (t: Task) => ({ pathname: '/task/[id]', params: { id: t.id } }) as const;

export function useNav() {
  const router = useRouter();

  return {
    openAge: (grade: GradeKey) => router.push(ageHref(grade)),
    openTask: (t: Task) => router.push(task(t)),
    openResults: () => router.push('/results'),
    /** «Решать» on the home screen: the next task, or the age group when every task is closed */
    resume: (grade: GradeKey, next: Task | undefined) =>
      router.push(next ? task(next) : ageHref(grade)),
    /**
     * «Следующая задача»: the task screen swaps to `next`; with no task left it closes and the
     * age group shows that everything is done.
     */
    nextTask: (from: Task, next: Task | undefined) =>
      next ? router.replace(task(next)) : router.dismissTo(ageHref(from.grade)),
    /** «←» on the task screen: back where the child came from, or to the task's age group */
    leaveTask: (from: Task) =>
      router.canGoBack() ? router.back() : router.replace(ageHref(from.grade)),
    /** «←» on any other screen: back where the child came from, or the home screen */
    back: () => (router.canGoBack() ? router.back() : router.replace('/')),
  };
}
