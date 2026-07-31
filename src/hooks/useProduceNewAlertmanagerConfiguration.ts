import { Action } from '@reduxjs/toolkit';
import reduceReducers from 'reduce-reducers';
import { defaultsDeep } from 'lodash';

import { getAlertmanagerConfigMutationAbility } from '../access-control/abilities.alertmanager';
import { PermissionDeniedError, UnsupportedOperationError } from '../access-control/errors';
import { timeIntervalsReducer } from '../reducers/alertmanager/timeIntervals';
import { routesReducer } from '../reducers/alertmanager/routes';
import { notificationTemplatesReducer } from '../reducers/alertmanager/templates';
import { receiversReducer } from '../reducers/alertmanager/receivers';
import { inhibitRulesReducer } from '../reducers/alertmanager/inhibitRules';
import { useAlertmanager } from './useAlertmanager';
import { useHasConfigurationAPI } from './useHasConfigurationAPI';
import { mimirAlertmanagerApi } from '../api/alertmanager/mimir.endpoints';
import {
  PostableParsedUserConfiguration,
  initialAlertmanagerConfiguration,
} from '@grafana/external-alertmanager/mimir';

const ERR_NO_ACTIVE_AM = new Error('no active Alertmanager');
const ERR_INSUFFICIENT_PERMISSIONS = new PermissionDeniedError(
  'Missing permission to update the Alertmanager configuration'
);
const ERR_CONFIGURATION_API_NOT_SUPPORTED = new UnsupportedOperationError(
  'The selected Alertmanager does not support configuration updates'
);

const { getUserConfiguration, updateUserConfiguration } = mimirAlertmanagerApi.endpoints;

const configurationReducer = reduceReducers<PostableParsedUserConfiguration>(
  initialAlertmanagerConfiguration,
  timeIntervalsReducer,
  receiversReducer,
  notificationTemplatesReducer,
  routesReducer,
  inhibitRulesReducer
);

/**
 * This hook will make sure we are always applying actions that mutate the Alertmanager configuration
 * on top of the latest Alertmanager configuration object.
 *
 * Currently supports Mimir alertmanager implementation.
 */
export function useProduceNewAlertmanagerConfiguration() {
  const { uid: dataSourceUID } = useAlertmanager();

  const [fetchAlertmanagerConfiguration, fetchAlertmanagerState] = getUserConfiguration.useLazyQuery();
  const [updateAlertManagerConfiguration, updateAlertmanagerState] = updateUserConfiguration.useMutation();

  const newConfigurationState = mergeRequestStates(fetchAlertmanagerState, updateAlertmanagerState);
  const configurationMutationAbility = getAlertmanagerConfigMutationAbility(useHasConfigurationAPI());

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
    if (!configurationMutationAbility.granted) {
      switch (configurationMutationAbility.cause) {
        case 'INSUFFICIENT_PERMISSIONS':
          throw ERR_INSUFFICIENT_PERMISSIONS;
        case 'NOT_SUPPORTED':
          throw ERR_CONFIGURATION_API_NOT_SUPPORTED;
      }
    }

    // Fetch the current configuration (already in ParsedUserConfiguration format)
    const currentConfig = await fetchAlertmanagerConfiguration({ dataSourceUID }).unwrap();

    if (!currentConfig) {
      throw new Error('Failed to fetch current Alertmanager configuration');
    }

    // merge currect config with initial configuration so we can send fields that may not be configured yet but are expected by the API
    // this may happen for example when a new Mimir configuration is created for a tenant – it will not have any routes defined by requires a route property when posting the configuration
    // NOTE: We preserve currentConfig values and only use initialAlertmanagerConfiguration as fallback for missing fields
    const initialConfiguration = defaultsDeep({}, currentConfig, initialAlertmanagerConfiguration);

    // defaultsDeep recursively backfills missing fields on an *existing* route tree too (e.g. group_wait,
    // group_interval, repeat_interval), which changes the content-hash IDs routesReducer/attachRouteIds
    // compute for it and breaks route lookups by ID. Only fall back to the initial default route when the
    // fetched config has no route at all (e.g. a brand new Mimir tenant) — otherwise keep it byte-for-byte
    // as fetched, matching what the UI hashed when it computed the route IDs used by the action payload.
    if (currentConfig.alertmanager_config.route) {
      initialConfiguration.alertmanager_config.route = currentConfig.alertmanager_config.route;
    }

    // Apply the reducer to produce the new configuration
    const newConfig = configurationReducer(initialConfiguration, action);

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
