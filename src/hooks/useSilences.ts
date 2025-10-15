import { alertmanagerApi } from '../api/alertmanager.endpoints';
import { useAlertmanager } from './useAlertmanager';

/**
 * Hook to fetch and manage silences from the Alertmanager silences endpoint.
 * Silences are used to mute alerts for a specific time period based on matchers.
 *
 * This hook can be extended in the future to support:
 * - Creating new silences
 * - Editing existing silences
 * - Deleting/expiring silences
 */
export function useSilences(filter?: string[]) {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  return (alertmanagerApi as any).endpoints.getSilences.useQuery({ dataSourceUID, filter, implementation });
}
