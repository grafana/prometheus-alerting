import { useAlertmanager } from './useAlertmanager';
import { useRoutes as usePrometheusRoutes } from './prometheus/useRoutes';
import { useRoutes as useMimirRoutes } from './mimir/useRoutes';

/**
 * Hook to fetch routes from Alertmanager.
 * Automatically selects the appropriate implementation (Prometheus or Mimir)
 * based on the current alertmanager data source settings.
 *
 * For Prometheus implementation (settings.jsonData.implementation === 'prometheus'):
 * - Fetches from the status endpoint which contains the full config
 *
 * For Mimir implementation:
 * - Fetches from the configuration endpoint
 *
 * @returns Object containing route object, isLoading, error, and other query state
 */
export function useRoutes() {
  const currentAlertmanager = useAlertmanager();

  // Always call both hooks to comply with Rules of Hooks
  const prometheusHook = usePrometheusRoutes();
  const mimirHook = useMimirRoutes();

  // Determine which implementation to use
  const implementation = currentAlertmanager?.settings.jsonData?.implementation;

  // Return the appropriate hook result based on implementation
  if (implementation === 'mimir') {
    return mimirHook;
  }

  // Default to Prometheus for 'prometheus' or undefined implementation
  return prometheusHook;
}
