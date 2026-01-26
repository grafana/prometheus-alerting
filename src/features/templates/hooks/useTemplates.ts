import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Represents a template with its name and content.
 */
export interface Template {
  name: string;
  content: string;
}

/**
 * Hook to fetch and manage templates from the Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 * Dynamically selects the correct API endpoint based on the data source implementation.
 *
 * Returns both template names and their content from template_files.
 */
export function useTemplates() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  // Select the appropriate API endpoint based on implementation
  // Mimir uses getUserConfiguration, vanilla Alertmanager uses getConfiguration
  const mimirQueryResult = mimirAlertmanagerApi.endpoints.getUserConfiguration.useQuery(
    { dataSourceUID },
    {
      skip: implementation !== 'mimir',
    }
  );

  const vanillaQueryResult = alertmanagerApi.endpoints.getConfiguration.useQuery(
    { dataSourceUID },
    {
      skip: implementation === 'mimir',
    }
  );

  const queryResult = implementation === 'mimir' ? mimirQueryResult : vanillaQueryResult;

  const templateNames = queryResult.data?.alertmanager_config?.templates ?? [];

  const templateFiles = queryResult.data?.template_files ?? {};

  // Combine names and content into Template objects
  const templates: Template[] = templateNames.map((name: string) => ({
    name,
    content: templateFiles[name] ?? '',
  }));

  return {
    ...queryResult,
    templates,
    templateFiles,
  };
}
