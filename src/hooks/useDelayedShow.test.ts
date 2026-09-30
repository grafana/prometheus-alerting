import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDelayedShow } from './useDelayedShow';

describe('useDelayedShow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('turns true only after the delay and false straight away', () => {
    const { result, rerender } = renderHook(({ value }) => useDelayedShow(value, 300), {
      initialProps: { value: true },
    });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);

    rerender({ value: false });
    expect(result.current).toBe(false);
  });

  it('never turns true when the value turns off before the delay runs out', () => {
    const { result, rerender } = renderHook(({ value }) => useDelayedShow(value, 300), {
      initialProps: { value: true },
    });

    act(() => vi.advanceTimersByTime(200));
    rerender({ value: false });
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBe(false);
  });
});
