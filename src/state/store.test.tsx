// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { addTaskSource } from '@/data/bank';
import type { GradeKey, Task } from '@/data/types';

import { memoryStorage } from './memory-storage';
import type { Storage } from './saved';
import { StoreProvider, useGradeSummary, useProgress, useSettings } from './store';
import { useAttempt } from './use-attempt';

// The built-in bank pulls assets through Metro's require; the tests bring their own tasks
// through the same seam a downloaded source will use.
vi.mock('@/data/builtin.generated', () => ({
  builtinBank: Object.fromEntries(
    ['1', '2', '3-4', '5-6', '7-8', '9-10'].map((g) => [g, { tasks: [], pictures: {} }]),
  ),
}));

const GRADE: GradeKey = '2';

function task(number: number): Task {
  return {
    id: `t${number}`,
    number,
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
    grade: GRADE,
    source: 'downloaded',
  };
}

const TASKS = [task(1), task(2), task(3)];
addTaskSource({ kind: 'downloaded', tasks: (g) => (g === GRADE ? TASKS : []) });

/** Everything a screen reads, for one task, over the given storage. */
function renderStore(storage: Storage, on: Task = TASKS[0]) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProvider storage={storage} deviceLang="en">
      {children}
    </StoreProvider>
  );
  return renderHook(
    () => ({
      attempt: useAttempt(on),
      summary: useGradeSummary(GRADE),
      progress: useProgress(),
      settings: useSettings(),
    }),
    { wrapper },
  );
}

/** Renders and waits until the saved state is read. */
async function open(storage: Storage, on?: Task) {
  const hook = renderStore(storage, on);
  await waitFor(() => expect(hook.result.current).toBeTruthy());
  return hook;
}

/** Picks an option and checks it, as the task screen does. */
function give(hook: Awaited<ReturnType<typeof open>>, key: string) {
  act(() => hook.result.current.attempt.choose(key));
  let result: ReturnType<typeof hook.result.current.attempt.check> = null;
  act(() => {
    result = hook.result.current.attempt.check();
  });
  return result;
}

describe('StoreProvider', () => {
  it('renders nothing until the saved state is read', async () => {
    let release = () => {};
    const slow: Storage = {
      multiGet: (keys) =>
        new Promise((resolve) => {
          release = () => resolve(keys.map((k) => [k, null] as const));
        }),
      setItem: async () => {},
    };
    const hook = renderStore(slow);
    expect(hook.result.current).toBeNull();
    await act(async () => release());
    expect(hook.result.current.settings.settings.lang).toBe('en');
  });

  it('starts from what was saved', async () => {
    const { storage } = memoryStorage({
      'mo:settings': { lang: 'fr', theme: 'stone', lastGrade: GRADE },
      [`mo:progress:${GRADE}`]: { t1: { wrong: [], done: 'solved' } },
    });
    const hook = await open(storage);
    expect(hook.result.current.settings.settings).toEqual({
      lang: 'fr',
      theme: 'stone',
      lastGrade: GRADE,
    });
    expect(hook.result.current.summary.next?.number).toBe(2);
    expect(hook.result.current.attempt.done).toBe('solved');
  });
});

describe('solving a task', () => {
  it('saves a miss, and the task stays open', async () => {
    const { storage, saved } = memoryStorage();
    const hook = await open(storage);
    expect(give(hook, 'А')).toEqual({ outcome: 'missed', left: 2 });
    expect(saved(`mo:progress:${GRADE}`)).toEqual({ t1: { wrong: ['А'] } });
    expect(hook.result.current.attempt.left).toBe(2);
    expect(hook.result.current.summary.counts.open).toBe(3);
  });

  it('closes the task after the third miss and moves «next» on', async () => {
    const { storage, saved } = memoryStorage();
    const hook = await open(storage);
    give(hook, 'А');
    give(hook, 'Б');
    expect(give(hook, 'Г')).toEqual({ outcome: 'failed', left: 0 });
    expect(saved(`mo:progress:${GRADE}`)).toEqual({
      t1: { wrong: ['А', 'Б', 'Г'], done: 'failed' },
    });
    const { summary } = hook.result.current;
    expect(summary.counts.failed).toBe(1);
    expect(summary.next?.number).toBe(2);
    expect(summary.nextAfter(TASKS[0])?.number).toBe(2);
  });

  it('solves the task and keeps it solved after a restart', async () => {
    const { storage } = memoryStorage();
    const first = await open(storage);
    expect(give(first, 'В')).toEqual({ outcome: 'solved', left: 3 });
    first.unmount();

    const again = await open(storage);
    expect(again.result.current.attempt.done).toBe('solved');
    expect(again.result.current.summary.counts.solved).toBe(1);
  });

  it('does not check the same wrong answer twice', async () => {
    const { storage } = memoryStorage();
    const hook = await open(storage);
    give(hook, 'А');
    expect(give(hook, 'А')).toBeNull();
    expect(hook.result.current.attempt.left).toBe(2);
  });
});

describe('«Начать заново»', () => {
  it('opens every task of the age group again and saves that', async () => {
    const { storage, saved } = memoryStorage({
      [`mo:progress:${GRADE}`]: {
        t1: { wrong: [], done: 'solved' },
        t2: { wrong: ['А', 'Б', 'Г'], done: 'failed' },
      },
    });
    const hook = await open(storage);
    act(() => hook.result.current.progress.resetGrade(GRADE));
    expect(hook.result.current.summary.counts).toMatchObject({ solved: 0, failed: 0, open: 3 });
    expect(hook.result.current.attempt.done).toBeUndefined();
    expect(saved(`mo:progress:${GRADE}`)).toEqual({});
  });
});

describe('settings', () => {
  it('saves the language, the theme and the last age group', async () => {
    const { storage, saved } = memoryStorage();
    const hook = await open(storage);
    act(() => hook.result.current.settings.setLang('es'));
    act(() => hook.result.current.settings.setTheme('lilac'));
    act(() => hook.result.current.settings.openGrade('3-4'));
    expect(saved('mo:settings')).toEqual({ lang: 'es', theme: 'lilac', lastGrade: '3-4' });
  });
});
