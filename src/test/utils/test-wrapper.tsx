/**
 * Test wrapper utilities for providing Redux store to tests
 */

import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from '../../store/store';

/**
 * Creates a test wrapper component that provides a fresh Redux store.
 * This ensures complete test isolation and prevents RTK Query cache pollution between tests.
 *
 * @param dataSourceUID - Optional data source UID to initialize the store with (defaults to 'test-mimir-uid')
 * @returns A wrapper component that can be used with renderHook or render
 *
 * @example
 * ```typescript
 * const { result } = renderHook(() => useMyHook(), {
 *   wrapper: createTestWrapper(),
 * });
 * ```
 */
export function createTestWrapper(dataSourceUID = 'test-mimir-uid') {
  const store = createStore(dataSourceUID);

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}
