/**
 * Helpers for combining several RTK Query request states into one, for hooks that
 * chain multiple requests (e.g. fetch the latest config, then write it back) but
 * want to expose a single loading / error state to their callers.
 */

export interface RequestState {
  error?: unknown;
  isUninitialized: boolean;
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
}

// @TODO what to do with the other props that we get from RTKQ's state such as originalArgs, etc?
export function mergeRequestStates(...states: RequestState[]): RequestState {
  return {
    error: states.find((s) => s.error)?.error,
    isUninitialized: states.every((s) => s.isUninitialized),
    isSuccess: states.every((s) => s.isSuccess),
    isError: states.some((s) => s.isError),
    isLoading: states.some((s) => s.isLoading),
  };
}
