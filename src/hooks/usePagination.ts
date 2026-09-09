import { useCallback, useMemo, useState } from 'react';

/** Paginates an in-memory list and resets to the first page when its page count changes. */
export function usePagination<T>(items: T[], itemsPerPage: number) {
  const [page, setPage] = useState(1);
  const numberOfPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const [previousPageCount, setPreviousPageCount] = useState(numberOfPages);

  if (previousPageCount !== numberOfPages) {
    setPreviousPageCount(numberOfPages);
    setPage(1);
  }

  const pageItems = useMemo(
    () => items.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [items, itemsPerPage, page]
  );

  const onPageChange = useCallback(
    (newPage: number) => setPage(Math.min(Math.max(newPage, 1), numberOfPages)),
    [numberOfPages]
  );

  return { page, onPageChange, numberOfPages, pageItems };
}
