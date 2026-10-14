import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests cover pure modules (no React Native): they run in Node.
export default defineConfig({
  resolve: {
    alias: {
      '@/assets/': fileURLToPath(new URL('./assets/', import.meta.url)),
      '@/': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
