import { getNetworkStateAsync } from 'expo-network';

import { needingNetwork, noAds, type RewardedAds } from './rewarded';
import { yandexAds } from './yandex';

export { type RewardedAds, type RewardedOutcome } from './rewarded';

/** Online unless the device says it is not: an unknown state lets the ad try. */
const online = () =>
  getNetworkStateAsync().then(
    (s) => s.isConnected !== false && s.isInternetReachable !== false,
    () => true,
  );

/**
 * The ads of this build, by its store (`EXPO_PUBLIC_STORE`, docs/adr/0001-ad-sdk-per-store.md):
 * Yandex for RuStore. Google Play's AdMob comes at stage 2; until then, and in a build with no
 * store set, there are no ads and every portion opens for free. `react-native.config.js` links
 * the Yandex SDK only into the RuStore build. In every build a portion needs the network.
 */
export const rewardedAds: RewardedAds = needingNetwork(
  process.env.EXPO_PUBLIC_STORE === 'rustore'
    ? yandexAds(process.env.EXPO_PUBLIC_YANDEX_REWARDED_ID)
    : noAds,
  online,
);
