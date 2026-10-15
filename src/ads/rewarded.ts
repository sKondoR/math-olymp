/**
 * Rewarded ads behind one interface: each store's build plugs in its own SDK (Yandex Mobile Ads
 * for RuStore, AdMob for Google Play — docs/adr/0001-ad-sdk-per-store.md); screens never know
 * which one is inside. The ads are always set up for children.
 */

/**
 * How showing one ad ended: `rewarded` — watched to the reward; `no-ad` — nothing to show
 * (no fill, or no SDK in this build); `offline` — no network; `dismissed` — closed before the
 * reward.
 */
export type RewardedOutcome = 'rewarded' | 'no-ad' | 'offline' | 'dismissed';

export type RewardedAds = {
  show(): Promise<RewardedOutcome>;
};

/**
 * Ads that need the network: with no network there is no ad to watch and the portion stays
 * locked. A failure or a missing ad while the network is gone is `offline` too, never the free
 * `no-ad`. Other failures go on to the caller.
 */
export function needingNetwork(ads: RewardedAds, online: () => Promise<boolean>): RewardedAds {
  return {
    async show() {
      if (!(await online())) return 'offline';
      try {
        const outcome = await ads.show();
        return outcome === 'no-ad' && !(await online()) ? 'offline' : outcome;
      } catch (e) {
        if (!(await online())) return 'offline';
        throw e;
      }
    },
  };
}

/** A build without an ad SDK: there is never an ad, so every portion opens for free. */
export const noAds: RewardedAds = {
  show: async () => 'no-ad',
};
