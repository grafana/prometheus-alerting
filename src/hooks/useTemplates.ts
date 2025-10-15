import { alertmanagerApi } from "../api/alertmanager.endpoints";
import { useAppSelector } from "../store/hooks";
import { selectDataSourceUID } from "../store/datasourceSlice";

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
  const dataSourceUID = useAppSelector(selectDataSourceUID);

  return alertmanagerApi.endpoints.getStatus.useQuery({ dataSourceUID }, {
    selectFromResult: (result) => ({
      ...result,
      templates: result.data?.config.parsed?.templates ?? [],
    }),
  });
}
