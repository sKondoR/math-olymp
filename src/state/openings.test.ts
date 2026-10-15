import { describe, expect, it } from 'vitest';

import { afterReset, nextPortion, NO_OPENINGS, openUpTo, withAdPortion } from './openings';

describe('open tasks', () => {
  it('are the first 20 for free', () => {
    expect(openUpTo(NO_OPENINGS)).toBe(20);
  });

  it('grow by 20 with each ad', () => {
    expect(openUpTo(withAdPortion(withAdPortion(NO_OPENINGS)))).toBe(60);
  });

  it('are all of them once bought', () => {
    expect(openUpTo({ ads: 0, bought: true })).toBe(Infinity);
  });
});

describe('next portion', () => {
  it('follows the open tasks', () => {
    expect(nextPortion(NO_OPENINGS, 99)).toEqual({ from: 21, to: 40 });
    expect(nextPortion({ ads: 2, bought: false }, 99)).toEqual({ from: 61, to: 80 });
  });

  it('stops at the last task', () => {
    expect(nextPortion({ ads: 3, bought: false }, 99)).toEqual({ from: 81, to: 99 });
  });

  it('is none when every task is open', () => {
    expect(nextPortion({ ads: 4, bought: false }, 99)).toBeUndefined();
    expect(nextPortion({ ads: 0, bought: true }, 99)).toBeUndefined();
    expect(nextPortion(NO_OPENINGS, 15)).toBeUndefined();
  });
});

describe('reset', () => {
  it('closes what ads opened and keeps a purchase', () => {
    expect(afterReset({ ads: 3, bought: false })).toEqual(NO_OPENINGS);
    expect(afterReset({ ads: 2, bought: true })).toEqual({ ads: 0, bought: true });
  });
});
