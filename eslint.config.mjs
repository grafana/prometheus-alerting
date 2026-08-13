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
      // Internal packages hold schemas and codecs, never rendered text, and are deliberately
      // framework-free -- they cannot depend on @grafana/i18n.
      'packages/**/*.{ts,tsx}',
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
    // Internal packages are behaviour, not UI, and they are where third-party rules-source flavors
    // live (see docs/adr/0001-rules-source-flavors.md). They must stay independently testable: no
    // reaching back into the app, and no Grafana/React runtime. Without this the package boundary
    // is only a convention.
    //
    // Must come after baseConfig, which also configures `no-restricted-imports` -- hence `moment`
    // is repeated here rather than inherited.
    name: 'grafana/package-boundaries',
    files: ['packages/*/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['moment'],
          patterns: [
            {
              group: ['src/*', 'src/**', '**/../src/*', '**/../src/**'],
              message:
                'Internal packages must not import from the app. Depend on the contract in @grafana/external-rules/ruler instead, and let the app wire the pieces together.',
            },
            {
              group: ['@grafana/ui', '@grafana/runtime', 'react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
              message:
                'Internal packages must stay framework-free so they can be tested without a Grafana or React runtime. Take what you need as an argument (e.g. RulerTransport) instead.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'test-data/rules-provisioner-console',
    files: ['test-data/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
]);
