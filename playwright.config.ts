import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'node:path';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

const RBAC_PASSWORD = 'e2e-rbac-password';
const RBAC_ROLES = ['None', 'Viewer', 'Editor'] as const;

/**
 * Every RBAC role gets an auth project that provisions and logs in a dedicated user, plus a test
 * project that runs `rbac.<role>.spec.ts` with the resulting session. The `e2e-tests` project
 * continues to use the admin session and ignores the RBAC specs.
 */
const rbacProjects = RBAC_ROLES.flatMap((role) => {
  const name = role.toLowerCase();
  const user = `e2e-rbac-${name}`;

  return [
    {
      name: `rbac-${name}-auth`,
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
      use: {
        user: { user, password: RBAC_PASSWORD, role },
      },
    },
    {
      name: `rbac-${name}`,
      testMatch: new RegExp(`rbac\\.${name}\\.spec\\.ts`),
      use: {
        ...devices['Desktop Chrome'],
        storageState: `playwright/.auth/${user}.json`,
      },
      dependencies: [`rbac-${name}-auth`],
    },
  ];
});

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig<PluginOptions>({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,
  /* Global setup to wait for Prometheus rules to be ready */
  globalSetup: './tests/global-setup.ts',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'html' : 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.GRAFANA_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // 1. Run tests in Google Chrome. Every test will start authenticated as admin user.
    {
      name: 'e2e-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
      testIgnore: /rbac\..*\.spec\.ts/,
    },
    // 2. Auth setup - runs automatically before e2e-tests via dependency
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    ...rbacProjects,
  ],
});
