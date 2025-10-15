import { useAlertmanager } from './useAlertmanager';
import { useInhibitRules as usePrometheusInhibitRules } from './prometheus/useInhibitRules';
import { useInhibitRules as useMimirInhibitRules } from './mimir/useInhibitRules';

/**
 * Hook to fetch inhibit rules from Alertmanager.
 * Automatically selects the appropriate implementation (Prometheus or Mimir)
 * based on the current alertmanager data source settings.
 *
 * For Prometheus implementation (settings.jsonData.implementation === 'prometheus'):
 * - Fetches from the status endpoint which contains the full config
 *
 * For Mimir implementation:
 * - Fetches from the configuration endpoint
 *
 * @returns Object containing inhibitRules array, isLoading, error, and other query state
 */
export function useInhibitRules() {
  const currentAlertmanager = useAlertmanager();

  // Always call both hooks to comply with Rules of Hooks
  const prometheusHook = usePrometheusInhibitRules();
  const mimirHook = useMimirInhibitRules();

  // Determine which implementation to use
  const implementation = currentAlertmanager?.settings.jsonData?.implementation;

  // Return the appropriate hook result based on implementation
  if (implementation === 'mimir') {
    return mimirHook;
  }

  // Default to Prometheus for 'prometheus' or undefined implementation
  return prometheusHook;
}
