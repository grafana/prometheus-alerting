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
      '**/node_modules/**',
      '**/.git/**',
    ],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}', 'packages/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/module.tsx', // Plugin entry point
        'src/types/**', // Type definitions
        'src/locales/**', // Translation files
        'src/**/*.stories.{js,jsx,ts,tsx}', // Storybook files
        'src/**/*.constants.ts', // Constants files
        '**/node_modules/**',
        '**/.git/**',
      ],
    },
  },
  ssr: {
    // Don't externalize these packages in SSR context (test environment)
    // This handles ESM-only packages that need to be transformed by Vitest
    noExternal: [/@grafana\/.*/, /rxjs/],
  },
});
