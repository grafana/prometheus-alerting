import { useAlertmanager } from './useAlertmanager';

/**
 * Hook to check if the current Alertmanager data source supports configuration API.
 * Only Mimir implementation supports creating, updating, and deleting configuration via API.
 * Vanilla Prometheus Alertmanager is read-only via the status endpoint.
 *
 * @returns true if the data source supports configuration API (Mimir), false otherwise
 */
export function useHasConfigurationAPI(): boolean {
  const { settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  return implementation === 'mimir';
}
