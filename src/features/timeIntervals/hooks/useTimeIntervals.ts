import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import {
  addMuteTimingAction,
  updateMuteTimingAction,
  deleteMuteTimingAction,
} from '../../../reducers/alertmanager/timeIntervals';

/**
 * Hook to fetch time intervals from Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 * Dynamically selects the correct API endpoint based on the data source implementation.
 *
 * Time intervals are used to define when notifications should be muted or sent.
 * They specify time ranges, weekdays, days of month, months, and years.
 */
export function useTimeIntervals() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  // Select the appropriate API endpoint based on implementation
  // Mimir uses getUserConfiguration, vanilla Alertmanager uses getConfiguration
  const mimirQueryResult = mimirAlertmanagerApi.endpoints.getUserConfiguration.useQuery(
    { dataSourceUID },
    {
      skip: implementation !== 'mimir',
    }
  );

  const vanillaQueryResult = alertmanagerApi.endpoints.getConfiguration.useQuery(
    { dataSourceUID },
    {
      skip: implementation === 'mimir',
    }
  );

  const queryResult = implementation === 'mimir' ? mimirQueryResult : vanillaQueryResult;

  return {
    ...queryResult,
    timeIntervals: queryResult.data?.alertmanager_config?.time_intervals ?? [],
  };
}

/**
 * Hook to add a new time interval to the Alertmanager configuration.
 * Returns a mutation function and request state.
 *
 * @example
 * const [addTimeInterval, { isLoading, error, isSuccess }] = useAddTimeInterval();
 * await addTimeInterval(newTimeInterval);
 */
export function useAddTimeInterval() {
  const [produceNewConfig, state] = useProduceNewAlertmanagerConfiguration();

  const addTimeInterval = async (interval: TimeInterval) => {
    return produceNewConfig(addMuteTimingAction({ interval }));
  };

  return [addTimeInterval, state] as const;
}

/**
 * Hook to update an existing time interval in the Alertmanager configuration.
 * Returns a mutation function and request state.
 *
 * @example
 * const [updateTimeInterval, { isLoading, error, isSuccess }] = useUpdateTimeInterval();
 * await updateTimeInterval(updatedInterval, originalName);
 */
export function useUpdateTimeInterval() {
  const [produceNewConfig, state] = useProduceNewAlertmanagerConfiguration();

  const updateTimeInterval = async (interval: TimeInterval, originalName: string) => {
    return produceNewConfig(updateMuteTimingAction({ interval, originalName }));
  };

  return [updateTimeInterval, state] as const;
}

/**
 * Hook to delete a time interval from the Alertmanager configuration.
 * Returns a mutation function and request state.
 *
 * @example
 * const [deleteTimeInterval, { isLoading, error, isSuccess }] = useDeleteTimeInterval();
 * await deleteTimeInterval(timeIntervalName);
 */
export function useDeleteTimeInterval() {
  const [produceNewConfig, state] = useProduceNewAlertmanagerConfiguration();

  const deleteTimeInterval = async (name: string) => {
    return produceNewConfig(deleteMuteTimingAction({ name }));
  };

  return [deleteTimeInterval, state] as const;
}
