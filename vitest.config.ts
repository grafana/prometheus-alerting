import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest-setup.ts'],
    include: [
      'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      'src/**/*.{spec,test}.{js,jsx,ts,tsx}',
      'packages/**/*.{spec,test}.{js,jsx,ts,tsx}',
    ],
    exclude: [
      'tests/**/*.spec.ts', // Exclude Playwright E2E tests
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/'], // Playwright E2E tests
    },
  },
  ssr: {
    // Don't externalize these packages in SSR context (test environment)
    // This handles ESM-only packages that need to be transformed by Vitest
    noExternal: [
      /@grafana\/.*/,
      /rxjs/,
    ],
  },
});
