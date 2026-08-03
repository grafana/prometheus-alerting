import { defineConfig } from 'eslint/config';
import baseConfig from './.config/eslint.config.mjs';
import grafanaI18nPlugin from '@grafana/i18n/eslint-plugin';

export default defineConfig([
  {
    ignores: [
      '**/logs',
      '**/*.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.pnpm-debug.log*',
      '**/node_modules/',
      '.yarn/cache',
      '.yarn/unplugged',
      '.yarn/build-state.yml',
      '.yarn/install-state.gz',
      '**/.pnp.*',
      '**/pids',
      '**/*.pid',
      '**/*.seed',
      '**/*.pid.lock',
      '**/lib-cov',
      '**/coverage',
      '**/dist/',
      '**/artifacts/',
      '**/work/',
      '**/ci/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      'playwright/.cache/',
      'playwright/.auth/',
      '**/.idea',
      '**/.eslintcache',
      // Internal packages have their own tsconfig
      'packages/**',
    ],
  },
  {
    name: 'grafana/i18n-rules',
    plugins: { '@grafana/i18n': grafanaI18nPlugin },
    rules: {
      '@grafana/i18n/no-untranslated-strings': ['error', { calleesToIgnore: ['^css$', 'use[A-Z].*'] }],
      '@grafana/i18n/no-translation-top-level': 'error',
    },
  },
  {
    name: 'grafana/i18n-test-overrides',
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/test/**/*.ts',
      '**/test/**/*.tsx',
      '**/*FormSchema.ts',
      '**/*Schema.ts',
    ],
    rules: {
      '@grafana/i18n/no-untranslated-strings': 'off',
    },
  },
  {
    name: 'grafana/typescript-safety',
    files: ['src/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/test/**/*.ts', '**/test/**/*.tsx'],
    rules: {
      // Disallow non-null assertions (!) - they bypass TypeScript's null checking
      // Use type guards (if (value)) or optional chaining (?.) instead
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    name: 'grafana/safe-links',
    files: ['src/**/*.tsx', 'packages/**/*.tsx'],
    ignores: ['**/*.test.tsx', '**/test/**/*.tsx'],
    rules: {
      // Raw anchors bypass URL sanitization: React does not sanitize href, so an
      // attacker-controlled `javascript:` URL executes in the Grafana origin.
      // TextLink / LinkButton / Link run the href through textUtil.sanitizeUrl.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="a"]:has(JSXAttribute[name.name="href"])',
          message:
            'Do not use <a href>. Use TextLink (or LinkButton / Link) from @grafana/ui — they sanitize the href and prevent javascript: URL XSS.',
        },
      ],
    },
  },
  ...baseConfig,
  {
    name: 'test-data/rules-provisioner-console',
    files: ['test-data/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
]);
