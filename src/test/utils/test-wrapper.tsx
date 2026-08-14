/**
 * Test wrapper utilities for providing Redux store to tests
 */

import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { createStore } from '../../store/store';

/**
 * react-router-dom v6 warns about behavior that becomes the default in v7 unless you
 * opt in early via these flags. Tests build their own MemoryRouter (there's no router
 * from the real app to inherit flags from), so set them here to keep test output clean.
 */
export const ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

/**
 * Drop-in replacement for react-router-dom's MemoryRouter that opts into the v7 future
 * flags so tests don't print the "React Router Future Flag" warnings.
 */
export function TestMemoryRouter(props: MemoryRouterProps) {
  return <MemoryRouter {...props} future={ROUTER_FUTURE_FLAGS} />;
}

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
