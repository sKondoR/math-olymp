import type { RewardedOutcome } from './rewarded';

/**
 * How one Yandex rewarded ad ends, apart from the SDK itself so it can be tested without a
 * device. Codes are `com.yandex.mobile.ads.common.AdRequestError.Code` of SDK 8.5.0.
 */

const NETWORK_ERROR = 3;

/**
 * A failed load: the plugin rejects with the SDK's error as JSON in the message. No network is
 * `offline`; anything else (no fill, a bad ad unit, an SDK fault) is an ad that is not there.
 */
export function outcomeOfLoadError(error: unknown): RewardedOutcome {
  try {
    const { code } = JSON.parse((error as Error).message) as { code?: unknown };
    if (code === NETWORK_ERROR) return 'offline';
  } catch {
    // not the plugin's JSON: still no ad
  }
  return 'no-ad';
}

/** The part of the SDK's `RewardedAd` the flow uses. */
export type ShownAd = {
  set onRewarded(fn: () => void);
  set onAdDismissed(fn: () => void);
  set onAdFailedToShow(fn: () => void);
  show(): Promise<void>;
};

/**
 * Shows a loaded ad and waits until it is closed. The reward comes before the ad is dismissed;
 * the plugin's `show()` never resolves on success, so only its failure is listened to.
 */
export function playRewarded(ad: ShownAd): Promise<RewardedOutcome> {
  return new Promise((resolve) => {
    let rewarded = false;
    ad.onRewarded = () => {
      rewarded = true;
    };
    ad.onAdDismissed = () => resolve(rewarded ? 'rewarded' : 'dismissed');
    ad.onAdFailedToShow = () => resolve('no-ad');
    ad.show().catch(() => resolve('no-ad'));
  });
}
