import { useAlertmanager } from './useAlertmanager';
import { useTimeIntervals as usePrometheusTimeIntervals } from './prometheus/useTimeIntervals';
import { useTimeIntervals as useMimirTimeIntervals } from './mimir/useTimeIntervals';

/**
 * Hook to fetch time intervals from Alertmanager.
 * Automatically selects the appropriate implementation (Prometheus or Mimir)
 * based on the current alertmanager data source settings.
 *
 * For Prometheus implementation (settings.jsonData.implementation === 'prometheus'):
 * - Fetches from the status endpoint which contains the full config
 *
 * For Mimir implementation:
 * - Fetches from the configuration endpoint
 *
 * @returns Object containing timeIntervals array, isLoading, error, and other query state
 */
export function useTimeIntervals() {
  const currentAlertmanager = useAlertmanager();

  // Always call both hooks to comply with Rules of Hooks
  const prometheusHook = usePrometheusTimeIntervals();
  const mimirHook = useMimirTimeIntervals();

  // Determine which implementation to use
  const implementation = currentAlertmanager?.settings.jsonData?.implementation;

  // Return the appropriate hook result based on implementation
  if (implementation === 'mimir') {
    return mimirHook;
  }

  // Default to Prometheus for 'prometheus' or undefined implementation
  return prometheusHook;
}
