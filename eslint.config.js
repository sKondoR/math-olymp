// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // Build configs run in Node; expo's preset grants Node globals to metro.config.js only.
    files: ['*.config.js', 'build-store.js'],
    languageOptions: { globals: globals.node },
  },
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'frontend-ideas/*'],
  },
]);
