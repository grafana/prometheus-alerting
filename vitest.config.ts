import fs from 'fs';
import path from 'path';
import * as swc from '@swc/core';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const BROWSERSLIST_FILE = path.resolve(process.cwd(), '.browserslistrc');

/**
 * Compile test code with swc and the same browser list the plugin bundle is built with, instead
 * of letting Vite hand it to esbuild.
 *
 * The reason is that swc and esbuild don't compile down to older browsers the same way, so a test
 * that passes can still be broken once it's bundled. Named capture groups in a regex are the
 * example we hit: esbuild leaves them for the browser to handle, while swc emulates them, and the
 * emulation is what made every duration look invalid when saving a route (#216). The unit tests
 * for that code already existed and passed the whole time. Running them through swc means a bug
 * like that fails a test instead of only showing up in a build.
 *
 * These options mirror the swc-loader options in the scaffolded webpack config, with the same
 * browser-list-derived target the override in `webpack.config.ts` sets up — keep them in step.
 *
 * To check this is actually doing something, temporarily put `chrome 60` in `.browserslistrc`:
 * the duration tests in `src/utils/time.utils.test.ts` should start failing.
 *
 * It has to replace Vite's own transform rather than run after it (hence `enforce: 'pre'` and no
 * `@vitejs/plugin-react`). Compiling twice loses track of which line came from where, which
 * quietly throws off the coverage numbers.
 */
const swcBuildTarget = (): Plugin => {
  if (!fs.existsSync(BROWSERSLIST_FILE)) {
    throw new Error(
      `Expected a browser list at ${BROWSERSLIST_FILE}, but it isn't there. ` +
        'Without it swc would compile the tests against its own default browser list instead of ' +
        'the browsers Grafana supports. Run the tests from the repository root.'
    );
  }

  return {
    name: 'swc-build-target',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules') || !/\.[jt]sx?($|\?)/.test(id)) {
        return null;
      }

      const output = swc.transformSync(code, {
        filename: id,
        sourceMaps: true,
        jsc: {
          parser: { syntax: 'typescript', tsx: true, decorators: false, dynamicImport: true },
          // Matches the React 18 runtime exception in webpack.config.ts.
          transform: { react: { runtime: 'automatic', development: false } },
        },
        // No `targets` here on purpose — that's what makes swc read `.browserslistrc` itself.
        env: { path: process.cwd() },
      });

      return { code: output.code, map: output.map ? JSON.parse(output.map) : null };
    },
  };
};

export default defineConfig({
  plugins: [swcBuildTarget()],
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
