import { act, renderHook } from '@testing-library/react';

import { usePagination } from './usePagination';

describe('usePagination', () => {
  it('returns the requested page of items', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3, 4, 5], 2));

    expect(result.current.numberOfPages).toBe(3);
    expect(result.current.pageItems).toEqual([1, 2]);

    act(() => result.current.onPageChange(3));

    expect(result.current.page).toBe(3);
    expect(result.current.pageItems).toEqual([5]);
  });

  it('keeps page changes within the available range', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3], 2));

    act(() => result.current.onPageChange(10));
    expect(result.current.page).toBe(2);

    act(() => result.current.onPageChange(0));
    expect(result.current.page).toBe(1);
  });

  it('resets to the first page when the number of pages changes', () => {
    const { result, rerender } = renderHook(({ items }) => usePagination(items, 2), {
      initialProps: { items: [1, 2, 3] },
    });
    act(() => result.current.onPageChange(2));

    rerender({ items: [1] });

    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toEqual([1]);
  });

  it('returns an empty first page for an empty list', () => {
    const { result } = renderHook(() => usePagination([], 2));

    expect(result.current).toMatchObject({ page: 1, numberOfPages: 1, pageItems: [] });
  });
});
