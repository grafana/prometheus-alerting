import { useAlertmanagerApi } from './useAlertmanagerApi';

/**
 * Hook to fetch and manage templates from the Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes templates.
 *
 * This hook can be extended in the future to support:
 * - Creating new templates
 * - Editing existing templates
 * - Deleting templates
 */
export function useTemplates() {
  const api = useAlertmanagerApi();

  return api.endpoints.getStatus.useQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      templates: result.data?.config.parsed?.templates ?? [],
    }),
  });
}
