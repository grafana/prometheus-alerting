import { setupServer } from 'msw/node';

import { allHandlers } from './handlers';

/**
 * MSW server instance with all default handlers.
 * This intercepts HTTP requests during tests and returns mock responses.
 */
export const server = setupServer(...allHandlers);

/**
 * Sets up MSW server lifecycle hooks for a test file.
 * Call this at the top level of a describe block.
 *
 * @example
 * ```ts
 * import { setupMswServer } from '../../test/server';
 *
 * const server = setupMswServer();
 *
 * test('my test', () => {
 *   // Server is running, handlers are active
 *   // Use server.use() to override handlers for specific tests
 * });
 * ```
 */
export function setupMswServer() {
  beforeAll(() => {
    // Start intercepting requests before all tests
    server.listen({ onUnhandledRequest: 'warn' });
  });

  afterEach(() => {
    // Reset handlers to defaults after each test
    // This removes any test-specific overrides added with server.use()
    server.resetHandlers();
  });

  afterAll(() => {
    // Stop intercepting requests after all tests complete
    server.close();
  });

  return server;
}
