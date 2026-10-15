import { NativeModules } from 'react-native';
import { MobileAds, RewardedAdLoader } from 'yandex-mobile-ads';

import { noAds, type RewardedAds } from './rewarded';
import { outcomeOfLoadError, playRewarded } from './yandex-flow';

/**
 * Yandex Mobile Ads, the RuStore build's SDK. The ad unit comes from
 * `EXPO_PUBLIC_YANDEX_REWARDED_ID`; without it a dev build shows Yandex's demo ads. The SDK
 * starts on the first ad, marked as serving children.
 */
const DEMO_UNIT = 'demo-rewarded-yandex';

let started: Promise<RewardedAdLoader> | undefined;

/** Sets the SDK up once: children's ads only, then the loader that every ad goes through. */
function start() {
  started ??= (async () => {
    MobileAds.setAgeRestrictedUser(true);
    await MobileAds.initialize();
    return RewardedAdLoader.create();
  })().catch((e: unknown) => {
    started = undefined; // try again with the next ad
    throw e;
  });
  return started;
}

export function yandexAds(unitId: string | undefined): RewardedAds {
  // a binary built without the SDK (Expo Go, a build without EXPO_PUBLIC_STORE=rustore) runs this
  // JS too: there the SDK's native modules are null and every call would throw
  if (!NativeModules.YandexRewardedAdModule) {
    console.warn('Yandex SDK is not linked into this build: no ads, portions open for free');
    return noAds;
  }
  const adUnitId = unitId || (__DEV__ ? DEMO_UNIT : undefined);
  if (!adUnitId) console.warn('EXPO_PUBLIC_YANDEX_REWARDED_ID is not set: no ads');

  return {
    async show() {
      if (!adUnitId) return 'no-ad';
      const loader = await start();
      const ad = await loader.loadAd({ adUnitId }).catch((e: unknown) => {
        console.warn('rewarded ad did not load', e);
        return outcomeOfLoadError(e);
      });
      return typeof ad === 'string' ? ad : playRewarded(ad);
    },
  };
}
