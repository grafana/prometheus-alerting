import React, { PropsWithChildren, createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { produce } from 'immer';

import { t } from '@grafana/i18n';

import { getRulesErrorFeedback } from '../../utils/errorFeedback';

/**
 * A single data source we hide from the rule list: either it failed to serve its rules, or it has
 * no rules at all. We store the user facing feedback rather than the error itself – errors are
 * frequently recreated on every render, the feedback is not.
 */
export interface DataSourceRulesError {
  uid: string;
  kind: 'error' | 'empty';
  description: string;
  /** See `RulesErrorFeedback` */
  status?: string;
  url?: string;
}

interface DataSourceErrorsContextValue {
  errors: DataSourceRulesError[];
  reportError: (error: DataSourceRulesError) => void;
  /** Pass a `kind` to only clear that kind of report, e.g. clear an error but keep a "no rules" report */
  clearError: (uid: string, kind?: DataSourceRulesError['kind']) => void;
}

type DataSourceErrorsState = Record<string, DataSourceRulesError>;

type DataSourceErrorsAction =
  { type: 'report'; error: DataSourceRulesError } | { type: 'clear'; uid: string; kind?: DataSourceRulesError['kind'] };

export function dataSourceErrorsReducer(
  state: DataSourceErrorsState,
  action: DataSourceErrorsAction
): DataSourceErrorsState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'report':
        draft[action.error.uid] = action.error;
        return;
      case 'clear':
        if (!action.kind || draft[action.uid]?.kind === action.kind) {
          delete draft[action.uid];
        }
        return;
    }
  });
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
});

/**
 * Collects errors and empty data sources from the rule list, so we can hide those data sources from
 * the list itself and report them in a single place instead.
 *
 * A report stays after the component that made it goes away. Switching between the grouped and the
 * filtered view unmounts every loader, and the hidden count should not drop to zero and climb back
 * while the other view loads the same data sources again. A report is only cleared once we know the
 * data source is fine, see `useReportDataSourceError` and `useReportHealthyDataSource`.
 */
export function DataSourceErrorsProvider({ children }: PropsWithChildren) {
  const [errorsByUid, dispatch] = useReducer(dataSourceErrorsReducer, {});

  // Kept out of the value below so the action creators stay stable – consumers use them as effect
  // dependencies, and a new identity on every state change would make them clear and report in a loop
  const actions = useMemo(
    () => ({
      reportError: (error: DataSourceRulesError) => dispatch({ type: 'report', error }),
      clearError: (uid: string, kind?: DataSourceRulesError['kind']) => dispatch({ type: 'clear', uid, kind }),
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
export function toDataSourceRulesError(uid: string, error: unknown): DataSourceRulesError {
  return { uid, kind: 'error', ...getRulesErrorFeedback(error) };
}

/**
 * Reports an error for a single data source. The report is cleared when the error goes away while this
 * component is still mounted (e.g. a retry went through), but not when the component unmounts.
 * Pass a falsy error to report nothing.
 */
export function useReportDataSourceError(uid: string, error: unknown) {
  const { reportError, clearError } = useDataSourceErrors();

  // Derive the feedback during render so the effect depends on plain strings – depending on the
  // error itself would re-trigger the reporting for every error that is recreated on each render
  const reported = error ? toDataSourceRulesError(uid, error) : undefined;
  const { description, status, url } = reported ?? {};
  const reportedUid = useRef<string>(undefined);

  useEffect(() => {
    if (description) {
      reportError({ uid, kind: 'error', description, status, url });
      reportedUid.current = uid;
    } else if (reportedUid.current) {
      clearError(reportedUid.current, 'error');
      reportedUid.current = undefined;
    }
  }, [uid, description, status, url, reportError, clearError]);
}

/**
 * Reports a data source that has no rules at all. Like `useReportDataSourceError`, the report is
 * cleared when the data source stops being empty while this component is mounted, not on unmount.
 */
export function useReportEmptyDataSource(uid: string, isEmpty: boolean) {
  const { reportError, clearError } = useDataSourceErrors();

  const reportedUid = useRef<string>(undefined);

  useEffect(() => {
    if (isEmpty) {
      reportError({
        uid,
        kind: 'empty',
        description: t('alerting.rule-list.datasource-errors.no-rules', 'This data source has no rules.'),
      });
      reportedUid.current = uid;
    } else if (reportedUid.current) {
      clearError(reportedUid.current, 'empty');
      reportedUid.current = undefined;
    }
  }, [uid, isEmpty, reportError, clearError]);
}

/**
 * Clears whatever was reported for a data source once it has served rules without an error – the only
 * way a report made by a view that has since gone away gets cleared.
 */
export function useReportHealthyDataSource(uid: string, isHealthy: boolean) {
  const { clearError } = useDataSourceErrors();

  useEffect(() => {
    if (isHealthy) {
      clearError(uid);
    }
  }, [uid, isHealthy, clearError]);
}
