import { alertmanagerApi } from "../../api/alertmanager.endpoints"
import { useAppSelector } from "../../store/hooks";
import { selectDataSourceUID } from "../../store/datasourceSlice";
import { useCallback } from "react";

/**
 * Hook to fetch and manage receivers from the Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes receivers.
 *
 * This hook can be extended in the future to support:
 * - Creating new receivers
 * - Editing existing receivers
 * - Deleting receivers
 */
export function useListReceivers() {
  const dataSourceUID = useAppSelector(selectDataSourceUID);
  const [trigger, result] = alertmanagerApi.endpoints.getStatus.useLazyQuery({
    selectFromResult: (result) => ({
      ...result,
      receivers: result.data?.config.parsed?.receivers ?? [],
    }),
  });

  // memoize the trigger function so we avoid an infinite loop
  const triggerFn = useCallback(() => {
    trigger({ dataSourceUID })
  }, [dataSourceUID, trigger]);

  return [
    triggerFn,
    result,
  ] as const;
}
