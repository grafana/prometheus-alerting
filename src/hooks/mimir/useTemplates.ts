import { alertmanagerApi } from "../../api/mimir.endpoints";
import { useAppSelector } from "../../store/hooks";
import { selectDataSourceUID } from "../../store/datasourceSlice";

/**
 * Hook to fetch and manage templates from the Mimir Alertmanager configuration endpoint.
 * The configuration endpoint contains template files as a record of filename to content.
 *
 * This hook can be extended in the future to support:
 * - Creating new templates
 * - Editing existing templates
 * - Deleting templates
 */
export function useTemplates() {
  const dataSourceUID = useAppSelector(selectDataSourceUID);

  return alertmanagerApi.endpoints.getConfiguration.useQuery({ dataSourceUID }, {
    selectFromResult: (result) => ({
      ...result,
      templates: result.data ? Object.keys(result.data.template_files) : [],
    }),
  });
}
