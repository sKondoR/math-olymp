import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests cover pure modules (no React Native) and the task bank build: they run in Node.
export default defineConfig({
  resolve: {
    // the same paths as tsconfig.json; the assets alias goes first, it is the narrower one
    alias: [
      { find: /^@\/assets\//, replacement: fileURLToPath(new URL('./assets/', import.meta.url)) },
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
  },
});
