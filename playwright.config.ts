import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'node:path';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

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
      testIgnore: /rbac(?:Editor)?\.spec\.ts/,
    },
    // 2. Auth setup - runs automatically before e2e-tests via dependency
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'rbac-none-auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
      use: {
        user: {
          user: 'e2e-rbac-none',
          password: 'e2e-rbac-password',
          role: 'None',
        },
      },
    },
    {
      name: 'rbac-reader-auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
      use: {
        user: {
          user: 'e2e-rbac-reader',
          password: 'e2e-rbac-password',
          role: 'Viewer',
        },
      },
    },
    {
      name: 'rbac-editor-auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
      use: {
        user: {
          user: 'e2e-rbac-editor',
          password: 'e2e-rbac-password',
          role: 'Editor',
        },
      },
    },
    // Each role project consumes the session state produced by its auth project.
    // This runs every RBAC spec as a real Grafana user while the usual E2E project
    // continues to use the admin session.
    {
      name: 'rbac-none',
      testMatch: /rbac\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/e2e-rbac-none.json',
      },
      dependencies: ['rbac-none-auth'],
    },
    {
      name: 'rbac-reader',
      testMatch: /rbac\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/e2e-rbac-reader.json',
      },
      dependencies: ['rbac-reader-auth'],
    },
    {
      name: 'rbac-editor',
      testMatch: /rbac(?:Editor)?\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/e2e-rbac-editor.json',
      },
      dependencies: ['rbac-editor-auth'],
    },
  ],
});
