import { alertmanagerApi } from "../../api/mimir.endpoints";
import { useAppSelector } from "../../store/hooks";
import { selectDataSourceUID } from "../../store/datasourceSlice";

/**
 * Hook to fetch and manage inhibit rules from the Mimir Alertmanager configuration endpoint.
 * The configuration endpoint contains the full Alertmanager config which includes inhibit rules.
 *
 * Inhibit rules allow you to mute alerts based on the presence of other alerts.
 * For example, you can inhibit alerts about a service when an alert about the host is firing.
 *
 * This hook can be extended in the future to support:
 * - Creating new inhibit rules
 * - Editing existing inhibit rules
 * - Deleting inhibit rules
 */
export function useInhibitRules() {
  const dataSourceUID = useAppSelector(selectDataSourceUID);

  return alertmanagerApi.endpoints.getConfiguration.useQuery({ dataSourceUID }, {
    selectFromResult: (result) => ({
      ...result,
      inhibitRules: result.data?.alertmanager_config.inhibit_rules ?? [],
    }),
  });
}
