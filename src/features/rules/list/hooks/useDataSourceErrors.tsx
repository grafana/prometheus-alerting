import React, { PropsWithChildren, createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import { isEmpty } from 'lodash';

import { getRulesErrorFeedback } from '../../utils/errorFeedback';

/**
 * A single data source that failed to serve its rules. We store the user facing feedback rather
 * than the error itself – errors are frequently recreated on every render, the feedback is not.
 */
export interface DataSourceRulesError {
  uid: string;
  name: string;
  description: string;
  details?: string;
}

interface DataSourceErrorsContextValue {
  errors: DataSourceRulesError[];
  reportError: (error: DataSourceRulesError) => void;
  clearError: (uid: string) => void;
  clearErrors: () => void;
}

type DataSourceErrorsState = Record<string, DataSourceRulesError>;

type DataSourceErrorsAction =
  | { type: 'report'; error: DataSourceRulesError }
  | { type: 'clear'; uid: string }
  | { type: 'clear-all' };

export function dataSourceErrorsReducer(
  state: DataSourceErrorsState,
  action: DataSourceErrorsAction
): DataSourceErrorsState {
  switch (action.type) {
    case 'report': {
      const { error } = action;
      // Bail out on repeat reports of the same error, re-rendering every consumer for nothing
      const reported = state[error.uid];
      if (reported && reported.description === error.description && reported.details === error.details) {
        return state;
      }
      return { ...state, [error.uid]: error };
    }
    case 'clear': {
      if (!(action.uid in state)) {
        return state;
      }
      const next = { ...state };
      delete next[action.uid];
      return next;
    }
    case 'clear-all':
      return isEmpty(state) ? state : {};
  }
}

function noop() {}

/**
 * Default value makes the context optional – components that report errors can be rendered
 * outside of the provider (e.g. in isolation in tests) without blowing up, their reports are
 * simply discarded.
 */
const DataSourceErrorsContext = createContext<DataSourceErrorsContextValue>({
  errors: [],
  reportError: noop,
  clearError: noop,
  clearErrors: noop,
});

/**
 * Collects errors from all data sources rendered in the rule list, so we can hide the broken
 * data sources from the list itself and report them in a single place instead.
 */
export function DataSourceErrorsProvider({ children }: PropsWithChildren) {
  const [errorsByUid, dispatch] = useReducer(dataSourceErrorsReducer, {});

  // Kept out of the value below so the action creators stay stable – consumers use them as effect
  // dependencies, and a new identity on every state change would make them clear and report in a loop
  const actions = useMemo(
    () => ({
      reportError: (error: DataSourceRulesError) => dispatch({ type: 'report', error }),
      clearError: (uid: string) => dispatch({ type: 'clear', uid }),
      clearErrors: () => dispatch({ type: 'clear-all' }),
    }),
    []
  );

  const errors = useMemo(() => Object.values(errorsByUid), [errorsByUid]);
  const value = useMemo(() => ({ errors, ...actions }), [errors, actions]);

  return <DataSourceErrorsContext.Provider value={value}>{children}</DataSourceErrorsContext.Provider>;
}

export function useDataSourceErrors() {
  return useContext(DataSourceErrorsContext);
}

/** Turns any rules request error into a reportable data source error. */
export function toDataSourceRulesError(uid: string, name: string, error: unknown): DataSourceRulesError {
  return { uid, name, ...getRulesErrorFeedback(error) };
}

/**
 * Reports an error for a single data source for as long as the error is present and the component
 * is mounted. Pass a falsy error to report nothing.
 */
export function useReportDataSourceError(uid: string, name: string, error: unknown) {
  const { reportError, clearError } = useDataSourceErrors();

  // Derive the feedback during render so the effect depends on plain strings – depending on the
  // error itself would re-trigger the reporting for every error that is recreated on each render
  const reported = error ? toDataSourceRulesError(uid, name, error) : undefined;
  const { description, details } = reported ?? {};

  useEffect(() => {
    if (!description) {
      return;
    }

    reportError({ uid, name, description, details });
    return () => clearError(uid);
  }, [uid, name, description, details, reportError, clearError]);
}

/**
 * Renderless version of {@link useReportDataSourceError}, for places where we cannot call hooks –
 * such as the render prop of an error boundary.
 */
export function ReportDataSourceError({ uid, name, error }: { uid: string; name: string; error: unknown }) {
  useReportDataSourceError(uid, name, error);
  return null;
}
