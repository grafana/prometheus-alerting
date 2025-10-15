import { useAlertmanager } from './useAlertmanager';
import { useListReceivers as useListPrometheusReceivers } from './prometheus/useReceivers';
import { useListReceivers as useListMimirReceivers } from './mimir/useReceivers';

/**
 * Hook to fetch receivers from Alertmanager.
 * Automatically selects the appropriate implementation (Prometheus or Mimir)
 * based on the current alertmanager data source settings.
 *
 * For Prometheus implementation (settings.jsonData.implementation === 'prometheus'):
 * - Fetches from the status endpoint which contains the full config
 *
 * For Mimir implementation:
 * - Fetches from the configuration endpoint
 *
 * @returns A tuple containing:
 * - triggerFetch: Function to trigger the fetch
 * - result: Object containing receivers array, isLoading, error, and other query state
 */
export function useReceivers() {
  const currentAlertmanager = useAlertmanager();

  // Always call both hooks to comply with Rules of Hooks
  const prometheusHook = useListPrometheusReceivers();
  const mimirHook = useListMimirReceivers();

  // Determine which implementation to use
  const implementation = currentAlertmanager?.settings.jsonData?.implementation;

  // Return the appropriate hook result based on implementation
  if (implementation === 'mimir') {
    return mimirHook;
  }

  // Default to Prometheus for 'prometheus' or undefined implementation
  return prometheusHook;
}
