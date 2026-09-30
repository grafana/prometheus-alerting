import React, { PropsWithChildren, createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import { isEmpty } from 'lodash';

import { t } from '@grafana/i18n';

import { getRulesErrorFeedback } from '../../utils/errorFeedback';

/**
 * A single data source we hide from the rule list: either it failed to serve its rules, or it has
 * no rules at all. We store the user facing feedback rather than the error itself – errors are
 * frequently recreated on every render, the feedback is not.
 */
export interface DataSourceRulesError {
  uid: string;
  name: string;
  kind: 'error' | 'empty';
  description: string;
  details?: string;
}

interface DataSourceErrorsContextValue {
  errors: DataSourceRulesError[];
  /** Data sources that are still loading their rules */
  loadingUids: string[];
  reportError: (error: DataSourceRulesError) => void;
  clearError: (uid: string) => void;
  clearErrors: () => void;
  startLoading: (uid: string) => void;
  stopLoading: (uid: string) => void;
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
      if (
        reported &&
        reported.kind === error.kind &&
        reported.description === error.description &&
        reported.details === error.details
      ) {
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

/**
 * How many components are loading for each data source. A count rather than a flag because
 * discovery and the rule groups load in different components, and when one hands over to the
 * other both can briefly be loading at the same time.
 */
type LoadingState = Record<string, number>;

type LoadingAction = { type: 'start'; uid: string } | { type: 'stop'; uid: string };

export function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  const count = state[action.uid] ?? 0;

  if (action.type === 'start') {
    return { ...state, [action.uid]: count + 1 };
  }

  if (count === 0) {
    return state;
  }

  if (count === 1) {
    const next = { ...state };
    delete next[action.uid];
    return next;
  }

  return { ...state, [action.uid]: count - 1 };
}

function noop() {}

/**
 * Default value makes the context optional – components that report errors can be rendered
 * outside of the provider (e.g. in isolation in tests) without blowing up, their reports are
 * simply discarded.
 */
const DataSourceErrorsContext = createContext<DataSourceErrorsContextValue>({
  errors: [],
  loadingUids: [],
  reportError: noop,
  clearError: noop,
  clearErrors: noop,
  startLoading: noop,
  stopLoading: noop,
});

/**
 * Collects errors and empty data sources from the rule list, so we can hide those data sources from
 * the list itself and report them in a single place instead.
 */
export function DataSourceErrorsProvider({ children }: PropsWithChildren) {
  const [errorsByUid, dispatch] = useReducer(dataSourceErrorsReducer, {});
  const [loadingByUid, dispatchLoading] = useReducer(loadingReducer, {});

  // Kept out of the value below so the action creators stay stable – consumers use them as effect
  // dependencies, and a new identity on every state change would make them clear and report in a loop
  const actions = useMemo(
    () => ({
      reportError: (error: DataSourceRulesError) => dispatch({ type: 'report', error }),
      clearError: (uid: string) => dispatch({ type: 'clear', uid }),
      clearErrors: () => dispatch({ type: 'clear-all' }),
      startLoading: (uid: string) => dispatchLoading({ type: 'start', uid }),
      stopLoading: (uid: string) => dispatchLoading({ type: 'stop', uid }),
    }),
    []
  );

  const errors = useMemo(() => Object.values(errorsByUid), [errorsByUid]);
  const loadingUids = useMemo(() => Object.keys(loadingByUid), [loadingByUid]);
  const value = useMemo(() => ({ errors, loadingUids, ...actions }), [errors, loadingUids, actions]);

  return <DataSourceErrorsContext.Provider value={value}>{children}</DataSourceErrorsContext.Provider>;
}

export function useDataSourceErrors() {
  return useContext(DataSourceErrorsContext);
}

/** Turns any rules request error into a reportable data source error. */
export function toDataSourceRulesError(uid: string, name: string, error: unknown): DataSourceRulesError {
  return { uid, name, kind: 'error', ...getRulesErrorFeedback(error) };
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

    reportError({ uid, name, kind: 'error', description, details });
    return () => clearError(uid);
  }, [uid, name, description, details, reportError, clearError]);
}

/**
 * Reports a data source that has no rules at all, for as long as it stays empty and the component
 * is mounted.
 */
export function useReportEmptyDataSource(uid: string, name: string, isEmpty: boolean) {
  const { reportError, clearError } = useDataSourceErrors();

  useEffect(() => {
    if (!isEmpty) {
      return;
    }

    reportError({
      uid,
      name,
      kind: 'empty',
      description: t('alerting.rule-list.datasource-errors.no-rules', 'This data source has no rules.'),
    });
    return () => clearError(uid);
  }, [uid, name, isEmpty, reportError, clearError]);
}

/** Marks a data source as loading for as long as `isLoading` is true and the component is mounted. */
export function useReportDataSourceLoading(uid: string, isLoading: boolean) {
  const { startLoading, stopLoading } = useDataSourceErrors();

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    startLoading(uid);
    return () => stopLoading(uid);
  }, [uid, isLoading, startLoading, stopLoading]);
}
