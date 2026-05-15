import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['dist/**', 'node_modules/**'],
    environment: 'node',
    globals: true, // Enables the use of describe/it/expected without needing to import them in every file
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
