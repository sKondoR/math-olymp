// The store a build is for (docs/adr/0001-ad-sdk-per-store.md): EXPO_PUBLIC_STORE from the shell,
// an EAS profile or a .env file. Read by the build configs; the app reads the same variable in
// src/ads/index.ts, where Expo inlines it into the bundle.
const { parseProjectEnv } = require('@expo/env');

const store =
  process.env.EXPO_PUBLIC_STORE ??
  parseProjectEnv(__dirname, { silent: true }).env.EXPO_PUBLIC_STORE;

/** RuStore: ads from the Yandex SDK. */
const isRuStoreBuild = store === 'rustore';

module.exports = { isRuStoreBuild };
