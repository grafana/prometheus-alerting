import { useAlertmanager } from './useAlertmanager';
import { useTemplates as usePrometheusTemplates } from './prometheus/useTemplates';
import { useTemplates as useMimirTemplates } from './mimir/useTemplates';

/**
 * Hook to fetch templates from Alertmanager.
 * Automatically selects the appropriate implementation (Prometheus or Mimir)
 * based on the current alertmanager data source settings.
 *
 * For Prometheus implementation (settings.jsonData.implementation === 'prometheus'):
 * - Fetches from the status endpoint which contains the full config
 *
 * For Mimir implementation:
 * - Fetches from the configuration endpoint which returns template files as a record
 *
 * @returns Object containing templates array, isLoading, error, and other query state
 */
export function useTemplates() {
  const currentAlertmanager = useAlertmanager();

  // Always call both hooks to comply with Rules of Hooks
  const prometheusHook = usePrometheusTemplates();
  const mimirHook = useMimirTemplates();

  // Determine which implementation to use
  const implementation = currentAlertmanager?.settings.jsonData?.implementation;

  // Return the appropriate hook result based on implementation
  if (implementation === 'mimir') {
    return mimirHook;
  }

  // Default to Prometheus for 'prometheus' or undefined implementation
  return prometheusHook;
}
