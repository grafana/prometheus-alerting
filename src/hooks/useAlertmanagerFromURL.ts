import { useLayoutEffect } from 'react';

import { ALERTMANAGER_QUERY_PARAM } from '../constants';
import { selectDataSourceUID } from '../store/datasourceSlice';
import { useAppSelector } from '../store/hooks';
import { findAlertmanagerUIDForQueryParam } from '../utils/utils.alertmanager';
import { useAvailableAlertmanagers } from './useAvailableAlertmanager';
import { useSelectAlertmanager } from './useSelectAlertmanager';
import { useURLSearchParams } from './useURLSearchParams';

/**
 * Selects the Alertmanager a link names in `?alertmanager=`, so a link from Grafana (or from a colleague)
 * opens the Alertmanager it was about rather than whichever one this browser tab picked last.
 *
 * The param is taken out of the URL once it's been applied. From then on the picker is in charge, and a
 * param left behind would keep naming the old Alertmanager after somebody switched away from it. A value
 * that doesn't match any Alertmanager is left alone and ignored.
 *
 * Returns true while the switch is still happening, so callers can hold off rendering a page that would
 * otherwise load, and briefly show, the previous Alertmanager's data.
 */
export function useAlertmanagerFromURL(): boolean {
  const availableAlertmanagers = useAvailableAlertmanagers();
  const selectedUID = useAppSelector(selectDataSourceUID);
  const selectAlertmanager = useSelectAlertmanager();
  const [searchParams, updateSearchParams] = useURLSearchParams();

  const requestedUID = findAlertmanagerUIDForQueryParam(
    searchParams.get(ALERTMANAGER_QUERY_PARAM),
    availableAlertmanagers
  );

  // A layout effect so the switch lands before the browser paints anything.
  useLayoutEffect(() => {
    if (requestedUID === undefined) {
      return;
    }

    if (requestedUID !== selectedUID) {
      selectAlertmanager(requestedUID);
    }
    updateSearchParams({ [ALERTMANAGER_QUERY_PARAM]: undefined });
  }, [requestedUID, selectedUID, selectAlertmanager, updateSearchParams]);

  return requestedUID !== undefined && requestedUID !== selectedUID;
}
