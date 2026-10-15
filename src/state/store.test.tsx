// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { RewardedAds, RewardedOutcome } from '@/ads';
import { addTaskSource } from '@/data/bank';
import { testTask } from '@/data/test-tasks';
import type { GradeKey, Task } from '@/data/types';

import { memoryStorage } from './memory-storage';
import type { Storage } from './saved';
import { StoreProvider, useGradeSummary, useProgress, useSettings } from './store';
import { useAttempt } from './use-attempt';
import { usePortion } from './use-portion';

// The built-in bank pulls assets through Metro's require; the tests bring their own tasks
// through the same seam a downloaded source will use.
vi.mock('@/data/builtin.generated', async () => ({
  builtinBank: (await import('@/data/test-tasks')).testBuiltinBank(),
}));

const GRADE: GradeKey = '2';

const task = (number: number, grade: GradeKey = GRADE) =>
  testTask({
    id: `${grade === GRADE ? '' : grade}t${number}`,
    number,
    grade,
    source: 'downloaded',
  });

const TASKS = [task(1), task(2), task(3)];
/** an age group longer than the free portion */
const LONG: GradeKey = '3-4';
const LONG_TASKS = Array.from({ length: 30 }, (_, i) => task(i + 1, LONG));
addTaskSource({
  kind: 'downloaded',
  tasks: (g) => (g === GRADE ? TASKS : g === LONG ? LONG_TASKS : []),
});

/** Ads that end the way they are told to. */
const fakeAds = (outcome: RewardedOutcome | Error): RewardedAds => ({
  show: () => (outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome)),
});

/** Everything a screen reads, for one task, over the given storage. */
function renderStore(storage: Storage, on: Task = TASKS[0], ads = fakeAds('rewarded')) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProvider storage={storage} deviceLang="en" ads={ads}>
      {children}
    </StoreProvider>
  );
  return renderHook(
    () => ({
      attempt: useAttempt(on),
      summary: useGradeSummary(GRADE),
      long: useGradeSummary(LONG),
      portion: usePortion(LONG),
      /** another button offering a portion, elsewhere on the screen */
      otherPortion: usePortion(GRADE),
      progress: useProgress(),
      settings: useSettings(),
    }),
    { wrapper },
  );
}

/** Renders and waits until the saved state is read. */
async function open(storage: Storage, on?: Task, ads?: RewardedAds) {
  const hook = renderStore(storage, on, ads);
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
    expect(hook.result.current.summary.counts.ahead).toBe(3);
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
    expect(hook.result.current.summary.counts).toMatchObject({ solved: 0, failed: 0, ahead: 3 });
    expect(hook.result.current.attempt.done).toBeUndefined();
    expect(saved(`mo:progress:${GRADE}`)).toEqual({});
  });
});

describe('portions', () => {
  it('opens the next portion and saves that', async () => {
    const { storage, saved } = memoryStorage();
    const hook = await open(storage);
    expect(hook.result.current.long.portion).toMatchObject({ from: 21, to: 30 });
    act(() => hook.result.current.progress.openPortion(LONG));
    expect(hook.result.current.long.portion).toBeUndefined();
    expect(hook.result.current.long.stateOf(LONG_TASKS[29])).toBe('ahead');
    expect(saved(`mo:openings:${LONG}`)).toEqual({ ads: 1, bought: false });
  });

  it('closes them again on «Начать заново», with the results', async () => {
    const { storage, saved } = memoryStorage({
      [`mo:progress:${LONG}`]: { '3-4t25': { wrong: [], done: 'solved' } },
      [`mo:openings:${LONG}`]: { ads: 1, bought: false },
    });
    const hook = await open(storage);
    act(() => hook.result.current.progress.resetGrade(LONG));
    expect(hook.result.current.long.counts.solved).toBe(0);
    expect(hook.result.current.long.stateOf(LONG_TASKS[24])).toBe('locked');
    expect(saved(`mo:openings:${LONG}`)).toEqual({ ads: 0, bought: false });
  });
});

describe('watching an ad for a portion', () => {
  async function watch(outcome: RewardedOutcome | Error) {
    const { storage } = memoryStorage();
    const hook = await open(storage, undefined, fakeAds(outcome));
    let result: unknown;
    await act(async () => {
      result = await hook.result.current.portion.watch();
    });
    return { result, portion: hook.result.current.long.portion };
  }

  it('opens the portion when the ad is watched to the reward', async () => {
    expect(await watch('rewarded')).toEqual({ result: 'opened', portion: undefined });
  });

  it('opens it for free when there is no ad, or the SDK fails', async () => {
    expect((await watch('no-ad')).result).toBe('opened');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await watch(new Error('sdk'))).result).toBe('opened');
  });

  it('keeps it locked when offline or closed before the reward', async () => {
    expect(await watch('offline')).toMatchObject({
      result: 'offline',
      portion: { from: 21, to: 30 },
    });
    expect((await watch('dismissed')).result).toBe('dismissed');
  });

  it('shows one ad at a time in the whole app', async () => {
    let finish = (_: RewardedOutcome) => {};
    const slow: RewardedAds = { show: () => new Promise((r) => (finish = r)) };
    const hook = await open(memoryStorage().storage, undefined, slow);
    let first: Promise<unknown> = Promise.resolve();
    act(() => {
      first = hook.result.current.portion.watch();
    });
    expect(hook.result.current.portion.watching).toBe(true);
    expect(hook.result.current.otherPortion.watching).toBe(true);
    let again: unknown;
    let elsewhere: unknown;
    await act(async () => {
      again = await hook.result.current.portion.watch();
      elsewhere = await hook.result.current.otherPortion.watch();
    });
    expect(again).toBeNull();
    expect(elsewhere).toBeNull();
    await act(async () => {
      finish('rewarded');
      await first;
    });
    expect(hook.result.current.portion.watching).toBe(false);
    expect(hook.result.current.otherPortion.watching).toBe(false);
    expect(hook.result.current.long.portion).toBeUndefined();
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
