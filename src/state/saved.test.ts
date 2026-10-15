import { afterEach, describe, expect, it, vi } from 'vitest';

import { memoryStorage as memory } from './memory-storage';
import { loadState, saveOpenings, saveProgress, saveSettings, type Storage } from './saved';

const broken: Storage = {
  multiGet: () => Promise.reject(new Error('disk')),
  setItem: () => Promise.reject(new Error('disk')),
};

afterEach(() => vi.restoreAllMocks());

describe('loadState', () => {
  it('gives the defaults on the first launch', async () => {
    const { settings, progress } = await loadState(memory().storage, 'en');
    expect(settings).toEqual({ lang: 'en', theme: 'sea', lastGrade: null });
    expect(Object.keys(progress)).toEqual(['1', '2', '3-4', '5-6', '7-8', '9-10']);
    expect(Object.values(progress).every((p) => Object.keys(p).length === 0)).toBe(true);
  });

  it('opens only the free portion on the first launch', async () => {
    const { openings } = await loadState(memory().storage, 'en');
    expect(Object.values(openings).every((a) => a.ads === 0 && !a.bought)).toBe(true);
  });

  it('reads what opens the tasks, and drops what makes no sense', async () => {
    const { storage } = memory({
      'mo:openings:2': { ads: 2, bought: false },
      'mo:openings:3-4': { ads: -1, bought: 'yes' },
      'mo:openings:5-6': { ads: 1.5, bought: true },
      'mo:openings:7-8': '[3]',
    });
    const { openings } = await loadState(storage, 'ru');
    expect(openings['2']).toEqual({ ads: 2, bought: false });
    expect(openings['3-4']).toEqual({ ads: 0, bought: false });
    expect(openings['5-6']).toEqual({ ads: 0, bought: true });
    expect(openings['7-8']).toEqual({ ads: 0, bought: false });
  });

  it('reads what was saved', async () => {
    const { storage } = memory();
    saveSettings(storage, { lang: 'fr', theme: 'lilac', lastGrade: '3-4' });
    saveProgress(storage, '3-4', { a: { wrong: ['Б'] }, b: { wrong: [], done: 'solved' } });
    const { settings, progress } = await loadState(storage, 'ru');
    expect(settings).toEqual({ lang: 'fr', theme: 'lilac', lastGrade: '3-4' });
    expect(progress['3-4']).toEqual({ a: { wrong: ['Б'] }, b: { wrong: [], done: 'solved' } });
    expect(progress['1']).toEqual({});
  });

  it('replaces unknown settings with the defaults one by one', async () => {
    const { storage } = memory({
      'mo:settings': { lang: 'de', theme: 'stone', lastGrade: '11' },
    });
    const { settings } = await loadState(storage, 'es');
    expect(settings).toEqual({ lang: 'es', theme: 'stone', lastGrade: null });
  });

  it('survives values that are not JSON or not objects', async () => {
    const { storage } = memory({
      'mo:settings': '{oops',
      'mo:progress:1': '[1, 2]',
      'mo:progress:2': '"text"',
    });
    const { settings, progress } = await loadState(storage, 'ru');
    expect(settings).toEqual({ lang: 'ru', theme: 'sea', lastGrade: null });
    expect(progress['1']).toEqual({});
    expect(progress['2']).toEqual({});
  });

  it('drops damaged records and keeps the good ones', async () => {
    const { storage } = memory({
      'mo:progress:1': {
        good: { wrong: ['А'], done: 'failed' },
        noWrong: { done: 'solved' },
        wrongNotList: { wrong: 'А' },
        wrongNotText: { wrong: [1] },
        unknownDone: { wrong: [], done: 'maybe' },
        notRecord: 5,
      },
    });
    const { progress } = await loadState(storage, 'ru');
    expect(progress['1']).toEqual({ good: { wrong: ['А'], done: 'failed' } });
  });

  it('gives the defaults when the storage cannot be read', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { settings, progress } = await loadState(broken, 'ru');
    expect(settings.theme).toBe('sea');
    expect(progress['9-10']).toEqual({});
    expect(console.warn).toHaveBeenCalledOnce();
  });
});

describe('save', () => {
  it('keeps each age group under its own key', () => {
    const { storage, data } = memory();
    saveProgress(storage, '5-6', {});
    saveOpenings(storage, '5-6', { ads: 1, bought: false });
    saveSettings(storage, { lang: 'ru', theme: 'sea', lastGrade: null });
    expect([...data.keys()]).toEqual(['mo:progress:5-6', 'mo:openings:5-6', 'mo:settings']);
  });

  it('only warns when the storage fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    saveSettings(broken, { lang: 'ru', theme: 'sea', lastGrade: null });
    await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());
  });
});
