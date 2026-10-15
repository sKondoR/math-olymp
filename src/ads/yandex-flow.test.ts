import { describe, expect, it } from 'vitest';

import { outcomeOfLoadError, playRewarded, type ShownAd } from './yandex-flow';

/** An ad that fires the given events once shown. */
function fakeAd(events: ('reward' | 'dismiss' | 'fail' | 'reject')[]) {
  const on: { reward?: () => void; dismiss?: () => void; fail?: () => void } = {};
  const ad: ShownAd = {
    set onRewarded(fn: () => void) {
      on.reward = fn;
    },
    set onAdDismissed(fn: () => void) {
      on.dismiss = fn;
    },
    set onAdFailedToShow(fn: () => void) {
      on.fail = fn;
    },
    show() {
      if (events.includes('reject')) return Promise.reject(new Error('no activity'));
      for (const e of events) on[e as 'reward' | 'dismiss' | 'fail']?.();
      return new Promise(() => {}); // the plugin never resolves it
    },
  };
  return ad;
}

const loadError = (code: number) =>
  new Error(JSON.stringify({ code, description: 'from the SDK' }));

describe('a failed load', () => {
  it('is offline on a network error', () => {
    expect(outcomeOfLoadError(loadError(3))).toBe('offline');
  });

  it('is no ad on no fill and on any other error', () => {
    expect(outcomeOfLoadError(loadError(4))).toBe('no-ad');
    expect(outcomeOfLoadError(loadError(2))).toBe('no-ad');
    expect(outcomeOfLoadError(new Error('Loader is not initialized'))).toBe('no-ad');
    expect(outcomeOfLoadError(undefined)).toBe('no-ad');
  });
});

describe('a shown ad', () => {
  it('is rewarded when the reward comes before it is closed', async () => {
    expect(await playRewarded(fakeAd(['reward', 'dismiss']))).toBe('rewarded');
  });

  it('is dismissed when closed without the reward', async () => {
    expect(await playRewarded(fakeAd(['dismiss']))).toBe('dismissed');
  });

  it('is no ad when it cannot be shown', async () => {
    expect(await playRewarded(fakeAd(['fail']))).toBe('no-ad');
    expect(await playRewarded(fakeAd(['reject']))).toBe('no-ad');
  });
});
