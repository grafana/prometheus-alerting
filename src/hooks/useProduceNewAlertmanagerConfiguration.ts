import { Action } from '@reduxjs/toolkit';
import type { ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import reduceReducers from 'reduce-reducers';

import { muteTimingsReducer } from '../reducers/alertmanager/timeIntervals';
import { routesReducer } from '../reducers/alertmanager/routes';
import { notificationTemplatesReducer } from '../reducers/alertmanager/templates';
import { receiversReducer } from '../reducers/alertmanager/receivers';
import { useAlertmanager } from './useAlertmanager';
import { alertmanagerApi } from 'api/alertmanager.endpoints';

const ERR_NO_ACTIVE_AM = new Error('no active Alertmanager');

// TODO: These endpoints need to be implemented in alertmanagerApi
// const { useLazyGetAlertmanagerConfigurationQuery, useUpdateAlertmanagerConfigurationMutation } = alertmanagerApi;

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
 * NOTE: This hook is currently incomplete and requires the following endpoints to be added to alertmanagerApi:
 * - useLazyGetAlertmanagerConfigurationQuery
 * - useUpdateAlertmanagerConfigurationMutation
 */
export function useProduceNewAlertmanagerConfiguration() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  const [fetchAlertmanagerConfig, fetchAlertmanagerState] = alertmanagerApi.endpoints.getStatus.useLazyQuery();
  // const [updateAlertManager, updateAlertmanagerState] = useUpdateAlertmanagerConfigurationMutation();
  // const newConfigurationState = mergeRequestStates(fetchAlertmanagerState, updateAlertmanagerState);

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
    // TODO: Implement once API endpoints are available
    throw new Error('useProduceNewAlertmanagerConfiguration is not yet implemented - API endpoints need to be added');

    // Future implementation:
    // const currentAlertmanagerConfiguration = await fetchAlertmanagerConfig({ dataSourceUID, implementation }).unwrap();
    // const newConfig = configurationReducer(currentAlertmanagerConfiguration, action);
    // return updateAlertManager({
    //   dataSourceUID,
    //   implementation,
    //   config: newConfig,
    // }).unwrap();
  };

  // TODO: Return actual state once endpoints are implemented
  const newConfigurationState = {
    error: undefined,
    isUninitialized: true,
    isSuccess: false,
    isError: false,
    isLoading: false,
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
