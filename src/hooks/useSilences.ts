import { useAlertmanagerApi } from './useAlertmanagerApi';

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
  const api = useAlertmanagerApi();

  return api.endpoints.getSilences.useQuery({ filter });
}
