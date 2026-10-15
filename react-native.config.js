// Links each store's ad SDK only into that store's build (docs/adr/0001-ad-sdk-per-store.md):
// the Yandex SDK is not certified for Google Play's Families program and must stay out of any
// other build.
const { isRuStoreBuild } = require('./build-store');

module.exports = {
  dependencies: isRuStoreBuild ? {} : { 'yandex-mobile-ads': { platforms: { android: null } } },
};
