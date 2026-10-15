import { useSyncExternalStore } from 'react';

import type { RewardedOutcome } from '@/ads';
import type { GradeKey } from '@/data/types';

import { useAds, useProgress } from './store';

/** How watching for the next portion ended: it opened, or why it did not. */
export type PortionResult = 'opened' | Exclude<RewardedOutcome, OpeningOutcome>;

type OpeningOutcome = 'rewarded' | 'no-ad';

/**
 * Whether the portion opens. With no ad to show it opens for free: the child is not stuck, and
 * nothing is lost where no ad would have paid anyway.
 */
function opensPortion(outcome: RewardedOutcome): outcome is OpeningOutcome {
  return outcome === 'rewarded' || outcome === 'no-ad';
}

/**
 * Whether an ad is showing, one flag for the whole app: every button and dialog that offers a
 * portion sees it, so a second ad never starts over the first, whatever the screen holds.
 */
let showing = false;
const listeners = new Set<() => void>();

function setShowing(value: boolean) {
  showing = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Opening the next portion of an age group with a rewarded ad. Only one ad at a time in the app:
 * a tap anywhere while one is showing does nothing. The ads come from `StoreProvider`.
 */
export function usePortion(grade: GradeKey) {
  const { openPortion } = useProgress();
  const ads = useAds();
  /** an ad is showing — this one's or another button's */
  const watching = useSyncExternalStore(subscribe, () => showing);

  /** shows the ad; null when one is showing already */
  const watch = async (): Promise<PortionResult | null> => {
    if (showing) return null;
    setShowing(true);
    try {
      // an SDK that fails is an ad that is not there
      const outcome = await ads.show().catch((e): RewardedOutcome => {
        console.warn('rewarded ad failed', e);
        return 'no-ad';
      });
      if (!opensPortion(outcome)) return outcome;
      openPortion(grade);
      return 'opened';
    } finally {
      setShowing(false);
    }
  };

  return { watching, watch };
}
