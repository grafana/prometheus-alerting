import { setupServer } from 'msw/node';

import { allHandlers } from './handlers';

/**
 * MSW server instance with all default handlers.
 * This intercepts HTTP requests during tests and returns mock responses.
 *
 * The server lifecycle (listen, reset, close) is managed globally in vitest-setup.ts.
 * Individual tests can override handlers using server.use() for specific test cases.
 */
export const server = setupServer(...allHandlers);
