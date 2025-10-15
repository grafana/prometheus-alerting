import { useAlertmanager } from './useAlertmanager';
import { useSilences as usePrometheusSilences } from './prometheus/useSilences';
import { useSilences as useMimirSilences } from './mimir/useSilences';

/**
 * Hook to fetch silences from Alertmanager.
 * Automatically selects the appropriate implementation (Prometheus or Mimir)
 * based on the current alertmanager data source settings.
 *
 * Both implementations use the same silences endpoint (v2 API).
 *
 * @param filter - Optional array of filter strings to filter silences
 * @returns Object containing data array, isLoading, error, and other query state
 */
export function useSilences(filter?: string[]) {
  const currentAlertmanager = useAlertmanager();

  // Always call both hooks to comply with Rules of Hooks
  const prometheusHook = usePrometheusSilences(filter);
  const mimirHook = useMimirSilences(filter);

  // Determine which implementation to use
  const implementation = currentAlertmanager?.settings.jsonData?.implementation;

  // Return the appropriate hook result based on implementation
  if (implementation === 'mimir') {
    return mimirHook;
  }

  // Default to Prometheus for 'prometheus' or undefined implementation
  return prometheusHook;
}
