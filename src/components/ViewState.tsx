import React from 'react';
import Skeleton from 'react-loading-skeleton';
import type { RequireAllOrNone } from 'type-fest';

type ViewStateProps = {
  isSuccess: boolean;
  children: React.ReactNode;
} & RequireAllOrNone<
  {
    isLoading: boolean;
    loading: React.ReactNode;
  },
  'isLoading' | 'loading'
> &
  RequireAllOrNone<
    {
      isEmpty: boolean;
      empty: React.ReactNode;
    },
    'isEmpty' | 'empty'
  > &
  RequireAllOrNone<
    {
      error: unknown;
      renderError: React.ReactNode;
    },
    'error' | 'renderError'
  >;

/**
 * Component that handles common list view states: loading, error, empty, and data.
 * Prevents flashing of empty states by checking isSuccess before rendering empty/data states.
 *
 * @example
 * <ViewState
 *   isLoading={isLoading}
 *   isSuccess={isSuccess}
 *   error={error}
 *   isEmpty={receivers.length === 0}
 *   loading={<Skeleton height={24} count={5} />}
 *   renderError={<DataSourceError error={error} title="Error loading" />}
 *   empty={<EmptyState message="No data" />}
 * >
 *   <InteractiveTable data={receivers} ... />
 * </ViewState>
 */
export function ViewState({
  isLoading,
  isSuccess,
  error,
  isEmpty,
  loading,
  renderError,
  empty,
  children,
}: ViewStateProps) {
  if (isLoading) {
    return <>{loading ?? <Skeleton height={24} count={5} />}</>;
  }

  if (error) {
    return <>{renderError}</>;
  }

  if (!isLoading && isSuccess && isEmpty && !error) {
    return <>{empty}</>;
  }

  if (!isLoading && isSuccess && !isEmpty && !error) {
    return <>{children}</>;
  }

  return null;
}
