import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDelayedHide } from './useDelayedHide';

describe('useDelayedHide', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('turns true straight away and false only after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDelayedHide(value, 500), {
      initialProps: { value: false },
    });
    expect(result.current).toBe(false);

    rerender({ value: true });
    expect(result.current).toBe(true);

    rerender({ value: false });
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it('stays true when the value turns back on before the delay runs out', () => {
    const { result, rerender } = renderHook(({ value }) => useDelayedHide(value, 500), {
      initialProps: { value: true },
    });

    rerender({ value: false });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: true });
    act(() => vi.advanceTimersByTime(500));

    expect(result.current).toBe(true);
  });
});
