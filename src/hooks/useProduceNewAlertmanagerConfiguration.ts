import { Action } from '@reduxjs/toolkit';
import type { ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import reduceReducers from 'reduce-reducers';

import { muteTimingsReducer } from '../reducers/alertmanager/timeIntervals';
import { routesReducer } from '../reducers/alertmanager/routes';
import { notificationTemplatesReducer } from '../reducers/alertmanager/templates';
import { receiversReducer } from '../reducers/alertmanager/receivers';
import { useAlertmanager } from './useAlertmanager';
import { mimirAlertmanagerApi } from 'api/mimir.endpoints';

const ERR_NO_ACTIVE_AM = new Error('no active Alertmanager');

export const initialAlertmanagerConfiguration: ParsedUserConfiguration = {
  alertmanager_config: {
    receivers: [],
    route: {},
    time_intervals: [],
    inhibit_rules: [],
    templates: [],
  },
  template_files: {},
};

const configurationReducer = reduceReducers(
  initialAlertmanagerConfiguration,
  muteTimingsReducer,
  receiversReducer,
  notificationTemplatesReducer,
  routesReducer
);

/**
 * This hook will make sure we are always applying actions that mutate the Alertmanager configuration
 * on top of the latest Alertmanager configuration object.
 *
 * Currently supports Mimir alertmanager implementation.
 */
export function useProduceNewAlertmanagerConfiguration() {
  const { uid: dataSourceUID } = useAlertmanager();

  const [fetchAlertmanagerConfiguration, fetchAlertmanagerState] =
    mimirAlertmanagerApi.endpoints.getUserConfiguration.useLazyQuery();
  const [updateAlertManagerConfiguration, updateAlertmanagerState] =
    mimirAlertmanagerApi.endpoints.updateUserConfiguration.useMutation();

  const newConfigurationState = mergeRequestStates(fetchAlertmanagerState, updateAlertmanagerState);

  if (!dataSourceUID) {
    throw ERR_NO_ACTIVE_AM;
  }

  /**
   * This function will fetch the latest Alertmanager configuration, apply a diff to it via a reducer and
   * returns the result.
   *
   * ┌────────────────────────────┐  ┌───────────────┐  ┌───────────────────┐
   * │ fetch latest configuration │─▶│ apply reducer │─▶│  new rule config  │
   * └────────────────────────────┘  └───────────────┘  └───────────────────┘
   */
  const produceNewAlertmanagerConfiguration = async (action: Action) => {
    // Fetch the current configuration (already in ParsedUserConfiguration format)
    const currentConfig = await fetchAlertmanagerConfiguration({ dataSourceUID }).unwrap();

    if (!currentConfig) {
      throw new Error('Failed to fetch current Alertmanager configuration');
    }

    // Apply the reducer to produce the new configuration
    const newConfig = configurationReducer(currentConfig, action);

    // Update the Alertmanager with the new configuration
    return updateAlertManagerConfiguration({
      dataSourceUID,
      configuration: newConfig,
    }).unwrap();
  };

  return [produceNewAlertmanagerConfiguration, newConfigurationState] as const;
}

interface RequestState {
  error?: unknown;
  isUninitialized: boolean;
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
}

// @TODO what to do with the other props that we get from RTKQ's state such as originalArgs, etc?
function mergeRequestStates(...states: RequestState[]): RequestState {
  return {
    error: states.find((s) => s.error),
    isUninitialized: states.every((s) => s.isUninitialized),
    isSuccess: states.every((s) => s.isSuccess),
    isError: states.some((s) => s.isError),
    isLoading: states.some((s) => s.isLoading),
  };
}
