import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

import { useReturnTo } from './useReturnTo';
import { TestMemoryRouter } from '../test/utils/test-wrapper';

const FALLBACK = '/a/grafana-prometheusalerting-app/rules';

function renderUseReturnTo(returnTo: string) {
  const search = `?returnTo=${encodeURIComponent(returnTo)}`;

  return renderHook(() => useReturnTo(FALLBACK), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <TestMemoryRouter initialEntries={[`/edit${search}`]}>{children}</TestMemoryRouter>
    ),
  });
}

describe('useReturnTo', () => {
  // the hook logs rejected values, which is noise we don't need in the test output
  let warn: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    warn.mockRestore();
  });

  it('should return the fallback when no returnTo is set', () => {
    const { result } = renderHook(() => useReturnTo(FALLBACK), {
      wrapper: ({ children }: { children: React.ReactNode }) => <TestMemoryRouter>{children}</TestMemoryRouter>,
    });

    expect(result.current.returnTo).toBe(FALLBACK);
  });

  it.each([
    ['/rules/group/edit', '/rules/group/edit'],
    ['/rules?view=list', '/rules?view=list'],
    [`${window.location.origin}/rules?view=list`, '/rules?view=list'],
    ['/', '/'],
  ])('should accept same-site path %s', (returnTo, expected) => {
    const { result } = renderUseReturnTo(returnTo);
    expect(result.current.returnTo).toBe(expected);
  });

  it.each([
    'https://evil.com/x',
    '//evil.com/x',
    'javascript:alert(1)',
    // origin matches the real Grafana origin, but the path is protocol-relative
    `${window.location.origin}//evil.com/x`,
    `${window.location.origin}/\\evil.com/x`,
    `${window.location.origin}/\\/evil.com/x`,
  ])('should reject off-site returnTo %s', (returnTo) => {
    const { result } = renderUseReturnTo(returnTo);
    expect(result.current.returnTo).toBe(FALLBACK);
  });
});
