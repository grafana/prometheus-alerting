// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// Import MSW server
import { server } from './src/test/server';

// Import mocks
import { mockCanvasContext } from './src/test/mocks/canvas';
import { setupGrafanaRuntimeMocks, resetGrafanaRuntimeMocks } from './src/test/mocks/grafana-runtime';

// Import handler reset functions
import { resetRulerState } from './src/test/handlers/ruler';

/**
 * MSW Server Lifecycle
 *
 * The server starts before all tests and closes after all tests.
 * Handlers are reset after each test to ensure isolation.
 */
beforeAll(() => {
  // Start MSW server
  server.listen({
    // Warn about unhandled requests (helps catch missing mocks)
    onUnhandledRequest: 'warn',
  });
});

afterEach(() => {
  // Reset MSW handlers to defaults (removes test-specific overrides)
  server.resetHandlers();

  // Reset any stateful mock data
  resetRulerState();
  resetGrafanaRuntimeMocks();
});

afterAll(() => {
  // Clean up MSW server
  server.close();
});

/**
 * Global Mocks
 *
 * These mocks are applied to all tests automatically.
 */

// Mock canvas context for @grafana/ui components that use measureText
mockCanvasContext();

// Set up Grafana runtime mocks (config.datasources, getDataSourceSrv, etc.)
setupGrafanaRuntimeMocks();
