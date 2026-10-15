import { describe, expect, it } from 'vitest';

import { needingNetwork, type RewardedAds, type RewardedOutcome } from './rewarded';

/** `online` answers in turn: before the ad, then after it */
function ads(outcome: RewardedOutcome | Error, ...online: boolean[]) {
  let shown = 0;
  const inner: RewardedAds = {
    show: () => {
      shown++;
      return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
    },
  };
  const wrapped = needingNetwork(inner, async () => online.shift() ?? true);
  return { show: () => wrapped.show(), shown: () => shown };
}

describe('needingNetwork', () => {
  it('shows no ad without the network', async () => {
    const a = ads('rewarded', false);
    expect(await a.show()).toBe('offline');
    expect(a.shown()).toBe(0);
  });

  it('passes the outcome on when online', async () => {
    expect(await ads('rewarded', true).show()).toBe('rewarded');
    expect(await ads('dismissed', true).show()).toBe('dismissed');
    expect(await ads('no-ad', true, true).show()).toBe('no-ad');
  });

  it('turns a missing ad into offline when the network dropped', async () => {
    expect(await ads('no-ad', true, false).show()).toBe('offline');
  });

  it('turns a failure into offline when the network dropped, else passes it on', async () => {
    expect(await ads(new Error('sdk'), true, false).show()).toBe('offline');
    await expect(ads(new Error('sdk'), true, true).show()).rejects.toThrow('sdk');
  });
});
