// app.json holds the config; this only refuses a store release that would ship without real ads.
// A RuStore production build needs the Yandex ad unit: without it every portion opens for free.
const { isRuStoreBuild } = require('./build-store');

module.exports = ({ config }) => {
  if (
    process.env.EAS_BUILD_PROFILE === 'production' &&
    isRuStoreBuild &&
    !process.env.EXPO_PUBLIC_YANDEX_REWARDED_ID
  ) {
    throw new Error('EXPO_PUBLIC_YANDEX_REWARDED_ID is required for a RuStore production build');
  }
  return config;
};
