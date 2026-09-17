import { defineConfig } from '@rstest/core';

export default defineConfig({
  globals: true,
  testEnvironment: 'happy-dom',
  setupFiles: ['./rstest-setup.ts'],
  include: [
    'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    'src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    'packages/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  exclude: ['tests/**/*.spec.ts', '**/node_modules/**', '**/.git/**'],
  coverage: {
    provider: 'v8',
    reporters: ['text-summary', 'json-summary', 'json', 'html', 'lcov'],
    reportsDirectory: './coverage',
    include: ['src/**/*.{js,jsx,ts,tsx}', 'packages/**/*.{js,jsx,ts,tsx}'],
    exclude: [
      'src/module.tsx',
      'src/types/**',
      'src/locales/**',
      'src/**/*.stories.{js,jsx,ts,tsx}',
      'src/**/*.constants.ts',
      '**/node_modules/**',
      '**/.git/**',
    ],
  },
});
