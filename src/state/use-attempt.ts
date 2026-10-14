import { useState } from 'react';

import type { Task } from '@/data/types';

import { TRIES, outcomeOf, typeKey, viewAttempt, type Outcome } from './attempt';
import { recordOf } from './progress';
import { useProgress } from './store';

/**
 * One task being solved: the stored record, the answer picked but not checked yet, and the
 * shake of the last miss. A new task needs a new hook (key the screen by task id).
 */
export function useAttempt(task: Task) {
  const store = useProgress();
  const record = recordOf(store.progress[task.grade], task);
  const [pick, setPick] = useState<string | null>(null);
  const [shake, setShake] = useState<{ key: string; token: number } | null>(null);
  const view = viewAttempt(task, record, pick);

  return {
    ...view,
    /** the missed answer shakes once per miss; token 0 — never */
    shake,
    choose: (key: string) => setPick(key),
    type: (key: string) => setPick(typeKey(pick, key)),
    /** checks the picked answer; null when there is nothing to check */
    check(): { outcome: Outcome; left: number } | null {
      if (!view.canCheck || !pick) return null;
      const after = store.answer(task, pick);
      const outcome = outcomeOf(after);
      if (outcome !== 'solved') setShake({ key: pick, token: (shake?.token ?? 0) + 1 });
      setPick(null);
      return { outcome, left: TRIES - after.wrong.length };
    },
  };
}
